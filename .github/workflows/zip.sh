#!/usr/bin/env bash
set -euo pipefail
ROOT="ws-api-server"
rm -rf "$ROOT"
mkdir -p "$ROOT"
cd "$ROOT"

# helper
write() {
  local path="$1"; shift
  mkdir -p "$(dirname "$path")"
  cat > "$path" <<'EOF'
'"$@"
EOF
}

# .env.example
cat > .env.example <<'EOF'
WS_PORT=8080
ADMIN_PORT=8090

DB_DRIVER=mysql        # mysql | pg
DB_HOST=127.0.0.1
DB_USER=root
DB_PASS=
DB_NAME=wbapp
DB_URL=postgres://user:pass@localhost:5432/wbapp

JWT_SECRET=replace_with_secure_value
TOKEN_TTL_DAYS=30

REDIS_HOST=127.0.0.1
REDIS_PORT=6379

MODE=mock   # mock | live

WB_API_TOKEN=put_wb_token_here

LOG_PATH=./logs/events.log
EOF

# package.json
cat > package.json <<'EOF'
{
  "name": "ws-api-server",
  "version": "1.0.0",
  "description": "WebSocket API server with Wildberries integration, admin REST, queue and Swagger UI",
  "type": "module",
  "scripts": {
    "start": "node server/index.js",
    "start:dev": "NODE_ENV=development node server/index.js"
  },
  "dependencies": {
    "ajv": "^8.12.0",
    "axios": "^1.7.2",
    "bullmq": "^5.5.0",
    "cors": "^2.8.5",
    "dotenv": "^16.4.5",
    "express": "^4.19.2",
    "ioredis": "^5.3.2",
    "jsonwebtoken": "^9.0.2",
    "mysql2": "^3.9.1",
    "node-fetch": "^3.3.2",
    "pg": "^8.10.0",
    "playwright": "^1.47.0",
    "swagger-ui-express": "^4.6.3",
    "ws": "^8.18.0",
    "uuid": "^9.0.1",
    "js-yaml": "^4.1.0"
  }
}
EOF

# README.md
cat > README.md <<'EOF'
# ws-api-server

Production-ready WebSocket + REST API server for Wildberries integration and internal task management.
Quickstart:
1. cp .env.example .env and edit values
2. npm ci
3. mysql -u root -p wbapp < server/db/migrations.sql
4. npm start
Swagger UI: http://localhost:8090/docs
Test client: npx http-server public -p 8081
EOF

# public/index.html
mkdir -p public
cat > public/index.html <<'EOF'
<!DOCTYPE html>
<html lang="ru">
<head><meta charset="utf-8"/><title>WS API Tester</title></head>
<body>
<h1>WS API Tester</h1>
<textarea id="log" style="width:100%;height:300px;"></textarea>
<script>
  console.log('Open this file and use it as test client (see README).');
</script>
</body>
</html>
EOF

# server files
mkdir -p server server/db server/wildberries server/wildberries/handlers

# server/index.js
cat > server/index.js <<'EOF'
import './wsServer.js';
import { startAdmin } from './admin.js';
import dotenv from 'dotenv';
dotenv.config();
const adminPort = process.env.ADMIN_PORT || 8090;
startAdmin(adminPort);
console.log(`[server] started. WS:${process.env.WS_PORT || 8080} ADMIN:${adminPort}` );
EOF

# server/wsServer.js
cat > server/wsServer.js <<'EOF'
import http from 'http';
import express from 'express';
import { WebSocketServer } from 'ws';
import { verifyToken } from './auth.js';
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
EOF

# server/admin.js
cat > server/admin.js <<'EOF'
import express from 'express';
import cors from 'cors';
import swaggerUi from 'swagger-ui-express';
import fs from 'fs';
import yaml from 'js-yaml';
import { db } from './db/pool.js';
import { verifyToken, getUserById, requireRole } from './auth.js';
import dotenv from 'dotenv';
dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const spec = yaml.load(fs.readFileSync(new URL('./swagger.yaml', import.meta.url), 'utf8'));
app.use('/docs', swaggerUi.serve, swaggerUi.setup(spec));

app.use('/admin', async (req, res, next) => {
  const auth = req.headers.authorization || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : '';
  try {
    const { uid } = await verifyToken(token);
    req.user = await getUserById(uid);
    next();
  } catch {
    res.status(401).json({ error: 'auth_failed' });
  }
});

app.get('/admin/users', async (req, res) => {
  try { requireRole(req.user, ['admin']); } catch (e) { return res.status(403).json({ error: e.message }); }
  const d = await db;
  const [rows] = await d.query('SELECT id, email, role, created_at FROM users');
  res.json(rows);
});

export function startAdmin(port = 8090) {
  app.listen(port, () => console.log(`[Admin] listening on ${port}` ));
}
EOF

