import { Queue, Worker, QueueScheduler } from 'bullmq';
import dotenv from 'dotenv';
import { db } from './utils/pool.js';
import { routeMessage } from './router.js';
dotenv.config();

const connection = { 
  host: process.env.REDIS_HOST, 
  port: Number(process.env.REDIS_PORT || 6379) 
};

export const taskQueue = new Queue('tasks', { connection });
new QueueScheduler('tasks', { connection });

export async function enqueueTask(userId, payload) {
  const job = await taskQueue.add(
    'task', 
    { userId, payload }, 
    { 
      priority: payload.priority || 3, 
      removeOnComplete: true 
    }
  );
  
  const d = await db;
  await d.query(
    'INSERT INTO tasks (type, source, payload, status, priority, user_id, request_id) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [
      payload.type, 
      payload.source || 'wildberries', 
      JSON.stringify(payload), 
      'queued', 
      payload.priority || 3, 
      userId, 
      payload.requestId || null
    ]
  );
  
  return { id: job.id };
}

export const worker = new Worker('tasks', async job => {
  const { userId, payload } = job.data;
  const user = { id: userId, role: 'viewer' };
  const d = await db;
  
  await d.query('UPDATE tasks SET status = "running" WHERE id = ?', [job.id]);
  
  try {
    const res = await routeMessage(user, payload);
    await d.query(
      'UPDATE tasks SET status = "done", result = ? WHERE id = ?', 
      [JSON.stringify(res), job.id]
    );
    return res;
  } catch (error) {
    await d.query(
      'UPDATE tasks SET status = "failed", error = ? WHERE id = ?',
      [error.message, job.id]
    );
    throw error;
  }
}, { 
  connection,
  concurrency: 5,
  limiter: {
    max: 10,
    duration: 1000
  }
});

// Handle worker events
worker.on('completed', (job) => {
  console.log(`Job ${job.id} completed`);
});

worker.on('failed', (job, err) => {
  console.error(`Job ${job?.id} failed:`, err);
});
