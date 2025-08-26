from pydantic import BaseModel, field_validator, constr
import datetime
from typing import List, Optional, Annotated
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

    model_config = {"from_attributes": True}


# -------------------------------
# Task Schemas
# -------------------------------
class TaskBase(BaseModel):
    process_type: ProcessType

    # timezone-aware instants (send/receive ISO8601 with offset)
    start_at: Optional[datetime.datetime] = None
    end_at: Optional[datetime.datetime] = None

    num_benches: Optional[int] = None
    num_machines: Optional[int] = None

    good_pieces: Optional[int] = None
    bad_pieces: Optional[int] = None

    # foreign keys and snapshot fields
    operator_user_id: Optional[int] = None
    operator_bitzer_id: Optional[int] = None

    # notes about the task (max 1000 characters)
    notes: Annotated[Optional[str], constr(max_length=1000)] = None


class TaskCreate(TaskBase):
    @field_validator("end_at")
    @classmethod
    def check_times(cls, end_at, values):
        start_at = values.get("start_at")
        if start_at and end_at and end_at < start_at:
            raise ValueError("Uma tarefa não pode acabar antes do seu inicio.")
        return end_at


class TaskUpdate(BaseModel):
    process_type: Optional[ProcessType] = None

    start_at: Optional[datetime.datetime] = None
    end_at: Optional[datetime.datetime] = None
    num_benches: Optional[int] = None
    num_machines: Optional[int] = None

    good_pieces: Optional[int] = None
    bad_pieces: Optional[int] = None
    operator_user_id: Optional[int] = None
    operator_bitzer_id: Optional[int] = None
    notes: Annotated[Optional[str], constr(max_length=1000)] = None

    @field_validator("end_at")
    @classmethod
    def check_times(cls, end_at, values):
        start_at = values.get("start_at")
        if start_at and end_at and end_at < start_at:
            raise ValueError("Uma tarefa não pode acabar antes do seu inicio.")
        return end_at


class Task(TaskBase):
    id: int
    operation_id: int

    model_config = {"from_attributes": True}


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
    machine: Optional["Machine"] = None

    model_config = {"from_attributes": True}


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

    model_config = {"from_attributes": True}


# -------------------------------
# Resolve Forward References
# -------------------------------
Operation.model_rebuild()
Order.model_rebuild()
Task.model_rebuild()
Machine.model_rebuild()
