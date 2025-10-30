import axios from 'axios';
import { buildHeaders } from '../../utils/buildHeaders.js';
import { logEvent } from '../../utils/logs.js';

const CACHE = new Map();
const CACHE_TTL = 1000 * 60 * 15; // 15 minutes

export async function handle(requestId, user, msg) {
  const query = String(msg.val || msg.query || '').trim();
  if (!query) {
    return { type: 'search', data: { products: [] } };
  }

  // Try cache first
  const cacheKey = `search:${query}`;
  const cached = CACHE.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return { type: 'search', data: cached.data };
  }

  try {
    const headers = await buildHeaders(user?.id || 'anon');
    const params = new URLSearchParams({
      query: query,
      appType: headers['X-App-Type'],
      dest: headers['X-Region'] || '-1257786',
      lang: 'ru',
      curr: 'rub',
      spp: headers['X-Region'] === '-1257786' ? '30' : '0',
      resultset: 'catalog',
      sort: 'popular',
      page: 1,
      limit: 100
    });

    const url = `https://u-search.wb.ru/exactmatch/ru/common/v18/search?${params.toString()}`;
    
    const { data } = await axios.get(url, { 
      headers,
      timeout: 12000,
      validateStatus: () => true // Don't throw on HTTP errors
    });

    // Cache successful responses
    if (data && Array.isArray(data.products)) {
      CACHE.set(cacheKey, {
        data,
        timestamp: Date.now()
      });
    }

    return { type: 'search', data };
  } catch (error) {
    console.error('Search error:', error);
    await logEvent(requestId, user?.id, 'search_error', { 
      error: error.message, 
      query,
      stack: error.stack
    });
    
    // Return empty result on error to prevent client-side issues
    return { type: 'search', data: { products: [] } };
  }
}
