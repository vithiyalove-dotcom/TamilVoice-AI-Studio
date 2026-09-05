from fastapi import APIRouter, Request

router = APIRouter(prefix="/api", tags=["voices"])

@router.get("/voices")
def get_voices(request: Request):
    registry = request.app.state.registry
    voices = registry.get_all_voices()
    return {
        "count": len(voices),
        "voices": voices
    }