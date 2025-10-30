// IP resolution and proxy management for Wildberries API requests
const axios = require('axios');
const db = require('./pool');
const { logEvent } = require('./logs');

class IPResolver {
  constructor() {
    this.ipCache = new Map();
    this.checkInterval = 5 * 60 * 1000; // 5 minutes
    this.lastCheck = 0;
  }

  async getPublicIP(useProxy = false) {
    try {
      // Check cache first
      const now = Date.now();
      const cached = this.ipCache.get('public');
      
      if (cached && (now - cached.timestamp < this.checkInterval)) {
        return cached.ip;
      }
      
      // Get fresh IP
      const response = await axios.get('https://api.ipify.org?format=json', {
        timeout: 5000,
        proxy: useProxy ? this.getRandomProxy() : false
      });
      
      const ip = response.data.ip;
      
      // Update cache
      this.ipCache.set('public', {
        ip,
        timestamp: now
      });
      
      return ip;
    } catch (error) {
      await logEvent('error', 'Failed to get public IP', { 
        useProxy,
        error: error.message 
      });
      
      // Return cached IP if available, even if expired
      const cached = this.ipCache.get('public');
      return cached ? cached.ip : null;
    }
  }

  async getRandomProxy() {
    try {
      // Get a random active proxy from the database
      const proxy = await db('proxies')
        .where('is_active', true)
        .orderByRaw('RANDOM()')
        .first();
      
      if (!proxy) {
        throw new Error('No active proxies available');
      }
      
      // Format for axios
      return {
        protocol: proxy.protocol || 'http',
        host: proxy.host,
        port: proxy.port,
        auth: proxy.username ? {
          username: proxy.username,
          password: proxy.password || ''
        } : undefined
      };
    } catch (error) {
      await logEvent('error', 'Failed to get random proxy', { error: error.message });
      return null;
    }
  }

  async verifyProxy(proxy) {
    try {
      const start = Date.now();
      const response = await axios.get('https://api.ipify.org?format=json', {
        proxy,
        timeout: 10000
      });
      
      const latency = Date.now() - start;
      const isValid = !!response.data?.ip;
      
      // Update proxy stats
      if (isValid) {
        await db('proxies')
          .where('host', proxy.host)
          .where('port', proxy.port)
          .update({
            last_verified: new Date(),
            response_time: latency,
            is_active: true,
            fail_count: 0
          });
      }
      
      return { isValid, latency };
    } catch (error) {
      // Mark proxy as potentially bad
      await db('proxies')
        .where('host', proxy.host)
        .where('port', proxy.port)
        .increment('fail_count', 1);
      
      // If failed too many times, disable it
      const proxyRecord = await db('proxies')
        .where('host', proxy.host)
        .where('port', proxy.port)
        .first();
      
      if (proxyRecord && proxyRecord.fail_count >= 5) {
        await db('proxies')
          .where('id', proxyRecord.id)
          .update({
            is_active: false,
            disabled_at: new Date()
          });
        
        await logEvent('proxy_disabled', 'Proxy disabled due to failures', {
          host: proxy.host,
          port: proxy.port,
          failCount: proxyRecord.fail_count + 1
        });
      }
      
      return { 
        isValid: false, 
        error: error.message 
      };
    }
  }

  async getCountryForIP(ip) {
    try {
      // Check cache first
      const cached = this.ipCache.get(`country_${ip}`);
      if (cached) return cached.country;
      
      // Get from external API
      const response = await axios.get(`http://ip-api.com/json/${ip}`, {
        timeout: 3000
      });
      
      const country = response.data?.country || 'Unknown';
      
      // Update cache (24h TTL)
      this.ipCache.set(`country_${ip}`, {
        country,
        timestamp: Date.now()
      });
      
      return country;
    } catch (error) {
      await logEvent('error', 'Failed to get country for IP', { 
        ip, 
        error: error.message 
      });
      return 'Unknown';
    }
  }
}

// Singleton instance
const ipResolver = new IPResolver();
module.exports = ipResolver;
