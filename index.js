import Fastify from 'fastify';
import dotenv from 'dotenv';
import websocket from '@fastify/websocket';
import cors from '@fastify/cors';

dotenv.config();

const fastify = Fastify({
  logger: {
    level: 'info',
    transport: {
      target: 'pino-pretty'
    }
  }
});

// Регистрируем только необходимые плагины
await fastify.register(cors);
await fastify.register(websocket);

// Root endpoint
fastify.get('/', async (request, reply) => {
  return {
    message: 'WebSocket API Server is running',
    version: '1.0.0',
    endpoints: {
      'GET /health': 'Health check',
      'GET /admin/status': 'Admin status',
      'WS /ws': 'WebSocket endpoint',
      'POST /api/t1/:module': 'Test mode API (mock data)',
      'POST /api/v1/:module': 'Production mode API (real data)'
    },
    timestamp: new Date().toISOString()
  };
});

// Health check endpoint
fastify.get('/health', async (request, reply) => {
  return {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    mode: process.env.NODE_ENV || 'development'
  };
});

// WebSocket endpoint
fastify.register(async (fastify) => {
  fastify.get('/ws', { websocket: true }, (connection, req) => {
    const { socket } = connection;

    // Временная аутентификация
    const token = req.headers['sec-websocket-protocol'];
    if (!token || !token.startsWith('Bearer ')) {
      socket.close();
      return;
    }

    socket.user = {
      id: 'temp-user',
      role: 'viewer'
    };

    fastify.log.info('New WebSocket connection');

    socket.on('message', async (message) => {
      try {
        const data = JSON.parse(message);

        // Обработка ping
        if (data.type === 'ping') {
          return socket.send(JSON.stringify({
            type: 'pong',
            requestId: data.requestId,
            timestamp: Date.now()
          }));
        }

        // Заглушка для router
        const result = await this.mockRouteMessage(socket.user, data);

        socket.send(JSON.stringify({
          success: true,
          ...result
        }));

      } catch (err) {
        fastify.log.error({ err }, 'Error processing WebSocket message');
        socket.send(JSON.stringify({
          success: false,
          error: err.message || 'Invalid message format',
        }));
      }
    });

    socket.on('close', () => {
      fastify.log.info('WebSocket connection closed');
    });

    // Приветственное сообщение
    socket.send(JSON.stringify({
      type: 'welcome',
      userId: socket.user.id,
      timestamp: Date.now(),
    }));
  });
});

// Mock функция для router (временно)
fastify.mockRouteMessage = async function(user, msg) {
  return {
    type: msg.type,
    requestId: msg.requestId || Date.now().toString(),
    data: { message: 'Mock response', original: msg }
  };
};

// Admin status endpoint
fastify.get('/admin/status', async (request, reply) => {
  return {
    status: 'ok',
    connections: 1,
    memoryUsage: process.memoryUsage(),
    uptime: process.uptime()
  };
});

// API Routes with versioning
fastify.post('/api/:mode:version/:module', async (request, reply) => {
  const { mode, version, module } = request.params;
  const { query, data, options } = request.body;

  // Validate mode
  if (!['t', 'v'].includes(mode)) {
    return reply.status(400).send({
      error: 'Invalid mode',
      message: 'Mode must be "t" (test) or "v" (production)'
    });
  }

  const isTestMode = mode === 't';

  try {
    let result;

    if (isTestMode) {
      // Test mode - mock data
      result = await handleMockRequest(module, query, data, options);
    } else {
      // Production mode - real data (пока тоже mock)
      result = await handleMockRequest(module, query, data, options);
    }

    return {
      success: true,
      mode,
      version: parseInt(version),
      module,
      timestamp: new Date().toISOString(),
      ...result
    };

  } catch (error) {
    fastify.log.error(`API error (${mode}${version}/${module}):`, error);
    return reply.status(500).send({
      success: false,
      error: error.message,
      mode,
      version: parseInt(version),
      module
    });
  }
});

