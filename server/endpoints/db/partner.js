// Partner API integration handlers
const axios = require('axios');
const db = require('../../utils/pool');
const { logEvent } = require('../../utils/logs');

const partnerHandlers = {
  async authenticate(apiKey) {
    try {
      const partner = await db('partners')
        .where('api_key', apiKey)
        .where('is_active', true)
        .first();
      
      if (!partner) {
        throw new Error('Invalid API key');
      }
      
      return { authenticated: true, partnerId: partner.id };
    } catch (error) {
      await logEvent('error', 'Partner authentication failed', { error: error.message });
      throw error;
    }
  },
  
  async getPartnerStats(partnerId, period = '30d') {
    try {
      const [stats] = await db('partner_stats')
        .where('partner_id', partnerId)
        .where('period', period)
        .orderBy('created_at', 'desc')
        .limit(1);
      
      return stats || {};
    } catch (error) {
      await logEvent('error', 'Failed to get partner stats', { partnerId, error: error.message });
      throw error;
    }
  },
  
  async updatePartnerWebhook(partnerId, webhookUrl) {
    try {
      // Validate webhook URL
      if (!webhookUrl || !webhookUrl.startsWith('https://')) {
        throw new Error('Invalid webhook URL');
      }
      
      await db('partners')
        .where('id', partnerId)
        .update({ webhook_url: webhookUrl });
      
      await logEvent('partner_webhook_updated', `Partner ${partnerId} webhook updated`, { webhookUrl });
      return { success: true };
    } catch (error) {
      await logEvent('error', 'Failed to update partner webhook', { partnerId, error: error.message });
      throw error;
    }
  },
  
  async sendToPartnerWebhook(partnerId, eventType, data) {
    try {
      const partner = await db('partners')
        .where('id', partnerId)
        .where('is_active', true)
        .first();
      
      if (!partner?.webhook_url) {
        return { sent: false, reason: 'No webhook configured' };
      }
      
      const payload = {
        event: eventType,
        timestamp: new Date().toISOString(),
        data
      };
      
      const response = await axios.post(partner.webhook_url, payload, {
        timeout: 5000,
        headers: {
          'Content-Type': 'application/json',
          'X-Partner-Signature': generateSignature(JSON.stringify(payload), partner.api_secret)
        }
      });
      
      await logEvent('webhook_sent', `Webhook sent to partner ${partnerId}`, { 
        eventType, 
        status: response.status,
        statusText: response.statusText
      });
      
      return { sent: true, status: response.status };
    } catch (error) {
      await logEvent('error', 'Failed to send webhook to partner', { 
        partnerId, 
        error: error.message,
        response: error.response?.data
      });
      return { sent: false, error: error.message };
    }
  }
};

function generateSignature(payload, secret) {
  const crypto = require('crypto');
  return crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');
}

module.exports = partnerHandlers;
