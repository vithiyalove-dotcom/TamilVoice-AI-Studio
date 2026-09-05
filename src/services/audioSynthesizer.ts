import { Voice } from '../types';
import {
  VoiceDetectionService,
  VoiceResolution,
} from './voiceDetectionService';

/**
 * AudioSynthesizer manages speech synthesis.
 * - Browser SpeechSynthesis for preview/demo voice.
 * - Piper TTS backend for generated real audio.
 * - No oscillator or artificial humming fallback.
 */
export class AudioSynthesizer {
  private static instance: AudioSynthesizer;
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private currentAudio: HTMLAudioElement | null = null;
  private currentAudioUrl: string | null = null;
  private isSpeakingActive = false;

  private constructor() {}

  public static getInstance(): AudioSynthesizer {
    if (!AudioSynthesizer.instance) {
      AudioSynthesizer.instance = new AudioSynthesizer();
    }

    return AudioSynthesizer.instance;
  }

  /**
   * Sends text to the local Piper TTS backend
   * and returns a playable audio URL.
   */
  public async synthesizeWithPiper(
    text: string,
    voiceId: string
  ): Promise<string> {
    const response = await fetch('http://127.0.0.1:8001/api/tts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text,
        voice_id: voiceId,
      }),
    });

    if (!response.ok) {
      let errorMessage = `Piper TTS error (${response.status})`;
      try {
        const errorJson = await response.json();
        if (errorJson.detail) {
          errorMessage = errorJson.detail;
        }
      } catch {
        const errorText = await response.text();
        if (errorText) {
          errorMessage = errorText;
        }
      }

      throw new Error(errorMessage);
    }

    const audioBlob = await response.blob();

    return URL.createObjectURL(audioBlob);
  }

  /**
   * Generate and play Piper TTS audio.
   */
  public async speakWithPiper(
    text: string,
    voiceId: string,
    options: {
      onStart?: () => void;
      onEnd?: () => void;
      onError?: (err: unknown) => void;
    } = {}
  ): Promise<string> {
    this.stopSpeaking();

    try {
      const audioUrl = await this.synthesizeWithPiper(
        text,
        voiceId
      );

      this.currentAudioUrl = audioUrl;

      const audio = new Audio(audioUrl);
      this.currentAudio = audio;

      audio.onplay = () => {
        this.isSpeakingActive = true;
        options.onStart?.();
      };

      audio.onended = () => {
        this.cleanupAudio();
        options.onEnd?.();
      };

      audio.onerror = () => {
        const error = new Error('Piper audio playback failed');
        this.cleanupAudio();
        options.onError?.(error);
      };

      await audio.play();

      return audioUrl;
    } catch (err) {
      this.cleanupAudio();
      options.onError?.(err);
      throw err;
    }
  }

  /**
   * Resolves system voice mapping and warning message
   * for a given voice profile.
   */
  public getVoiceResolution(voice: Voice): VoiceResolution {
    const detector = VoiceDetectionService.getInstance();

    return detector.resolveVoice(voice);
  }

  /**
   * Browser SpeechSynthesis voice preview.
   */
  public speakDemo(
    text: string,
    voice: Voice,
    options: {
      speed?: number;
      pitch?: number;
      onStart?: (resolution: VoiceResolution) => void;
      onEnd?: () => void;
      onError?: (err: unknown) => void;
    } = {}
  ): VoiceResolution {
    this.stopSpeaking();

    const detector = VoiceDetectionService.getInstance();
    const resolution = detector.resolveVoice(voice);

    if (
      typeof window === 'undefined' ||
      !('speechSynthesis' in window)
    ) {
      console.warn(
        'SpeechSynthesis is not supported in this environment.'
      );

      options.onError?.(
        new Error('SpeechSynthesis not supported')
      );

      return resolution;
    }

    try {
      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);

      if (resolution.voice) {
        utterance.voice = resolution.voice;
        utterance.lang = resolution.voice.lang;
      } else {
        utterance.lang =
          voice.language === 'ta' ? 'ta-IN' : 'en-US';
      }

      const basePitch = resolution.recommendedPitch;
      const userPitchMod = options.pitch ?? 1.0;
      const voicePitchOffset = voice.pitchOffset ?? 1.0;

      utterance.pitch = Math.max(
        0.5,
        Math.min(
          2.0,
          basePitch *
            userPitchMod *
            (voicePitchOffset !== 1
              ? voicePitchOffset /
                (voice.gender === 'female' ? 1.35 : 0.9)
              : 1)
        )
      );

      const userSpeed = options.speed ?? 1.0;
      const voiceSpeedOffset = voice.speedOffset ?? 1.0;

      utterance.rate = Math.max(
        0.5,
        Math.min(
          2.0,
          resolution.recommendedRate *
            userSpeed *
            voiceSpeedOffset
        )
      );

      utterance.onstart = () => {
        this.isSpeakingActive = true;
        options.onStart?.(resolution);
      };

      utterance.onend = () => {
        this.isSpeakingActive = false;
        this.currentUtterance = null;
        options.onEnd?.();
      };

      utterance.onerror = (e) => {
        this.isSpeakingActive = false;
        this.currentUtterance = null;

        if (
          e.error !== 'canceled' &&
          e.error !== 'interrupted'
        ) {
          console.warn('SpeechSynthesis error:', e);
          options.onError?.(e);
        } else {
          options.onEnd?.();
        }
      };

      this.currentUtterance = utterance;

      window.speechSynthesis.speak(utterance);

      return resolution;
    } catch (err) {
      this.isSpeakingActive = false;
      this.currentUtterance = null;

      console.error(
        'Speech synthesis execution failed:',
        err
      );

      options.onError?.(err);

      return resolution;
    }
  }

  /**
   * Stops both Browser SpeechSynthesis and Piper audio.
   */
  public stopSpeaking(): void {
    if (
      typeof window !== 'undefined' &&
      'speechSynthesis' in window
    ) {
      window.speechSynthesis.cancel();
    }

    if (this.currentAudio) {
      this.currentAudio.pause();
      this.currentAudio.currentTime = 0;
    }

    this.cleanupAudio();

    this.currentUtterance = null;
    this.isSpeakingActive = false;
  }

  /**
   * Returns true when either Piper or browser TTS is speaking.
   */
  public isSpeaking(): boolean {
    if (
      this.currentAudio &&
      !this.currentAudio.paused &&
      !this.currentAudio.ended
    ) {
      return true;
    }

    if (
      typeof window !== 'undefined' &&
      'speechSynthesis' in window
    ) {
      return (
        window.speechSynthesis.speaking ||
        this.isSpeakingActive
      );
    }

    return this.isSpeakingActive;
  }

  public getCurrentUtterance():
    | SpeechSynthesisUtterance
    | null {
    return this.currentUtterance;
  }

  /**
   * Generates a silent WAV container for timeline tracking.
   */
  public generateSpeechContainer(
    text: string,
    speed: number = 1.0
  ): {
    blob: Blob;
    duration: number;
  } {
    const charCount = Math.max(text.trim().length, 10);

    const estimatedDuration = Math.max(
      2.0,
      Math.min(60, charCount / 12 / speed)
    );

    const sampleRate = 22050;
    const numSamples = Math.floor(
      sampleRate * estimatedDuration
    );

    const byteRate = sampleRate * 2;
    const blockAlign = 2;
    const dataSize = numSamples * 2;

    const buffer = new ArrayBuffer(44 + dataSize);
    const view = new DataView(buffer);

    this.writeString(view, 0, 'RIFF');
    view.setUint32(4, 36 + dataSize, true);

    this.writeString(view, 8, 'WAVE');

    this.writeString(view, 12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, 1, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, byteRate, true);
    view.setUint16(32, blockAlign, true);
    view.setUint16(34, 16, true);

    this.writeString(view, 36, 'data');
    view.setUint32(40, dataSize, true);

    const blob = new Blob([buffer], {
      type: 'audio/wav',
    });

    return {
      blob,
      duration:
        Math.round(estimatedDuration * 10) / 10,
    };
  }

  /**
   * Clears the current Piper audio and its temporary URL.
   */
  private cleanupAudio(): void {
    if (this.currentAudio) {
      this.currentAudio.onplay = null;
      this.currentAudio.onended = null;
      this.currentAudio.onerror = null;
    }

    this.currentAudio = null;

    if (this.currentAudioUrl) {
      URL.revokeObjectURL(this.currentAudioUrl);
      this.currentAudioUrl = null;
    }

    this.isSpeakingActive = false;
  }

  private writeString(
    view: DataView,
    offset: number,
    string: string
  ): void {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(
        offset + i,
        string.charCodeAt(i)
      );
    }
  }
}