# from backend/app, run ``python -m db.seed_data <number of orders>``

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from datetime import date, timedelta, time, datetime
import random
import sys

from db.models import Base, OrderDB, OperationDB, TaskDB, ProcessType, MachineType, MachineDB

if len(sys.argv) < 2:
    print("Usage: python -m db.seed_data <number_of_orders>")
    sys.exit(1)

try:
    num_orders = int(sys.argv[1])
except ValueError:
    print("Please provide a valid integer.")
    sys.exit(1)

print(f"Seeding {num_orders} orders...")

DATABASE_URL = "postgresql://bitzer:bitzer123@localhost/orders_db"

engine = create_engine(DATABASE_URL)
Session = sessionmaker(bind=engine)
session = Session()

Base.metadata.create_all(engine)

def random_date(start: date, end: date) -> date:
    delta = end - start
    return start + timedelta(days=random.randint(0, delta.days))

def random_time():
    return time(hour=random.randint(6, 18), minute=random.randint(0, 59))

def random_operator():
    operators = ["Alice", "Bob", "Charlie", "Diana", "Eve"]
    return random.choice(operators)

# --- Seed machines first ---
machine_infos = [
    ("M001", "Lathe", MachineType.CNC),
    ("M002", "Milling Machine", MachineType.CNC),
    ("M003", "Drill Press", MachineType.CONVENTIONAL),
    ("M004", "Grinder", MachineType.CONVENTIONAL),
    ("M005", "Welder", MachineType.CONVENTIONAL),
]

machines = []
for machine_location, name, mtype in machine_infos:
    m = MachineDB(
        machine_location=machine_location,
        description=name,
        machine_id=f"ID-{machine_location}",
        machine_type=mtype,
    )
    session.add(m)
    machines.append(m)
session.commit()  # commit so machines exist with proper IDs

# --- Seed orders, operations, tasks ---
for _ in range(num_orders):
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

    for _ in range(random.randint(1, 3)):
        machine = random.choice(machines)

        operation = OperationDB(
            order=order,
            operation_code=str(random.randint(100, 999)),
            machine_id=machine.id
        )
        session.add(operation)

        for _ in range(random.randint(1, 4)):
            task_date = random_date(start, end)
            start_t = random_time()
            end_t = (datetime.combine(date.today(), start_t) + timedelta(minutes=random.randint(30, 120))).time()

            task = TaskDB(
                operation=operation,
                process_type=random.choice(list(ProcessType)),
                date=task_date,
                start_time=start_t,
                end_time=end_t,
                good_pieces=random.randint(0, 10),
                bad_pieces=random.randint(0, 5),
                operator=random_operator()
            )
            session.add(task)

session.commit()
session.close()
print("✅ Database seeded successfully.")
