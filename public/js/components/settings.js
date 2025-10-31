// admin-dashboard/components/settings.js
// Описание: Компонент для управления настройками системы
// Логика: Клиентская
// Зависимости: HTMLElement, fetch API
// Примечания: Реализует управление всеми настройками системы с валидацией

class SettingsPanel extends HTMLElement {
    constructor() {
        super();
        this.settings = {};
        this.originalSettings = {};
    }

    connectedCallback() {
        this.render();
        this.loadSettings();
    }

    render() {
        this.innerHTML = `
            <div class="card">
                <h2>⚙️ Настройки системы</h2>
                <p>Управление параметрами и конфигурацией системы</p>

                <div class="settings-grid">
                    <div class="settings-section">
                        <h3>🔌 Настройки API</h3>
                        <div class="form-group">
                            <label>Таймаут запросов (мс):</label>
                            <input type="number" class="form-control" id="api-timeout" min="1000" max="30000">
                        </div>
                        <div class="form-group">
                            <label>Количество повторов:</label>
                            <input type="number" class="form-control" id="api-retry-count" min="1" max="10">
                        </div>
                        <div class="form-group">
                            <label>Лимит запросов в минуту:</label>
                            <input type="number" class="form-control" id="api-rate-limit" min="10" max="1000">
                        </div>
                    </div>

                    <div class="settings-section">
                        <h3>🗄️ Настройки базы данных</h3>
                        <div class="form-group">
                            <label>Размер пула соединений:</label>
                            <input type="number" class="form-control" id="db-pool-size" min="1" max="50">
                        </div>
                        <div class="form-group">
                            <label>Таймаут БД (мс):</label>
                            <input type="number" class="form-control" id="db-timeout" min="1000" max="30000">
                        </div>
                        <div class="form-group">
                            <label>Авто-бэкап:</label>
                            <select class="form-control" id="db-backup">
                                <option value="disabled">Отключен</option>
                                <option value="daily">Ежедневно</option>
                                <option value="weekly">Еженедельно</option>
                                <option value="monthly">Ежемесячно</option>
                            </select>
                        </div>
                    </div>

                    <div class="settings-section">
                        <h3>📝 Настройки логирования</h3>
                        <div class="form-group">
                            <label>Уровень логирования:</label>
                            <select class="form-control" id="log-level">
                                <option value="debug">Debug</option>
                                <option value="info">Info</option>
                                <option value="warning">Warning</option>
                                <option value="error">Error</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label>Срок хранения логов:</label>
                            <select class="form-control" id="log-retention">
                                <option value="7d">7 дней</option>
                                <option value="30d">30 дней</option>
                                <option value="90d">90 дней</option>
                                <option value="1y">1 год</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label>
                                <input type="checkbox" id="log-verbose">
                                Подробное логирование
                            </label>
                        </div>
                    </div>

                    <div class="settings-section">
                        <h3>🔔 Уведомления</h3>
                        <div class="form-group">
                            <label>
                                <input type="checkbox" id="notifications-enabled" checked>
                                Включить уведомления
                            </label>
                        </div>
                        <div class="form-group">
                            <label>Email для уведомлений:</label>
                            <input type="email" class="form-control" id="notification-email" placeholder="admin@example.com">
                        </div>
                        <div class="form-group">
                            <label>Telegram уведомления:</label>
                            <input type="text" class="form-control" id="telegram-chat" placeholder="ID чата Telegram">
                        </div>
                        <div class="form-group">
                            <label>Уведомлять о ошибках:</label>
                            <select class="form-control" id="error-notifications">
                                <option value="all">Все ошибки</option>
                                <option value="critical">Только критические</option>
                                <option value="none">Не уведомлять</option>
                            </select>
                        </div>
                    </div>

                    <div class="settings-section">
                        <h3>💬 Система сообщений</h3>
                        <div class="form-group">
                            <label>
                                <input type="checkbox" id="auto-assign" checked>
                                Автоназначение обращений
                            </label>
                        </div>
                        <div class="form-group">
                            <label>
                                <input type="checkbox" id="notify-new-tickets" checked>
                                Уведомлять о новых обращениях
                            </label>
                        </div>
                        <div class="form-group">
                            <label>Рабочие часы:</label>
                            <input type="text" class="form-control" id="working-hours" placeholder="09:00-18:00">
                        </div>
                        <div class="form-group">
                            <label>Таймаут ответа (часы):</label>
                            <input type="number" class="form-control" id="response-timeout" min="1" max="168">
                        </div>
                    </div>

                    <div class="settings-section">
                        <h3>🛡️ Безопасность</h3>
                        <div class="form-group">
                            <label>Требовать двухфакторную аутентификацию:</label>
                            <select class="form-control" id="two-factor">
                                <option value="disabled">Отключена</option>
                                <option value="admins">Только для админов</option>
                                <option value="all">Для всех пользователей</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label>Срок действия сессии (часы):</label>
                            <input type="number" class="form-control" id="session-timeout" min="1" max="720">
                        </div>
                        <div class="form-group">
                            <label>Максимальное количество попыток входа:</label>
                            <input type="number" class="form-control" id="max-login-attempts" min="1" max="10">
                        </div>
                        <div class="form-group">
                            <label>
                                <input type="checkbox" id="password-complexity" checked>
                                Требовать сложные пароли
                            </label>
                        </div>
                    </div>
                </div>

                <div class="settings-actions">
                    <button class="btn btn-secondary" id="reset-settings">🔄 Сбросить к исходным</button>
                    <button class="btn btn-primary" id="save-settings">💾 Сохранить настройки</button>
                </div>

                <div id="settings-message" style="display: none; margin-top: 1rem;"></div>
            </div>
        `;

        this.setupEventListeners();
    }

