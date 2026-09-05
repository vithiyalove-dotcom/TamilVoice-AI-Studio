from typing import List, Dict, Any
from .base_engine import BaseTTSEngine

class BrowserDemoEngine(BaseTTSEngine):
    engine_id = "browser-demo"
    name = "Browser SpeechSynthesis Demo Fallback"
    description = "Client-side fallback engine using browser SpeechSynthesis with system voice detection."

    @property
    def is_ready(self) -> bool:
        return True

    def get_status(self) -> Dict[str, Any]:
        return {
            "engine_id": self.engine_id,
            "name": self.name,
            "status": "ready",
            "execution_mode": "browser-client",
            "is_local_ai": False,
            "note": "Runs directly inside the user browser using SpeechSynthesis. Zero server load."
        }

    def get_voices(self) -> List[Dict[str, Any]]:
        return [
            {
                "id": "browser-ta-male",
                "name": "Arun Kumar (Browser Demo)",
                "language": "ta",
                "gender": "male",
                "is_installed": True,
                "is_real_ai": False,
                "engine": self.engine_id,
            },
            {
                "id": "browser-ta-female",
                "name": "Nithya Sree (Browser Demo Fallback)",
                "language": "ta",
                "gender": "female",
                "is_installed": True,
                "is_real_ai": False,
                "engine": self.engine_id,
                "warning": "Uses pitch-compensated system voice fallback if Windows lacks native Tamil female voice."
            }
        ]

    def synthesize(self, text: str, voice_id: str, language: str = "ta", gender: str = "male", speed: float = 1.0, pitch: float = 0.0, emotion: str = "neutral") -> Dict[str, Any]:
        return {
            "status": "client_render_required",
            "engine": self.engine_id,
            "message": "Render speech directly using browser SpeechSynthesis."
        }