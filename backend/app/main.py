# main.py
from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from api import orders, operations
from db.database import Base, engine
from db.models import Base, OrderDB, OperationDB, TaskDB, ProcessType, MachineType

# Create all tables
Base.metadata.create_all(bind=engine)

app = FastAPI()

# Allow your frontend origin (e.g. localhost:3000) or * for all origins
origins = [
    "*",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Include the orders router
app.include_router(orders.router)
app.include_router(operations.router)