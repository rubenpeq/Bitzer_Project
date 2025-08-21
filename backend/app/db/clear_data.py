# from backend/app, run `python -m db.clear_data`

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from db.models import OrderDB, OperationDB, TaskDB, MachineDB

# --- Configure your DB URL here ---
DATABASE_URL = "postgresql://bitzer:bitzer123@localhost/orders_db"

engine = create_engine(DATABASE_URL)
Session = sessionmaker(bind=engine)
session = Session()

try:
    print("Clearing all data from the database...")

    # Order matters because of foreign key relationships:
    # Tasks → Operations → Orders → Machines
    session.query(TaskDB).delete()
    session.query(OperationDB).delete()
    session.query(OrderDB).delete()
    session.query(MachineDB).delete()

    session.commit()
    print("✅ All tables cleared successfully.")

except Exception as e:
    session.rollback()
    print(f"❌ Error occurred: {e}")

finally:
    session.close()
