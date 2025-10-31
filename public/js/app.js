// Импорт модулей
import { AdminDashboard } from './modules/dashboard-core.js';

// Глобальная обработка ошибок
window.addEventListener('error', (event) => {
    console.error('Global error:', event.error);
    
    // Показываем сообщение об ошибке в UI, если это не ошибка загрузки ресурса
    if (!(event instanceof ErrorEvent && event.target instanceof HTMLElement)) {
        showErrorUI(`Произошла ошибка: ${event.message || 'Неизвестная ошибка'}`);
    }
});

window.addEventListener('unhandledrejection', (event) => {
    const reason = event.reason || {};
    console.error('Unhandled promise rejection:', reason);
    showErrorUI(`Ошибка в асинхронном коде: ${reason.message || 'Неизвестная ошибка'}`);
});

/**
 * Показывает сообщение об ошибке в интерфейсе
 * @param {string} message - Текст сообщения об ошибке
 */
function showErrorUI(message) {
    const errorContainer = document.getElementById('error-container') || createErrorContainer();
    const errorId = 'error-' + Date.now();
    
    const errorElement = document.createElement('div');
    errorElement.id = errorId;
    errorElement.className = 'error-message';
    errorElement.innerHTML = `
        <div class="error-content">
            <span class="error-close" onclick="document.getElementById('${errorId}').remove()">&times;</span>
            <p>${message}</p>
        </div>
    `;
    
    errorContainer.appendChild(errorElement);
    
    // Автоматическое скрытие через 10 секунд
    setTimeout(() => {
        const element = document.getElementById(errorId);
        if (element) element.remove();
    }, 10000);
}

/**
 * Создает контейнер для сообщений об ошибках, если его нет
 * @returns {HTMLElement} Созданный контейнер
 */
function createErrorContainer() {
    const container = document.createElement('div');
    container.id = 'error-container';
    container.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 10000;
        max-width: 400px;
    `;
    document.body.appendChild(container);
    return container;
}

// Стили для сообщений об ошибках
const errorStyles = document.createElement('style');
errorStyles.textContent = `
    .error-message {
        background: #fef2f2;
        color: #dc2626;
        border-left: 4px solid #dc2626;
        padding: 12px 20px;
        margin-bottom: 10px;
        border-radius: 4px;
        box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        animation: slideIn 0.3s ease-out;
    }
    
    .error-content {
        position: relative;
        padding-right: 20px;
    }
    
    .error-close {
        position: absolute;
        top: 0;
        right: 0;
        cursor: pointer;
        font-size: 20px;
        line-height: 1;
    }
    
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
`;
document.head.appendChild(errorStyles);

// Инициализация приложения
document.addEventListener('DOMContentLoaded', () => {
    try {
        if (!document.getElementById('app')) {
            throw new Error('Не найден корневой элемент приложения с id="app"');
        }
        
        window.adminDashboard = new AdminDashboard();
        console.log('Wildberries Admin Dashboard инициализирован успешно');
        
        // Отправляем событие успешной загрузки
        document.dispatchEvent(new CustomEvent('app:loaded'));
        
    } catch (error) {
        console.error('Ошибка при инициализации панели администратора:', error);
        showErrorUI(`Ошибка при загрузке приложения: ${error.message}`);
        
        // Показываем сообщение об ошибке в интерфейсе
        const appContainer = document.getElementById('app') || document.body;
        appContainer.innerHTML = `
            <div class="error-screen">
                <h1>Ошибка запуска приложения</h1>
                <p>${error.message}</p>
                <button onclick="location.reload()" class="reload-button">
                    Перезагрузить страницу
                </button>
            </div>
        `;
        
        // Добавляем стили для экрана ошибки
        const errorScreenStyles = document.createElement('style');
        errorScreenStyles.textContent = `
            .error-screen {
                max-width: 600px;
                margin: 50px auto;
                padding: 30px;
                background: #fff;
                border-radius: 8px;
                box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                text-align: center;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            }
            
            .error-screen h1 {
                color: #dc2626;
                margin-bottom: 20px;
            }
            
            .reload-button {
                margin-top: 20px;
                padding: 12px 24px;
                background: #3b82f6;
                color: white;
                border: none;
                border-radius: 4px;
                font-size: 16px;
                cursor: pointer;
                transition: background-color 0.2s;
            }
            
            .reload-button:hover {
                background: #2563eb;
            }
        `;
        document.head.appendChild(errorScreenStyles);
    }
});