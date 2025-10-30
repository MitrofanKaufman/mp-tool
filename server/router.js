import { logEvent } from '../utils/logs.js';

// Заглушки для обработчиков
const handlers = {
  suggest: async (requestId, user, msg) => ({
    type: 'suggest',
    data: []
  }),
  search: async (requestId, user, msg) => ({
    type: 'search',
    data: { products: [] }
  }),
  product: async (requestId, user, msg) => ({
    type: 'product',
    data: { nm_id: msg.val, title: 'Test Product' }
  }),
  brand: async (requestId, user, msg) => ({
    type: 'brand',
    data: { id: msg.val, name: 'Test Brand' }
  }),
  seller: async (requestId, user, msg) => ({
    type: 'seller',
    data: { supplier_id: msg.val, name: 'Test Seller' }
  })
};

export async function routeMessage(user, msg) {
  if (!msg || typeof msg !== 'object') {
    throw new Error('invalid_message');
  }

  const { source = 'wildberries', type } = msg;
  if (source !== 'wildberries') {
    throw new Error('unsupported_source');
  }

  const requestId = msg.requestId || Date.now().toString(36);

  try {
    await logEvent(requestId, user?.id, 'route_start', { type, source });
  } catch (e) {
    console.log('Logging failed:', e.message);
  }

  const handler = handlers[type];
  if (!handler) {
    throw new Error('unsupported_type');
  }

  const res = await handler(requestId, user, msg);

  try {
    await logEvent(requestId, user?.id, 'route_done', { type, source });
  } catch (e) {
    console.log('Logging failed:', e.message);
  }

  return { requestId, ...res };
}