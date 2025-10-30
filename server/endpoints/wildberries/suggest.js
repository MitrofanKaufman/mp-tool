import axios from 'axios';
import { buildHeaders } from '../../utils/buildHeaders.js';
import { logEvent } from '../../utils/logs.js';

const CACHE = new Map();
const CACHE_TTL = 1000 * 60 * 5; // 5 minutes

export async function handle(requestId, user, msg) {
  const query = String(msg.val || msg.query || '').trim();
  if (!query) {
    return { type: 'suggest', data: [] };
  }

  // Try cache first
  const cacheKey = `suggest:${query}`;
  const cached = CACHE.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return { type: 'suggest', data: cached.data };
  }

  try {
    const headers = await buildHeaders(user?.id || 'anon');
    const url = `https://u-suggests.wb.ru/suggests/api/v7/hint?query=${encodeURIComponent(query)}&locale=ru&lang=ru&appType=${headers['X-App-Type']}`;
    
    const { data } = await axios.get(url, { 
      headers,
      timeout: 8000,
      validateStatus: () => true // Don't throw on HTTP errors
    });

    // Cache successful responses
    if (Array.isArray(data)) {
      CACHE.set(cacheKey, {
        data,
        timestamp: Date.now()
      });
    }

    return { type: 'suggest', data };
  } catch (error) {
    console.error('Suggest error:', error);
    await logEvent(requestId, user?.id, 'suggest_error', { error: error.message, query });
    
    // Return empty array on error to prevent client-side issues
    return { type: 'suggest', data: [] };
  }
}
