// Fingerprint management for Wildberries API requests
const crypto = require('crypto');
const db = require('./pool');
const { logEvent } = require('./logs');

class FingerprintManager {
  constructor() {
    this.fingerprints = new Map();
    this.loadFingerprints();
  }

  async loadFingerprints() {
    try {
      const rows = await db('wb_fingerprints')
        .where('is_active', true)
        .orderBy('last_used', 'desc');
      
      this.fingerprints.clear();
      rows.forEach(fp => {
        this.fingerprints.set(fp.id, {
          id: fp.id,
          userAgent: fp.user_agent,
          fingerprint: fp.fingerprint,
          lastUsed: fp.last_used,
          useCount: fp.use_count
        });
      });
      
      return this.fingerprints.size;
    } catch (error) {
      await logEvent('error', 'Failed to load fingerprints', { error: error.message });
      throw error;
    }
  }

  async getFingerprint() {
    try {
      // Try to find a fingerprint that hasn't been used recently
      const [fingerprint] = await db('wb_fingerprints')
        .where('is_active', true)
        .orderBy('last_used', 'asc')
        .limit(1);
      
      if (!fingerprint) {
        return await this.generateFingerprint();
      }
      
      // Update last used timestamp
      await db('wb_fingerprints')
        .where('id', fingerprint.id)
        .update({
          last_used: new Date(),
          use_count: db.raw('use_count + 1')
        });
      
      // Update in-memory cache
      if (this.fingerprints.has(fingerprint.id)) {
        const fp = this.fingerprints.get(fingerprint.id);
        fp.lastUsed = new Date();
        fp.useCount++;
      }
      
      return {
        id: fingerprint.id,
        userAgent: fingerprint.user_agent,
        fingerprint: fingerprint.fingerprint
      };
    } catch (error) {
      await logEvent('error', 'Failed to get fingerprint', { error: error.message });
      throw error;
    }
  }

  async generateFingerprint() {
    try {
      const userAgent = this.generateUserAgent();
      const fingerprint = this.generateFingerprintString();
      
      const [id] = await db('wb_fingerprints').insert({
        user_agent: userAgent,
        fingerprint: fingerprint,
        is_active: true,
        last_used: new Date(),
        use_count: 1
      });
      
      // Add to in-memory cache
      const fp = {
        id,
        userAgent,
        fingerprint,
        lastUsed: new Date(),
        useCount: 1
      };
      
      this.fingerprints.set(id, fp);
      
      return {
        id,
        userAgent,
        fingerprint
      };
    } catch (error) {
      await logEvent('error', 'Failed to generate fingerprint', { error: error.message });
      throw error;
    }
  }

  generateUserAgent() {
    const browsers = [
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Safari/537.36',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Safari/605.1.15',
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36 Edg/115.0.1901.203',
      'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Safari/537.36',
      'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1'
    ];
    
    return browsers[Math.floor(Math.random() * browsers.length)];
  }

  generateFingerprintString() {
    return crypto.randomBytes(16).toString('hex');
  }

  async disableFingerprint(id, reason = '') {
    try {
      await db('wb_fingerprints')
        .where('id', id)
        .update({
          is_active: false,
          disabled_reason: reason,
          disabled_at: new Date()
        });
      
      // Remove from in-memory cache
      this.fingerprints.delete(id);
      
      await logEvent('fingerprint_disabled', `Fingerprint ${id} disabled`, { reason });
      return true;
    } catch (error) {
      await logEvent('error', 'Failed to disable fingerprint', { id, error: error.message });
      throw error;
    }
  }
}

// Singleton instance
const fingerprintManager = new FingerprintManager();
module.exports = fingerprintManager;
