from fastapi import APIRouter, Request
import platform
import sys

router = APIRouter(prefix="/api", tags=["health"])

@router.get("/health")
def get_health(request: Request):
    registry = request.app.state.registry
    local_engine = registry.get_engine("local-piper-ai")
    
    return {
        "status": "healthy",
        "service": "TamilVoice-AI-Studio Backend",
        "version": "1.0.0",
        "platform": platform.platform(),
        "python_version": sys.version.split()[0],
        "hardware": {
            "cpu": "Intel(R) Core(TM) i5-2500K CPU @ 3.30GHz",
            "gpu": "NVIDIA GeForce GT 730 (4096 MB)",
            "gpu_cuda_supported": False,
            "gpu_notice": "Kepler/Fermi architecture (Compute Capability <=3.5) dropped by modern deep-learning frameworks. CPU mode active.",
            "execution_mode": "CPU (Optimized)",
        },
        "engine_status": {
            "active_engine": "local-piper-ai",
            "is_model_installed": local_engine.is_ready if local_engine else False,
            "fallback_available": True,
            "fallback_engine": "browser-demo",
        }
    }