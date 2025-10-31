// mock-data/system-mocks.js
export const systemServices = {
  redis: {
    name: 'Redis',
    status: 'running',
    uptime: '5d 12h 34m',
    lastRestart: '2024-01-10T08:30:00Z'
  },
  
  websocket: {
    name: 'WebSocket Server',
    status: 'running', 
    uptime: '2d 8h 15m',
    lastRestart: '2024-01-12T14:20:00Z'
  },
  
  api: {
    name: 'API Server',
    status: 'running',
    uptime: '2d 8h 15m', 
    lastRestart: '2024-01-12T14:20:00Z'
  }
};

export const generateLogs = (limit = 50) => {
  const levels = ['INFO', 'WARNING', 'ERROR'];
  const modules = ['API', 'WebSocket', 'Database'];
  const messages = [
    'User connected via WebSocket',
    'Database query executed successfully',
    'Task completed successfully',
    'Redis cache updated'
  ];
  
  const logs = [];
  const now = new Date();
  
  for (let i = 0; i < limit; i++) {
    const level = levels[Math.floor(Math.random() * levels.length)];
    const module = modules[Math.floor(Math.random() * modules.length)];
    const message = messages[Math.floor(Math.random() * messages.length)];
    
    logs.push({
      id: i + 1,
      timestamp: new Date(now - i * 60000).toISOString(),
      level,
      module,
      message
    });
  }
  
  return logs;
};
