// mock-data/messaging-mocks.js

// Mock data for ideas
export const generateIdeas = () => {
  const ideas = [];
  const priorities = ['low', 'medium', 'high', 'critical'];
  const statuses = ['new', 'in-progress', 'completed', 'rejected'];
  const categories = ['feature', 'improvement', 'bugfix', 'ui-ux', 'performance'];
  
  const sampleIdeas = [
    'Добавить темную тему в админку',
    'Реализовать кэширование запросов к Wildberries',
    'Добавить уведомления в Telegram',
    'Создать мобильное приложение',
    'Оптимизировать загрузку изображений',
    'Добавить аналитику пользовательского поведения',
    'Реализовать A/B тестирование',
    'Создать систему шаблонов отчетов',
    'Добавить экспорт данных в Excel',
    'Реализовать массовое редактирование товаров',
    'Внедрить систему кэширования Redis',
    'Добавить мониторинг производительности',
    'Создать API документацию',
    'Реализовать поиск по логам',
    'Добавить двухфакторную аутентификацию'
  ];
  
  const admins = ['alex', 'maria', 'ivan', 'olga', 'dmitry'];
  
  for (let i = 0; i < 15; i++) {
    const created = new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000);
    const updated = new Date(created.getTime() + Math.random() * 7 * 24 * 60 * 60 * 1000);
    
    ideas.push({
      id: i + 1,
      title: sampleIdeas[i % sampleIdeas.length] + ` #${i + 1}` ,
      description: `Подробное описание идеи ${i + 1}. Это улучшение поможет увеличить производительность системы и улучшить пользовательский опыт. Включает в себя следующие аспекты: оптимизация работы с базой данных, улучшение интерфейса пользователя, добавление новых функций аналитики.` ,
      category: categories[i % categories.length],
      priority: priorities[Math.floor(Math.random() * priorities.length)],
      status: statuses[Math.floor(Math.random() * statuses.length)],
      createdBy: admins[Math.floor(Math.random() * admins.length)],
      assignedTo: Math.random() > 0.3 ? admins[Math.floor(Math.random() * admins.length)] : null,
      votes: Math.floor(Math.random() * 20),
      estimatedHours: Math.floor(Math.random() * 40) + 8,
      actualHours: Math.random() > 0.5 ? Math.floor(Math.random() * 50) + 5 : null,
      createdAt: created.toISOString(),
      updatedAt: updated.toISOString(),
      tags: ['frontend', 'backend', 'database', 'ui', 'api', 'performance'][Math.floor(Math.random() * 6)].split(','),
      comments: Math.floor(Math.random() * 10),
      attachments: Math.random() > 0.7 ? [
        { name: 'specification.pdf', size: '2.3 MB', url: '#' },
        { name: 'mockups.zip', size: '5.1 MB', url: '#' }
      ] : []
    });
  }
  
  return ideas.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
};

