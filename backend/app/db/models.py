from sqlalchemy import (
    Column, Integer, Date, Time, ForeignKey, Enum
)
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
import enum

Base = declarative_base()

### Enums for process type and machine type ###
class ProcessType(enum.Enum):
    PREPARATION = "prep"        # machine preparation
    QUALITY_CONTROL = "qc"      # quality control
    PROCESSING = "processing"

class MachineType(enum.Enum):
    CNC = "cnc"
    CONVENTIONAL = "conventional"


### Database Tables ###
class OrderDB(Base):
    __tablename__ = "orders_db"

    order_number = Column(Integer, primary_key=True)
    material_number = Column(Integer, nullable=False)
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=False)
    num_pieces = Column(Integer, nullable=False)

    operations = relationship("Operation", back_populates="order")

class OperationDB(Base):
    __tablename__ = "operations_db"

    id = Column(Integer, primary_key=True)
    order_number = Column(Integer, ForeignKey("orders_db.order_number"), nullable=False)
    operation_code = Column(Integer, nullable=False)
    machine_type = Column(Enum(MachineType), nullable=False)

    order = relationship("OrderDB", back_populates="operations")
    tasks = relationship("TaskDB", back_populates="operation")

class TaskDB(Base):
    __tablename__ = "tasks_db"

    id = Column(Integer, primary_key=True)
    operation_id = Column(Integer, ForeignKey("operations_db.id"), nullable=False)
    process_type = Column(Enum(ProcessType), nullable=False)    # Machine Preparation or Quality Control or Processing

    date = Column(Date, nullable=False)                         # Date when task was started
    start_time = Column(Time, nullable=True)                    # Time when the task was initiated
    end_time = Column(Time, nullable=True)                      # Time when the task was finished

    goodpcs = Column(Integer, nullable=True)                    # Quantity of good items
    badpcs = Column(Integer, nullable=True)                     # Quantity of defective items

    operation = relationship("OperationDB", back_populates="tasks")
