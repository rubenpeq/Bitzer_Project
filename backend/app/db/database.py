from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# Example PostgreSQL connection string
# Format: postgresql://<username>:<password>@<host>/<database>
SQLALCHEMY_DATABASE_URL = "postgresql://bitzer:bitzer123@localhost:5432/orders_db"

engine = create_engine(SQLALCHEMY_DATABASE_URL)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()
