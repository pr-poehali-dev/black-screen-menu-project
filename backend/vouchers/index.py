"""
Управление ваучерами: создание (admin), активация (игрок), список (admin).
"""
import json
import os
import psycopg2
import random
import string
from datetime import datetime

CORS_HEADERS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-User-Id, X-Auth-Token",
}


def get_conn():
    return psycopg2.connect(os.environ["DATABASE_URL"])


def json_ok(data):
    return {"statusCode": 200, "headers": {**CORS_HEADERS, "Content-Type": "application/json"}, "body": json.dumps(data)}


def json_err(msg, code=400):
    return {"statusCode": code, "headers": {**CORS_HEADERS, "Content-Type": "application/json"}, "body": json.dumps({"error": msg})}


def gen_code(length=10):
    chars = string.ascii_uppercase + string.digits
    return "".join(random.choices(chars, k=length))


def handler(event: dict, context) -> dict:
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS_HEADERS, "body": ""}

    method = event.get("httpMethod", "GET")
    params = event.get("queryStringParameters") or {}
    body = {}
    if event.get("body"):
        try:
            body = json.loads(event["body"])
        except Exception:
            pass

    action = params.get("action") or body.get("action")

    # --- Создание ваучера (только admin) ---
    if action == "create":
        admin_id = body.get("admin_id")
        amount = body.get("amount")
        code = body.get("code", "").strip().upper() or gen_code()
        if not admin_id or not amount:
            return json_err("admin_id и amount обязательны")
        try:
            amount = float(amount)
            if amount <= 0:
                return json_err("Сумма должна быть больше 0")
        except Exception:
            return json_err("Некорректная сумма")

        conn = get_conn()
        cur = conn.cursor()
        cur.execute("SELECT id FROM admin_users WHERE display_id = %s", (int(admin_id),))
        if not cur.fetchone():
            conn.close()
            return json_err("Нет прав", 403)

        # Генерируем уникальный код
        for _ in range(10):
            cur.execute("SELECT id FROM vouchers WHERE code = %s", (code,))
            if not cur.fetchone():
                break
            code = gen_code()

        cur.execute(
            "INSERT INTO vouchers (code, amount, created_by) VALUES (%s, %s, %s) RETURNING id, code, amount, created_at",
            (code, amount, int(admin_id))
        )
        row = cur.fetchone()
        conn.commit()
        conn.close()
        return json_ok({"id": row[0], "code": row[1], "amount": float(row[2]), "created_at": str(row[3])})

    # --- Список ваучеров (только admin) ---
    if action == "list":
        admin_id = params.get("admin_id")
        if not admin_id:
            return json_err("admin_id обязателен")
        conn = get_conn()
        cur = conn.cursor()
        cur.execute("SELECT id FROM admin_users WHERE display_id = %s", (int(admin_id),))
        if not cur.fetchone():
            conn.close()
            return json_err("Нет прав", 403)
        cur.execute(
            "SELECT id, code, amount, is_active, used_by, used_at, created_at FROM vouchers ORDER BY created_at DESC LIMIT 100"
        )
        rows = cur.fetchall()
        conn.close()
        vouchers = [
            {
                "id": r[0],
                "code": r[1],
                "amount": float(r[2]),
                "is_active": r[3],
                "used_by": r[4],
                "used_at": str(r[5]) if r[5] else None,
                "created_at": str(r[6]) if r[6] else None,
            }
            for r in rows
        ]
        return json_ok({"vouchers": vouchers})

    # --- Деактивация ваучера (admin) ---
    if action == "deactivate":
        admin_id = body.get("admin_id")
        voucher_id = body.get("voucher_id")
        if not admin_id or not voucher_id:
            return json_err("admin_id и voucher_id обязательны")
        conn = get_conn()
        cur = conn.cursor()
        cur.execute("SELECT id FROM admin_users WHERE display_id = %s", (int(admin_id),))
        if not cur.fetchone():
            conn.close()
            return json_err("Нет прав", 403)
        cur.execute("UPDATE vouchers SET is_active = FALSE WHERE id = %s", (int(voucher_id),))
        conn.commit()
        conn.close()
        return json_ok({"ok": True})

    # --- Активация ваучера (игрок) ---
    if action == "redeem":
        user_id = body.get("user_id")
        code = (body.get("code") or "").strip().upper()
        if not user_id or not code:
            return json_err("user_id и code обязательны")

        conn = get_conn()
        cur = conn.cursor()

        cur.execute("SELECT id, amount, is_active, used_by FROM vouchers WHERE code = %s", (code,))
        row = cur.fetchone()
        if not row:
            conn.close()
            return json_err("Ваучер не найден")
        v_id, amount, is_active, used_by = row

        if not is_active:
            conn.close()
            return json_err("Ваучер уже использован или деактивирован")
        if used_by is not None:
            conn.close()
            return json_err("Ваучер уже использован")

        # Начисляем баланс
        cur.execute(
            "INSERT INTO user_balances (user_id, balance) VALUES (%s, %s) ON CONFLICT (user_id) DO UPDATE SET balance = user_balances.balance + EXCLUDED.balance, updated_at = NOW()",
            (str(user_id), float(amount))
        )
        cur.execute(
            "UPDATE vouchers SET is_active = FALSE, used_by = %s, used_at = NOW() WHERE id = %s",
            (int(user_id), v_id)
        )
        conn.commit()

        cur.execute("SELECT balance FROM user_balances WHERE user_id = %s", (str(user_id),))
        bal_row = cur.fetchone()
        conn.close()

        return json_ok({"ok": True, "amount": float(amount), "new_balance": float(bal_row[0]) if bal_row else 0})

    return json_err("Неизвестное действие")
