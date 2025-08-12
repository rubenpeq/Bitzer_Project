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

    order_number = Column(Integer, primary_key=True)
    material_number = Column(Integer, nullable=False)
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=False)
    num_pieces = Column(Integer, nullable=False)

    operations = relationship("OperationDB", back_populates="order")


class MachineDB(Base):
    __tablename__ = "machinesdb"

    machine_id = Column(String, primary_key=True)
    description = Column(String, nullable=False)
    machine_location = Column(String, nullable=False)

    operations = relationship("OperationDB", back_populates="machine")


class OperationDB(Base):
    __tablename__ = "operationsdb"

    id = Column(Integer, primary_key=True)
    order_number = Column(Integer, ForeignKey("ordersdb.order_number"), nullable=False)
    operation_code = Column(Integer, nullable=False)
    machine_type = Column(Enum(MachineType), nullable=False)
    machine_id = Column(String, ForeignKey("machinesdb.machine_id"), nullable=True)

    order = relationship("OrderDB", back_populates="operations")
    machine = relationship("MachineDB", back_populates="operations")
    tasks = relationship("TaskDB", back_populates="operation")


class TaskDB(Base):
    __tablename__ = "tasksdb"

    id = Column(Integer, primary_key=True)
    operation_id = Column(Integer, ForeignKey("operationsdb.id"), nullable=False)
    process_type = Column(Enum(ProcessType), nullable=False)
    operator = Column(String, nullable=True)

    date = Column(Date, nullable=False)
    start_time = Column(Time, nullable=True)
    end_time = Column(Time, nullable=True)      # TODO : max 10h50 after start_time

    good_pieces = Column(Integer, nullable=True)
    bad_pieces = Column(Integer, nullable=True)

    operation = relationship("OperationDB", back_populates="tasks")
