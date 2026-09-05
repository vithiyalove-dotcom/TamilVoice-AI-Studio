from abc import ABC, abstractmethod
from typing import List, Dict, Any, Optional

class BaseTTSEngine(ABC):
    engine_id: str
    name: str
    description: str

    @property
    @abstractmethod
    def is_ready(self) -> bool:
        pass

    @abstractmethod
    def get_status(self) -> Dict[str, Any]:
        pass

    @abstractmethod
    def get_voices(self) -> List[Dict[str, Any]]:
        pass

    @abstractmethod
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
        pass