import { CONFIG } from './config.js';
import {
    generateMetricsData,
    systemServices,
    generateLogs,
    generateIdeas,
    generateTickets,
    getTicketCategories,
    getCurrentUser
} from './mock-data.js';

export class ApiClient {
    constructor() {
        this.apiBase = CONFIG.apiBase;
        this.useMocks = CONFIG.useMocks;
    }

    async call(endpoint, options = {}) {
        const startTime = Date.now();

        if (this.useMocks) {
            return this.handleMockRequest(endpoint, options);
        }

        try {
            const response = await fetch(`${this.apiBase}${endpoint}`, {
                headers: {
                    'Content-Type': 'application/json',
                    ...options.headers
                },
                ...options
            });

            const duration = Date.now() - startTime;

            if (duration > 1000) {
                console.warn(`Slow API call: ${endpoint} took ${duration}ms`);
            }

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            return await response.json();
        } catch (error) {
            console.error('API call failed, falling back to mock data:', error);
            this.useMocks = true;
            return this.handleMockRequest(endpoint, options);
        }
    }

    handleMockRequest(endpoint, options = {}) {
        console.log(`Using mock data for: ${endpoint}`);

        return new Promise((resolve) => {
            const delay = Math.floor(
                Math.random() * (CONFIG.mockRequestDelay.max - CONFIG.mockRequestDelay.min) +
                CONFIG.mockRequestDelay.min
            );

            setTimeout(() => {
                try {
                    let response;

                    if (endpoint.startsWith('/api/metrics')) {
                        response = {
                            ...generateMetricsData(),
                            timestamp: new Date().toISOString()
                        };
                    }
                    else if (endpoint.startsWith('/api/services')) {
                        response = [...systemServices];
                    }
                    else if (endpoint.startsWith('/api/logs')) {
                        response = generateLogs(20);
                    }
                    else if (endpoint.startsWith('/api/ideas')) {
                        response = generateIdeas();
                    }
                    else if (endpoint.startsWith('/api/tickets')) {
                        if (options.method === 'POST') {
                            const body = typeof options.body === 'string' ? JSON.parse(options.body) : options.body;
                            const newTicket = {
                                id: Math.floor(Math.random() * 1000) + 1000,
                                ...body,
                                createdAt: new Date().toISOString(),
                                updatedAt: new Date().toISOString(),
                                status: 'open',
                                readBy: []
                            };
                            response = newTicket;
                        } else {
                            response = generateTickets();
                        }
                    }
                    else if (endpoint.startsWith('/api/ticket-categories')) {
                        response = getTicketCategories();
                    }
                    else if (endpoint.startsWith('/api/current-user')) {
                        response = getCurrentUser();
                    }
                    else {
                        response = {
                            success: true,
                            message: 'Mock data response',
                            endpoint,
                            timestamp: new Date().toISOString()
                        };
                    }

                    resolve(response);
                } catch (error) {
                    console.error('Error in mock request handler:', error);
                    resolve({
                        success: false,
                        error: error.message,
                        endpoint,
                        timestamp: new Date().toISOString()
                    });
                }
            }, delay);
        });
    }
}
