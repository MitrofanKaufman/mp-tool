// server.js - Pure Node.js server with CORS and admin dashboard
import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import { parse, fileURLToPath } from 'url';
import { dirname, join, extname } from 'path';
import { readFile, stat } from 'fs/promises';
import { createReadStream } from 'fs';
import { mockData, generateMockTableData, generateMetricsData, generateBegetMetrics, systemServices, generateLogs, generateIdeas, generateTickets, generateInternalMessages, getTicketCategories, getCurrentUser } from './mock-data/index.js';

// Get current directory name in ES module
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Function to serve static files
const serveStaticFile = async (res, filePath, contentType) => {
    try {
        const data = await readFile(filePath);
        res.setHeader('Content-Type', contentType);
        res.end(data);
    } catch (error) {
        res.statusCode = 404;
        res.end('File not found');
    }
};

const server = createServer();
const wss = new WebSocketServer({ server, path: '/ws' });

// Service control state
const serviceStates = {
    redis: { status: 'running', lastAction: null },
    websocket: { status: 'running', lastAction: null },
    api: { status: 'running', lastAction: null },
    database: { status: 'running', lastAction: null }
};

// Settings storage
let settings = {
    api: {
        timeout: 10000,
        retryCount: 3,
        rateLimit: 100
    },
    database: {
        poolSize: 10,
        timeout: 5000
    },
    logging: {
        level: 'info',
        retention: '30d'
    },
    notifications: {
        enabled: true,
        email: 'admin@example.com'
    },
    messaging: {
        autoAssign: true,
        notifyNewTickets: true,
        workingHours: '09:00-18:00',
        responseTimeout: 24
    }
};

// CORS middleware function
const setCorsHeaders = (res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, sec-websocket-protocol');
    res.setHeader('Access-Control-Allow-Credentials', 'false');
};

// Handle OPTIONS requests for CORS preflight
const handleOptions = (req, res) => {
    setCorsHeaders(res);
    res.writeHead(200);
    res.end();
};

// Helper function to send JSON responses
const sendJsonResponse = (res, statusCode, data) => {
    setCorsHeaders(res);
    res.setHeader('Content-Type', 'application/json');
    res.writeHead(statusCode);
    res.end(JSON.stringify(data));
};

// Helper function to parse request body
const parseRequestBody = (req) => {
    return new Promise((resolve, reject) => {
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', () => {
            try {
                resolve(body ? JSON.parse(body) : {});
            } catch (error) {
                reject(new Error('Invalid JSON'));
            }
        });
        req.on('error', reject);
    });
};

// Health check
const handleHealthCheck = (req, res) => {
    sendJsonResponse(res, 200, {
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        mode: process.env.NODE_ENV || 'development'
    });
};

// Admin status
const handleAdminStatus = (req, res) => {
    sendJsonResponse(res, 200, {
        status: 'ok',
        connections: wss.clients.size,
        memoryUsage: process.memoryUsage(),
        uptime: process.uptime()
    });
};

// API routes handler
const handleApiRequest = async (req, res, pathname) => {
    try {
        const [_, mode, version, module] = pathname.split('/');
        const data = await parseRequestBody(req);

        if (!['t1', 'v1'].includes(mode + version) || !mockData[module]) {
            return sendJsonResponse(res, 400, {
                error: 'Invalid endpoint',
                availableModules: Object.keys(mockData)
            });
        }

        const result = mockData[module](data.query || data.val || 'test');

        sendJsonResponse(res, 200, {
            success: true,
            mode: mode,
            version: parseInt(version),
            module,
            timestamp: new Date().toISOString(),
            data: result
        });

    } catch (error) {
        sendJsonResponse(res, 500, { error: error.message });
    }
};

// Metrics endpoints
const handleMetrics = (req, res) => {
    const metrics = generateMetricsData();
    sendJsonResponse(res, 200, metrics);
};

const handleBegetMetrics = (req, res) => {
    const metrics = generateBegetMetrics();
    sendJsonResponse(res, 200, metrics);
};

// Services endpoints
const handleServices = (req, res) => {
    const servicesWithState = Object.entries(systemServices).map(([key, service]) => ({
        ...service,
        id: key,
        controlState: serviceStates[key]
    }));

    sendJsonResponse(res, 200, { services: servicesWithState });
};

