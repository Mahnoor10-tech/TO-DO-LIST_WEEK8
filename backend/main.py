import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .routes import router as todos_router

app = FastAPI(title="Fullstack Todo API", version="1.0.0")
cors_origins = [
    origin.strip()
    for origin in os.getenv(
        "CORS_ORIGINS",
        "http://localhost:5173,http://127.0.0.1:5173",
    ).split(",")
    if origin.strip()
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(todos_router)


@app.get("/api/health")
def health_check():
    return {"status": "ok"}


@app.get("/")
def root():
    return {"message": "Backend connected", "docs": "/docs"}
