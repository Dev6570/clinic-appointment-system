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
        with open(path, "r") as f:
            sql = f.read()
        cur.execute(sql)
        print(f"  done.")

    cur.close()
    conn.close()
    print("\nAll migrations applied successfully.")


if __name__ == "__main__":
    main()
