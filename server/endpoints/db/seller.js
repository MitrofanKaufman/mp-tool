// Seller management handlers
const db = require('../../utils/pool');
const { logEvent } = require('../../utils/logs');

const sellerHandlers = {
  async createSeller(sellerData) {
    try {
      const [sellerId] = await db('sellers').insert({
        name: sellerData.name,
        wb_seller_id: sellerData.wb_seller_id,
        rating: sellerData.rating,
        reviews_count: sellerData.reviews_count,
        is_active: true
      });
      
      await logEvent('seller_created', `Seller ${sellerData.name} created`, { sellerId });
      return { success: true, sellerId };
    } catch (error) {
      await logEvent('error', 'Failed to create seller', { error: error.message });
      throw error;
    }
  },
  
  async getSeller(sellerId) {
    try {
      const seller = await db('sellers')
        .where('id', sellerId)
        .first();
      
      if (!seller) {
        throw new Error('Seller not found');
      }
      
      return seller;
    } catch (error) {
      await logEvent('error', 'Failed to get seller', { sellerId, error: error.message });
      throw error;
    }
  },
  
  async updateSeller(sellerId, updates) {
    try {
      await db('sellers')
        .where('id', sellerId)
        .update(updates);
      
      await logEvent('seller_updated', `Seller ${sellerId} updated`, { updates: Object.keys(updates) });
      return { success: true };
    } catch (error) {
      await logEvent('error', 'Failed to update seller', { sellerId, error: error.message });
      throw error;
    }
  },
  
  async getSellerProducts(sellerId, page = 1, limit = 20) {
    try {
      const offset = (page - 1) * limit;
      const products = await db('products')
        .where('seller_id', sellerId)
        .limit(limit)
        .offset(offset);
      
      const [{ count }] = await db('products')
        .where('seller_id', sellerId)
        .count('* as count');
      
      return {
        data: products,
        pagination: {
          total: parseInt(count),
          page,
          total_pages: Math.ceil(count / limit),
          limit
        }
      };
    } catch (error) {
      await logEvent('error', 'Failed to get seller products', { sellerId, error: error.message });
      throw error;
    }
  }
};

module.exports = sellerHandlers;
