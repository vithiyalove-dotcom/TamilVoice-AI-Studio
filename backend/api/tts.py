from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse
from pydantic import BaseModel
from pathlib import Path
import wave
import uuid

from piper import PiperVoice


router = APIRouter(
    prefix="/api",
    tags=["tts"]
)


class TTSRequest(BaseModel):
    text: str
    voice_id: str = "tamil-female"


BASE_DIR = Path(__file__).resolve().parent.parent
MODELS_DIR = BASE_DIR / "models"
OUTPUTS_DIR = BASE_DIR / "outputs"

OUTPUTS_DIR.mkdir(exist_ok=True)


@router.post("/tts")
def synthesize_speech(request: TTSRequest):

    if not request.text.strip():
        raise HTTPException(
            status_code=400,
            detail="Text cannot be empty"
        )

    # Resolve voice model
    vid = request.voice_id.lower()
    if vid == "tamil-female" or "female" in vid or vid.startswith("ta-female") or vid.startswith("en-female"):
        model_path = (
            MODELS_DIR
            / "tamil-female"
            / "ta_IN-rasa_female-medium.onnx"
        )
    elif vid == "tamil-male" or "male" in vid or vid.startswith("ta-male") or vid.startswith("en-male"):
        # Prefer ValluvarNeural, fallback to rasa_male
        valluvar_path = MODELS_DIR / "tamil-male" / "ta_IN-ValluvarNeural-medium.onnx"
        rasa_male_path = MODELS_DIR / "tamil-male" / "ta_IN-rasa_male-medium.onnx"
        if valluvar_path.exists():
            model_path = valluvar_path
        elif rasa_male_path.exists():
            model_path = rasa_male_path
        else:
            raise HTTPException(
                status_code=404,
                detail="Tamil Male model is not yet installed on server. Please select a Tamil Female voice (e.g. Nithya Sree, Kavitha, Meera) for Piper neural speech, or switch to Browser Demo Engine for male voices."
            )
    else:
        raise HTTPException(
            status_code=404,
            detail=f"Voice '{request.voice_id}' is not supported by the local Piper engine. Available local AI voices: 'tamil-female' (Rasa Female) and 'tamil-male' (Valluvar Male)."
        )

    if not model_path.exists():
        raise HTTPException(
            status_code=500,
            detail=f"Model not found: {model_path}"
        )

    try:

        voice = PiperVoice.load(str(model_path))

        output_filename = f"{uuid.uuid4()}.wav"

        output_path = OUTPUTS_DIR / output_filename

        with wave.open(str(output_path), "wb") as wav_file:

            voice.synthesize_wav(
                request.text,
                wav_file
            )

        return FileResponse(
            path=str(output_path),
            media_type="audio/wav",
            filename=output_filename
        )

    except Exception as error:

        raise HTTPException(
            status_code=500,
            detail=str(error)
        )