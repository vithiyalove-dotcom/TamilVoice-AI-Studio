export type Language = 'ta' | 'en';
export type Gender = 'male' | 'female';
export type VoiceCategory = 'Conversational' | 'News Broadcast' | 'Storytelling' | 'Audiobook' | 'Cinema & Dubbing' | 'Calm & Meditation';

export interface Voice {
  id: string;
  name: string;
  nativeName?: string;
  language: Language;
  gender: Gender;
  category: VoiceCategory;
  accent: string;
  description: string;
  sampleText: string;
  sampleTamilText?: string;
  avatarUrl?: string;
  isCloned?: boolean;
  isCustom?: boolean;
  sampleAudioUrl?: string; // If external audio exists, otherwise synthesized via Web Audio / Web Speech
  pitchOffset?: number; // Pitch modifier
  speedOffset?: number; // Speed modifier
  tags: string[];
  demoPreferredVoiceNames?: string[];
}

export interface AudioGenerationOptions {
  voiceId: string;
  text: string;
  sourceLanguage: Language;
  targetLanguage: Language;
  isTranslationEnabled: boolean;
  translatedText?: string;
  speed: number;       // 0.5 - 2.0
  pitch: number;       // -10 to +10 (or 0.5 to 1.5)
  stability: number;   // 0 - 100%
  clarity: number;     // 0 - 100%
  emotion: 'neutral' | 'cheerful' | 'dramatic' | 'serious' | 'whisper';
}

export interface GeneratedProject {
  id: string;
  title: string;
  text: string;
  translatedText?: string;
  language: Language;
  voice: Voice;
  audioBlobUrl?: string;
  audioDuration: number; // in seconds
  createdAt: string;
  fileSizeBytes: number;
  format: 'mp3' | 'wav';
  status: 'ready' | 'processing' | 'failed';
  systemVoiceUsed?: string;
  systemVoiceWarning?: string;
}

export interface VoiceCloneRequest {
  id: string;
  name: string;
  gender: Gender;
  language: Language;
  accent: string;
  description: string;
  audioFile?: File;
  audioBlob?: Blob;
  audioBlobUrl?: string;
  durationSeconds: number;
  status: 'draft' | 'validating' | 'extracting_features' | 'training' | 'completed' | 'failed';
  progress: number; // 0 - 100
  createdAt: string;
}

export interface StudioSettings {
  activeEngine: 'piper-local' | 'browser-demo' | 'indictts-local' | 'elevenlabs-api' | 'azure-speech' | 'custom-endpoint';
  indicTtsUrl: string;
  elevenLabsApiKey: string;
  azureSpeechKey: string;
  azureRegion: string;
  customEndpointUrl: string;
  defaultAudioFormat: 'mp3' | 'wav';
  sampleRate: '24000' | '44100' | '48000';
  accentTheme: 'cyan' | 'indigo' | 'emerald';
  autoPlayAfterGenerate: boolean;
}

export type PageView =
  | 'dashboard'
  | 'text-to-speech'
  | 'voice-library'
  | 'voice-cloning'
  | 'my-voices'
  | 'my-projects'
  | 'settings';
