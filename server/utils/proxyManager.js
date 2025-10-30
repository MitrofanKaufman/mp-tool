// Proxy management for Wildberries API requests
const axios = require('axios');
const db = require('./pool');
const { logEvent } = require('./logs');

class ProxyManager {
  constructor() {
    this.proxies = new Map();
    this.loadProxies();
    // Refresh proxies every 5 minutes
    this.refreshInterval = setInterval(() => this.loadProxies(), 5 * 60 * 1000);
  }

  async loadProxies() {
    try {
      const rows = await db('proxies')
        .where('is_active', true)
        .orderBy('last_used', 'asc');
      
      this.proxies.clear();
      rows.forEach(proxy => {
        this.proxies.set(proxy.id, {
          id: proxy.id,
          host: proxy.host,
          port: proxy.port,
          protocol: proxy.protocol || 'http',
          username: proxy.username,
          password: proxy.password,
          lastUsed: proxy.last_used,
          failCount: proxy.fail_count || 0,
          responseTime: proxy.response_time || 0
        });
      });
      
      await logEvent('info', `Loaded ${this.proxies.size} proxies`);
      return this.proxies.size;
    } catch (error) {
      await logEvent('error', 'Failed to load proxies', { error: error.message });
      throw error;
    }
  }

  async getProxy() {
    try {
      // Get the least recently used proxy
      const proxy = Array.from(this.proxies.values())
        .sort((a, b) => (a.lastUsed?.getTime() || 0) - (b.lastUsed?.getTime() || 0))[0];
      
      if (!proxy) {
        throw new Error('No active proxies available');
      }
      
      // Update last used timestamp
      proxy.lastUsed = new Date();
      
      await db('proxies')
        .where('id', proxy.id)
        .update({
          last_used: proxy.lastUsed,
          use_count: db.raw('use_count + 1')
        });
      
      return this.formatProxyForAxios(proxy);
    } catch (error) {
      await logEvent('error', 'Failed to get proxy', { error: error.message });
      return null;
    }
  }

  formatProxyForAxios(proxy) {
    return {
      protocol: proxy.protocol || 'http',
      host: proxy.host,
      port: proxy.port,
      ...(proxy.username && {
        auth: {
          username: proxy.username,
          password: proxy.password || ''
        }
      })
    };
  }

  async addProxy(proxyData) {
    try {
      const [id] = await db('proxies').insert({
        host: proxyData.host,
        port: proxyData.port,
        protocol: proxyData.protocol || 'http',
        username: proxyData.username,
        password: proxyData.password,
        is_active: true,
        added_at: new Date(),
        last_verified: new Date(),
        use_count: 0,
        fail_count: 0
      });
      
      // Add to in-memory cache
      this.proxies.set(id, {
        id,
        ...proxyData,
        lastUsed: null,
        failCount: 0,
        responseTime: 0
      });
      
      await logEvent('proxy_added', 'New proxy added', { 
        host: proxyData.host,
        port: proxyData.port 
      });
      
      return id;
    } catch (error) {
      await logEvent('error', 'Failed to add proxy', { 
        error: error.message,
        host: proxyData.host 
      });
      throw error;
    }
  }

  async disableProxy(proxyId, reason = '') {
    try {
      await db('proxies')
        .where('id', proxyId)
        .update({
          is_active: false,
          disabled_reason: reason,
          disabled_at: new Date()
        });
      
      // Remove from in-memory cache
      this.proxies.delete(proxyId);
      
      await logEvent('proxy_disabled', `Proxy ${proxyId} disabled`, { reason });
      return true;
    } catch (error) {
      await logEvent('error', 'Failed to disable proxy', { 
        proxyId, 
        error: error.message 
      });
      throw error;
    }
  }

  async testProxy(proxyId) {
    try {
      const proxy = this.proxies.get(proxyId);
      if (!proxy) {
        throw new Error('Proxy not found');
      }
      
      const start = Date.now();
      const response = await axios.get('https://api.ipify.org?format=json', {
        proxy: this.formatProxyForAxios(proxy),
        timeout: 10000
      });
      
      const latency = Date.now() - start;
      const isValid = !!response.data?.ip;
      
      // Update proxy stats
      await db('proxies')
        .where('id', proxyId)
        .update({
          last_verified: new Date(),
          response_time: latency,
          is_active: isValid,
          fail_count: isValid ? 0 : db.raw('fail_count + 1')
        });
      
      // Update in-memory cache
      if (this.proxies.has(proxyId)) {
        const p = this.proxies.get(proxyId);
        p.responseTime = latency;
        p.failCount = 0;
      }
      
      return { 
        success: true, 
        latency,
        ip: response.data?.ip 
      };
    } catch (error) {
      // Increment fail count
      await db('proxies')
        .where('id', proxyId)
        .increment('fail_count', 1);
      
      // Update in-memory cache
      if (this.proxies.has(proxyId)) {
        const p = this.proxies.get(proxyId);
        p.failCount++;
        p.lastError = error.message;
      }
      
      await logEvent('proxy_test_failed', `Proxy test failed for ${proxyId}`, { 
        error: error.message 
      });
      
      return { 
        success: false, 
        error: error.message 
      };
    }
  }

  // Clean up on shutdown
  async shutdown() {
    clearInterval(this.refreshInterval);
    this.proxies.clear();
  }
}

// Singleton instance
const proxyManager = new ProxyManager();

// Handle process termination
process.on('SIGTERM', () => proxyManager.shutdown());
process.on('SIGINT', () => proxyManager.shutdown());

module.exports = proxyManager;
