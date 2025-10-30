import axios from 'axios';
import { nmIdToVolPart } from '../../utils.js';
import { upsertProduct } from '../../utils/upserts.js';
import { buildHeaders } from '../../utils/buildHeaders.js';
import { logEvent } from '../../utils/logs.js';

const CACHE = new Map();
const CACHE_TTL = 1000 * 60 * 30; // 30 minutes

export async function handle(requestId, user, msg) {
  const nm_id = String(msg.val || msg.query || '').trim();
  if (!nm_id || !/^\d+$/.test(nm_id)) {
    throw new Error('invalid_product_id');
  }

  // Try cache first
  const cacheKey = `product:${nm_id}`;
  const cached = CACHE.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return { type: 'product', data: cached.data };
  }

  try {
    const headers = await buildHeaders(user?.id || 'anon');
    const { vol, part } = nmIdToVolPart(nm_id);
    const url = `https://basket-23.wbbasket.ru/${vol}/${part}/${nm_id}/info/ru/card.json`;
    
    const { data } = await axios.get(url, { 
      headers,
      timeout: 15000,
      validateStatus: () => true // Don't throw on HTTP errors
    });

    if (!data || !data.nm_id) {
      throw new Error('product_not_found');
    }

    // Cache and save to database
    CACHE.set(cacheKey, {
      data,
      timestamp: Date.now()
    });
    
    await upsertProduct({
      nm_id: data.nm_id,
      imt_id: data.imt_id || null,
      title: data.naming?.title || null,
      brand: data.selling?.brand_name || null,
      brand_id: data.selling?.brand_id || null,
      price: data.price?.price || null,
      price_old: data.price?.price_with_sale || null,
      rating: data.feedback_rating || null,
      feedback_count: data.feedback_count || 0,
      raw_payload: data
    });

    return { type: 'product', data };
  } catch (error) {
    console.error('Product error:', error);
    await logEvent(requestId, user?.id, 'product_error', { 
      error: error.message, 
      nm_id,
      stack: error.stack
    });
    
    throw new Error('failed_to_fetch_product');
  }
}