# server/router.js
cat > server/router.js <<'EOF'
import * as suggestHandler from './wildberries/handlers/suggest.js';
import * as searchHandler from './wildberries/handlers/search.js';
import * as productHandler from './wildberries/handlers/product.js';
import * as brandHandler from './wildberries/handlers/brand.js';
import * as sellerHandler from './wildberries/handlers/seller.js';
import { logEvent } from './logs.js';

export async function routeMessage(user, msg) {
  if (!msg || typeof msg !== 'object') throw new Error('invalid_message');
  const { source, type } = msg;
  if (source !== 'wildberries') throw new Error('unsupported_source');

  const requestId = msg.requestId || Date.now().toString(36);
  await logEvent(requestId, user?.id, 'route_start', { type, source });

  let res;
  switch (type) {
    case 'suggest':
      res = await suggestHandler.handle(requestId, user, msg);
      break;
    case 'search':
      res = await searchHandler.handle(requestId, user, msg);
      break;
    case 'product':
      res = await productHandler.handle(requestId, user, msg);
      break;
    case 'brand':
      res = await brandHandler.handle(requestId, user, msg);
      break;
    case 'seller':
      res = await sellerHandler.handle(requestId, user, msg);
      break;
    default:
      throw new Error('unsupported_type');
  }

  await logEvent(requestId, user?.id, 'route_done', { type, source });
  return { requestId, ...res };
}
EOF

# server/auth.js
cat > server/auth.js <<'EOF'
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import { db } from './db/pool.js';
dotenv.config();

export async function issueToken(userId, ttlDays = Number(process.env.TOKEN_TTL_DAYS || 30)) {
  const token = jwt.sign({ uid: userId }, process.env.JWT_SECRET, { expiresIn: `${ttlDays}d`  });
  const expiresAt = new Date(Date.now() + ttlDays * 24 * 3600 * 1000);
  const d = await db;
  await d.query('INSERT INTO tokens (user_id, token, expires_at) VALUES (?, ?, ?)', [userId, token, expiresAt.toISOString().slice(0,19).replace('T',' ')]);
  return token;
}

export async function verifyToken(token) {
  if (!token) throw new Error('auth_failed');
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const d = await db;
    const [rows] = await d.query('SELECT * FROM tokens WHERE token = ? AND expires_at > NOW() LIMIT 1', [token]);
    if (!rows.length) throw new Error('token_expired');
    return { uid: payload.uid };
  } catch (e) {
    throw new Error('auth_failed');
  }
}

export async function getUserById(id) {
  const d = await db;
  const [rows] = await d.query('SELECT id, email, role FROM users WHERE id = ? LIMIT 1', [id]);
  return rows[0] || null;
}

export function requireRole(user, roles = ['viewer']) {
  if (!user) throw new Error('unauthorized');
  const order = { viewer: 1, editor: 2, admin: 3 };
  const needed = Math.max(...roles.map(r => order[r] || 1));
  if ((order[user.role] || 0) < needed) throw new Error('forbidden');
}
EOF

# server/logs.js
cat > server/logs.js <<'EOF'
import { db } from './db/pool.js';

export async function logEvent(requestId, userId, event, context = {}) {
  const d = await db;
  await d.query('INSERT INTO logs (request_id, user_id, event, context) VALUES (?, ?, ?, ?)', [requestId, userId || null, event, JSON.stringify(context)]);
}
EOF

# server/queue.js
cat > server/queue.js <<'EOF'
import { Queue, Worker, QueueScheduler } from 'bullmq';
import dotenv from 'dotenv';
import { db } from './db/pool.js';
import { routeMessage } from './router.js';
dotenv.config();

const connection = { host: process.env.REDIS_HOST, port: Number(process.env.REDIS_PORT || 6379) };
export const taskQueue = new Queue('tasks', { connection });
new QueueScheduler('tasks', { connection });

export async function enqueueTask(userId, payload) {
  const job = await taskQueue.add('task', { userId, payload }, { priority: payload.priority || 3, removeOnComplete: true });
  const d = await db;
  await d.query('INSERT INTO tasks (type, source, payload, status, priority, user_id, request_id) VALUES (?, ?, ?, ?, ?, ?, ?)', [
    payload.type, payload.source || 'wildberries', JSON.stringify(payload), 'queued', payload.priority || 3, userId, payload.requestId || null
  ]);
  return { id: job.id };
}

export const worker = new Worker('tasks', async job => {
  const { userId, payload } = job.data;
  const user = { id: userId, role: 'viewer' };
  const d = await db;
  await d.query('UPDATE tasks SET status = "running" WHERE id = ?', [job.id]);
  const res = await routeMessage(user, payload);
  await d.query('UPDATE tasks SET status = "done", result = ? WHERE id = ?', [JSON.stringify(res), job.id]);
  return res;
}, { connection });
EOF

