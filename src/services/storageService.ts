import { GeneratedProject, StudioSettings, Voice } from '../types';

const STORAGE_KEYS = {
  PROJECTS: 'tamilvoice_studio_projects',
  CLONED_VOICES: 'tamilvoice_studio_cloned_voices',
  FAVORITE_VOICES: 'tamilvoice_studio_favorite_voices',
  SETTINGS: 'tamilvoice_studio_settings',
};

const DEFAULT_SETTINGS: StudioSettings = {
  activeEngine: 'piper-local',
  indicTtsUrl: 'http://127.0.0.1:8001/api/tts',
  elevenLabsApiKey: '',
  azureSpeechKey: '',
  azureRegion: 'southeastasia',
  customEndpointUrl: '',
  defaultAudioFormat: 'mp3',
  sampleRate: '44100',
  accentTheme: 'indigo',
  autoPlayAfterGenerate: true,
};

export class StorageService {
  public static getProjects(): GeneratedProject[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.PROJECTS);
      if (!data) return [];
      return JSON.parse(data);
    } catch {
      return [];
    }
  }

  public static saveProject(project: GeneratedProject): void {
    const projects = this.getProjects();
    const existingIndex = projects.findIndex((p) => p.id === project.id);
    if (existingIndex >= 0) {
      projects[existingIndex] = project;
    } else {
      projects.unshift(project);
    }
    localStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(projects));
  }

  public static deleteProject(projectId: string): void {
    const projects = this.getProjects().filter((p) => p.id !== projectId);
    localStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(projects));
  }

  public static getClonedVoices(): Voice[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.CLONED_VOICES);
      if (!data) return [];
      return JSON.parse(data);
    } catch {
      return [];
    }
  }

  public static saveClonedVoice(voice: Voice): void {
    const voices = this.getClonedVoices();
    const index = voices.findIndex((v) => v.id === voice.id);
    if (index >= 0) {
      voices[index] = voice;
    } else {
      voices.unshift(voice);
    }
    localStorage.setItem(STORAGE_KEYS.CLONED_VOICES, JSON.stringify(voices));
  }

  public static deleteClonedVoice(voiceId: string): void {
    const voices = this.getClonedVoices().filter((v) => v.id !== voiceId);
    localStorage.setItem(STORAGE_KEYS.CLONED_VOICES, JSON.stringify(voices));
  }

  public static getFavorites(): string[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.FAVORITE_VOICES);
      if (!data) return ['ta-male-arun', 'ta-female-nithya'];
      return JSON.parse(data);
    } catch {
      return ['ta-male-arun', 'ta-female-nithya'];
    }
  }

  public static toggleFavorite(voiceId: string): string[] {
    const favs = this.getFavorites();
    const index = favs.indexOf(voiceId);
    let updated: string[];
    if (index >= 0) {
      updated = favs.filter((id) => id !== voiceId);
    } else {
      updated = [...favs, voiceId];
    }
    localStorage.setItem(STORAGE_KEYS.FAVORITE_VOICES, JSON.stringify(updated));
    return updated;
  }

  public static getSettings(): StudioSettings {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      if (!data) return DEFAULT_SETTINGS;
      return { ...DEFAULT_SETTINGS, ...JSON.parse(data) };
    } catch {
      return DEFAULT_SETTINGS;
    }
  }

  public static saveSettings(settings: StudioSettings): void {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  }
}
