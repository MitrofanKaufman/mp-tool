// Импорт всех компонентов
import './base-component.js';
import './ideas.js';
import './messages-panel.js';
import './metrics.js';
import './tickets.js';
import './test-runner.js';
import './settings.js';
import './server-status.js';
import './queue-monitor.js';
import './module-tester.js';
import './database-explorer.js';

// Импорт модулей
import { AdminDashboard } from '../modules/dashboard-core.js';

// Глобальная обработка ошибок
window.addEventListener('error', (event) => {
    console.error('Global error:', event.error);
});

window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection:', event.reason);
});

// Инициализация приложения
document.addEventListener('DOMContentLoaded', () => {
    try {
        window.adminDashboard = new AdminDashboard();
        console.log('Wildberries Admin Dashboard started successfully');
    } catch (error) {
        console.error('Failed to initialize Admin Dashboard:', error);

        // Показываем сообщение об ошибке
        document.body.innerHTML = `
            <div style="padding: 40px; text-align: center; font-family: Arial, sans-serif;">
                <h1 style="color: #ef4444;">Ошибка запуска приложения</h1>
                <p style="margin: 20px 0;">${error.message}</p>
                <button onclick="location.reload()" style="
                    padding: 10px 20px; 
                    background: #3b82f6; 
                    color: white; 
                    border: none; 
                    border-radius: 4px; 
                    cursor: pointer;
                ">
                    Перезагрузить
                </button>
            </div>
        `;
    }
});