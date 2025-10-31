// Генераторы мок-данных

export function generateMetricsData() {
    return {
        cpu: {
            usage: Math.floor(Math.random() * 30) + 20,
            cores: 4,
            frequency: '2.6 GHz'
        },
        memory: {
            used: Math.floor(Math.random() * 8) + 4,
            total: 16,
            free: 16 - (Math.floor(Math.random() * 8) + 4)
        },
        disk: {
            used: Math.floor(Math.random() * 500) + 100,
            total: 1000,
            free: 1000 - (Math.floor(Math.random() * 500) + 100)
        },
        network: {
            received: Math.floor(Math.random() * 1000000),
            sent: Math.floor(Math.random() * 500000),
            connections: Math.floor(Math.random() * 100) + 50
        },
        users: {
            online: Math.floor(Math.random() * 50) + 10,
            devices: {
                desktop: Math.floor(Math.random() * 30) + 5,
                mobile: Math.floor(Math.random() * 20) + 5
            }
        },
        queue: {
            waiting: Math.floor(Math.random() * 10),
            active: Math.floor(Math.random() * 5),
            completed: Math.floor(Math.random() * 1000) + 500
        },
        requests: {
            today: Math.floor(Math.random() * 10000) + 5000,
            perSecond: Math.floor(Math.random() * 10) + 5
        },
        uptime: Math.floor(Math.random() * 86400) + 3600,
        lastRestart: new Date(Date.now() - Math.floor(Math.random() * 7 * 24 * 60 * 60 * 1000)).toISOString()
    };
}

export const systemServices = [
    { id: 'api', name: 'API Server', status: 'running', uptime: '5d 3h' },
    { id: 'database', name: 'Database', status: 'running', uptime: '7d 12h' },
    { id: 'cache', name: 'Cache', status: 'running', uptime: '2d 8h' },
    { id: 'queue', name: 'Queue Worker', status: 'running', uptime: '1d 6h' }
];

export function generateLogs(count = 50) {
    const levels = ['info', 'warning', 'error'];
    const sources = ['auth', 'api', 'database', 'cron', 'system'];
    const messages = [
        'User authentication successful',
        'Database query executed',
        'Cache updated',
        'Scheduled task completed',
        'System health check passed'
    ];

    const logs = [];

    for (let i = 0; i < count; i++) {
        const level = levels[Math.floor(Math.random() * levels.length)];
        const source = sources[Math.floor(Math.random() * sources.length)];
        const message = messages[Math.floor(Math.random() * messages.length)];
        const time = new Date(Date.now() - Math.floor(Math.random() * 24 * 60 * 60 * 1000));

        logs.push({
            id: i + 1,
            level,
            source,
            message: `${message} (${source})`,
            timestamp: time.toISOString()
        });
    }

    return logs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
}

export function generateIdeas() {
    const statuses = ['new', 'in-progress', 'completed', 'rejected'];
    const priorities = ['low', 'medium', 'high'];
    const categories = ['feature', 'improvement', 'bugfix', 'ui-ux', 'performance'];
    const ideas = [];

    for (let i = 0; i < 15; i++) {
        const status = statuses[Math.floor(Math.random() * statuses.length)];
        const priority = priorities[Math.floor(Math.random() * priorities.length)];
        const category = categories[Math.floor(Math.random() * categories.length)];

        ideas.push({
            id: i + 1,
            title: `Идея улучшения #${i + 1}`,
            description: `Подробное описание идеи для улучшения системы.`,
            status,
            priority,
            category,
            votes: Math.floor(Math.random() * 50),
            comments: Math.floor(Math.random() * 10),
            createdBy: `user${Math.floor(Math.random() * 5) + 1}`,
            createdAt: new Date(Date.now() - Math.floor(Math.random() * 30 * 24 * 60 * 60 * 1000)).toISOString(),
            estimatedHours: Math.floor(Math.random() * 40) + 8,
            tags: ['frontend', 'backend', 'database'].slice(0, Math.floor(Math.random() * 3) + 1)
        });
    }

    return ideas;
}

export function generateTickets() {
    const statuses = ['open', 'in-progress', 'resolved', 'closed'];
    const priorities = ['low', 'medium', 'high', 'urgent'];
    const types = ['user', 'system'];
    const tickets = [];

    for (let i = 0; i < 20; i++) {
        const status = statuses[Math.floor(Math.random() * statuses.length)];
        const priority = priorities[Math.floor(Math.random() * priorities.length)];
        const type = types[Math.floor(Math.random() * types.length)];

        tickets.push({
            id: i + 1,
            subject: type === 'system' ? `Системное уведомление #${i + 1}` : `Обращение пользователя #${i + 1}`,
            message: type === 'system'
                ? `Системное сообщение о событии #${i + 1}`
                : `Описание проблемы от пользователя #${i + 1}`,
            type,
            status,
            priority,
            category: {
                id: Math.floor(Math.random() * 3) + 1,
                name: ['Технические проблемы', 'Уведомления', 'Запросы пользователей'][Math.floor(Math.random() * 3)],
                color: ['#ef4444', '#3b82f6', '#10b981'][Math.floor(Math.random() * 3)]
            },
            createdAt: new Date(Date.now() - Math.floor(Math.random() * 30 * 24 * 60 * 60 * 1000)).toISOString(),
            fromUser: type === 'system' ? 'system' : `user${Math.floor(Math.random() * 5) + 1}@example.com`,
            readBy: Math.random() > 0.7 ? ['admin'] : [],
            assignedTo: Math.random() > 0.5 ? `support${Math.floor(Math.random() * 3) + 1}` : null
        });
    }

    return tickets;
}

export function getTicketCategories() {
    return [
        { id: 1, name: 'Технические проблемы', color: '#ef4444', enabled: true, description: 'Проблемы с системой и ошибки' },
        { id: 2, name: 'Уведомления', color: '#3b82f6', enabled: true, description: 'Системные уведомления' },
        { id: 3, name: 'Запросы пользователей', color: '#10b981', enabled: true, description: 'Запросы от пользователей' }
    ];
}

export function getCurrentUser() {
    return {
        id: 1,
        name: 'Admin',
        email: 'admin@example.com',
        role: 'admin',
        avatar: 'https://i.pravatar.cc/150?img=1'
    };
}