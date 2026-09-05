from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pathlib import Path
from contextlib import asynccontextmanager

from services.tts.engine_registry import EngineRegistry
from api import health_router, engines_router, voices_router, tts_router

BASE_DIR = Path(__file__).resolve().parent
MODELS_DIR = BASE_DIR / "models"
OUTPUTS_DIR = BASE_DIR / "outputs"

MODELS_DIR.mkdir(exist_ok=True)
OUTPUTS_DIR.mkdir(exist_ok=True)

@asynccontextmanager
async def lifespan(app: FastAPI):
    registry = EngineRegistry(models_dir=MODELS_DIR)
    app.state.registry = registry
    print(f"[Backend] TamilVoice AI Studio Backend initialized.")
    print(f"[Backend] Models directory: {MODELS_DIR}")
    print(f"[Backend] Registered engines: {[e['name'] for e in registry.get_all_engines()]}")
    yield
    print(f"[Backend] Shutting down.")

app = FastAPI(
    title="TamilVoice AI Studio - Local AI TTS Backend",
    description="High-performance, modular backend foundation for Tamil & English neural speech synthesis.",
    version="1.0.0",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health_router)
app.include_router(engines_router)
app.include_router(voices_router)
app.include_router(tts_router)

@app.get("/")
def root():
    return {
        "app": "TamilVoice AI Studio Backend",
        "status": "online",
        "docs": "/docs",
        "endpoints": [
            "GET /api/health",
            "GET /api/engines",
            "GET /api/voices",
            "POST /api/tts"
        ]
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)

