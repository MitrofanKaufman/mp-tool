// admin-dashboard/components/messages.js
// Описание: Компонент для внутренней переписки между администраторами
// Логика: Клиентская
// Зависимости: HTMLElement, fetch API
// Примечания: Реализует обмен сообщениями с фильтрацией по приоритету и специализации

class MessagesPanel extends HTMLElement {
    constructor() {
        super();
        this.messages = [];
        this.currentUser = {
            id: 'alex',
            name: 'Алексей Петров',
            role: 'director',
            specialization: ['management']
        };
        this.filters = {
            type: 'all',
            priority: 'all',
            specialization: 'all',
            search: ''
        };
        this.specializations = ['frontend', 'backend', 'design', 'devops', 'analytics', 'management'];
    }

    connectedCallback() {
        this.render();
        this.loadMessages();
    }

    render() {
        this.innerHTML = `
            <div class="card">
                <div class="messages-header">
                    <h2>💬 Внутренние сообщения</h2>
                    <button class="btn btn-primary" id="new-message-btn">
                        ✉️ Новое сообщение
                    </button>
                </div>
                <p>Общение между администраторами системы</p>

                <div class="messages-controls">
                    <div class="filters-grid">
                        <div class="form-group">
                            <label>Тип:</label>
                            <select class="form-control" id="type-filter">
                                <option value="all">Все сообщения</option>
                                <option value="incoming">Входящие</option>
                                <option value="outgoing">Исходящие</option>
                                <option value="unread">Непрочитанные</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label>Приоритет:</label>
                            <select class="form-control" id="priority-filter">
                                <option value="all">Все приоритеты</option>
                                <option value="urgent">Срочный</option>
                                <option value="high">Высокий</option>
                                <option value="normal">Обычный</option>
                                <option value="low">Низкий</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label>Специализация:</label>
                            <select class="form-control" id="specialization-filter">
                                <option value="all">Все направления</option>
                                ${this.specializations.map(spec => 
                                    `<option value="${spec}">${this.getSpecializationLabel(spec)}</option>`
                                ).join('')}
                            </select>
                        </div>
                    </div>
                    <div class="search-box">
                        <input type="text" id="search-messages" class="form-control" placeholder="🔍 Поиск по сообщениям...">
                    </div>
                </div>

                <div class="messages-stats">
                    <div class="stat-card">
                        <span class="stat-number">${this.getStats().total}</span>
                        <span class="stat-label">Всего сообщений</span>
                    </div>
                    <div class="stat-card">
                        <span class="stat-number">${this.getStats().unread}</span>
                        <span class="stat-label">Непрочитанные</span>
                    </div>
                    <div class="stat-card">
                        <span class="stat-number">${this.getStats().highPriority}</span>
                        <span class="stat-label">Высокий приоритет</span>
                    </div>
                    <div class="stat-card">
                        <span class="stat-number">${this.getStats().toMe}</span>
                        <span class="stat-label">Адресованы мне</span>
                    </div>
                </div>

                <div class="messages-container">
                    <div id="messages-list" class="messages-list">
                        <div class="loading">Загрузка сообщений...</div>
                    </div>
                </div>
            </div>

            <!-- New Message Modal -->
            <div id="new-message-modal" class="modal" style="display: none;">
                <div class="modal-content large">
                    <div class="modal-header">
                        <h3>✉️ Новое внутреннее сообщение</h3>
                        <button class="close-modal">&times;</button>
                    </div>
                    <div class="modal-body">
                        <form id="new-message-form">
                            <div class="form-grid">
                                <div class="form-group">
                                    <label>Кому (специализация):</label>
                                    <select class="form-control" name="toSpecialization" required>
                                        <option value="">Выберите специализацию</option>
                                        ${this.specializations.map(spec =>
                                            `<option value="${spec}">${this.getSpecializationLabel(spec)}</option>`
                                        ).join('')}
                                    </select>
                                </div>
                                <div class="form-group">
                                    <label>Приоритет:</label>
                                    <select class="form-control" name="priority" required>
                                        <option value="normal">Обычный</option>
                                        <option value="high">Высокий</option>
                                        <option value="urgent">Срочный</option>
                                        <option value="low">Низкий</option>
                                    </select>
                                </div>
                                <div class="form-group full-width">
                                    <label>Тема:</label>
                                    <input type="text" class="form-control" name="subject" required>
                                </div>
                                <div class="form-group full-width">
                                    <label>Сообщение:</label>
                                    <textarea class="form-control" name="message" rows="5" required></textarea>
                                </div>
                                <div class="form-actions">
                                    <button type="button" class="btn btn-secondary close-modal">Отмена</button>
                                    <button type="submit" class="btn btn-primary">Отправить сообщение</button>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        `;

        this.setupEventListeners();
    }

