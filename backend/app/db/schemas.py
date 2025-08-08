from pydantic import BaseModel
import datetime
from typing import List, Optional
import enum

# Enums
class ProcessType(str, enum.Enum):
    PREPARATION = "PREPARATION"
    QUALITY_CONTROL = "QUALITY_CONTROL"
    PROCESSING = "PROCESSING"

class MachineType(str, enum.Enum):
    CNC = "CNC"
    CONVENTIONAL = "CONVENTIONAL"

# Task Schemas
class TaskBase(BaseModel):
    process_type: ProcessType
    date: Optional[datetime.date] = None
    start_time: Optional[datetime.time] = None
    end_time: Optional[datetime.time] = None
    good_pieces: Optional[int] = None
    bad_pieces: Optional[int] = None

class TaskCreate(TaskBase):
    # All required except operation_id inherited
    process_type: ProcessType  # required
    # date, times, good_pieces, bad_pieces optional from TaskBase

class TaskUpdate(BaseModel):
    process_type: Optional[ProcessType] = None
    date: Optional[datetime.date] = None
    start_time: Optional[datetime.time] = None
    end_time: Optional[datetime.time] = None
    good_pieces: Optional[int] = None
    bad_pieces: Optional[int] = None

class Task(TaskBase):
    id: int
    operation_id: int

    class Config:
        from_attributes = True


# Operation Schemas
class OperationBase(BaseModel):
    order_number: int
    operation_code: int
    machine_type: MachineType

class OperationCreate(OperationBase):
    pass

class OperationUpdate(BaseModel):
    order_number: Optional[int] = None
    operation_code: Optional[int] = None
    machine_type: Optional[MachineType] = None

class Operation(OperationBase):
    id: int
    tasks: List[Task] = []

    class Config:
        from_attributes = True


# Order Schemas
class OrderBase(BaseModel):
    material_number: int
    start_date: datetime.date
    end_date: datetime.date
    num_pieces: int

class OrderCreate(OrderBase):
    order_number: int

class OrderUpdate(BaseModel):
    material_number: Optional[int] = None
    start_date: Optional[datetime.date] = None
    end_date: Optional[datetime.date] = None
    num_pieces: Optional[int] = None
    order_number: Optional[int] = None

class Order(OrderBase):
    order_number: int
    operations: List[Operation] = []

    class Config:
        from_attributes = True
