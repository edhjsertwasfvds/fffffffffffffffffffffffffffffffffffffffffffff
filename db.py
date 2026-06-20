"""
PostgreSQL-backed persistent storage for FearSearch Bot.
Uses a single table `kv_store` with key→JSONB mapping.
Falls back gracefully if DATABASE_URL is not set.
"""
import os
import json
import logging
import psycopg2
import psycopg2.extras

logger = logging.getLogger("db")

_pool = None


def _get_conn():
    global _pool
    url = os.getenv("DATABASE_URL", "").strip()
    if not url:
        return None
    if _pool is None or _pool.closed:
        try:
            _pool = psycopg2.connect(url, cursor_factory=psycopg2.extras.RealDictCursor)
            _pool.autocommit = True
            _init_table()
            logger.info("[DB] PostgreSQL подключена")
        except Exception as e:
            logger.error(f"[DB] Ошибка подключения: {e}")
            _pool = None
            return None
    return _pool


def _init_table():
    conn = _get_conn()
    if not conn:
        return
    try:
        with conn.cursor() as cur:
            cur.execute("""
                CREATE TABLE IF NOT EXISTS kv_store (
                    key TEXT PRIMARY KEY,
                    value JSONB NOT NULL,
                    updated_at TIMESTAMPTZ DEFAULT NOW()
                )
            """)
    except Exception as e:
        logger.error(f"[DB] Ошибка создания таблицы: {e}")


def db_load(key: str):
    """Загрузить данные по ключу. Возвращает Python-объект или None."""
    conn = _get_conn()
    if not conn:
        return None
    try:
        with conn.cursor() as cur:
            cur.execute("SELECT value FROM kv_store WHERE key = %s", (key,))
            row = cur.fetchone()
            if row:
                return row["value"]
    except Exception as e:
        logger.error(f"[DB] Ошибка загрузки {key}: {e}")
    return None


def db_save(key: str, data) -> bool:
    """Сохранить данные по ключу. Возвращает True при успехе."""
    conn = _get_conn()
    if not conn:
        return False
    try:
        with conn.cursor() as cur:
            cur.execute("""
                INSERT INTO kv_store (key, value, updated_at)
                VALUES (%s, %s::jsonb, NOW())
                ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()
            """, (key, json.dumps(data, ensure_ascii=False)))
        return True
    except Exception as e:
        logger.error(f"[DB] Ошибка сохранения {key}: {e}")
        # Попробовать переподключиться
        global _pool
        _pool = None
        conn2 = _get_conn()
        if conn2:
            try:
                with conn2.cursor() as cur:
                    cur.execute("""
                        INSERT INTO kv_store (key, value, updated_at)
                        VALUES (%s, %s::jsonb, NOW())
                        ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()
                    """, (key, json.dumps(data, ensure_ascii=False)))
                return True
            except Exception as e2:
                logger.error(f"[DB] Ошибка сохранения (retry) {key}: {e2}")
    return False


def db_load_all_keys() -> list[str]:
    """Возвращает список всех ключей в хранилище."""
    conn = _get_conn()
    if not conn:
        return []
    try:
        with conn.cursor() as cur:
            cur.execute("SELECT key FROM kv_store ORDER BY key")
            return [row["key"] for row in cur.fetchall()]
    except Exception as e:
        logger.error(f"[DB] Ошибка получения ключей: {e}")
    return []


def db_init() -> bool:
    """Инициализировать подключение. Возвращает True если БД доступна."""
    conn = _get_conn()
    return conn is not None


def db_is_available() -> bool:
    """Проверить доступность БД."""
    return _pool is not None and not _pool.closed