    setupEventListeners() {
        // Фильтры
        document.getElementById('type-filter').addEventListener('change', (e) => {
            this.filters.type = e.target.value;
            this.renderMessages();
        });

        document.getElementById('priority-filter').addEventListener('change', (e) => {
            this.filters.priority = e.target.value;
            this.renderMessages();
        });

        document.getElementById('specialization-filter').addEventListener('change', (e) => {
            this.filters.specialization = e.target.value;
            this.renderMessages();
        });

        document.getElementById('search-messages').addEventListener('input', (e) => {
            this.filters.search = e.target.value.toLowerCase();
            this.renderMessages();
        });

        // Кнопка нового сообщения
        document.getElementById('new-message-btn').addEventListener('click', () => {
            document.getElementById('new-message-modal').style.display = 'block';
        });

        // Закрытие модального окна
        document.querySelectorAll('.close-modal').forEach(btn => {
            btn.addEventListener('click', () => {
                document.getElementById('new-message-modal').style.display = 'none';
            });
        });

        // Отправка формы
        document.getElementById('new-message-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.sendMessage(new FormData(e.target));
        });
    }

    async loadMessages() {
        try {
            // В реальном приложении здесь был бы запрос к API
            // const response = await fetch('/api/messages');
            // this.messages = await response.json();
            
            // Временные моковые данные
            this.messages = [
                {
                    id: 1,
                    from: { id: 'anna', name: 'Анна Сидорова' },
                    to: { type: 'specialization', value: 'management' },
                    subject: 'Обновление политики безопасности',
                    message: 'Не забудьте обновить пароли для всех административных аккаунтов.',
                    timestamp: new Date(Date.now() - 3600000).toISOString(),
                    read: false,
                    priority: 'high',
                    specialization: 'security'
                },
                {
                    id: 2,
                    from: { id: 'alex', name: 'Алексей Петров' },
                    to: { type: 'specialization', value: 'frontend' },
                    subject: 'Обновление интерфейса',
                    message: 'Не забудьте обновить зависимости перед началом работы над новым интерфейсом.',
                    timestamp: new Date(Date.now() - 7200000).toISOString(),
                    read: true,
                    priority: 'normal',
                    specialization: 'frontend'
                },
                {
                    id: 3,
                    from: { id: 'ivan', name: 'Иван Иванов' },
                    to: { type: 'specialization', value: 'backend' },
                    subject: 'Проблема с API',
                    message: 'Обнаружена утечка памяти в API. Требуется срочное исправление.',
                    timestamp: new Date(Date.now() - 10800000).toISOString(),
                    read: false,
                    priority: 'urgent',
                    specialization: 'backend'
                }
            ];
            
            this.renderMessages();
        } catch (error) {
            console.error('Ошибка при загрузке сообщений:', error);
            this.showError('Не удалось загрузить сообщения');
        }
    }

    renderMessages() {
        const messagesList = document.getElementById('messages-list');
        if (!messagesList) return;

        const filtered = this.messages.filter(msg => {
            // Фильтрация по типу
            if (this.filters.type === 'incoming' && msg.to.id !== this.currentUser.id) return false;
            if (this.filters.type === 'outgoing' && msg.from.id !== this.currentUser.id) return false;
            if (this.filters.type === 'unread' && msg.read) return false;
            
            // Фильтрация по приоритету
            if (this.filters.priority !== 'all' && msg.priority !== this.filters.priority) return false;
            
            // Фильтрация по специализации
            if (this.filters.specialization !== 'all' && msg.specialization !== this.filters.specialization) return false;
            
            // Поиск
            if (this.filters.search) {
                const search = this.filters.search.toLowerCase();
                return (
                    msg.subject.toLowerCase().includes(search) ||
                    msg.message.toLowerCase().includes(search) ||
                    msg.from.name.toLowerCase().includes(search)
                );
            }
            
            return true;
        });

        if (filtered.length === 0) {
            messagesList.innerHTML = '<div class="no-messages">Сообщения не найдены</div>';
            return;
        }

        messagesList.innerHTML = filtered.map(msg => `
            <div class="message-item ${msg.read ? '' : 'unread'}" data-id="${msg.id}">
                <div class="message-priority ${msg.priority}"></div>
                <div class="message-content">
                    <div class="message-header">
                        <span class="message-sender">${msg.from.name}</span>
                        <span class="message-time">${new Date(msg.timestamp).toLocaleString()}</span>
                    </div>
                    <div class="message-subject">${msg.subject}</div>
                    <div class="message-preview">${msg.message.substring(0, 100)}...</div>
                    <div class="message-tags">
                        <span class="tag ${msg.priority}">${this.getPriorityLabel(msg.priority)}</span>
                        <span class="tag ${msg.specialization}">${this.getSpecializationLabel(msg.specialization)}</span>
                    </div>
                </div>
            </div>
        `).join('');
    }

    async sendMessage(formData) {
        try {
            // В реальном приложении здесь был бы запрос к API
            // const response = await fetch('/api/messages', {
            //     method: 'POST',
            //     body: formData
            // });
            // const result = await response.json();
            
            // Добавляем новое сообщение в начало списка
            const newMessage = {
                id: Date.now(),
                from: this.currentUser,
                to: { type: 'specialization', value: formData.get('toSpecialization') },
                subject: formData.get('subject'),
                message: formData.get('message'),
                timestamp: new Date().toISOString(),
                read: true,
                priority: formData.get('priority'),
                specialization: formData.get('toSpecialization')
            };
            
            this.messages.unshift(newMessage);
            this.renderMessages();
            
            // Закрываем модальное окно и сбрасываем форму
            document.getElementById('new-message-modal').style.display = 'none';
            document.getElementById('new-message-form').reset();
            
            this.showSuccess('Сообщение отправлено');
        } catch (error) {
            console.error('Ошибка при отправке сообщения:', error);
            this.showError('Не удалось отправить сообщение');
        }
    }

    getStats() {
        return {
            total: this.messages.length,
            unread: this.messages.filter(msg => !msg.read).length,
            highPriority: this.messages.filter(msg => msg.priority === 'high' || msg.priority === 'urgent').length,
            toMe: this.messages.filter(msg => msg.to.id === this.currentUser.id).length
        };
    }

    getPriorityLabel(priority) {
        const labels = {
            'urgent': 'Срочно',
            'high': 'Высокий',
            'normal': 'Обычный',
            'low': 'Низкий'
        };
        return labels[priority] || priority;
    }

    getSpecializationLabel(specialization) {
        const labels = {
            'frontend': 'Фронтенд',
            'backend': 'Бэкенд',
            'design': 'Дизайн',
            'devops': 'DevOps',
            'analytics': 'Аналитика',
            'management': 'Менеджмент',
            'security': 'Безопасность'
        };
        return labels[specialization] || specialization;
    }

    showError(message) {
        // В реальном приложении здесь было бы отображение уведомления об ошибке
        console.error(message);
        alert(`Ошибка: ${message}`);
    }

    showSuccess(message) {
        // В реальном приложении здесь было бы отображение уведомления об успехе
        console.log(message);
        alert(`Успех: ${message}`);
    }
}

// Регистрируем компонент
if (!customElements.get('messages-panel')) {
    customElements.define('messages-panel', MessagesPanel);
}