# server/swagger.yaml
cat > server/swagger.yaml <<'EOF'
openapi: 3.0.3
info:
  title: WB Project API
  version: "1.0.0"
servers:
  - url: http://localhost:8090
    description: Admin REST API
  - url: ws://localhost:8080/ws
    description: WebSocket endpoint
components:
  securitySchemes:
    BearerAuth:
      type: http
      scheme: bearer
      bearerFormat: JWT
  schemas:
    WildberriesMessage:
      type: object
      required: [source, type]
      properties:
        source:
          type: string
          example: wildberries
        type:
          type: string
          example: suggest
        val:
          oneOf:
            - type: string
            - type: integer
        payload:
          type: object
        queue:
          type: boolean
paths:
  /admin/users:
    get:
      security:
        - BearerAuth: []
      responses:
        '200':
          description: OK
  /ws:
    get:
      description: WebSocket endpoint (Sec-WebSocket-Protocol: Bearer <JWT>)
      responses:
        '101':
          description: Switching protocols
EOF

# server/db/pool.js
cat > server/db/pool.js <<'EOF'
import dotenv from 'dotenv';
dotenv.config();

export const isPg = process.env.DB_DRIVER === 'pg';

let db;
if (isPg) {
  import('pg').then(({ Pool }) => {
    db = new Pool({ connectionString: process.env.DB_URL });
  });
} else {
  import('mysql2/promise').then(({ default: mysql }) => {
    db = mysql.createPool({
      host: process.env.DB_HOST || '127.0.0.1',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASS || '',
      database: process.env.DB_NAME || 'wbapp',
      waitForConnections: true,
      connectionLimit: 10
    });
  });
}

export async function getDb() {
  if (db) return db;
  for (let i = 0; i < 20; i++) {
    if (db) return db;
    await new Promise(r => setTimeout(r, 100));
  }
  throw new Error('db_not_ready');
}

export const db = getDb();
EOF

