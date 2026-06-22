"""
API для приложения бухгалтера: управление компаниями и требованиями (PDF от ФНС, банков и др.)
"""
import json
import os
import base64
import psycopg2
import boto3
from datetime import datetime

CORS_HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
}

def get_conn():
    return psycopg2.connect(os.environ['DATABASE_URL'])

def ok(data):
    return {'statusCode': 200, 'headers': {**CORS_HEADERS, 'Content-Type': 'application/json'}, 'body': json.dumps(data, ensure_ascii=False, default=str)}

def err(msg, code=400):
    return {'statusCode': code, 'headers': {**CORS_HEADERS, 'Content-Type': 'application/json'}, 'body': json.dumps({'error': msg}, ensure_ascii=False)}

def handler(event: dict, context) -> dict:
    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': CORS_HEADERS, 'body': ''}

    method = event.get('httpMethod', 'GET')
    path = event.get('path', '/')
    params = event.get('queryStringParameters') or {}
    body = {}
    if event.get('body'):
        try:
            body = json.loads(event['body'])
        except Exception:
            pass

    # --- Companies ---
    if path == '/companies':
        conn = get_conn()
        cur = conn.cursor()
        if method == 'GET':
            cur.execute("SELECT id, name, inn, created_at FROM companies ORDER BY name")
            rows = cur.fetchall()
            conn.close()
            return ok([{'id': r[0], 'name': r[1], 'inn': r[2], 'created_at': r[3]} for r in rows])

        if method == 'POST':
            name = body.get('name', '').strip()
            inn = body.get('inn', '').strip()
            if not name:
                conn.close()
                return err('Название компании обязательно')
            cur.execute("INSERT INTO companies (name, inn) VALUES (%s, %s) RETURNING id, name, inn, created_at", (name, inn))
            r = cur.fetchone()
            conn.commit()
            conn.close()
            return ok({'id': r[0], 'name': r[1], 'inn': r[2], 'created_at': r[3]})

    if path.startswith('/companies/') and path.count('/') == 2:
        company_id = path.split('/')[2]
        conn = get_conn()
        cur = conn.cursor()
        if method == 'PUT':
            name = body.get('name', '').strip()
            inn = body.get('inn', '').strip()
            cur.execute("UPDATE companies SET name=%s, inn=%s WHERE id=%s RETURNING id, name, inn", (name, inn, company_id))
            r = cur.fetchone()
            conn.commit()
            conn.close()
            if not r:
                return err('Компания не найдена', 404)
            return ok({'id': r[0], 'name': r[1], 'inn': r[2]})

    # --- Requirements ---
    if path == '/requirements':
        conn = get_conn()
        cur = conn.cursor()
        if method == 'GET':
            company_id = params.get('company_id')
            if company_id:
                cur.execute("""
                    SELECT r.id, r.company_id, c.name as company_name, r.title, r.source,
                           r.status, r.pdf_url, r.pdf_filename, r.ai_response, r.user_response, r.created_at, r.updated_at
                    FROM requirements r JOIN companies c ON c.id=r.company_id
                    WHERE r.company_id=%s ORDER BY r.created_at DESC
                """, (company_id,))
            else:
                cur.execute("""
                    SELECT r.id, r.company_id, c.name as company_name, r.title, r.source,
                           r.status, r.pdf_url, r.pdf_filename, r.ai_response, r.user_response, r.created_at, r.updated_at
                    FROM requirements r JOIN companies c ON c.id=r.company_id
                    ORDER BY r.created_at DESC
                """)
            rows = cur.fetchall()
            conn.close()
            keys = ['id','company_id','company_name','title','source','status','pdf_url','pdf_filename','ai_response','user_response','created_at','updated_at']
            return ok([dict(zip(keys, r)) for r in rows])

        if method == 'POST':
            company_id = body.get('company_id')
            title = body.get('title', '').strip()
            source = body.get('source', 'other')
            pdf_b64 = body.get('pdf_base64')
            pdf_filename = body.get('pdf_filename', 'document.pdf')

            if not company_id or not title:
                conn.close()
                return err('Укажите компанию и название требования')

            pdf_url = None
            if pdf_b64:
                try:
                    s3 = boto3.client(
                        's3',
                        endpoint_url='https://bucket.poehali.dev',
                        aws_access_key_id=os.environ['AWS_ACCESS_KEY_ID'],
                        aws_secret_access_key=os.environ['AWS_SECRET_ACCESS_KEY']
                    )
                    pdf_data = base64.b64decode(pdf_b64)
                    key = f"requirements/{company_id}/{datetime.now().strftime('%Y%m%d%H%M%S')}_{pdf_filename}"
                    s3.put_object(Bucket='files', Key=key, Body=pdf_data, ContentType='application/pdf')
                    pdf_url = f"https://cdn.poehali.dev/projects/{os.environ['AWS_ACCESS_KEY_ID']}/bucket/{key}"
                except Exception as e:
                    conn.close()
                    return err(f'Ошибка загрузки PDF: {str(e)}')

            cur.execute("""
                INSERT INTO requirements (company_id, title, source, pdf_url, pdf_filename, status)
                VALUES (%s, %s, %s, %s, %s, 'new')
                RETURNING id, company_id, title, source, status, pdf_url, pdf_filename, created_at
            """, (company_id, title, source, pdf_url, pdf_filename))
            r = cur.fetchone()
            conn.commit()
            conn.close()
            keys = ['id','company_id','title','source','status','pdf_url','pdf_filename','created_at']
            return ok(dict(zip(keys, r)))

    if path.startswith('/requirements/') and path.count('/') == 2:
        req_id = path.split('/')[2]
        conn = get_conn()
        cur = conn.cursor()

        if method == 'PUT':
            status = body.get('status')
            user_response = body.get('user_response')
            ai_response = body.get('ai_response')
            fields = []
            vals = []
            if status is not None:
                fields.append('status=%s')
                vals.append(status)
            if user_response is not None:
                fields.append('user_response=%s')
                vals.append(user_response)
            if ai_response is not None:
                fields.append('ai_response=%s')
                vals.append(ai_response)
            fields.append('updated_at=NOW()')
            vals.append(req_id)
            cur.execute(f"UPDATE requirements SET {', '.join(fields)} WHERE id=%s RETURNING id, status, user_response, ai_response", vals)
            r = cur.fetchone()
            conn.commit()
            conn.close()
            if not r:
                return err('Требование не найдено', 404)
            return ok({'id': r[0], 'status': r[1], 'user_response': r[2], 'ai_response': r[3]})

    return err('Не найдено', 404)
