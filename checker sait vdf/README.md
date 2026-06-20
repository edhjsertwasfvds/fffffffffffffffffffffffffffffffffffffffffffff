# VDF Checker — Проверка аккаунтов Steam

Веб-версия чекера config.vdf для Fear Project.

## Что делает

1. Загружает `config.vdf` из папки Steam (drag & drop или выбор файла)
2. Парсит SteamID64 из секции Accounts
3. Проверяет каждый аккаунт:
   - Регистрацию на Fear Project
   - Баны на Fear Project
   - VAC баны (Steam API)
   - Game Bans (Steam API)
   - Community Bans (Steam API)
4. Показывает результаты в виде карточек
5. Дополнительная проверка Yooma.su банов по кнопке

## Структура

```
vdf-checker/
├── backend/
│   ├── app.py              # FastAPI сервер
│   └── requirements.txt    # Зависимости
└── frontend/
    ├── index.html          # Главная страница
    └── static/
        ├── style.css       # Стили (тёмная тема)
        └── app.js          # Логика фронтенда
```

## Запуск

### Локально (Python)

```bash
cd backend
pip install -r requirements.txt
# Установи STEAM_API_KEY в .env или оставь дефолтный
python app.py
```

Открой http://localhost:8080

### Docker

```bash
docker-compose up --build
```

## API Endpoints

| Endpoint | Method | Описание |
|----------|--------|----------|
| `/api/parse-vdf` | POST | Парсит .vdf файлы, возвращает SteamID |
| `/api/check-batch` | POST | Проверяет батч SteamID через Steam API |
| `/api/check-fear` | POST | Проверяет профиль на Fear Project |
| `/api/check-yooma` | POST | Проверяет баны на Yooma.su |

## Как это работает (из bot.py)

### Парсинг VDF
```python
# Из bot.py: _parse_vdf_steamids()
# Ищет строки вида: "SteamID" "76561198..."
re.findall(r'"SteamID"\s+"(7656\d{13})"', text)
```

### Проверка Steam
```python
# GetPlayerBans — VAC, Game Ban, Community Ban
# GetPlayerSummaries — ник, аватарка
```

### Проверка Fear
```python
# GET https://api.fearproject.ru/profile/{steamid}
# Возвращает: name, banInfo, adminGroup, stats, faceitLevel
```

### Проверка Yooma
```python
# GET https://yooma.su/api/public/read/punishments
# Параметры: punish_type=0, search={steamid}
# Фильтрует активные баны (не разбаненные, не истёкшие)
```

## Переменные окружения

| Переменная | Описание | По умолчанию |
|------------|----------|--------------|
| `STEAM_API_KEY` | Ключ Steam Web API | `9EA60BC3158081747D77604EB9819F19` |
| `FEAR_API_BASE` | Базовый URL Fear API | `https://api.fearproject.ru` |

## Особенности

- **CORS**: Бэкенд проксирует все запросы к внешним API, фронтенд не сталкивается с CORS
- **Батчинг**: Steam API ограничен 100 SteamID за запрос, бэкенд разбивает на батчи
- **Семафоры**: Ограничение параллельных запросов к Fear/Yooma чтобы не получить 429
- **Сортировка**: Результаты сортируются — бананы первые, потом незарегистрированные, потом чистые
