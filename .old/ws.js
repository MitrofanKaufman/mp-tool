import http from 'http';
import express from 'express';
import { WebSocketServer } from 'ws';
import { verifyToken } from '../public/auth.js';
import { routeMessage } from './router.js';
import dotenv from 'dotenv';
dotenv.config();

const app = express();
app.get('/health', (req, res) => res.json({ ok: true, mode: process.env.MODE || 'mock' }));
const server = http.createServer(app);
const wss = new WebSocketServer({ server, path: '/ws', handleProtocols });

function handleProtocols(protocols = []) {
  const p = protocols.find(p => p && p.startsWith('Bearer '));
  return p || false;
}

wss.on('connection', async (ws) => {
  const protocol = ws.protocol || '';
  const token = protocol.startsWith('Bearer ') ? protocol.slice(7) : null;
  try {
    const payload = await verifyToken(token);
    ws.user = { id: payload.uid, role: payload.role || 'viewer' };
  } catch {
    ws.send(JSON.stringify({ success: false, error: 'auth_failed' }));
    ws.close();
    return;
  }

  ws.on('message', async (raw) => {
    let msg;
    try { msg = JSON.parse(raw); } catch { return ws.send(JSON.stringify({ success: false, error: 'invalid_json' })); }
    try {
      if (msg.queue) {
        const { enqueueTask } = await import('./queue.js');
        const job = await enqueueTask(ws.user.id, msg);
        return ws.send(JSON.stringify({ success: true, queued: true, job }));
      }
      const result = await routeMessage(ws.user, msg);
      ws.send(JSON.stringify({ success: true, ...result }));
    } catch (err) {
      ws.send(JSON.stringify({ success: false, error: err.message || 'internal_error' }));
    }
  });
});

const port = process.env.WS_PORT || 8080;
server.listen(port, () => console.log(`[WS] listening on ${port}` ));

const fp = require('fastify-plugin');
const jwt = require('jsonwebtoken');
const WebSocket = require('server/endpoints/routes/ws');

const authenticate = (request, reply, done) => {
  const token = request.headers['sec-websocket-protocol']?.replace('Bearer ', '');

  if (!token) {
    request.log.warn('No token provided');
    return reply.code(401).send({ error: 'Authentication required' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    request.user = decoded;
    done();
  } catch (err) {
    request.log.warn({ err }, 'Invalid token');
    return reply.code(401).send({ error: 'Invalid or expired token' });
  }
};

async function wsRoutes(fastify) {
  fastify.register(async (fastify) => {
    fastify.get('/', { websocket: true, preValidation: [authenticate] }, (connection, req) => {
      const { socket } = connection;
      const { user } = req;

      // Add user info to the connection
      socket.user = user;
      fastify.log.info({ userId: user.uid }, 'New WebSocket connection');

      // Handle incoming messages
      socket.on('message', (message) => {
        try {
          const data = JSON.parse(message);
          fastify.log.debug({ data }, 'Received WebSocket message');

          // Handle different message types
          switch (data.type) {
            case 'ping':
              socket.send(JSON.stringify({ type: 'pong', timestamp: Date.now() }));
              break;
              // Add more message handlers here
            default:
              fastify.log.warn({ type: data.type }, 'Unknown message type');
              socket.send(JSON.stringify({
                type: 'error',
                error: 'Unknown message type',
                requestId: data.requestId,
              }));
          }
        } catch (err) {
          fastify.log.error({ err, message }, 'Error processing WebSocket message');
          socket.send(JSON.stringify({
            type: 'error',
            error: 'Invalid message format',
          }));
        }
      });

      // Handle client disconnection
      socket.on('close', () => {
        fastify.log.info({ userId: user.uid }, 'WebSocket connection closed');
      });

      // Send welcome message
      socket.send(JSON.stringify({
        type: 'welcome',
        userId: user.uid,
        timestamp: Date.now(),
      }));
    });
  });
}

module.exports = fp(wsRoutes);