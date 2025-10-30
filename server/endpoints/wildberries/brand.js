import axios from 'axios';
import { buildHeaders } from '../../utils/buildHeaders.js';
import { normalizeBrandJson } from '../../utils.js';
import { upsertBrand } from '../../utils/upserts.js';
import { logEvent } from '../../utils/logs.js';

const CACHE = new Map();
const CACHE_TTL = 1000 * 60 * 60 * 24; // 24 hours

export async function handle(requestId, user, { val }) {
  const brandId = String(val || '').trim();
  if (!brandId) {
    throw new Error('brand_id_required');
  }

  // Try cache first
  const cacheKey = `brand:${brandId}`;
  const cached = CACHE.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return { type: 'brand', data: cached.data };
  }

  try {
    const headers = await buildHeaders(user?.id || 'anon');
    const url = `https://static-basket-01.wbbasket.ru/vol0/data/brands/${brandId}.json`;
    
    const { data } = await axios.get(url, { 
      headers,
      timeout: 10000,
      validateStatus: () => true // Don't throw on HTTP errors
    });

    if (!data || !data.id) {
      throw new Error('brand_not_found');
    }

    // Normalize and cache the data
    const brandData = normalizeBrandJson(data);
    CACHE.set(cacheKey, {
      data: brandData,
      timestamp: Date.now()
    });
    
    // Save to database
    await upsertBrand(brandData);

    return { type: 'brand', data: brandData };
  } catch (error) {
    console.error('Brand error:', error);
    await logEvent(requestId, user?.id, 'brand_error', { 
      error: error.message, 
      brandId,
      stack: error.stack
    });
    
    throw new Error('failed_to_fetch_brand');
  }
}
