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
                                    <label>Или конкретному админу:</label>
                                    <select class="form-control" name="toAdmin">
                                        <option value="">Выберите админа (опционально)</option>
                                        <option value="maria">Мария Иванова (Frontend/Backend)</option>
                                        <option value="ivan">Иван Сидоров (Backend)</option>
                                        <option value="olga">Ольга Кузнецова (Design)</option>
                                        <option value="dmitry">Дмитрий Смирнов (Analytics)</option>
                                        <option value="serg">Сергей Васильев (DevOps)</option>
                                    </select>
                                </div>
                            </div>
                            <div class="form-group">
                                <label>Приоритет:</label>
                                <select class="form-control" name="priority" required>
                                    <option value="low">Низкий</option>
                                    <option value="normal" selected>Обычный</option>
                                    <option value="high">Высокий</option>
                                    <option value="urgent">Срочный</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label>Тема:</label>
                                <input type="text" class="form-control" name="subject" required 
                                       placeholder="Краткая тема сообщения">
                            </div>
                            <div class="form-group">
                                <label>Сообщение:</label>
                                <textarea class="form-control" name="message" rows="6" 
                                          placeholder="Подробное содержание сообщения..." required></textarea>
                            </div>
                            <div class="form-group">
                                <label>
                                    <input type="checkbox" name="important">
                                    ❗ Важное сообщение (выделение)
                                </label>
                            </div>
                        </form>
                    </div>
                    <div class="modal-footer">
                        <button class="btn btn-secondary" id="cancel-message">Отмена</button>
                        <button class="btn btn-primary" id="send-message">📤 Отправить сообщение</button>
                    </div>
                </div>
            </div>
        `;

        this.setupEventListeners();
    }

    setupEventListeners() {
        // Filters
        this.querySelector('#type-filter').addEventListener('change', (e) => {
            this.filters.type = e.target.value;
            this.renderMessages();
        });
        
        this.querySelector('#priority-filter').addEventListener('change', (e) => {
            this.filters.priority = e.target.value;
            this.renderMessages();
        });
        
        this.querySelector('#specialization-filter').addEventListener('change', (e) => {
            this.filters.specialization = e.target.value;
            this.renderMessages();
        });
        
        this.querySelector('#search-messages').addEventListener('input', (e) => {
            this.filters.search = e.target.value;
            this.renderMessages();
        });

        // New message modal
        this.querySelector('#new-message-btn').addEventListener('click', () => this.showNewMessageModal());
        this.querySelector('.close-modal').addEventListener('click', () => this.hideModal());
        this.querySelector('#cancel-message').addEventListener('click', () => this.hideModal());
        this.querySelector('#send-message').addEventListener('click', () => this.sendMessage());
    }

    async loadMessages() {
        try {
            const response = await fetch(`${window.adminDashboard.apiBase}/admin/messages/internal`);
            const data = await response.json();
            this.messages = data.messages;
            this.renderMessages();
        } catch (error) {
            this.showError('Ошибка загрузки сообщений: ' + error.message);
        }
    }

    renderMessages() {
        const filteredMessages = this.filterMessages();
        const messagesList = this.querySelector('#messages-list');
        
        if (filteredMessages.length === 0) {
            messagesList.innerHTML = '<div class="no-data">Сообщения не найдены</div>';
            return;
        }

        messagesList.innerHTML = filteredMessages.map(msg => `
            <div class="message-item ${!msg.read ? 'unread' : ''} ${msg.priority === 'urgent' ? 'urgent' : ''}" data-id="${msg.id}">
                <div class="message-header">
                    <div class="message-sender">
                        <strong>${msg.from.name}</strong>
                        <span class="message-role">${this.getRoleLabel(msg.from.role)}</span>
                    </div>
                    <div class="message-meta">
                        <span class="badge priority-${msg.priority}">${this.getPriorityLabel(msg.priority)}</span>
                        <span class="badge specialization-${msg.toSpecialization}">${this.getSpecializationLabel(msg.toSpecialization)}</span>
                        ${msg.toAdmin ? `<span class="badge">👤 ${msg.toAdmin.name}</span>` : ''}
                        <span class="message-time">${new Date(msg.createdAt).toLocaleString()}</span>
                    </div>
                </div>
                <div class="message-subject">
                    <h4>${msg.subject}</h4>
                    ${!msg.read ? '<span class="unread-indicator">●</span>' : ''}
                </div>
                <div class="message-body">
                    <p>${msg.message}</p>
                    ${msg.attachments && msg.attachments.length > 0 ? `
                        <div class="message-attachments">
                            <strong>Вложения:</strong>
                            ${msg.attachments.map(att => 
                                `<span class="attachment">📎 ${att.name} (${att.size})</span>`
                            ).join('')}
                        </div>
                    ` : ''}
                </div>
                <div class="message-footer">
                    <div class="message-actions">
                        ${!msg.read ? `
                            <button class="btn-link mark-read">Отметить прочитанным</button>
                        ` : `
                            <span class="read-info">👁️ Прочитано ${new Date(msg.readAt).toLocaleString()}</span>
                        `}
                        <button class="btn-link reply-btn">↩️ Ответить</button>
                        <button class="btn-link">💬 ${msg.replies} ответов</button>
                    </div>
                </div>
            </div>
        `).join('');

        // Add event listeners
        messagesList.querySelectorAll('.mark-read').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const messageId = e.target.closest('.message-item').dataset.id;
                this.markAsRead(messageId);
            });
        });

        messagesList.querySelectorAll('.reply-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const messageId = e.target.closest('.message-item').dataset.id;
                this.replyToMessage(messageId);
            });
        });
    }

    filterMessages() {
        return this.messages.filter(msg => {
            const matchesType = this.filters.type === 'all' || 
                (this.filters.type === 'incoming' && msg.from.id !== this.currentUser.id) ||
                (this.filters.type === 'outgoing' && msg.from.id === this.currentUser.id) ||
                (this.filters.type === 'unread' && !msg.read);
                
            const matchesPriority = this.filters.priority === 'all' || msg.priority === this.filters.priority;
            const matchesSpecialization = this.filters.specialization === 'all' || msg.toSpecialization === this.filters.specialization;
            const matchesSearch = !this.filters.search || 
                msg.subject.toLowerCase().includes(this.filters.search.toLowerCase()) ||
                msg.message.toLowerCase().includes(this.filters.search.toLowerCase());
            
            // Check if user has access to this message based on role
            const hasAccess = this.checkMessageAccess(msg);
            
            return matchesType && matchesPriority && matchesSpecialization && matchesSearch && hasAccess;
        });
    }

    checkMessageAccess(message) {
        const roleHierarchy = {
            'director': ['frontend', 'backend', 'design', 'devops', 'analytics', 'management'],
            'team-lead': ['frontend', 'backend', 'design'],
            'developer': ['frontend', 'backend'],
            'designer': ['design'],
            'analyst': ['analytics'],
            'devops': ['devops']
        };

        // Director can read everything
        if (this.currentUser.role === 'director') return true;
        
        // Check if user's role has access to this specialization
        const userSpecializations = roleHierarchy[this.currentUser.role] || [];
        return userSpecializations.includes(message.toSpecialization) ||
               message.from.id === this.currentUser.id;
    }

    getSpecializationLabel(spec) {
        const labels = {
            'frontend': 'Frontend',
            'backend': 'Backend', 
            'design': 'Дизайн',
            'devops': 'DevOps',
            'analytics': 'Аналитика',
            'management': 'Менеджмент'
        };
        return labels[spec] || spec;
    }

    getRoleLabel(role) {
        const labels = {
            'director': 'Директор',
            'team-lead': 'Тимлид',
            'developer': 'Разработчик',
            'designer': 'Дизайнер',
            'analyst': 'Аналитик',
            'devops': 'DevOps'
        };
        return labels[role] || role;
    }

    getPriorityLabel(priority) {
        const labels = {
            'urgent': 'Срочный',
            'high': 'Высокий',
            'normal': 'Обычный',
            'low': 'Низкий'
        };
        return labels[priority] || priority;
    }

    getStats() {
        const accessibleMessages = this.messages.filter(msg => this.checkMessageAccess(msg));
        return {
            total: accessibleMessages.length,
            unread: accessibleMessages.filter(msg => !msg.read).length,
            highPriority: accessibleMessages.filter(msg => msg.priority === 'high' || msg.priority === 'urgent').length,
            toMe: accessibleMessages.filter(msg => 
                msg.toAdmin && msg.toAdmin.id === this.currentUser.id
            ).length
        };
    }

    showNewMessageModal() {
        this.querySelector('#new-message-modal').style.display = 'block';
    }

    hideModal() {
        this.querySelector('#new-message-modal').style.display = 'none';
        this.querySelector('#new-message-form').reset();
    }

    async sendMessage() {
        const form = this.querySelector('#new-message-form');
        const formData = new FormData(form);
        
        const messageData = {
            toSpecialization: formData.get('toSpecialization'),
            toAdmin: formData.get('toAdmin') ? { id: formData.get('toAdmin') } : null,
            priority: formData.get('priority'),
            subject: formData.get('subject'),
            message: formData.get('message'),
            important: formData.get('important') === 'on'
        };

        try {
            const response = await fetch(`${window.adminDashboard.apiBase}/admin/messages/internal`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(messageData)
            });
            
            if (response.ok) {
                this.hideModal();
                this.loadMessages(); // Reload messages
                this.showSuccess('Сообщение отправлено!');
            }
        } catch (error) {
            this.showError('Ошибка отправки сообщения: ' + error.message);
        }
    }

    markAsRead(messageId) {
        const message = this.messages.find(m => m.id == messageId);
        if (message) {
            message.read = true;
            message.readAt = new Date().toISOString();
            this.renderMessages();
            this.showSuccess('Сообщение отмечено как прочитанное');
        }
    }

    replyToMessage(messageId) {
        const message = this.messages.find(m => m.id == messageId);
        if (message) {
            this.showNewMessageModal();
            const form = this.querySelector('#new-message-form');
            form.querySelector('[name="toSpecialization"]').value = message.from.specialization[0];
            form.querySelector('[name="subject"]').value = `Re: ${message.subject}`;
            form.querySelector('[name="message"]').value = `\n\n--- Original Message ---\n${message.message}`;
        }
    }

    showSuccess(message) {
        alert('✅ ' + message);
    }

    showError(message) {
        alert('❌ ' + message);
    }
}

customElements.define('messages-panel', MessagesPanel);