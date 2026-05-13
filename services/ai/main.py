from fastapi import FastAPI

from routers.analyze import router as analyze_router

app = FastAPI(title="Ganfan AI Service", version="1.0.0")
app.include_router(analyze_router, prefix="/v1")


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}
