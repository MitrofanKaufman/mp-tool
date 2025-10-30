---
description: Управление макросами проекта
auto_execution_mode: 3
---

---
description: Управление макросами проекта
version: 1.1.0
maintainer: DevOps Team
date: 2025-10-13
lang: russian

# Основные параметры
parameters:
  - name: action
    description: Действие для выполнения
    required: true
    type: string
    options:
      - list       # Показать список доступных макросов
      - run        # Запустить макрос
      - status     # Проверить статус выполнения
      - create     # Создать новый макрос
      - update     # Обновить существующий макрос
      - delete     # Удалить макрос
      - help       # Показать справку

  # Общие параметры
  - name: macro-id
    description: ID макроса (обязателен для run/status/update/delete)
    type: string
    required: false

  - name: name
    description: Название макроса (обязателен для create/update)
    type: string
    required: false

  - name: description
    description: Описание макроса
    type: string
    required: false
    default: ""

  - name: category
    description: Категория макроса (development, deployment, maintenance, etc.)
    type: string
    required: false
    default: "general"

  - name: params
    description: Параметры для выполнения макроса в формате JSON
    type: string
    required: false
    default: "{}"

  - name: async
    description: Запустить асинхронно (не дожидаясь завершения)
    type: boolean
    required: false
    default: false

  - name: log-level
    description: Уровень логирования (error, warn, info, debug)
    type: string
    required: false
    default: "info"
    options:
      - error
      - warn
      - info
      - debug

# Переменные окружения
env:
  - name: NODE_ENV
    description: Окружение выполнения
    default: development
    options:
      - development
      - staging
      - production

  - name: LOG_LEVEL
    description: Уровень логирования
    default: info

# Обработчики событий
on:
  success:
    - echo "✅ Макрос успешно выполнен"
    - echo "🕒 Время выполнения: {{ duration }} секунд"
    
  failure:
    - echo "❌ Ошибка выполнения макроса"
    - echo "🔍 Сообщение об ошибке: {{ error }}"
    - echo "📋 Логи доступны в: logs/macros/{{ timestamp }}.log"

  always:
    - echo "🏁 Завершение работы макроса"

# Основной workflow
workflow:
  - name: Инициализация
    run: |
      echo "🔧 Инициализация окружения..."
      export LOG_LEVEL={{ log-level | default('info') }}
      export MACRO_ID={{ macro-id | default('') }}
      export TIMESTAMP=$(date +%Y%m%d-%H%M%S)
      
      # Создаем лог-файл
      export LOG_FILE="logs/macros/${TIMESTAMP}-${action}-${MACRO_ID:-'none'}.log"
      mkdir -p "$(dirname "$LOG_FILE")"
      exec > >(tee -a "$LOG_FILE") 2>&1
      
      echo "📝 Логирование в файл: $LOG_FILE"

  - name: Выполнение действия
    switch: {{ action }}
    cases:
      - case: list
        run: |
          echo "📋 Список доступных макросов:"
          yarn macro:list
          
      - case: run
        run: |
          if [ -z "{{ macro-id }}" ]; then
            echo "❌ Ошибка: Не указан ID макроса"
            exit 1
          fi
          
          echo "🚀 Запуск макроса: {{ macro-id }}"
          if [ "{{ async }}" = "true" ]; then
            echo "🔹 Запуск в фоновом режиме..."
            nohup yarn macro:run "{{ macro-id }}" --params '{{ params }}' > "$LOG_FILE" 2>&1 &
            echo "✅ Макрос запущен асинхронно (PID: $!)"
            echo "📋 Логи будут записаны в: $LOG_FILE"
          else
            yarn macro:run "{{ macro-id }}" --params '{{ params }}'
          fi
          
      - case: status
        run: |
          if [ -z "{{ macro-id }}" ]; then
            echo "❌ Ошибка: Не указан ID макроса"
            exit 1
          fi
          
          echo "🔄 Проверка статуса макроса: {{ macro-id }}"
          yarn macro:status "{{ macro-id }}"
          
      - case: create
        run: |
          if [ -z "{{ name }}" ]; then
            echo "❌ Ошибка: Не указано название макроса"
            exit 1
          fi
          
          echo "🆕 Создание макроса: {{ name }}"
          yarn macro:create "{{ name }}" "{{ description }}" "{{ category }}"
          
      - case: update
        run: |
          if [ -z "{{ macro-id }}" ]; then
            echo "❌ Ошибка: Не указан ID макроса"
            exit 1
          fi
          
          echo "🔄 Обновление макроса: {{ macro-id }}"
          yarn macro:update "{{ macro-id }}" --name "{{ name }}" --description "{{ description }}" --category "{{ category }}"
          
      - case: delete
        run: |
          if [ -z "{{ macro-id }}" ]; then
            echo "❌ Ошибка: Не указан ID макроса"
            exit 1
          fi
          
          echo "🗑️ Удаление макроса: {{ macro-id }}"
          yarn macro:delete "{{ macro-id }}"
          
      - case: help
      - case: default
        run: |
          echo "📚 Справка по использованию макросов"
          echo ""
          echo "Доступные команды:"
          echo "  list      - Показать список доступных макросов"
          echo "  run       - Запустить макрос"
          echo "  status    - Проверить статус выполнения"
          echo "  create    - Создать новый макрос"
          echo "  update    - Обновить существующий макрос"
          echo "  delete    - Удалить макрос"
          echo "  help      - Показать эту справку"
          echo ""
          echo "Примеры использования:"
          echo "  windsurf workflow run macro.md --action list"
          echo "  windsurf workflow run macro.md --action run --macro-id init-project"
          echo "  windsurf workflow run macro.md --action status --macro-id abc123"
          echo "  windsurf workflow run macro.md --action create --name 'New Macro' --description 'Description'"
          echo ""
          echo "Дополнительные параметры:"
          echo "  --async     - Запустить асинхронно"
          echo "  --log-level - Уровень логирования (error, warn, info, debug)"
          echo "  --params    - Параметры в формате JSON"

  - name: Завершение
    run: |
      echo "🏁 Завершение работы макроса"
      echo "🕒 Общее время выполнения: ${SECONDS} секунд"
      echo "📋 Полные логи доступны в: $LOG_FILE"

# Примеры использования
examples:
  - name: Показать список макросов
    command: windsurf workflow run macro.md --action list
    
  - name: Запустить макрос синхронно
    command: windsurf workflow run macro.md --action run --macro-id init-project
    
  - name: Запустить макрос асинхронно
    command: windsurf workflow run macro.md --action run --macro-id deploy --async true
    
  - name: Проверить статус выполнения
    command: windsurf workflow run macro.md --action status --macro-id abc123
    
  - name: Создать новый макрос
    command: windsurf workflow run macro.md --action create --name "Новый макрос" --description "Описание" --category "development"
    
  - name: Обновить макрос
    command: windsurf workflow run macro.md --action update --macro-id abc123 --name "Обновленное название" --description "Новое описание"
    
  - name: Удалить макрос
    command: windsurf workflow run macro.md --action delete --macro-id abc123

# Примечания
notes:
  - Все действия логируются в папку logs/macros/
  - Для асинхронного выполнения используйте флаг --async true
  - Уровень детализации логов можно изменить через --log-level
  - Для передачи параметров используйте --params '{"key": "value"}'