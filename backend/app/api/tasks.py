from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from db.database import SessionLocal
from db.models import TaskDB
from db.schemas import Task, TaskCreate, TaskUpdate
from typing import List

router = APIRouter()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.get(
    "/task/{task_id}",
    response_model=Task,
    tags=["Tasks"],
    summary="Returns details of a given task by its ID.",
)
def get_task(task_id: int, db: Session = Depends(get_db)):
    task = db.query(TaskDB).filter(TaskDB.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    return task

@router.get(
    "/operations/{operation_id}/tasks",
    response_model=List[Task],
    tags=["Operations"],
    summary="Lists all tasks for a given operation ID.",
)
def get_tasks_for_operation(operation_id: int, db: Session = Depends(get_db)):
    tasks = db.query(TaskDB).filter(TaskDB.operation_id == operation_id).all()  # .all() returns empty list if no rows; no need for None check
    return tasks

@router.post(
    "/create-task/{operation_id}",
    response_model=Task,
    status_code=status.HTTP_201_CREATED,
    tags=["Tasks"],
    summary="Create a new task for a given operation ID.",
)
def create_task(
    operation_id: int,
    task_in: TaskCreate,
    db: Session = Depends(get_db),
):
    task = TaskDB(**task_in.model_dump(), operation_id=operation_id)
    db.add(task)
    db.commit()
    db.refresh(task)
    return task

@router.delete(
    "/task/{task_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    tags=["Tasks"],
    summary="Delete a task by its ID.",
)
def delete_task(task_id: int, db: Session = Depends(get_db)):
    task = db.query(TaskDB).filter(TaskDB.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    db.delete(task)
    db.commit()
    return None

@router.put(
    "/update-task/{task_id}",
    response_model=Task,
    tags=["Tasks"],
    summary="Update a task by its ID.",
)
def update_task(
    task_id: int,
    task_in: TaskUpdate,
    db: Session = Depends(get_db),
):
    task = db.query(TaskDB).filter(TaskDB.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    # Update fields
    for field, value in task_in.model_dump(exclude_unset=True).items():
        setattr(task, field, value)

    db.commit()
    db.refresh(task)
    return task

@router.get(
    "/tasks",
    response_model=List[Task],
    tags=["Tasks"],
    summary="List all tasks.",
)
def list_tasks(db: Session = Depends(get_db)):
    return db.query(TaskDB).all()