// Mock data for tickets
export const generateTickets = () => {
  const tickets = [];
  const statuses = ['open', 'in-progress', 'resolved', 'closed'];
  const priorities = ['low', 'medium', 'high', 'urgent'];
  const categories = [
    { id: 1, name: 'Ошибка', color: '#ef4444', description: 'Сообщения об ошибках в системе' },
    { id: 2, name: 'Вопрос', color: '#3b82f6', description: 'Вопросы по использованию системы' },
    { id: 3, name: 'Предложение', color: '#10b981', description: 'Предложения по улучшению' },
    { id: 4, name: 'Техническая поддержка', color: '#f59e0b', description: 'Технические вопросы' },
    { id: 5, name: 'Системное', color: '#8b5cf6', description: 'Системные уведомления' }
  ];
  
  const sampleMessages = [
    'Не работает поиск по определенным запросам',
    'Как экспортировать данные в CSV?',
    'Предлагаю добавить фильтр по дате',
    'Ошибка 500 при загрузке страницы товара',
    'Медленно работает дашборд при большом количестве данных',
    'Нужна возможность массового редактирования',
    'Не приходят уведомления на email',
    'Как настроить автоматический сбор данных?',
    'Ошибка авторизации через социальные сети',
    'Предлагаю добавить темную тему',
    'Проблема с отображением кириллицы',
    'Не обновляются цены товаров',
    'Как добавить нового пользователя?',
    'Ошибка при загрузке изображений',
    'Нужна помощь с API интеграцией'
  ];
  
  const users = ['user123', 'company_abc', 'individual_user', 'test_account', 'premium_user', 'business_pro'];
  const admins = ['alex', 'maria', 'ivan', 'olga'];
  
  // System messages
  tickets.push({
    id: 1,
    type: 'system',
    subject: 'Обновление системы',
    message: 'Запланировано техническое обслуживание на 15.01.2024 с 02:00 до 04:00. В это время система может быть недоступна. Пожалуйста, сохраните все важные данные заранее.',
    category: categories[4],
    priority: 'medium',
    status: 'open',
    fromUser: 'system',
    fromUserId: null,
    assignedTo: null,
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    readBy: [],
    attachments: []
  });
  
  tickets.push({
    id: 2,
    type: 'system',
    subject: 'Новая версия API',
    message: 'Вышла новая версия API Wildberries. Обновите клиенты до версии 2.5. Основные изменения: добавлены новые методы для работы с акциями, улучшена обработка ошибок, обновлена документация.',
    category: categories[4],
    priority: 'high',
    status: 'open',
    fromUser: 'system',
    fromUserId: null,
    assignedTo: null,
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    readBy: ['alex'],
    attachments: [
      { name: 'api_changelog.pdf', size: '1.2 MB', url: '#' },
      { name: 'migration_guide.docx', size: '856 KB', url: '#' }
    ]
  });
  
  // User tickets
  for (let i = 3; i < 20; i++) {
    const created = new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000);
    const updated = new Date(created.getTime() + Math.random() * 3 * 24 * 60 * 60 * 1000);
    const category = categories[Math.floor(Math.random() * (categories.length - 1))];
    
    tickets.push({
      id: i,
      type: 'user',
      subject: sampleMessages[(i - 3) % sampleMessages.length],
      message: `Подробное описание проблемы или вопроса от пользователя. Пользователь сообщает о следующей проблеме: ${sampleMessages[(i - 3) % sampleMessages.length]}. Требуется помощь специалиста для решения данного вопроса. Дополнительная информация: возникло при определенных условиях, влияет на работу основных функций системы.` ,
      category: category,
      priority: priorities[Math.floor(Math.random() * priorities.length)],
      status: statuses[Math.floor(Math.random() * statuses.length)],
      fromUser: users[Math.floor(Math.random() * users.length)],
      fromUserId: `user_${i}` ,
      assignedTo: Math.random() > 0.4 ? admins[Math.floor(Math.random() * admins.length)] : null,
      createdAt: created.toISOString(),
      updatedAt: updated.toISOString(),
      readBy: Math.random() > 0.5 ? [admins[Math.floor(Math.random() * admins.length)]] : [],
      attachments: Math.random() > 0.7 ? [
        { name: 'screenshot.png', size: '2.1 MB', url: '#' },
        { name: 'logs.txt', size: '156 KB', url: '#' },
        { name: 'config.json', size: '4.2 KB', url: '#' }
      ] : [],
      responses: Math.random() > 0.5 ? Math.floor(Math.random() * 5) : 0
    });
  }
  
  return tickets.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
};

