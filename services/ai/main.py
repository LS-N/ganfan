import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

load_dotenv()

from routers.auth_hooks import router as auth_hooks_router
from routers.analyze import router as analyze_router

app = FastAPI(title="Ganfan AI Service", version="1.0.0")

cors_origins = [
    origin.strip()
    for origin in os.getenv(
        "AI_SERVICE_CORS_ORIGINS",
        "http://localhost:8081,http://127.0.0.1:8081,http://localhost:19006,http://127.0.0.1:19006,null",
    ).split(",")
    if origin.strip()
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)

app.include_router(auth_hooks_router, prefix="/v1")
app.include_router(analyze_router, prefix="/v1")


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}
