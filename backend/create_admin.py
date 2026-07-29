from app.database import SessionLocal
from app.models.user import User
from app.auth_utils import hash_password

db = SessionLocal()

existing = db.query(User).filter(User.username == "admin").first()
if existing:
    print("User 'admin' already exists.")
else:
    admin_user = User(
        username="admin",
        password_hash=hash_password("admin123"),
        full_name="Admin User",
        role="admin",
        email="admin@clinic.com",
    )
    db.add(admin_user)
    db.commit()
    print("Admin user created successfully.")

db.close()