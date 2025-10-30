/**
 * Converts a Wildberries nm_id to vol/part path components
 * @param {string|number} nm_id - The product ID
 * @returns {{vol: string, part: string}} Object with vol and part strings
 */
export function nmIdToVolPart(nm_id) {
  const s = String(nm_id).padStart(6, '0');
  return {
    vol: `vol${s.slice(0, 4)}`,
    part: `part${s.slice(0, 6)}`
  };
}

/**
 * Normalizes product card data
 * @param {Object} obj - Raw product data
 * @returns {Object} Normalized product data
 */
export function normalizeCardJson(obj) {
  if (!obj) return null;
  
  return {
    nm_id: obj.nm_id || obj.id || null,
    imt_id: obj.imt_id || null,
    title: obj.naming?.title || obj.title || null,
    brand: obj.selling?.brand_name || obj.brand || null,
    brand_id: obj.selling?.brand_id || obj.brand_id || null,
    price: obj.price?.price || obj.priceU ? Math.floor(obj.priceU / 100) : null,
    price_old: obj.price?.price_with_sale || null,
    rating: obj.feedback_rating || obj.rating || null,
    feedback_count: obj.feedback_count || 0,
    raw_payload: obj
  };
}

/**
 * Normalizes brand data
 * @param {Object} obj - Raw brand data
 * @returns {Object} Normalized brand data
 */
export function normalizeBrandJson(obj) {
  if (!obj) return null;
  
  return {
    brand_id: obj.id || null,
    name: obj.name || null,
    site: obj.site || null,
    description: obj.description || null,
    raw_payload: obj
  };
}

/**
 * Formats a price in kopecks to rubles
 * @param {number} price - Price in kopecks
 * @returns {number} Price in rubles
 */
export function formatPrice(price) {
  if (typeof price === 'number') {
    return price >= 100 ? Math.floor(price / 100) : price / 100;
  }
  return null;
}

/**
 * Parses a price string with currency symbol
 * @param {string} priceStr - Price string (e.g., "1 234 ₽")
 * @returns {number|null} Price in rubles or null if invalid
 */
export function parsePrice(priceStr) {
  if (!priceStr) return null;
  const match = priceStr.replace(/\s+/g, '').match(/([\d,.]+)/);
  return match ? parseFloat(match[1].replace(',', '.')) : null;
}

/**
 * Generates a product URL on Wildberries
 * @param {string|number} nm_id - Product ID
 * @returns {string} Full product URL
 */
export function getProductUrl(nm_id) {
  return `https://www.wildberries.ru/catalog/${nm_id}/detail.aspx`;
}

/**
 * Generates a seller URL on Wildberries
 * @param {string|number} seller_id - Seller ID
 * @returns {string} Full seller URL
 */
export function getSellerUrl(seller_id) {
  return `https://www.wildberries.ru/seller/${seller_id}`;
}

/**
 * Extracts numeric ID from a Wildberries URL
 * @param {string} url - URL to parse
 * @returns {string|null} Extracted ID or null if not found
 */
export function extractIdFromUrl(url) {
  if (!url) return null;
  const match = url.match(/(\d+)(?:\/|$)/);
  return match ? match[1] : null;
}
