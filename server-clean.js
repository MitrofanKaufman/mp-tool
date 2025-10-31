import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import { parse, fileURLToPath } from 'url';
import { dirname, join, extname } from 'path';
import { readFile, stat } from 'fs/promises';
import { createReadStream } from 'fs';

// Get current directory name in ES module
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configuration
const PORT = process.env.PORT || 8081;
const HOST = process.env.HOST || 'localhost';
const PUBLIC_DIR = join(__dirname, 'public');

// Create HTTP server
const server = createServer();
const wss = new WebSocketServer({ server, path: '/ws' });

// Helper function to serve static files
async function serveStaticFile(res, filePath, contentType = 'text/html') {
    try {
        const data = await readFile(filePath);
        res.setHeader('Content-Type', contentType);
        res.end(data);
    } catch (error) {
        console.error(`Error serving file ${filePath}:`, error);
        res.statusCode = 404;
        res.end('File not found');
    }
}

// CORS headers
function setCorsHeaders(res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Request-Method', '*');
    res.setHeader('Access-Control-Allow-Methods', 'OPTIONS, GET, POST, PUT, DELETE');
    res.setHeader('Access-Control-Allow-Headers', '*');
}

// Handle OPTIONS requests
function handleOptions(req, res) {
    setCorsHeaders(res);
    res.writeHead(200);
    res.end();
}

// Main request handler
server.on('request', async (req, res) => {
    const { pathname } = parse(req.url);
    console.log(`${new Date().toISOString()} - ${req.method} ${pathname}`);

    // Handle CORS preflight
    if (req.method === 'OPTIONS') return handleOptions(req, res);
    setCorsHeaders(res);

    try {
        // Handle API routes
        if (pathname.startsWith('/api/')) {
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            return res.end(JSON.stringify({ message: 'API endpoint', path: pathname }));
        }

        // Handle dashboard routes
        if (pathname === '/' || pathname.startsWith('/dashboard')) {
            return serveStaticFile(res, join(PUBLIC_DIR, 'dashboard.html'));
        }

        // Handle static files
        const filePath = join(PUBLIC_DIR, pathname.substring(1));
        const ext = extname(filePath).toLowerCase().substring(1);
        
        // Define MIME types
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
            'ico': 'image/x-icon'
        };

        try {
            const stats = await stat(filePath);
            if (stats.isFile()) {
                const contentType = mimeTypes[ext] || 'application/octet-stream';
                res.setHeader('Content-Type', contentType);
                
                const fileStream = createReadStream(filePath);
                fileStream.pipe(res);
                
                fileStream.on('error', (error) => {
                    console.error(`Error reading file ${filePath}:`, error);
                    res.statusCode = 500;
                    res.end('Error reading file');
                });
                
                return;
            }
        } catch (error) {
            console.error(`File not found: ${filePath}`);
        }

        // 404 Not Found
        res.statusCode = 404;
        res.setHeader('Content-Type', 'text/plain');
        res.end('Not Found');

    } catch (error) {
        console.error('Error handling request:', error);
        if (!res.headersSent) {
            res.statusCode = 500;
            res.end('Internal Server Error');
        }
    }
});

// WebSocket connection handler
wss.on('connection', (ws) => {
    console.log('New WebSocket connection');
    
    ws.on('message', (message) => {
        console.log('Received:', message.toString());
        ws.send(JSON.stringify({ 
            type: 'echo', 
            message: 'Message received',
            timestamp: new Date().toISOString()
        }));
    });

    ws.on('close', () => {
        console.log('WebSocket connection closed');
    });
});

// Graceful shutdown
function gracefulShutdown() {
    console.log('\n🛑 Shutting down gracefully...');
    
    // Close WebSocket connections
    wss.clients.forEach(client => {
        if (client.readyState === 1) { // 1 = OPEN
            client.close(1001, 'Server shutdown');
        }
    });

    // Close the server
    server.close(() => {
        console.log('✅ Server closed');
        process.exit(0);
    });

    // Force shutdown after 5 seconds
    setTimeout(() => {
        console.log('⚠️ Forcing shutdown');
        process.exit(1);
    }, 5000);
}

// Handle process termination
process.on('SIGINT', gracefulShutdown);
process.on('SIGTERM', gracefulShutdown);

// Start the server
server.listen(PORT, HOST, () => {
    console.log(`🚀 Server running at http://${HOST}:${PORT}`);
    console.log(`📊 Dashboard available at http://${HOST}:${PORT}/dashboard`);
});
