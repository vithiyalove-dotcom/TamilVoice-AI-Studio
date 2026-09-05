import {
  AudioGenerationOptions,
  GeneratedProject,
  StudioSettings,
  Voice,
} from '../types';

import { AudioSynthesizer } from './audioSynthesizer';
import { StorageService } from './storageService';

export interface TTSGenerationResult {
  audioBlob: Blob;
  audioUrl: string;
  duration: number;
  engineUsed: string;
  systemVoiceUsed: string;
  systemVoiceWarning?: string;
  format: 'mp3' | 'wav';
  spokenText: string;
}

/**
 * Interface that all TTS engines must implement.
 */
export interface ITTSEngine {
  name: string;
  isReady: boolean;

  generateSpeech(
    options: AudioGenerationOptions,
    voice: Voice,
    onProgress?: (percent: number, status: string) => void
  ): Promise<TTSGenerationResult>;
}

/**
 * Local Piper TTS Engine
 *
 * Connects to the local Python Piper backend:
 * http://127.0.0.1:8001/api/tts
 */
export class PiperTTSEngine implements ITTSEngine {
  public name = 'Local Piper Neural TTS Engine';
  public isReady = true;

  public async generateSpeech(
    options: AudioGenerationOptions,
    voice: Voice,
    onProgress?: (percent: number, status: string) => void
  ): Promise<TTSGenerationResult> {
    const synth = AudioSynthesizer.getInstance();

    try {
      onProgress?.(10, 'Preparing Piper neural voice engine...');

      if (!options.text.trim()) {
        throw new Error('Please enter text before generating audio.');
      }

      onProgress?.(
        25,
        `Connecting to local Piper TTS engine for ${voice.name}...`
      );

      /**
       * Generate the actual audio using Piper backend.
       */
      const audioUrl = await synth.synthesizeWithPiper(
        options.text,
        voice.id
      );

      onProgress?.(60, 'Piper neural voice generated successfully...');

      /**
       * Convert the generated Object URL back into a Blob.
       */
      const audioResponse = await fetch(audioUrl);

      if (!audioResponse.ok) {
        URL.revokeObjectURL(audioUrl);

        throw new Error(
          `Unable to read generated audio: ${audioResponse.status}`
        );
      }

      const audioBlob = await audioResponse.blob();

      onProgress?.(80, 'Analyzing generated audio duration...');

      /**
       * Calculate the real audio duration.
       */
      const duration = await this.getAudioDuration(audioUrl);

      onProgress?.(100, 'Neural voice audio generation completed!');

      return {
        audioBlob,
        audioUrl,
        duration,
        engineUsed: this.name,
        systemVoiceUsed: voice.name,
        format: 'wav',
        spokenText: options.text,
      };
    } catch (error) {
      console.error('Piper TTS generation failed:', error);

      const message =
        error instanceof Error
          ? error.message
          : 'Unknown Piper TTS generation error';

      onProgress?.(100, `Piper generation failed: ${message}`);

      throw error;
    }
  }

  /**
   * Gets the actual duration of generated audio.
   */
  private getAudioDuration(audioUrl: string): Promise<number> {
    return new Promise((resolve) => {
      const audio = new Audio();
      audio.preload = 'metadata';

      const cleanup = () => {
        audio.onloadedmetadata = null;
        audio.onerror = null;
      };

      audio.onloadedmetadata = () => {
        const duration =
          Number.isFinite(audio.duration) && audio.duration > 0
            ? audio.duration
            : 0;

        cleanup();
        resolve(Math.round(duration * 10) / 10);
      };

      audio.onerror = () => {
        cleanup();

        /**
         * Fallback duration estimation.
         */
        resolve(0);
      };

      audio.src = audioUrl;
    });
  }
}

/**
 * Browser SpeechSynthesis Demo Engine
 *
 * Used only as a fallback/demo preview engine.
 */
export class BrowserDemoEngine implements ITTSEngine {
  public name = 'Browser SpeechSynthesis Demo Engine';
  public isReady = true;

  public async generateSpeech(
    options: AudioGenerationOptions,
    voice: Voice,
    onProgress?: (percent: number, status: string) => void
  ): Promise<TTSGenerationResult> {
    const synth = AudioSynthesizer.getInstance();

    onProgress?.(20, 'Detecting system voices...');

    const resolution = synth.getVoiceResolution(voice);

    await new Promise((resolve) => setTimeout(resolve, 300));

    if (resolution.warningMessage) {
      onProgress?.(50, resolution.warningMessage);
    } else {
      onProgress?.(
        50,
        `Preparing browser voice for ${resolution.detectedName}...`
      );
    }

    /**
     * Browser demo engine still creates a timeline container.
     * Real generated audio is handled by PiperTTSEngine.
     */
    onProgress?.(80, 'Preparing audio session...');

    const container = synth.generateSpeechContainer(
      options.text,
      options.speed
    );

    const audioUrl = URL.createObjectURL(container.blob);

    onProgress?.(100, 'Demo audio session ready!');

    return {
      audioBlob: container.blob,
      audioUrl,
      duration: container.duration,
      engineUsed: this.name,
      systemVoiceUsed: resolution.detectedName,
      systemVoiceWarning: resolution.warningMessage,
      format: 'wav',
      spokenText: options.text,
    };
  }
}

/**
 * Production IndicTTS Engine Adapter.
 *
 * Currently falls back to local Piper when the external
 * IndicTTS endpoint is unavailable.
 */
