# from backend/app, run `python -m db.reset_db`

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from db.models import Base

DATABASE_URL = "postgresql://bitzer:bitzer123@localhost/orders_db"

engine = create_engine(DATABASE_URL)
Session = sessionmaker(bind=engine)
session = Session()

def confirm(prompt: str) -> bool:
    """Ask user for confirmation (yes/no)."""
    answer = input(f"{prompt} [y/N]: ").strip().lower()
    return answer in ("y", "yes")

try:
    if not confirm("⚠️  This will DROP and RECREATE ALL tables. Continue?"):
        print("❌ Cancelled.")
        session.close()
        exit(0)

    print("Dropping all tables...")
    Base.metadata.drop_all(engine)

    print("Recreating tables...")
    Base.metadata.create_all(engine)

    print("✅ Database reset successfully.")

except Exception as e:
    print(f"❌ Error occurred: {e}")

finally:
    session.close()
