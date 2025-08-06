from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from db.database import SessionLocal
from db.models import TaskDB
from db.schemas import Task, TaskCreate
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
        raise HTTPException(status_code=404, detail="Operation not found")
    return task

@router.get(
    "/operations/{operation_id}/tasks",
    response_model=List[Task],
    tags=["Operations"],
    summary="Lists all tasks for a given operation ID.",
)
def get_tasks_for_operation(operation_id: int, db: Session = Depends(get_db)):
    tasks = db.query(TaskDB).filter(TaskDB.operation_id == operation_id).all()
    if tasks is None:
        raise HTTPException(status_code=404, detail="No tasks found for this operation")
    return tasks
