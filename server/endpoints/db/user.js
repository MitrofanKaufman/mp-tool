// User management handlers
const db = require('../../utils/pool');
const { logEvent } = require('../../utils/logs');
const { hashPassword } = require('../../../public/auth');

const userHandlers = {
  async createUser(userData) {
    try {
      const hashedPassword = await hashPassword(userData.password);
      const [userId] = await db('users').insert({
        username: userData.username,
        email: userData.email,
        password_hash: hashedPassword,
        role: userData.role || 'user',
        is_active: true
      });
      
      await logEvent('user_created', `User ${userData.username} created`, { userId });
      return { success: true, userId };
    } catch (error) {
      await logEvent('error', 'Failed to create user', { error: error.message });
      throw error;
    }
  },
  
  async getUser(userId) {
    try {
      const user = await db('users')
        .where('id', userId)
        .select('id', 'username', 'email', 'role', 'created_at', 'last_login')
        .first();
      
      if (!user) {
        throw new Error('User not found');
      }
      
      return user;
    } catch (error) {
      await logEvent('error', 'Failed to get user', { userId, error: error.message });
      throw error;
    }
  },
  
  async updateUser(userId, updates) {
    try {
      if (updates.password) {
        updates.password_hash = await hashPassword(updates.password);
        delete updates.password;
      }
      
      await db('users')
        .where('id', userId)
        .update(updates);
      
      await logEvent('user_updated', `User ${userId} updated`, { updates: Object.keys(updates) });
      return { success: true };
    } catch (error) {
      await logEvent('error', 'Failed to update user', { userId, error: error.message });
      throw error;
    }
  }
};

module.exports = userHandlers;