// Mock data for internal messages
export const generateInternalMessages = () => {
  const messages = [];
  const priorities = ['low', 'normal', 'high', 'urgent'];
  const specializations = ['frontend', 'backend', 'design', 'devops', 'analytics', 'management'];
  
  const roleHierarchy = {
    'director': ['frontend', 'backend', 'design', 'devops', 'analytics', 'management'],
    'team-lead': ['frontend', 'backend', 'design'],
    'developer': ['frontend', 'backend'],
    'designer': ['design'],
    'analyst': ['analytics'],
    'devops': ['devops']
  };
  
  const admins = [
    { id: 'alex', name: 'Алексей Петров', role: 'director', specialization: ['management'] },
    { id: 'maria', name: 'Мария Иванова', role: 'team-lead', specialization: ['frontend', 'backend'] },
    { id: 'ivan', name: 'Иван Сидоров', role: 'developer', specialization: ['backend'] },
    { id: 'olga', name: 'Ольга Кузнецова', role: 'designer', specialization: ['design'] },
    { id: 'dmitry', name: 'Дмитрий Смирнов', role: 'analyst', specialization: ['analytics'] },
    { id: 'serg', name: 'Сергей Васильев', role: 'devops', specialization: ['devops'] }
  ];
  
  const sampleMessages = [
    'Нужна помощь с оптимизацией запроса к базе данных',
    'Требуется дизайн для новой страницы отчетов',
    'Обсудим архитектуру нового модуля?',
    'Проблема с развертыванием на production',
    'Нужны данные для аналитики пользовательского поведения',
    'Код ревью для пулл реквеста #145',
    'Планируем спринт на следующую неделю',
    'Вопрос по интеграции с новым API Wildberries',
    'Нужно обновить документацию для разработчиков',
    'Обсудим приоритеты задач на этот квартал',
    'Проблема с производительностью на мобильных устройствах',
    'Требуется консультация по безопасности',
    'Подготовка к масштабированию системы',
    'Анализ метрик за последний месяц',
    'Координация работ по миграции базы данных'
  ];
  
  for (let i = 0; i < 25; i++) {
    const fromAdmin = admins[Math.floor(Math.random() * admins.length)];
    let toSpecialization;
    let toAdmin = null;
    
    // 70% сообщений к специализации, 30% конкретному админу
    if (Math.random() > 0.3) {
      toSpecialization = specializations[Math.floor(Math.random() * specializations.length)];
    } else {
      toAdmin = admins.filter(a => a.id !== fromAdmin.id)[Math.floor(Math.random() * (admins.length - 1))];
      toSpecialization = toAdmin.specialization[0];
    }
    
    const created = new Date(Date.now() - Math.random() * 14 * 24 * 60 * 60 * 1000);
    const read = Math.random() > 0.3;
    
    messages.push({
      id: i + 1,
      from: fromAdmin,
      toSpecialization: toSpecialization,
      toAdmin: toAdmin,
      subject: sampleMessages[i % sampleMessages.length],
      message: `Подробное содержание сообщения. ${sampleMessages[i % sampleMessages.length]}. Это сообщение требует внимания и возможно обсуждения с коллегами. Необходимо рассмотреть все аспекты проблемы и предложить оптимальное решение. Прошу предоставить обратную связь в ближайшее время.` ,
      priority: priorities[Math.floor(Math.random() * priorities.length)],
      createdAt: created.toISOString(),
      read: read,
      readAt: read ? new Date(created.getTime() + Math.random() * 60 * 60 * 1000).toISOString() : null,
      replies: Math.floor(Math.random() * 5),
      attachments: Math.random() > 0.8 ? [
        { name: 'design.pdf', size: '4.2 MB', url: '#' },
        { name: 'specification.docx', size: '1.8 MB', url: '#' },
        { name: 'metrics_data.xlsx', size: '3.5 MB', url: '#' }
      ] : [],
      important: Math.random() > 0.8
    });
  }
  
  return messages.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
};

// Get categories for tickets
export const getTicketCategories = () => {
  return [
    { id: 1, name: 'Ошибка', color: '#ef4444', description: 'Сообщения об ошибках в системе', enabled: true },
    { id: 2, name: 'Вопрос', color: '#3b82f6', description: 'Вопросы по использованию системы', enabled: true },
    { id: 3, name: 'Предложение', color: '#10b981', description: 'Предложения по улучшению', enabled: true },
    { id: 4, name: 'Техническая поддержка', color: '#f59e0b', description: 'Технические вопросы', enabled: true },
    { id: 5, name: 'Системное', color: '#8b5cf6', description: 'Системные уведомления', enabled: true },
    { id: 6, name: 'Безопасность', color: '#dc2626', description: 'Вопросы безопасности', enabled: false },
    { id: 7, name: 'API', color: '#8b5cf6', description: 'Вопросы по API интеграции', enabled: true },
    { id: 8, name: 'Документация', color: '#6b7280', description: 'Запросы по документации', enabled: true }
  ];
};

// Get current user (mock)
export const getCurrentUser = () => {
  return {
    id: 'alex',
    name: 'Алексей Петров',
    role: 'director',
    specialization: ['management'],
    permissions: ['read_all', 'manage_users', 'system_config', 'manage_tickets', 'view_analytics'],
    email: 'alex@company.com',
    avatar: 'https://example.com/avatars/alex.jpg',
    lastLogin: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
  };
};
