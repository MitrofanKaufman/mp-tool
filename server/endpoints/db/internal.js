// Internal API handlers for system operations
const db = require('../../utils/pool');
const { logEvent } = require('../../utils/logs');

const internalHandlers = {
  async status() {
    try {
      // Check database connection
      await db.raw('SELECT 1');
      return { status: 'ok', db: 'connected' };
    } catch (error) {
      await logEvent('error', 'Internal status check failed', { error: error.message });
      return { status: 'error', db: 'disconnected', error: error.message };
    }
  },
  
  async metrics() {
    try {
      const [users] = await db('users').count('* as count');
      const [tasks] = await db('tasks').count('* as count');
      const [connections] = await db('ws_connections').count('* as count');
      
      return {
        users: users.count,
        tasks: tasks.count,
        activeConnections: connections.count,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      await logEvent('error', 'Failed to collect metrics', { error: error.message });
      throw error;
    }
  }
};

module.exports = internalHandlers;