const handleServiceControl = async (req, res, pathname) => {
    try {
        const [_, serviceId, action] = pathname.split('/');
        const data = await parseRequestBody(req);

        if (!serviceStates[serviceId]) {
            return sendJsonResponse(res, 404, { error: 'Service not found' });
        }

        // Simulate service control
        serviceStates[serviceId].lastAction = {
            action,
            timestamp: new Date().toISOString(),
            user: data.user || 'admin'
        };

        // Simulate state change
        if (action === 'restart') {
            serviceStates[serviceId].status = 'restarting';
            setTimeout(() => {
                serviceStates[serviceId].status = 'running';
            }, 3000);
        } else if (action === 'stop') {
            serviceStates[serviceId].status = 'stopped';
        } else if (action === 'start') {
            serviceStates[serviceId].status = 'starting';
            setTimeout(() => {
                serviceStates[serviceId].status = 'running';
            }, 2000);
        }

        sendJsonResponse(res, 200, {
            success: true,
            service: serviceId,
            action,
            newStatus: serviceStates[serviceId].status,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        sendJsonResponse(res, 500, { error: error.message });
    }
};

// Settings endpoints
const handleSettings = async (req, res) => {
    try {
        if (req.method === 'GET') {
            return sendJsonResponse(res, 200, { settings });
        }

        if (req.method === 'POST') {
            const newSettings = await parseRequestBody(req);
            settings = { ...settings, ...newSettings };
            return sendJsonResponse(res, 200, {
                success: true,
                settings,
                message: 'Settings updated successfully'
            });
        }

    } catch (error) {
        sendJsonResponse(res, 500, { error: error.message });
    }
};

// Logs endpoint
const handleLogs = (req, res) => {
    const { query } = parse(req.url, true);
    const limit = parseInt(query.limit) || 50;
    const level = query.level || 'all';

    let logs = generateLogs(limit);

    if (level !== 'all') {
        logs = logs.filter(log => log.level === level.toUpperCase());
    }

    sendJsonResponse(res, 200, {
        logs,
        total: logs.length,
        filters: { level, limit }
    });
};

// Ideas endpoints
const handleIdeas = (req, res) => {
    const ideas = generateIdeas();
    sendJsonResponse(res, 200, { ideas });
};

const handleCreateIdea = async (req, res) => {
    try {
        const data = await parseRequestBody(req);
        const ideas = generateIdeas();

        const newIdea = {
            id: Math.max(...ideas.map(i => i.id)) + 1,
            ...data,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            votes: 0,
            comments: 0
        };

        sendJsonResponse(res, 201, { idea: newIdea });
    } catch (error) {
        sendJsonResponse(res, 500, { error: error.message });
    }
};

// Tickets endpoints
const handleTickets = (req, res) => {
    const tickets = generateTickets();
    sendJsonResponse(res, 200, { tickets });
};

const handleTicketCategories = (req, res) => {
    const categories = getTicketCategories();
    sendJsonResponse(res, 200, { categories });
};

const handleUpdateTicketCategory = async (req, res) => {
    try {
        const data = await parseRequestBody(req);
        sendJsonResponse(res, 200, {
            success: true,
            category: data,
            message: 'Category updated successfully'
        });
    } catch (error) {
        sendJsonResponse(res, 500, { error: error.message });
    }
};

const handleMarkTicketRead = async (req, res) => {
    try {
        const { ticketId } = await parseRequestBody(req);
        const currentUser = getCurrentUser();

        sendJsonResponse(res, 200, {
            success: true,
            ticketId,
            readBy: currentUser.id,
            message: 'Ticket marked as read'
        });
    } catch (error) {
        sendJsonResponse(res, 500, { error: error.message });
    }
};

// Internal messages endpoints
const handleInternalMessages = (req, res) => {
    const messages = generateInternalMessages();
    sendJsonResponse(res, 200, { messages });
};

// Swagger documentation
const handleSwagger = (req, res) => {
    try {
        const swaggerDoc = {
            openapi: '3.0.0',
            info: {
                title: 'Wildberries Data Collector API',
                version: '1.0.0',
                description: 'API for collecting and managing Wildberries data'
            },
            servers: [{ url: `http://localhost:${process.env.PORT || 8081}` }],
            paths: {
                '/api/{mode}{version}/{module}': {
                    post: {
                        summary: 'Execute module',
                        parameters: [
                            { name: 'mode', in: 'path', required: true, schema: { type: 'string', enum: ['t', 'v'] } },
                            { name: 'version', in: 'path', required: true, schema: { type: 'string' } },
                            { name: 'module', in: 'path', required: true, schema: { type: 'string', enum: ['suggest', 'search', 'product', 'brand', 'seller'] } }
                        ],
                        requestBody: {
                            required: true,
                            content: {
                                'application/json': {
                                    schema: {
                                        type: 'object',
                                        properties: {
                                            query: { type: 'string' },
                                            val: { type: 'string' }
                                        }
                                    }
                                }
                            }
                        },
                        responses: {
                            200: { description: 'Success' },
                            400: { description: 'Bad Request' }
                        }
                    }
                },
                '/admin/metrics': {
                    get: { summary: 'Get system metrics', responses: { 200: { description: 'Success' } } }
                },
                '/admin/services': {
                    get: { summary: 'Get services status', responses: { 200: { description: 'Success' } } }
                },
                '/admin/logs': {
                    get: {
                        summary: 'Get system logs',
                        parameters: [
                            { name: 'limit', in: 'query', schema: { type: 'integer' } },
                            { name: 'level', in: 'query', schema: { type: 'string', enum: ['all', 'info', 'warning', 'error', 'debug'] } }
                        ],
                        responses: { 200: { description: 'Success' } }
                    }
                }
            }
        };

        sendJsonResponse(res, 200, swaggerDoc);
    } catch (error) {
        sendJsonResponse(res, 500, { error: error.message });
    }
};

// Main request handler
server.on('request', async (req, res) => {
    const { pathname, query } = parse(req.url, true);

    if (req.method === 'OPTIONS') return handleOptions(req, res);
    setCorsHeaders(res);

    try {
        // Serve dashboard.html for root path
        if (pathname === '/' || pathname === '/index.html' || pathname === '/dashboard.html') {
            return serveStaticFile(res, join(__dirname, 'public', 'dashboard.html'), 'text/html');
        }

        // Handle static files from public directory
        if (pathname.startsWith('/')) {
            const filePath = join(__dirname, 'public', pathname === '/' ? 'dashboard.html' : pathname);
            
            try {
                const stats = await stat(filePath);
                if (stats.isFile()) {
                    const ext = extname(pathname).toLowerCase().substring(1);
                    const mimeTypes = {
                        'html': 'text/html',
                        'js': 'text/javascript',
                        'css': 'text/css',
                        'json': 'application/json',
                        'png': 'image/png',
                        'jpg': 'image/jpg',
                        'jpeg': 'image/jpeg',
                        'gif': 'image/gif',
                        'svg': 'image/svg+xml',
                        'wav': 'audio/wav',
                        'mp4': 'video/mp4',
                        'woff': 'application/font-woff',
                        'ttf': 'application/font-ttf',
                        'eot': 'application/vnd.ms-fontobject',
                        'otf': 'application/font-otf',
                        'wasm': 'application/wasm'
                    };

                    const contentType = mimeTypes[ext] || 'application/octet-stream';
                    res.setHeader('Content-Type', contentType);
                    
                    // Use streams for better performance with large files
                    const fileStream = createReadStream(filePath);
                    fileStream.pipe(res);
                    
                    // Handle stream errors
                    fileStream.on('error', () => {
                        res.statusCode = 500;
                        res.end('Error reading file');
                    });
                    
                    return;
                }
            } catch (error) {
                // File not found, will be handled by 404 below
            }
        }

        // Basic routes
        if (pathname === '/health') return handleHealthCheck(req, res);
        if (pathname === '/admin/status') return handleAdminStatus(req, res);

        // API routes
        if (req.method === 'POST' && pathname.match(/^\/api\/(t|v)1\/(suggest|search|product|brand|seller)$/)) {
            return await handleApiRequest(req, res, pathname);
        }

        // Admin routes
        if (pathname === '/admin/metrics') return handleMetrics(req, res);
        if (pathname === '/admin/beget-metrics') return handleBegetMetrics(req, res);
        if (pathname === '/admin/services' && req.method === 'GET') return handleServices(req, res);
        if (pathname.match(/^\/admin\/services\/\w+\/(start|stop|restart)$/) && req.method === 'POST') {
            return await handleServiceControl(req, res, pathname);
        }
        if (pathname === '/admin/settings') return await handleSettings(req, res);
        if (pathname === '/admin/logs') return handleLogs(req, res);
        if (pathname === '/docs/swagger.json') return handleSwagger(req, res);

        // Messaging system routes
        if (pathname === '/admin/ideas' && req.method === 'GET') return handleIdeas(req, res);
        if (pathname === '/admin/ideas' && req.method === 'POST') return await handleCreateIdea(req, res);

        if (pathname === '/admin/tickets' && req.method === 'GET') return handleTickets(req, res);
        if (pathname === '/admin/tickets/categories' && req.method === 'GET') return handleTicketCategories(req, res);
        if (pathname === '/admin/tickets/categories' && req.method === 'PUT') return await handleUpdateTicketCategory(req, res);
        if (pathname === '/admin/tickets/mark-read' && req.method === 'POST') return await handleMarkTicketRead(req, res);

        if (pathname === '/admin/messages/internal' && req.method === 'GET') return handleInternalMessages(req, res);
        if (pathname === '/admin/messages/internal' && req.method === 'POST') {
            // Handle new internal message
            const data = await parseRequestBody(req);
            return sendJsonResponse(res, 201, { message: { id: Date.now(), ...data, createdAt: new Date().toISOString() } });
        }

        // Database and queue routes
        if (req.method === 'GET' && pathname.match(/^\/api\/(t|v)1\/db\/tables$/)) {
            return sendJsonResponse(res, 200, { tables: [
                    { name: 'products', count: 150, description: 'Товары' },
                    { name: 'brands', count: 45, description: 'Бренды' },
                    { name: 'sellers', count: 23, description: 'Продавцы' }
                ]});
        }

        if (req.method === 'POST' && pathname.match(/^\/api\/(t|v)1\/db\/query$/)) {
            const data = await parseRequestBody(req);
            const mockData = generateMockTableData(data.table, data.limit || 10);
            return sendJsonResponse(res, 200, { table: data.table, data: mockData, total: mockData.length });
        }

        if (pathname.match(/^\/api\/(t|v)1\/queue\/status$/)) {
            return sendJsonResponse(res, 200, {
                waiting: Math.floor(Math.random() * 20),
                active: Math.floor(Math.random() * 10),
                completed: Math.floor(Math.random() * 1000)
            });
        }

        // If no route matched, try to serve dashboard.html for SPA routing
        if (pathname.startsWith('/admin/')) {
            try {
                return serveStaticFile(res, join(__dirname, 'public', 'dashboard.html'), 'text/html');
            } catch (error) {
                // If dashboard.html is not found, return 404
                res.statusCode = 404;
                res.end('Not found');
            }
        } else {
            res.statusCode = 404;
            res.end('Not found');
        }

    } catch (error) {
        sendJsonResponse(res, 500, { error: error.message });
    }
});

// WebSocket connections
wss.on('connection', (ws, req) => {
    const token = req.headers['sec-websocket-protocol'];

    if (!token || !token.includes('Bearer')) {
        ws.close();
        return;
    }

    console.log('New WebSocket connection');

    ws.user = {
        id: 'user-' + Date.now(),
        role: 'viewer',
        token: token.replace('Bearer ', '')
    };

    ws.on('message', async (data) => {
        try {
            const msg = JSON.parse(data.toString());

            if (msg.type === 'ping') {
                ws.send(JSON.stringify({
                    type: 'pong',
                    requestId: msg.requestId,
                    timestamp: Date.now()
                }));
                return;
            }

            if (mockData[msg.type]) {
                await new Promise(resolve => setTimeout(resolve, 100));
                const result = mockData[msg.type](msg.val || msg.query || '');
                ws.send(JSON.stringify({
                    success: true,
                    type: msg.type,
                    requestId: msg.requestId,
                    data: result
                }));
            }

        } catch (error) {
            ws.send(JSON.stringify({
                success: false,
                error: 'Invalid message format'
            }));
        }
    });

    ws.on('close', () => {
        console.log('WebSocket connection closed');
    });

    // Welcome message
    ws.send(JSON.stringify({
        type: 'welcome',
        userId: ws.user.id,
        timestamp: new Date().toISOString()
    }));
});

// Graceful shutdown
const gracefulShutdown = () => {
    console.log('\n🛑 Shutting down gracefully...');

    wss.clients.forEach(client => {
        client.close(1001, 'Server shutdown');
    });

    server.close(() => {
        console.log('✅ Server closed');
        process.exit(0);
    });

    setTimeout(() => {
        console.log('⚠️ Forcing shutdown');
        process.exit(1);
    }, 5000);
};

process.on('SIGINT', gracefulShutdown);
process.on('SIGTERM', gracefulShutdown);

// Start server
const PORT = process.env.PORT || 8081;
const HOST = process.env.HOST || 'localhost';

server.listen(PORT, HOST, () => {
    console.log(`🚀 Server running at http://${HOST}:${PORT}`);
    console.log(`📊 Admin dashboard available at http://${HOST}:${PORT}/dashboard.html`);
    console.log(`📚 Swagger docs: http://${HOST}:${PORT}/docs/swagger.json`);
});
