// Импорт всех компонентов
import './components/base-component.js';
import './components/ideas.js';
import './components/messages-panel.js';
import './components/metrics.js';
import './components/tickets.js';
import './components/test-runner.js';
import './components/settings.js';
import './components/server-status.js';
import './components/queue-monitor.js';
import './components/module-tester.js';
import './components/database-explorer.js';

// Импорт модулей
import { AdminDashboard } from './modules/dashboard-core.js';

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