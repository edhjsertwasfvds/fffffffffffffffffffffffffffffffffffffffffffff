#!/bin/bash

echo "=========================================="
echo "   VDF Checker - Запуск сервера"
echo "=========================================="
echo ""

# Проверяем Python
if ! command -v python3 &> /dev/null; then
    echo "[ERROR] Python3 не найден! Установите Python 3.11+"
    exit 1
fi

echo "[OK] Python найден:"
python3 --version
echo ""

# Переходим в папку скрипта
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR/backend"

# Проверяем виртуальное окружение
if [ ! -d "venv" ]; then
    echo "[INFO] Создаю виртуальное окружение..."
    python3 -m venv venv
fi

# Активируем venv
source venv/bin/activate

# Устанавливаем зависимости если нужно
if ! python -c "import fastapi" 2>/dev/null; then
    echo "[INFO] Устанавливаю зависимости..."
    pip install -r requirements.txt
fi

echo ""
echo "=========================================="
echo "   Запуск сервера..."
echo "   URL: http://localhost:8080"
echo "   Нажмите Ctrl+C для остановки"
echo "=========================================="
echo ""

# Запускаем сервер
python app.py
