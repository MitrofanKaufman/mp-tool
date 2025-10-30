import { resolveIP } from './ipResolver.js';
import { getFingerprint } from './fingerprintManager.js';
import { getProxy } from './proxyManager.js';

/**
 * Builds headers for Wildberries API requests
 * @param {string} token - User token for fingerprint management
 * @returns {Promise<Object>} Headers object
 */
export async function buildHeaders(token) {
  try {
    const proxy = await getProxy(token);
    const ipInfo = await resolveIP(proxy.ip);
    const fp = await getFingerprint(token);
    
    return {
      'User-Agent': fp?.user_agent || 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/90.0.4430.212 Safari/537.36',
      'Accept': 'application/json, text/plain, */*',
      'Accept-Language': 'ru-RU,ru;q=0.9,en-US;q=0.8,en;q=0.7',
      'Content-Type': 'application/json',
      'Origin': 'https://www.wildberries.ru',
      'Referer': 'https://www.wildberries.ru/',
      'Cookie': fp?.cookies || '',
      'X-Requested-With': 'XMLHttpRequest',
      'X-Region': proxy.regionCode || '-1257786',
      'X-App-Type': String(fp?.app_type || '1'),
      'X-Client-ID': fp?.client_id || 'cid',
      'X-Forwarded-For': proxy.ip,
      'X-IP': proxy.ip
    };
  } catch (error) {
    console.error('Error building headers:', error);
    return {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/90.0.4430.212 Safari/537.36',
      'X-Region': '-1257786',
      'X-App-Type': '1'
    };
  }
}
