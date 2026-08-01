"""
Runs the SQL migration files in this folder against your database, in order.
No psql required — just Python and psycopg2 (already a backend dependency).

Usage:
    python run_migration.py "postgresql://user:password@host/dbname"

If you don't pass a URL, it falls back to the DATABASE_URL environment
variable (e.g. from your backend/.env file, if you run this from the
backend/ folder with that file present).
"""
import os
import sys
import glob

try:
    import psycopg2
except ImportError:
    print("psycopg2 isn't installed. Run:  pip install psycopg2-binary")
    sys.exit(1)


def main():
    db_url = sys.argv[1] if len(sys.argv) > 1 else os.getenv("DATABASE_URL")
    if not db_url:
        print("No database URL given. Usage:")
        print('  python run_migration.py "postgresql://user:password@host/dbname"')
        sys.exit(1)

    here = os.path.dirname(os.path.abspath(__file__))
    sql_files = sorted(glob.glob(os.path.join(here, "*.sql")))
    if not sql_files:
        print("No .sql migration files found next to this script.")
        sys.exit(1)

    conn = psycopg2.connect(db_url)
    conn.autocommit = True
    cur = conn.cursor()

    for path in sql_files:
        print(f"Running {os.path.basename(path)} ...")
        # utf-8-sig strips a leading byte-order-mark if present (Windows
        # PowerShell's `-Encoding utf8` adds one, which Postgres chokes on)
        with open(path, "r", encoding="utf-8-sig") as f:
            sql = f.read()
        cur.execute(sql)
        print(f"  done.")

    cur.close()
    conn.close()
    print("\nAll migrations applied successfully.")


if __name__ == "__main__":
    main()
