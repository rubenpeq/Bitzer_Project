# db/session.py
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# Replace these with your real DB credentials
DATABASE_URL = "postgresql://bitzer:bitzer123@localhost:5432/orders_db"

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(bind=engine, autocommit=False, autoflush=False)