// Database API
fastify.get('/api/:mode:version/db/tables', async (request, reply) => {
  const { mode, version } = request.params;

  return {
    tables: [
      { name: 'products', count: 150, description: 'Товары' },
      { name: 'brands', count: 45, description: 'Бренды' },
      { name: 'sellers', count: 23, description: 'Продавцы' },
      { name: 'tasks', count: 12, description: 'Задачи' },
      { name: 'logs', count: 3456, description: 'Логи' }
    ]
  };
});

fastify.post('/api/:mode:version/db/query', async (request, reply) => {
  const { mode, version } = request.params;
  const { table, limit = 10, offset = 0 } = request.body;

  // Мок данные для таблиц
  const mockData = generateMockTableData(table, limit);
  return {
    table,
    data: mockData,
    total: mockData.length,
    limit,
    offset
  };
});

// Queue API
fastify.get('/api/:mode:version/queue/status', async (request, reply) => {
  return {
    waiting: 5,
    active: 2,
    completed: 123,
    failed: 3,
    workers: 3
  };
});

// Вспомогательные функции
async function handleMockRequest(module, query, data, options) {
  // Имитация задержки сети
  await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 1000));

  return generateMockResponse(module, query, data);
}

function generateMockResponse(module, query, data) {
  const baseData = {
    query,
    timestamp: new Date().toISOString(),
    source: 'wildberries'
  };

  switch (module) {
    case 'suggest':
      return {
        ...baseData,
        data: [
          { value: `${query} телефон`, count: 1234 },
          { value: `${query} наушники`, count: 567 },
          { value: `${query} аксессуары`, count: 234 }
        ]
      };

    case 'search':
      return {
        ...baseData,
        data: {
          products: [
            {
              id: 123456,
              name: `Смартфон ${query} Pro`,
              price: 29999,
              brand: 'Xiaomi',
              rating: 4.7
            }
          ],
          total: 156
        }
      };

    case 'product':
      return {
        ...baseData,
        data: {
          nm_id: query,
          title: `Товар ${query}`,
          price: 89999,
          brand: 'Apple',
          rating: 4.8
        }
      };

    case 'brand':
      return {
        ...baseData,
        data: {
          id: query,
          name: 'Apple',
          products_count: 15600,
          rating: 4.9
        }
      };

    case 'seller':
      return {
        ...baseData,
        data: {
          supplier_id: parseInt(query),
          name: 'Official Store',
          rating: 4.9,
          reviews_count: 45678
        }
      };

    default:
      return baseData;
  }
}

function generateMockTableData(table, limit) {
  const data = [];
  const now = new Date();

  for (let i = 0; i < limit; i++) {
    switch (table) {
      case 'products':
        data.push({
          id: i + 1,
          nm_id: 1000000 + i,
          title: `Товар ${i + 1}`,
          brand: `Бренд ${i % 5}`,
          price: 1000 + i * 100,
          rating: 4 + Math.random()
        });
        break;

      case 'tasks':
        data.push({
          id: i + 1,
          type: ['search', 'product', 'brand'][i % 3],
          status: ['completed', 'running', 'failed'][i % 3],
          created_at: new Date(now - i * 60000).toISOString()
        });
        break;

      default:
        data.push({ id: i + 1, name: `Запись ${i + 1}` });
    }
  }

  return data;
}

// Запуск сервера
const start = async () => {
  try {
    const port = process.env.PORT || 8081;
    const host = process.env.HOST || 'localhost';

    await fastify.listen({ port, host });
    console.log(`🚀 Server listening on http://${host}:${port}`);
    console.log(`📊 API endpoints:`);
    console.log(`   Test mode:     http://${host}:${port}/api/t1/:module`);
    console.log(`   Production:    http://${host}:${port}/api/v1/:module`);
    console.log(`   Dashboard:     http://${host}:${port}/admin`);

  } catch (err) {
    console.error('Server error:', err);
    process.exit(1);
  }
};

start();