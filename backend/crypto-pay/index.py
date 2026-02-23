import json
import os
import urllib.request
import urllib.error

CRYPTOBOT_API_URL = "https://pay.crypt.bot/api"


def handler(event, context):
    """Создание инвойса для оплаты через CryptoBot"""
    if event.get("httpMethod") == "OPTIONS":
        return {
            "statusCode": 200,
            "headers": {
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
                "Access-Control-Allow-Headers": "Content-Type",
                "Access-Control-Max-Age": "86400",
            },
            "body": "",
        }

    cors = {"Access-Control-Allow-Origin": "*"}

    if event.get("httpMethod") != "POST":
        return {
            "statusCode": 405,
            "headers": cors,
            "body": json.dumps({"error": "Method not allowed"}),
        }

    raw_body = event.get("body", "{}")
    if isinstance(raw_body, dict):
        body = raw_body
    else:
        body = json.loads(raw_body or "{}")
    if isinstance(body, str):
        body = json.loads(body)
    amount = body.get("amount")

    if not amount:
        return {
            "statusCode": 400,
            "headers": cors,
            "body": json.dumps({"error": "Укажите сумму"}),
        }

    try:
        amount = float(amount)
    except (ValueError, TypeError):
        return {
            "statusCode": 400,
            "headers": cors,
            "body": json.dumps({"error": "Некорректная сумма"}),
        }

    if amount < 5:
        return {
            "statusCode": 400,
            "headers": cors,
            "body": json.dumps({"error": "Минимальная сумма — 5 USDT"}),
        }

    if amount > 5000:
        return {
            "statusCode": 400,
            "headers": cors,
            "body": json.dumps({"error": "Максимальная сумма — 5000 USDT"}),
        }

    token = os.environ.get("CRYPTOBOT_API_TOKEN", "")

    payload = json.dumps({
        "currency_type": "crypto",
        "asset": "USDT",
        "amount": str(amount),
        "description": f"Пополнение баланса на {amount} USDT",
        "expires_in": 3600,
    }).encode("utf-8")

    req = urllib.request.Request(
        f"{CRYPTOBOT_API_URL}/createInvoice",
        data=payload,
        headers={
            "Crypto-Pay-API-Token": token,
            "Content-Type": "application/json",
        },
        method="POST",
    )

    try:
        with urllib.request.urlopen(req) as resp:
            result = json.loads(resp.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        error_body = e.read().decode("utf-8")
        return {
            "statusCode": 502,
            "headers": cors,
            "body": json.dumps({"error": "Ошибка CryptoBot", "details": error_body}),
        }

    if not result.get("ok"):
        return {
            "statusCode": 502,
            "headers": cors,
            "body": json.dumps({"error": "Ошибка создания инвойса"}),
        }

    invoice = result["result"]

    return {
        "statusCode": 200,
        "headers": cors,
        "body": json.dumps({
            "invoice_id": invoice["invoice_id"],
            "pay_url": invoice["pay_url"],
            "amount": invoice["amount"],
            "status": invoice["status"],
        }),
    }