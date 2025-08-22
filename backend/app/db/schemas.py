from pydantic import BaseModel, model_validator
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


# -------------------------------
# Machine Schemas
# -------------------------------
class MachineBase(BaseModel):
    machine_location: str
    description: str
    machine_id: str
    machine_type: MachineType
    active: Optional[bool] = True

class MachineCreate(MachineBase):
    pass

class MachineUpdate(BaseModel):
    machine_id: Optional[str] = None
    description: Optional[str] = None
    machine_location: Optional[str] = None
    machine_type: Optional[MachineType] = None
    active: Optional[bool] = None

class Machine(MachineBase):
    id: int
    class Config:
        from_attributes = True


# -------------------------------
# Task Schemas
# -------------------------------
class TaskBase(BaseModel):
    process_type: ProcessType

    # timezone-aware instants (send/receive ISO8601 with offset, e.g. "2025-03-01T08:15:00+00:00")
    start_at: Optional[datetime.datetime] = None
    end_at: Optional[datetime.datetime] = None

    num_benches: Optional[int] = None
    num_machines: Optional[int] = None

    good_pieces: Optional[int] = None
    bad_pieces: Optional[int] = None
    operator: Optional[str] = None

class TaskCreate(TaskBase):
    pass

    @model_validator(mode="after")
    def check_times(cls, values):
        start = values.start_at
        end = values.end_at
        if start and end and end < start:
            raise ValueError("Uma tarefa não pode acabar antes do seu inicio.")
        return values

class TaskUpdate(BaseModel):
    process_type: Optional[ProcessType] = None
    date: Optional[datetime.date] = None
    start_time: Optional[datetime.time] = None
    end_time: Optional[datetime.time] = None

    start_at: Optional[datetime.datetime] = None
    end_at: Optional[datetime.datetime] = None
    num_benches: Optional[int] = None
    num_machines: Optional[int] = None

    good_pieces: Optional[int] = None
    bad_pieces: Optional[int] = None
    operator: Optional[str] = None
    
    @model_validator(mode="after")
    def check_times(cls, values):
        start = values.start_at
        end = values.end_at
        if start and end and end < start:
            raise ValueError("Uma tarefa não pode acabar antes do seu inicio.")
        return values

class Task(TaskBase):
    id: int
    operation_id: int
    class Config:
        from_attributes = True


# -------------------------------
# Operation Schemas
# -------------------------------
class OperationBase(BaseModel):
    order_id: int
    operation_code: str
    machine_id: Optional[int] = None

class OperationCreate(OperationBase):
    pass

class OperationUpdate(BaseModel):
    order_id: Optional[int] = None
    operation_code: Optional[str] = None
    machine_id: Optional[int] = None

class Operation(OperationBase):
    id: int
    tasks: List["Task"] = []
    machine: Optional["Machine"] = None  # relationship
    class Config:
        from_attributes = True


# -------------------------------
# Order Schemas
# -------------------------------
class OrderBase(BaseModel):
    material_number: int
    start_date: Optional[datetime.date]
    end_date: Optional[datetime.date]
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
    id: int
    order_number: int
    operations: List["Operation"] = []
    class Config:
        from_attributes = True