    setupEventListeners() {
        this.querySelector('#save-settings').addEventListener('click', () => this.saveSettings());
        this.querySelector('#reset-settings').addEventListener('click', () => this.resetSettings());
        
        // Real-time validation
        this.querySelectorAll('.form-control').forEach(input => {
        });
    }

    async loadSettings() {
        try {
            const apiBase = window.adminDashboard?.apiBase || window.location.origin;
            const response = await fetch(`${apiBase}/admin/settings`);
            
            // Check if response is JSON
            const contentType = response.headers.get('content-type');
            if (!contentType || !contentType.includes('application/json')) {
                throw new Error('Invalid response format from server');
            }
            
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.message || 'Ошибка загрузки настроек');
            }
            
            this.settings = data;
            this.originalSettings = JSON.parse(JSON.stringify(data));
            this.updateForm();
            
        } catch (error) {
            console.error('Error loading settings:', error);
            
            // Fallback to mock data if available
            if (window.adminDashboard?.useMocks) {
                this.settings = {
                    api: {
                        timeout: 10000,
                        retryCount: 3,
                        rateLimit: 100
                    },
                    database: {
                        poolSize: 10,
                        timeout: 10000
                    },
                    logging: {
                        level: 'info',
                        maxSize: '100MB',
                        maxFiles: 10
                    },
                    security: {
                        passwordExpiry: 90,
                        maxLoginAttempts: 5,
                        sessionTimeout: 30
                    }
                };
                this.originalSettings = JSON.parse(JSON.stringify(this.settings));
                this.updateForm();
                this.showNotification('Загружены тестовые настройки', 'info');
            } else if (this.showError) {
                this.showError('Ошибка загрузки настроек: ' + error.message);
            }
        }
    }
    
    updateForm() {
        if (!this.settings) return;
        
        // Update form fields with current settings
        if (this.settings.api) {
            this.setValueIfExists('api-timeout', this.settings.api.timeout);
            this.setValueIfExists('api-retry-count', this.settings.api.retryCount);
            this.setValueIfExists('api-rate-limit', this.settings.api.rateLimit);
        }
        
        if (this.settings.database) {
            this.setValueIfExists('db-pool-size', this.settings.database.poolSize);
            this.setValueIfExists('db-timeout', this.settings.database.timeout);
        }
        
        if (this.settings.logging) {
            this.setValueIfExists('log-level', this.settings.logging.level);
            this.setValueIfExists('log-max-size', this.settings.logging.maxSize);
            this.setValueIfExists('log-max-files', this.settings.logging.maxFiles);
        }
        
        if (this.settings.security) {
            this.setValueIfExists('password-expiry', this.settings.security.passwordExpiry);
            this.setValueIfExists('max-login-attempts', this.settings.security.maxLoginAttempts);
            this.setValueIfExists('session-timeout', this.settings.security.sessionTimeout);
        }
    }
    
    setValueIfExists(elementId, value, defaultValue = '') {
        const element = this.querySelector(`#${elementId}`);
        if (element) {
            element.value = value !== undefined ? value : defaultValue;
        }
    }
    
    showError(message) {
        console.error(message);
        // You can implement a more user-friendly error display here
        alert(message);
    }
    
    showNotification(message, type = 'info') {
        console.log(`[${type}] ${message}`);
        // You can implement a more user-friendly notification system here
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        this.appendChild(notification);
        
        // Auto-remove notification after 5 seconds
        setTimeout(() => {
            notification.remove();
        }, 5000);
    }

    populateForm() {
        // API Settings
        if (this.settings.api) {
            this.setValueIfExists('api-timeout', this.settings.api.timeout, 10000);
            this.setValueIfExists('api-retry-count', this.settings.api.retryCount, 3);
            this.setValueIfExists('api-rate-limit', this.settings.api.rateLimit, 100);
        }
        
        // Database Settings
        if (this.settings.database) {
            this.setValueIfExists('db-pool-size', this.settings.database.poolSize, 10);
            this.setValueIfExists('db-timeout', this.settings.database.timeout, 5000);
            this.setValueIfExists('db-backup', this.settings.database.backup, 'daily');
        }
        
        // Logging Settings
        if (this.settings.logging) {
            this.setValueIfExists('log-level', this.settings.logging.level, 'info');
            this.setValueIfExists('log-retention', this.settings.logging.retention, '30d');
            this.setCheckedIfExists('log-verbose', this.settings.logging.verbose, false);
        }
        
        // Notification Settings
        if (this.settings.notifications) {
            this.setCheckedIfExists('notifications-enabled', this.settings.notifications.enabled, true);
            this.setValueIfExists('notification-email', this.settings.notifications.email, 'admin@example.com');
            this.setValueIfExists('telegram-chat', this.settings.notifications.telegramChat, '');
            this.setValueIfExists('error-notifications', this.settings.notifications.errorLevel, 'all');
        }
        
        // Messaging Settings
        if (this.settings.messaging) {
            this.setCheckedIfExists('auto-assign', this.settings.messaging.autoAssign, true);
            this.setCheckedIfExists('notify-new-tickets', this.settings.messaging.notifyNewTickets, true);
            this.setValueIfExists('working-hours', this.settings.messaging.workingHours, '09:00-18:00');
            this.setValueIfExists('response-timeout', this.settings.messaging.responseTimeout, 24);
        }
        
        // Security Settings
        if (this.settings.security) {
            this.setValueIfExists('two-factor', this.settings.security.twoFactor, 'admins');
            this.setValueIfExists('session-timeout', this.settings.security.sessionTimeout, 24);
            this.setValueIfExists('max-login-attempts', this.settings.security.maxLoginAttempts, 5);
            this.setCheckedIfExists('password-complexity', this.settings.security.passwordComplexity, true);
        }
    }

    setValueIfExists(elementId, value, defaultValue = '') {
        const element = this.querySelector(`#${elementId}`);
        if (element) {
            element.value = value !== undefined ? value : defaultValue;
        }
    }

    setCheckedIfExists(elementId, value, defaultValue = false) {
        const element = this.querySelector(`#${elementId}`);
        if (element) {
            element.checked = value !== undefined ? value : defaultValue;
        }
    }

    validateField(field) {
        const value = field.value;
        let isValid = true;
        let message = '';

        switch (field.id) {
            case 'api-timeout':
                if (value < 1000 || value > 30000) {
                    isValid = false;
                    message = 'Таймаут должен быть между 1000 и 30000 мс';
                }
                break;
            case 'api-rate-limit':
                if (value < 10 || value > 1000) {
                    isValid = false;
                    message = 'Лимит запросов должен быть между 10 и 1000';
                }
                break;
            case 'notification-email':
                if (value) {
                    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                    if (!emailRegex.test(value)) {
                        isValid = false;
                        message = 'Введите корректный email адрес';
                    }
                }
                break;
            case 'working-hours':
                if (value) {
                    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]-([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
                    if (!timeRegex.test(value)) {
                        isValid = false;
                        message = 'Формат: ЧЧ:ММ-ЧЧ:ММ (например, 09:00-18:00)';
                    }
                }
                break;
        }

        if (!isValid) {
            field.classList.add('error');
            this.showTooltip(field, message);
        } else {
            field.classList.remove('error');
            this.hideTooltip(field);
        }

        return isValid;
    }

    showTooltip(element, message) {
        let tooltip = element.parentNode.querySelector('.tooltip');
        if (!tooltip) {
            tooltip = document.createElement('div');
            tooltip.className = 'tooltip';
            element.parentNode.appendChild(tooltip);
        }
        tooltip.textContent = message;
        tooltip.style.display = 'block';
    }

    hideTooltip(element) {
        const tooltip = element.parentNode.querySelector('.tooltip');
        if (tooltip) {
            tooltip.style.display = 'none';
        }
    }

    collectFormData() {
        return {
            api: {
                timeout: parseInt(this.querySelector('#api-timeout').value) || 10000,
                retryCount: parseInt(this.querySelector('#api-retry-count').value) || 3,
                rateLimit: parseInt(this.querySelector('#api-rate-limit').value) || 100
            },
            database: {
                poolSize: parseInt(this.querySelector('#db-pool-size').value) || 10,
                timeout: parseInt(this.querySelector('#db-timeout').value) || 5000,
                backup: this.querySelector('#db-backup').value || 'daily'
            },
            logging: {
                level: this.querySelector('#log-level').value || 'info',
                retention: this.querySelector('#log-retention').value || '30d',
                verbose: this.querySelector('#log-verbose').checked
            },
            notifications: {
                enabled: this.querySelector('#notifications-enabled').checked,
                email: this.querySelector('#notification-email').value || 'admin@example.com',
                telegramChat: this.querySelector('#telegram-chat').value || '',
                errorLevel: this.querySelector('#error-notifications').value || 'all'
            },
            messaging: {
                autoAssign: this.querySelector('#auto-assign').checked,
                notifyNewTickets: this.querySelector('#notify-new-tickets').checked,
                workingHours: this.querySelector('#working-hours').value || '09:00-18:00',
                responseTimeout: parseInt(this.querySelector('#response-timeout').value) || 24
            },
            security: {
                twoFactor: this.querySelector('#two-factor').value || 'admins',
                sessionTimeout: parseInt(this.querySelector('#session-timeout').value) || 24,
                maxLoginAttempts: parseInt(this.querySelector('#max-login-attempts').value) || 5,
                passwordComplexity: this.querySelector('#password-complexity').checked
            }
        };
    }

    async saveSettings() {
        // Validate all fields
        const fields = this.querySelectorAll('.form-control');
        let allValid = true;
        
        fields.forEach(field => {
            if (!this.validateField(field)) {
                allValid = false;
                // Scroll to first error
                if (allValid) {
                    field.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            }
        });

        if (!allValid) {
            this.showMessage('❌ Исправьте ошибки в форме перед сохранением', 'error');
            return;
        }

        const settings = this.collectFormData();

        try {
            const response = await fetch(`${window.adminDashboard.apiBase}/admin/settings`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(settings)
            });
            
            if (response.ok) {
                this.showMessage('✅ Настройки успешно сохранены!', 'success');
                this.originalSettings = JSON.parse(JSON.stringify(settings));
                
                // Reload settings to get any server-side defaults
                setTimeout(() => this.loadSettings(), 1000);
            } else {
                const error = await response.json();
                throw new Error(error.message || 'Ошибка сервера');
            }
        } catch (error) {
            console.error('Error saving settings:', error);
            this.showMessage(`❌ Ошибка сохранения настроек: ${error.message}`, 'error');
        }
    }

    resetSettings() {
        if (confirm('Вы уверены, что хотите сбросить все настройки к исходным значениям?')) {
            this.settings = JSON.parse(JSON.stringify(this.originalSettings));
            this.populateForm();
            this.showMessage('⚙️ Настройки сброшены к исходным значениям', 'info');
        }
    }

    showMessage(text, type = 'info') {
        const messageEl = this.querySelector('#settings-message');
        if (!messageEl) return;
        
        messageEl.textContent = text;
        messageEl.className = type;
        messageEl.style.display = 'block';
        
        // Auto-hide after 5 seconds
        clearTimeout(this.messageTimer);
        this.messageTimer = setTimeout(() => {
            messageEl.style.display = 'none';
        }, 5000);
    }
}

// Register the custom element
if (!customElements.get('settings-panel')) {
    customElements.define('settings-panel', SettingsPanel);
}
