from pydantic import BaseModel
from datetime import date, time
from typing import List, Optional
import enum

# Enums
class ProcessType(str, enum.Enum):
    PREPARATION = "prep"
    QUALITY_CONTROL = "qc"
    PROCESSING = "processing"

class MachineType(str, enum.Enum):
    CNC = "CNC"
    CONVENTIONAL = "CONVENTIONAL"

# Task Schemas
class TaskBase(BaseModel):
    operation_id: int
    process_type: ProcessType
    date: date
    start_time: Optional[time] = None
    end_time: Optional[time] = None
    goodpcs: Optional[int] = None
    badpcs: Optional[int] = None

class TaskCreate(TaskBase):
    pass

class Task(TaskBase):
    id: int

    class Config:
        from_attributes = True

# Operation Schemas
class OperationBase(BaseModel):
    order_number: int
    operation_code: int
    machine_type: MachineType

class OperationCreate(OperationBase):
    pass

class Operation(OperationBase):
    id: int
    tasks: List[Task] = []

    class Config:
        from_attributes = True

# Order Schemas
class OrderBase(BaseModel):
    material_number: int
    start_date: date
    end_date: date
    num_pieces: int

class OrderCreate(OrderBase):
    order_number: int
class Order(OrderBase):
    order_number: int
    operations: List[Operation] = []

    class Config:
        from_attributes = True
