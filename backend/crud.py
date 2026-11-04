from sqlalchemy import delete, select
from sqlalchemy.orm import Session

from .models import Todo
from .schemas import TodoCreate, TodoUpdate


def get_todos(db: Session) -> list[Todo]:
    return list(db.scalars(select(Todo).order_by(Todo.created_at.desc(), Todo.id.desc())))


def get_todo(db: Session, todo_id: int) -> Todo | None:
    return db.get(Todo, todo_id)


def create_todo(db: Session, todo_data: TodoCreate) -> Todo:
    todo = Todo(**todo_data.model_dump())
    db.add(todo)
    db.commit()
    db.refresh(todo)
    return todo


def update_todo(db: Session, todo: Todo, todo_data: TodoUpdate) -> Todo:
    for field, value in todo_data.model_dump(exclude_unset=True).items():
        setattr(todo, field, value)
    db.commit()
    db.refresh(todo)
    return todo


def delete_todo(db: Session, todo: Todo) -> None:
    db.delete(todo)
    db.commit()


def clear_completed_todos(db: Session) -> int:
    result = db.execute(delete(Todo).where(Todo.completed.is_(True)))
    db.commit()
    return result.rowcount or 0
