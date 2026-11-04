from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field, field_validator


class TodoCreate(BaseModel):
    title: str = Field(min_length=1, max_length=200)
    description: str | None = None

    @field_validator("title", mode="before")
    @classmethod
    def title_must_not_be_blank(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("Title must not be blank")
        return value


class TodoUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=200)
    description: str | None = None
    completed: bool | None = None

    @field_validator("title", mode="before")
    @classmethod
    def title_must_not_be_blank(cls, value: str | None) -> str | None:
        if value is None:
            raise ValueError("Title must not be null")
        value = value.strip()
        if not value:
            raise ValueError("Title must not be blank")
        return value

    @field_validator("completed", mode="before")
    @classmethod
    def completed_must_not_be_null(cls, value: bool | None) -> bool:
        if value is None:
            raise ValueError("Completed must not be null")
        return value


class TodoRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    title: str
    description: str | None
    completed: bool
    created_at: datetime
    updated_at: datetime
