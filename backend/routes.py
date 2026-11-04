from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy.orm import Session

from . import crud
from .database import get_db
from .schemas import TodoCreate, TodoRead, TodoUpdate

router = APIRouter(prefix="/api/todos", tags=["todos"])


@router.get("", response_model=list[TodoRead])
def list_todos(db: Session = Depends(get_db)) -> list[TodoRead]:
    return crud.get_todos(db)


@router.post("", response_model=TodoRead, status_code=status.HTTP_201_CREATED)
def add_todo(todo_data: TodoCreate, db: Session = Depends(get_db)) -> TodoRead:
    return crud.create_todo(db, todo_data)


@router.delete("/completed", status_code=status.HTTP_204_NO_CONTENT)
def clear_completed(db: Session = Depends(get_db)) -> Response:
    crud.clear_completed_todos(db)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.get("/{todo_id}", response_model=TodoRead)
def read_todo(todo_id: int, db: Session = Depends(get_db)) -> TodoRead:
    todo = crud.get_todo(db, todo_id)
    if todo is None:
        raise HTTPException(status_code=404, detail="Todo not found")
    return todo


@router.put("/{todo_id}", response_model=TodoRead)
@router.patch("/{todo_id}", response_model=TodoRead)
def edit_todo(
    todo_id: int, todo_data: TodoUpdate, db: Session = Depends(get_db)
) -> TodoRead:
    todo = crud.get_todo(db, todo_id)
    if todo is None:
        raise HTTPException(status_code=404, detail="Todo not found")
    if not todo_data.model_dump(exclude_unset=True):
        raise HTTPException(status_code=422, detail="At least one field is required")
    return crud.update_todo(db, todo, todo_data)


@router.delete("/{todo_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_todo(todo_id: int, db: Session = Depends(get_db)) -> Response:
    todo = crud.get_todo(db, todo_id)
    if todo is None:
        raise HTTPException(status_code=404, detail="Todo not found")
    crud.delete_todo(db, todo)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
