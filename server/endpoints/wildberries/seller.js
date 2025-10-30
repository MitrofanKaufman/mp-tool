import axios from 'axios';
import { buildHeaders } from '../../utils/buildHeaders.js';
import { upsertSeller } from '../../utils/upserts.js';
import { logEvent } from '../../utils/logs.js';

const CACHE = new Map();
const CACHE_TTL = 1000 * 60 * 60 * 24; // 24 hours

/**
 * Extract seller information from HTML using regex
 */
function extractSellerInfo(html) {
  if (!html) return null;
  
  try {
    // Try to find seller name in the HTML
    const nameMatch = html.match(/<h1[^>]*>([^<]+)<\/h1>/i);
    const name = nameMatch ? nameMatch[1].trim() : 'Неизвестный продавец';
    
    // Try to find rating
    const ratingMatch = html.match(/ratingValue"[^>]*>([\d.]+)/i);
    const rating = ratingMatch ? parseFloat(ratingMatch[1]) : null;
    
    // Try to find number of reviews
    const reviewsMatch = html.match(/([\d\s]+) отзыв/i);
    const reviews = reviewsMatch ? parseInt(reviewsMatch[1].replace(/\s+/g, ''), 10) : 0;
    
    return { name, rating, reviews };
  } catch (error) {
    console.error('Error parsing seller HTML:', error);
    return { name: 'Продавец', rating: null, reviews: 0 };
  }
}

export async function handle(requestId, user, { val }) {
  const sellerId = String(val || '').trim();
  if (!sellerId || !/^\d+$/.test(sellerId)) {
    throw new Error('invalid_seller_id');
  }

  // Try cache first
  const cacheKey = `seller:${sellerId}`;
  const cached = CACHE.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return { type: 'seller', data: cached.data };
  }

  try {
    const headers = await buildHeaders(user?.id || 'anon');
    const url = `https://www.wildberries.ru/seller/${sellerId}`;
    
    const { data } = await axios.get(url, { 
      headers: {
        ...headers,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'ru-RU,ru;q=0.9,en-US;q=0.8,en;q=0.7',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache',
        'Upgrade-Insecure-Requests': '1'
      },
      timeout: 15000,
      validateStatus: () => true, // Don't throw on HTTP errors
      responseType: 'text'
    });

    const sellerInfo = extractSellerInfo(data);
    if (!sellerInfo) {
      throw new Error('seller_info_not_found');
    }

    const sellerData = {
      supplier_id: parseInt(sellerId, 10),
      name: sellerInfo.name,
      rating: sellerInfo.rating,
      reviews_count: sellerInfo.reviews,
      raw_html: process.env.NODE_ENV === 'development' ? data.substring(0, 1000) + '...' : undefined
    };

    // Cache the data
    CACHE.set(cacheKey, {
      data: sellerData,
      timestamp: Date.now()
    });
    
    // Save to database
    await upsertSeller(sellerData);

    return { type: 'seller', data: sellerData };
  } catch (error) {
    console.error('Seller error:', error);
    await logEvent(requestId, user?.id, 'seller_error', { 
      error: error.message, 
      sellerId,
      stack: error.stack
    });
    
    // Return minimal data on error
    return { 
      type: 'seller', 
      data: {
        supplier_id: parseInt(sellerId, 10),
        name: `Продавец #${sellerId}`,
        rating: null,
        reviews_count: 0,
        error: 'failed_to_fetch_seller_details'
      }
    };
  }
}
