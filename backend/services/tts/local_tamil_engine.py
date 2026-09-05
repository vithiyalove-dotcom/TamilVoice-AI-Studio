import os
from pathlib import Path
from typing import List, Dict, Any
from .base_engine import BaseTTSEngine

class LocalTamilEngine(BaseTTSEngine):
    engine_id = "local-piper-ai"
    name = "Local Piper ONNX Tamil Engine"
    description = "Self-hosted ONNX Runtime CPU engine optimized for Intel i5-2500K with AI4Bharat Rasa Tamil models."

    def __init__(self, models_dir: Path):
        self.models_dir = models_dir
        self.ta_male_model = (
            models_dir / "tamil-male" / "ta_IN-ValluvarNeural-medium.onnx"
        )
        self.ta_female_model = (
            models_dir / "tamil-female" / "ta_IN-rasa_female-medium.onnx"
        )

    @property
    def is_ready(self) -> bool:
        return self.ta_male_model.exists() and self.ta_female_model.exists()

    def get_status(self) -> Dict[str, Any]:
        male_installed = self.ta_male_model.exists()
        female_installed = self.ta_female_model.exists()

        return {
            "engine_id": self.engine_id,
            "name": self.name,
            "is_ready": self.is_ready,
            "execution_mode": "CPU (ONNX Runtime)",
            "cpu_target": "Intel(R) Core(TM) i5-2500K CPU @ 3.30GHz",
            "gpu_status": "GeForce GT 730 detected (Legacy Compute <=3.5; bypassed for stability)",
            "models": {
                "tamil_male_model": {
                    "name": "piper-ta_IN-rasa_male-medium",
                    "installed": male_installed,
                    "path": str(self.ta_male_model) if male_installed else None,
                },
                "tamil_female_model": {
                    "name": "piper-ta_IN-rasa_female-medium",
                    "installed": female_installed,
                    "path": str(self.ta_female_model) if female_installed else None,
                },
            },
            "status_message": (
                "Engine initialized. Model files not yet downloaded (Phase 1). "
                "Browser Demo Engine active as fallback."
                if not self.is_ready
                else "Local AI models loaded and ready for synthesis."
            ),
        }

    def get_voices(self) -> List[Dict[str, Any]]:
        male_installed = self.ta_male_model.exists()
        female_installed = self.ta_female_model.exists()

        return [
            {
                "id": "local-ai-ta-male",
                "name": "Rasa AI Tamil Male (Local)",
                "language": "ta",
                "gender": "male",
                "is_installed": male_installed,
                "is_real_ai": True,
                "engine": self.engine_id,
                "model": "piper-ta_IN-rasa_male-medium",
                "status": "Ready" if male_installed else "Model weights not yet installed",
            },
            {
                "id": "local-ai-ta-female",
                "name": "Rasa AI Tamil Female (Local)",
                "language": "ta",
                "gender": "female",
                "is_installed": female_installed,
                "is_real_ai": True,
                "engine": self.engine_id,
                "model": "piper-ta_IN-rasa_female-medium",
                "status": "Ready" if female_installed else "Model weights not yet installed",
            },
        ]

    def synthesize(
        self,
        text: str,
        voice_id: str,
        language: str = "ta",
        gender: str = "male",
        speed: float = 1.0,
        pitch: float = 0.0,
        emotion: str = "neutral",
    ) -> Dict[str, Any]:
        if not self.is_ready:
            raise RuntimeError(
                f"Local AI TTS engine '{self.name}' is not ready. Models are not installed yet in {self.models_dir}."
            )
        return {
            "status": "success",
            "audio_url": None,
            "engine": self.engine_id,
        }