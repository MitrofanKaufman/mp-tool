'use strict';

// Import the authentication module
const { authenticateWebSocket } = require('./auth');

/**
 * WebSocket plugin for Fastify
 */
module.exports = async function(fastify, options) {
    fastify.get('/', { websocket: true }, async (connection, req) => {
        try {
            // Authenticate the WebSocket connection
            await authenticateWebSocket(req, {});

            const { socket } = connection;
            const user = req.user;

            // Store user on the socket for later use
            socket.user = user;
            fastify.log.info({ userId: user?.id }, 'WebSocket connected');

            // Handle incoming messages
            socket.on('message', (message) => {
                try {
                    const data = JSON.parse(message);
                    fastify.log.debug({ data }, 'Received WebSocket message');

                    // Handle ping-pong for keep-alive
                    if (data.type === 'ping') {
                        socket.send(JSON.stringify({
                            type: 'pong',
                            timestamp: Date.now()
                        }));
                    }
                } catch (err) {
                    fastify.log.error({ err, message }, 'Error handling WebSocket message');
                }
            });

            // Handle connection close
            socket.on('close', () => {
                fastify.log.info({ userId: user?.id }, 'WebSocket connection closed');
            });

            // Send welcome message
            socket.send(JSON.stringify({
                type: 'welcome',
                userId: user?.id,
                role: user?.role,
                timestamp: Date.now(),
            }));

        } catch (error) {
            fastify.log.warn({ error: error.message }, 'WebSocket authentication failed');
            connection.socket.close(1008, error.message);
        }
    });
};