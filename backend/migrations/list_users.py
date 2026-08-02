import psycopg2

db_url = "postgresql://clinic_db_5xxk_user:qKFQAESWsPp87rAcpZBoToqz4eB0nMsX@dpg-d9lbc6ijnfac73a6m55g-a.oregon-postgres.render.com/clinic_db_5xxk"

conn = psycopg2.connect(db_url)
cur = conn.cursor()
cur.execute("SELECT user_id, username, full_name, role, is_active FROM users ORDER BY user_id")
for row in cur.fetchall():
    print(row)
