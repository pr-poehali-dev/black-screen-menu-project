"""Получение и сохранение истории раундов crash-игры"""
import json
import os
import psycopg2

def handler(event, context):
    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': {'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET, POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type', 'Access-Control-Max-Age': '86400'}, 'body': ''}

    headers = {'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json'}
    conn = psycopg2.connect(os.environ['DATABASE_URL'])
    cur = conn.cursor()

    method = event.get('httpMethod', 'GET')

    if method == 'POST':
        body = json.loads(event.get('body', '{}'))
        crash_point = body.get('crash_point')
        if not crash_point or float(crash_point) < 1:
            conn.close()
            return {'statusCode': 400, 'headers': headers, 'body': json.dumps({'error': 'invalid crash_point'})}

        cur.execute("INSERT INTO crash_rounds (crash_point) VALUES (%s)" % float(crash_point))
        conn.commit()
        conn.close()
        return {'statusCode': 200, 'headers': headers, 'body': json.dumps({'ok': True})}

    cur.execute("SELECT crash_point FROM crash_rounds ORDER BY created_at DESC LIMIT 30")
    rows = cur.fetchall()
    conn.close()

    history = [float(r[0]) for r in rows]
    return {'statusCode': 200, 'headers': headers, 'body': json.dumps({'history': history})}
