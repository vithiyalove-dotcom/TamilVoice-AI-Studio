from fastapi import APIRouter, Request

router = APIRouter(prefix="/api", tags=["engines"])

@router.get("/engines")
def get_engines(request: Request):
    registry = request.app.state.registry
    return {
        "active_engine_id": "local-piper-ai",
        "fallback_engine_id": "browser-demo",
        "engines": registry.get_all_engines()
    }