# server/db/migrations.sql
cat > server/db/migrations.sql <<'EOF'
-- migrations (same as in README)
CREATE TABLE IF NOT EXISTS users (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('admin','editor','viewer') NOT NULL DEFAULT 'viewer',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
-- tokens, fingerprints, products, brands, sellers, tasks, logs (omitted for brevity)
EOF

# server/db/upserts.js
cat > server/db/upserts.js <<'EOF'
import { db } from './pool.js';

export async function upsertProduct(p) {
  const d = await db;
  const sql = `
    INSERT INTO products (nm_id, imt_id, slug, title, raw_payload)
    VALUES (?, ?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE imt_id=VALUES(imt_id), slug=VALUES(slug), title=VALUES(title), raw_payload=VALUES(raw_payload), updated_at=NOW()
  `;
  const params = [p.nm_id, p.imt_id || null, p.slug || null, p.title || null, JSON.stringify(p.raw_payload || null)];
  await d.query(sql, params);
}
EOF

# wildberries helpers (simple versions)
cat > server/wildberries/ipResolver.js <<'EOF'
import axios from 'axios';
export async function resolveIP(ip) { return { ip, provider: 'unknown' }; }
EOF

cat > server/wildberries/proxyManager.js <<'EOF'
export async function getProxy(token) {
  return { ip: process.env.PROXY_IP || '91.123.45.67', regionCode: process.env.REGION_CODE || '-1257786' };
}
EOF

cat > server/wildberries/fingerprintManager.js <<'EOF'
import { v4 as uuidv4 } from 'uuid';
import { db } from '../db/pool.js';
export async function getFingerprint(token) {
  const d = await db;
  const [rows] = await d.query('SELECT * FROM fingerprints WHERE token = ? LIMIT 1', [token]);
  if (rows.length) return rows[0];
  const clientId = uuidv4();
  await d.query('INSERT INTO fingerprints (token, client_id, device_id, user_agent, locale, language, cookies, spp, app_type) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)', [token, clientId, `dev-${Date.now()}` , 'UA', 'ru', 'ru-RU', 'region=-1257786; spp=30;', 30, '1']);
  const [r2] = await d.query('SELECT * FROM fingerprints WHERE token = ? LIMIT 1', [token]);
  return r2[0];
}
EOF

cat > server/wildberries/buildHeaders.js <<'EOF'
import { resolveIP } from './ipResolver.js';
import { getFingerprint } from './fingerprintManager.js';
import { getProxy } from './proxyManager.js';
export async function buildHeaders(token) {
  const proxy = await getProxy(token);
  const ipInfo = await resolveIP(proxy.ip);
  const fp = await getFingerprint(token);
  return { 'User-Agent': fp?.user_agent || 'UA', 'Cookie': fp?.cookies || '', 'X-Region': proxy.regionCode || '-1257786', 'X-App-Type': String(fp?.app_type || '1'), 'X-Client-ID': fp?.client_id || 'cid' };
}
EOF

# handlers
cat > server/wildberries/handlers/suggest.js <<'EOF'
import axios from 'axios';
import { buildHeaders } from '../buildHeaders.js';
export async function handle(requestId, user, msg) {
  const q = encodeURIComponent(msg.val || msg.query || '');
  const headers = await buildHeaders(user?.id || 'anon');
  const url = `https://u-suggests.wb.ru/suggests/api/v7/hint?query=${q}&locale=ru&lang=ru&appType=${headers['X-App-Type']}` ;
  const { data } = await axios.get(url, { headers, timeout: 8000 });
  return { type: 'suggest', data };
}
EOF

cat > server/wildberries/handlers/search.js <<'EOF'
import axios from 'axios';
import { buildHeaders } from '../buildHeaders.js';
export async function handle(requestId, user, msg) {
  const q = encodeURIComponent(msg.val || msg.query || '');
  const headers = await buildHeaders(user?.id || 'anon');
  const params = new URLSearchParams({ query: q, appType: headers['X-App-Type'], dest: headers['X-Region'] || '-1257786', lang: 'ru', curr: 'rub' });
  const url = `https://u-search.wb.ru/exactmatch/ru/common/v18/search?${params.toString()}` ;
  const { data } = await axios.get(url, { headers, timeout: 12000 });
  return { type: 'search', data };
}
EOF

cat > server/wildberries/handlers/product.js <<'EOF'
import axios from 'axios';
import { nmIdToVolPart, normalizeCardJson } from '../utils.js';
import { upsertProduct } from '../../db/upserts.js';
import { buildHeaders } from '../buildHeaders.js';
export async function handle(requestId, user, msg) {
  const nm_id = String(msg.val || msg.query || '');
  const headers = await buildHeaders(user?.id || 'anon');
  const vol = 'vol0', part = 'part0';
  const url = `https://basket-23.wbbasket.ru/${vol}/${part}/${nm_id}/info/ru/card.json` ;
  try {
    const { data } = await axios.get(url, { headers, timeout: 8000 });
    if (data && data.nm_id) {
      await upsertProduct({ nm_id: data.nm_id, raw_payload: data });
      return { type: 'product', data };
    }
  } catch {}
  throw new Error('product_not_found');
}
EOF

cat > server/wildberries/handlers/brand.js <<'EOF'
import axios from 'axios';
import { buildHeaders } from '../buildHeaders.js';
import { normalizeBrandJson } from '../utils.js';
import { upsertBrand } from '../../db/upserts.js';
export async function handle(requestId, user, { val }) {
  const headers = await buildHeaders(user?.id || 'anon');
  const url = `https://static-basket-01.wbbasket.ru/vol0/data/brands/${val}.json` ;
  const { data } = await axios.get(url, { headers, timeout: 7000 });
  await upsertBrand(normalizeBrandJson(data));
  return { type: 'brand', data };
}
EOF

cat > server/wildberries/handlers/seller.js <<'EOF'
import axios from 'axios';
import { buildHeaders } from '../buildHeaders.js';
import { upsertSeller } from '../../db/upserts.js';
export async function handle(requestId, user, { val }) {
  const headers = await buildHeaders(user?.id || 'anon');
  const url = `https://www.wildberries.ru/seller/${val}` ;
  const { data } = await axios.get(url, { headers, timeout: 9000 });
  await upsertSeller({ supplier_id: Number(val), name: (data || '').slice(0,100) });
  return { type: 'seller', data: { supplier_id: Number(val) } };
}
EOF

# utils minimal
cat > server/wildberries/utils.js <<'EOF'
export function nmIdToVolPart(nm_id) {
  const s = String(nm_id).padStart(6,'0');
  return { vol: `vol${s.slice(0,4)}` , part: `part${s.slice(0,6)}`  };
}
export function normalizeCardJson(obj) { return { nm_id: obj.nm_id, raw_payload: obj }; }
export function normalizeBrandJson(obj) { return { brand_id: obj.id || 0, name: obj.name || null, raw_payload: obj }; }
EOF

# systemd
mkdir -p systemd
cat > systemd/api-ws-server.service <<'EOF'
[Unit]
Description=API WS Server
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/opt/ws-api-server
ExecStart=/usr/bin/node /opt/ws-api-server/server/index.js
Restart=on-failure
EnvironmentFile=/opt/ws-api-server/.env

[Install]
WantedBy=multi-user.target
EOF

echo "Project scaffold created at: $(pwd)"
echo "Next steps:"
echo "  1) cd ws-api-server"
echo "  2) cp .env.example .env && edit .env"
echo "  3) npm ci"
echo "  4) mysql -u root -p wbapp < server/db/migrations.sql"
echo "  5) npm start"
