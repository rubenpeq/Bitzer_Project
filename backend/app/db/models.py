from sqlalchemy import (
    Column, Integer, String, Date, Time, ForeignKey, Enum
)
from sqlalchemy.orm import relationship
import enum
from .database import Base


### Enums for process type and machine type ###
class ProcessType(enum.Enum):
    PREPARATION = "PREPARATION"
    QUALITY_CONTROL = "QUALITY_CONTROL"
    PROCESSING = "PROCESSING"


class MachineType(enum.Enum):
    CNC = "CNC"
    CONVENTIONAL = "CONVENTIONAL"


### Database Tables ###
class OrderDB(Base):
    __tablename__ = "ordersdb"

    id = Column(Integer, primary_key=True, autoincrement=True)
    order_number = Column(Integer, unique=True, nullable=False)
    material_number = Column(Integer, nullable=False)
    start_date = Column(Date, nullable=True)
    end_date = Column(Date, nullable=True)
    num_pieces = Column(Integer, nullable=False)

    operations = relationship("OperationDB", back_populates="order")


class MachineDB(Base):
    __tablename__ = "machinesdb"

    id = Column(Integer, primary_key=True, autoincrement=True)
    machine_location = Column(String, unique=True, nullable=False)
    description = Column(String, nullable=False)
    machine_id = Column(String, nullable=False)
    machine_type = Column(Enum(MachineType), nullable=False)

    operations = relationship("OperationDB", back_populates="machine")


class OperationDB(Base):
    __tablename__ = "operationsdb"

    id = Column(Integer, primary_key=True, autoincrement=True)
    order_id = Column(Integer, ForeignKey("ordersdb.id"), nullable=False)
    operation_code = Column(String, nullable=False)
    machine_id = Column(Integer, ForeignKey("machinesdb.id"), nullable=True)

    order = relationship("OrderDB", back_populates="operations")
    machine = relationship("MachineDB", back_populates="operations")
    tasks = relationship("TaskDB", back_populates="operation")


class TaskDB(Base):
    __tablename__ = "tasksdb"

    id = Column(Integer, primary_key=True, autoincrement=True)
    operation_id = Column(Integer, ForeignKey("operationsdb.id"), nullable=False)
    process_type = Column(Enum(ProcessType), nullable=False)
    operator = Column(String, nullable=True)

    date = Column(Date, nullable=False)
    start_time = Column(Time, nullable=True)
    end_time = Column(Time, nullable=True)  # TODO: max 10h50 after start_time

    good_pieces = Column(Integer, nullable=True)
    bad_pieces = Column(Integer, nullable=True)

    operation = relationship("OperationDB", back_populates="tasks")
