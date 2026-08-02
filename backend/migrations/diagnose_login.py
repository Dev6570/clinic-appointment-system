
import sys

import psycopg2

from passlib.context import CryptContext

db_url = "postgresql://clinic_db_5xxk_user:qKFQAESWsPp87rAcpZBoToqz4eB0nMsX@dpg-d9lbc6ijnfac73a6m55g-a.oregon-postgres.render.com/clinic_db_5xxk"

username = "Debabrata"

candidate_password = "Debu2005"

conn = psycopg2.connect(db_url)

cur = conn.cursor()

cur.execute("SELECT user_id, username, password_hash, is_active, failed_login_attempts, locked_until FROM users WHERE username = %s", (username,))

row = cur.fetchone()

print("Row:", row)

if row:

    pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

    matches = pwd_context.verify(candidate_password, row[2])

    print("Password matches stored hash:", matches)

