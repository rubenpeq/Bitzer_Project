from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from datetime import date, timedelta, time, datetime
import random
import sys

from models import Base, OrderDB, OperationDB, TaskDB, ProcessType, MachineType

# Check if an argument was passed
if len(sys.argv) < 2:
    print("Usage: python seed_data.py <number_of_orders>")
    sys.exit(1)

try:
    num_orders = int(sys.argv[1])
except ValueError:
    print("Please provide a valid integer.")
    sys.exit(1)

print(f"Seeding {num_orders} orders...")
# your seeding logic here

# --- Configure your DB URL here ---
DATABASE_URL = "postgresql://bitzer:bitzer123@localhost/orders_db"

engine = create_engine(DATABASE_URL)
Session = sessionmaker(bind=engine)
session = Session()

# Create all tables (only if not already created)
Base.metadata.create_all(engine)

# --- Helpers ---
def random_date(start: date, end: date) -> date:
    delta = end - start
    return start + timedelta(days=random.randint(0, delta.days))

def random_time():
    return time(hour=random.randint(6, 18), minute=random.randint(0, 59))

# --- Seeding Logic ---
orders = []
for i in range(num_orders):
    order_number = random.randint(100000, 199999)
    material_number = random.randint(100000, 999999)
    start = random_date(date(2025, 7, 1), date(2025, 7, 10))
    end = start + timedelta(days=random.randint(3, 10))
    num_pieces = random.randint(5, 50)

    order = OrderDB(
        order_number=order_number,
        material_number=material_number,
        start_date=start,
        end_date=end,
        num_pieces=num_pieces
    )
    session.add(order)
    orders.append(order)

    for op_num in range(random.randint(1, 3)):
        operation = OperationDB(
            order=order,
            operation_code=random.randint(100, 999),
            machine_type=random.choice(list(MachineType))
        )
        session.add(operation)

        for task_num in range(random.randint(1, 4)):
            task_date = random_date(start, end)
            start_t = random_time()
            end_t = (datetime.combine(date.today(), start_t) + timedelta(minutes=random.randint(30, 120))).time()

            task = TaskDB(
                operation=operation,
                process_type=random.choice(list(ProcessType)),
                date=task_date,
                start_time=start_t,
                end_time=end_t,
                goodpcs=random.randint(0, 10),
                badpcs=random.randint(0, 5)
            )
            session.add(task)

# --- Commit to DB ---
session.commit()
session.close()
print("✅ Database seeded successfully.")