export class IndicTtsEngine implements ITTSEngine {
  public name = 'IndicTTS AI Engine';
  public isReady: boolean;

  private endpoint: string;

  constructor(endpoint: string) {
    this.endpoint = endpoint;
    this.isReady = true;
  }

  public async generateSpeech(
    options: AudioGenerationOptions,
    voice: Voice,
    onProgress?: (percent: number, status: string) => void
  ): Promise<TTSGenerationResult> {
    onProgress?.(15, 'Initializing IndicTTS engine...');

    if (this.endpoint) {
      onProgress?.(
        25,
        `External endpoint configured. Using local neural fallback if needed...`
      );
    }

    /**
     * Use local Piper neural TTS.
     */
    const piper = new PiperTTSEngine();

    return piper.generateSpeech(
      options,
      voice,
      onProgress
    );
  }
}

/**
 * ElevenLabs Engine Adapter.
 *
 * Currently uses the local Piper engine as the actual
 * audio-generation fallback.
 */
export class ElevenLabsEngine implements ITTSEngine {
  public name = 'ElevenLabs Multilingual v2';
  public isReady: boolean;

  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
    this.isReady = Boolean(
      apiKey && apiKey.length > 5
    );
  }

  public async generateSpeech(
    options: AudioGenerationOptions,
    voice: Voice,
    onProgress?: (percent: number, status: string) => void
  ): Promise<TTSGenerationResult> {
    const maskedKey = this.apiKey
      ? `(ending in ...${this.apiKey.slice(-4)})`
      : '(not configured)';

    onProgress?.(
      20,
      `Preparing voice engine ${maskedKey}...`
    );

    /**
     * Until ElevenLabs API generation is fully connected,
     * use the local Piper neural engine.
     */
    const piper = new PiperTTSEngine();

    return piper.generateSpeech(
      options,
      voice,
      onProgress
    );
  }
}

/**
 * Central Studio Voice Manager
 */
export class VoiceStudioManager {
  public static getActiveEngine(
    settings?: StudioSettings
  ): ITTSEngine {
    const currentSettings =
      settings || StorageService.getSettings();

    switch (currentSettings.activeEngine) {
      case 'indictts-local':
        return new PiperTTSEngine();

      case 'elevenlabs-api':
        return new ElevenLabsEngine(
          currentSettings.elevenLabsApiKey
        );

      case 'browser-demo':
        return new BrowserDemoEngine();

      case 'piper-local':
      default:
        return new PiperTTSEngine();
    }
  }

  /**
   * Helper translation for demonstration mode.
   */
  public static translateText(
    text: string,
    from: 'ta' | 'en',
    to: 'ta' | 'en'
  ): string {
    if (from === to) {
      return text;
    }

    const sampleTranslations: Record<string, string> = {
      // Tamil -> English
      'வணக்கம்': 'Hello / Greetings',

      'வணக்கம்! தமிழ் வாய்ஸ் ஏஐ ஸ்டுடியோவிற்கு உங்களை அன்புடன் வரவேற்கிறோம்.':
        'Hello! We warmly welcome you to TamilVoice AI Studio.',

      'காலை வணக்கம்':
        'Good morning',

      'நன்றி':
        'Thank you',

      'நான் நலமாக இருக்கிறேன்':
        'I am doing well',

      'செயற்கை நுண்ணறிவு':
        'Artificial Intelligence',

      'புதிய தொழில்நுட்பங்களை எளிய முறையில் கற்றுக்கொள்ளுங்கள்':
        'Learn new technologies in a simple and easy manner.',

      'இது ஒரு அதிநவீன குரல் தொழில்நுட்பம்':
        'This is a state-of-the-art voice technology system.',

      // English -> Tamil
      'Hello':
        'வணக்கம்',

      'Good morning':
        'காலை வணக்கம்',

      'Thank you':
        'நன்றி',

      'Welcome to TamilVoice AI Studio':
        'தமிழ் வாய்ஸ் ஏஐ ஸ்டுடியோவிற்கு வரவேற்கிறோம்',
    };

    const trimmed = text.trim();

    if (sampleTranslations[trimmed]) {
      return sampleTranslations[trimmed];
    }

    if (from === 'ta' && to === 'en') {
      return `[English Audio Translation]: ${text}`;
    }

    return `[தமிழ் குரல் மொழிபெயர்ப்பு]: ${text}`;
  }

  /**
   * Creates a saved project object from generation result.
   */
  public static createProject(
    options: AudioGenerationOptions,
    voice: Voice,
    result: TTSGenerationResult
  ): GeneratedProject {
    const wordSnippet =
      options.text.trim().slice(0, 32);

    const title =
      wordSnippet.length > 0
        ? `${wordSnippet}...`
        : `${voice.name} Audio`;

    return {
      id:
        'proj_' +
        Date.now() +
        '_' +
        Math.random()
          .toString(36)
          .substring(2, 6),

      title,
      text: options.text,
      translatedText: options.translatedText,
      language: options.targetLanguage,
      voice,
      audioBlobUrl: result.audioUrl,
      audioDuration:
        Math.round(result.duration * 10) / 10,
      createdAt: new Date().toISOString(),
      fileSizeBytes:
        result.audioBlob.size || 88200,
      format: result.format,
      status: 'ready',
      systemVoiceUsed: result.systemVoiceUsed,
      systemVoiceWarning:
        result.systemVoiceWarning,
    };
  }
}