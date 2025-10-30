// server/utils/logs.js
export async function logEvent(requestId, userId, event, context = {}) {
  console.log(`[LOG] ${event}`, {
    requestId,
    userId: userId || 'anonymous',
    timestamp: new Date().toISOString(),
    context
  });
  return Promise.resolve();
}