// mock-data/metrics-mocks.js
export const generateMetricsData = () => {
  return {
    queueMetrics: {
      waiting: Math.floor(Math.random() * 20),
      active: Math.floor(Math.random() * 10),
      completed: Math.floor(Math.random() * 1000)
    },
    
    userMetrics: {
      online: Math.floor(Math.random() * 50) + 10,
      total: 2345,
      devices: {
        desktop: Math.floor(Math.random() * 30) + 10,
        mobile: Math.floor(Math.random() * 40) + 20
      }
    },
    
    taskMetrics: {
      created: {
        today: Math.floor(Math.random() * 100) + 50,
        week: Math.floor(Math.random() * 500) + 200
      }
    },
    
    dataMetrics: {
      products: {
        total: 156789,
        today: Math.floor(Math.random() * 1000) + 500
      }
    },
    
    performanceMetrics: {
      cpu: Math.random() * 100,
      memory: Math.random() * 100
    }
  };
};

export const generateBegetMetrics = () => {
  return {
    cpu: {
      usage: Math.random() * 100,
      cores: 4
    },
    memory: {
      total: 8,
      used: Math.random() * 8,
      usage: Math.random() * 100
    },
    services: {
      nginx: { status: 'running', uptime: '15d 4h' },
      mysql: { status: 'running', uptime: '15d 4h' },
      redis: { status: 'running', uptime: '15d 4h' }
    }
  };
};
