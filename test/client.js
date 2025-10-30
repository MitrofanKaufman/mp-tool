const WebSocket = require('ws');

console.log('Testing WebSocket connection...');

const ws = new WebSocket('ws://localhost:8081/ws', {
    headers: {
        'Sec-WebSocket-Protocol': 'Bearer test-token-123'
    }
});

ws.on('open', () => {
    console.log('✅ Connected to WebSocket server!');

    // Отправляем ping
    console.log('Sending ping...');
    ws.send(JSON.stringify({
        type: 'ping',
        requestId: 'test-123'
    }));

    // Отправляем поисковый запрос
    setTimeout(() => {
        console.log('Sending search request...');
        ws.send(JSON.stringify({
            type: 'search',
            requestId: 'search-123',
            val: 'телефон'
        }));
    }, 1000);

    // Тестируем другие типы сообщений
    setTimeout(() => {
        console.log('Sending product request...');
        ws.send(JSON.stringify({
            type: 'product',
            requestId: 'product-123',
            val: '123456'
        }));
    }, 2000);
});

ws.on('message', (data) => {
    const message = JSON.parse(data);
    console.log('📨 Received:', message);
});

ws.on('error', (error) => {
    console.error('❌ Error:', error);
});

ws.on('close', () => {
    console.log('🔌 Connection closed');
});

// Автоматическое закрытие через 5 секунд
setTimeout(() => {
    console.log('Closing connection...');
    ws.close();
}, 5000);