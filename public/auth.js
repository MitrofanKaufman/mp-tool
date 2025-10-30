const jwt = require('jsonwebtoken');
const { logEvent } = require('../server/utils/logs');

/** @constant {string} JWT_SECRET - Secret key for JWT token signing */
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

/** @constant {string} JWT_EXPIRES_IN - JWT token expiration time */
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

/**
 * @typedef {Object} User
 * @property {string} id - Unique user identifier
 * @property {string} role - User role (e.g., 'admin', 'editor', 'viewer')
 * @property {string} [email] - User's email address
 * @property {boolean} [is_active] - Whether the user account is active
 */

/**
 * Generates a JWT token for the specified user
 * @param {User} user - User object containing at least id and role
 * @returns {string} Signed JWT token
 * @throws {Error} If user object is invalid or missing required properties
 * @example
 * const token = generateToken({ id: '123', role: 'admin' });
 */
function generateToken(user) {
  if (!user || !user.id || !user.role) {
    throw new Error('Invalid user object. Must contain id and role');
  }
  
  return jwt.sign(
    { 
      uid: user.id, 
      role: user.role,
      // Add standard claims
      iat: Math.floor(Date.now() / 1000),
      iss: 'ws-api-server'
    },
    JWT_SECRET,
    { 
      expiresIn: JWT_EXPIRES_IN,
      algorithm: 'HS256'
    }
  );
}

/**
 * Verifies and decodes a JWT token
 * @param {string} token - JWT token to verify
 * @returns {Promise<Object>} Decoded token payload
 * @throws {Error} If token is invalid, expired, or verification fails
 * @example
 * const payload = await verifyToken('jwt.token.here');
 */
async function verifyToken(token) {
  if (!token) {
    throw new Error('No token provided');
  }

  try {
    return jwt.verify(token, JWT_SECRET, {
      algorithms: ['HS256'],
      ignoreExpiration: false,
      issuer: 'ws-api-server'
    });
  } catch (error) {
    const errorType = error.name === 'TokenExpiredError' ? 'token_expired' : 'token_invalid';
    await logEvent('auth_error', `Token verification failed: ${errorType}`, { 
      error: error.message 
    });
    throw new Error(`Token verification failed: ${errorType}`);
  }
}

/**
 * Authenticates a WebSocket connection using JWT token
 * @param {Object} request - Fastify request object
 * @param {Object} reply - Fastify reply object
 * @returns {Promise<void>}
 * @throws {Error} If authentication fails
 * @example
 * await authenticateWebSocket(req, reply);
 */
async function authenticateWebSocket(request, reply) {
  const token = request.headers['sec-websocket-protocol']?.replace('Bearer ', '');
  
  if (!token) {
    request.log.warn('No token provided in WebSocket handshake');
    throw new Error('Authentication required: Missing token');
  }

  try {
    const decoded = await verifyToken(token);
    
    // Additional validation if needed
    if (!decoded.uid || !decoded.role) {
      throw new Error('Invalid token payload');
    }
    
    // Attach user to request
    request.user = {
      id: decoded.uid,
      role: decoded.role
    };
    
    request.log.debug({ userId: decoded.uid }, 'WebSocket authentication successful');
  } catch (error) {
    request.log.warn({ error: error.message }, 'WebSocket authentication failed');
    throw new Error(`Authentication failed: ${error.message}`);
  }
}

/**
 * Retrieves a user by their ID from the database
 * @param {string|number} id - User ID to look up
 * @returns {Promise<User|null>} User object if found and active, null otherwise
 * @throws {Error} If database query fails
 * @example
 * const user = await getUserById('user-123');
 */
async function getUserById(id) {
  if (!id) {
    throw new Error('User ID is required');
  }

  try {
    const db = require('../server/utils/pool').pool;
    const user = await db('users')
      .where('id', id)
      .select([
        'id',
        'email',
        'role',
        'is_active',
        'created_at',
        'updated_at'
      ])
      .first();
    
    return user?.is_active ? user : null;
  } catch (error) {
    await logEvent('database_error', 'Failed to fetch user by ID', { 
      userId: id, 
      error: error.message 
    });
    throw new Error('Failed to retrieve user');
  }
}

/**
 * Validates if a user has the required role(s)
 * @param {Object} user - User object with role property
 * @param {string|string[]} [roles=['viewer']] - Role or array of roles to check against
 * @throws {Error} If user is unauthorized or lacks required role
 * @example
 * // Check for single role
 * requireRole(user, 'admin');
 * 
 * // Check for multiple roles (OR condition)
 * requireRole(user, ['admin', 'superadmin']);
 */
function requireRole(user, roles = ['viewer']) {
  if (!user) {
    throw new Error('Authentication required: No user provided');
  }
  
  const roleHierarchy = { 
    viewer: 1, 
    editor: 2, 
    admin: 3,
    superadmin: 4 
  };
  
  // Convert single role to array for consistent handling
  const requiredRoles = Array.isArray(roles) ? roles : [roles];
  
  // Get the highest required role level
  const requiredLevel = Math.max(
    ...requiredRoles.map(role => roleHierarchy[role.toLowerCase()] || 0)
  );
  
  const userLevel = roleHierarchy[user.role?.toLowerCase()] || 0;
  
  if (userLevel < requiredLevel) {
    throw new Error(
      `Insufficient permissions. Required role: ${requiredRoles.join(' or ')}`
    );
  }
}

module.exports = {
  generateToken,
  verifyToken,
  authenticateWebSocket,
  getUserById,
  requireRole,
  // Export constants for testing
  _test: { JWT_SECRET, JWT_EXPIRES_IN }
};
