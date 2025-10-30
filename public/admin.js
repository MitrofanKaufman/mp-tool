import express from 'express';
import cors from 'cors';
import swaggerUi from 'swagger-ui-express';
import fs from 'fs';
import yaml from 'js-yaml';
import { knex as db } from './../server/utils/pool.js';
import { verifyToken, getUserById, requireRole } from './auth.js';
import dotenv from 'dotenv';
dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const spec = yaml.load(fs.readFileSync(new URL('./../server/swagger.yaml', import.meta.url), 'utf8'));
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
  const rows = await d.select('id', 'email', 'role', 'created_at').from('users');
  res.json(rows);
});

export function startAdmin(port = 8090) {
  app.listen(port, () => console.log(`[Admin] listening on ${port}` ));
}
