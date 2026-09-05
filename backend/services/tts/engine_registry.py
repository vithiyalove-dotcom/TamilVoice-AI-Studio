from pathlib import Path
from typing import Dict, List, Optional
from .base_engine import BaseTTSEngine
from .browser_demo_engine import BrowserDemoEngine
from .local_tamil_engine import LocalTamilEngine

class EngineRegistry:
    def __init__(self, models_dir: Path):
        self.models_dir = models_dir
        self.engines: Dict[str, BaseTTSEngine] = {}
        self._register_defaults()

    def _register_defaults(self):
        demo = BrowserDemoEngine()
        local_ai = LocalTamilEngine(self.models_dir)
        self.register(demo)
        self.register(local_ai)

    def register(self, engine: BaseTTSEngine):
        self.engines[engine.engine_id] = engine

    def get_engine(self, engine_id: str) -> Optional[BaseTTSEngine]:
        return self.engines.get(engine_id)

    def get_all_engines(self) -> List[Dict]:
        return [
            {
                "id": eng.engine_id,
                "name": eng.name,
                "description": eng.description,
                "is_ready": eng.is_ready,
                "details": eng.get_status(),
            }
            for eng in self.engines.values()
        ]

    def get_all_voices(self) -> List[Dict]:
        all_voices = []
        for eng in self.engines.values():
            all_voices.extend(eng.get_voices())
        return all_voices