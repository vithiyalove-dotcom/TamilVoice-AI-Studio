import { Voice } from '../types';

export interface VoiceResolution {
  voice: SpeechSynthesisVoice | null;
  detectedName: string;
  language: string;
  isLanguageMatch: boolean;
  isGenderMatch: boolean;
  isExactMatch: boolean;
  warningMessage?: string;
  recommendedPitch: number;
  recommendedRate: number;
}

/**
 * VoiceDetectionService discovers, caches, and selects the most accurate
 * browser and operating system voices for Tamil and English male/female profiles.
 */
export class VoiceDetectionService {
  private static instance: VoiceDetectionService;
  private voices: SpeechSynthesisVoice[] = [];
  private isLoaded = false;
  private listeners: Array<(voices: SpeechSynthesisVoice[]) => void> = [];

  private femaleIndicators = [
    'female', 'zira', 'aria', 'pallavi', 'libby', 'priya', 'susan', 'hazel',
    'heather', 'sylvie', 'denise', 'katja', 'ekaterina', 'hayley', 'elsa',
    'sunhi', 'hanna', 'elvira', 'emel', 'paulina', 'xiaoxiao', 'nanami',
    'neerja', 'vani', 'kavitha', 'ananya', 'swara', 'aditi', 'kalpana', 'geeta'
  ];

  private maleIndicators = [
    'male', 'david', 'guy', 'valluvar', 'mark', 'george', 'richard',
    'prabhat', 'madhav', 'arun', 'kumar', 'ravi', 'anand', 'yunyang', 'hanhan'
  ];

  private constructor() {
    this.init();
  }

  public static getInstance(): VoiceDetectionService {
    if (!VoiceDetectionService.instance) {
      VoiceDetectionService.instance = new VoiceDetectionService();
    }
    return VoiceDetectionService.instance;
  }

  private init(): void {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      this.isLoaded = true;
      return;
    }

    const loadVoices = () => {
      const vs = window.speechSynthesis.getVoices();
      if (vs && vs.length > 0) {
        this.voices = vs;
        this.isLoaded = true;
        this.notifyListeners();
      }
    };

    // Immediate attempt
    loadVoices();

    // Standard event listener
    if ('speechSynthesis' in window) {
      window.speechSynthesis.onvoiceschanged = () => {
        loadVoices();
      };
      if (window.speechSynthesis.addEventListener) {
        window.speechSynthesis.addEventListener('voiceschanged', loadVoices);
      }
    }

    // Polling retry in case event is missed
    const checkInterval = setInterval(() => {
      loadVoices();
      if (this.voices.length > 0) {
        clearInterval(checkInterval);
      }
    }, 400);

    setTimeout(() => clearInterval(checkInterval), 5000);
  }

  public subscribe(cb: (voices: SpeechSynthesisVoice[]) => void): () => void {
    this.listeners.push(cb);
    if (this.isLoaded && this.voices.length > 0) {
      cb(this.voices);
    }
    return () => {
      this.listeners = this.listeners.filter((l) => l !== cb);
    };
  }

  private notifyListeners(): void {
    this.listeners.forEach((l) => l(this.voices));
  }

  public getAllVoices(): SpeechSynthesisVoice[] {
    if (this.voices.length === 0 && typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.voices = window.speechSynthesis.getVoices();
    }
    return this.voices;
  }

  public getSystemVoiceSummary(): {
    totalCount: number;
    tamilVoices: string[];
    englishVoices: string[];
  } {
    const all = this.getAllVoices();
    const tamil = all.filter((v) => v.lang.startsWith('ta') || v.lang.includes('ta')).map((v) => v.name);
    const english = all.filter((v) => v.lang.startsWith('en')).map((v) => v.name);
    return {
      totalCount: all.length,
      tamilVoices: tamil,
      englishVoices: english,
    };
  }

  public isFemaleVoice(voiceName: string): boolean {
    const lower = voiceName.toLowerCase();
    return this.femaleIndicators.some((ind) => lower.includes(ind));
  }

  public isMaleVoice(voiceName: string): boolean {
    const lower = voiceName.toLowerCase();
    return this.maleIndicators.some((ind) => lower.includes(ind));
  }

  /**
   * Resolves the best possible system voice for a given Tamil/English preset or requested profile.
   */
  public resolveVoice(voice: Voice): VoiceResolution {
    const allVoices = this.getAllVoices();
    const targetLang = voice.language;
    const targetGender = voice.gender;

    // 1. TAMIL MALE
    if (targetLang === 'ta' && targetGender === 'male') {
      const tamilVoices = allVoices.filter((v) => v.lang.startsWith('ta') || v.lang.includes('ta'));
      // Prefer explicit male Tamil voice (e.g. Valluvar)
      const maleTamil = tamilVoices.find((v) => this.isMaleVoice(v.name) || !this.isFemaleVoice(v.name));
      if (maleTamil) {
        return {
          voice: maleTamil,
          detectedName: maleTamil.name,
          language: maleTamil.lang,
          isLanguageMatch: true,
          isGenderMatch: true,
          isExactMatch: true,
          recommendedPitch: 0.9,
          recommendedRate: 1.0,
        };
      }

      if (tamilVoices.length > 0) {
        return {
          voice: tamilVoices[0],
          detectedName: tamilVoices[0].name,
          language: tamilVoices[0].lang,
          isLanguageMatch: true,
          isGenderMatch: false,
          isExactMatch: false,
          warningMessage: `No Tamil male voice found. Using available Tamil voice: ${tamilVoices[0].name}`,
          recommendedPitch: 0.85,
          recommendedRate: 1.0,
        };
      }

      // No Tamil voice installed at all
      const fallbackIndian = allVoices.find((v) => v.lang.includes('IN') && this.isMaleVoice(v.name)) ||
                             allVoices.find((v) => this.isMaleVoice(v.name)) ||
                             allVoices[0] || null;

      return {
        voice: fallbackIndian,
        detectedName: fallbackIndian ? fallbackIndian.name : 'Browser Default Voice',
        language: fallbackIndian?.lang || 'unknown',
        isLanguageMatch: false,
        isGenderMatch: fallbackIndian ? this.isMaleVoice(fallbackIndian.name) : false,
        isExactMatch: false,
        warningMessage: 'No Tamil voice is installed on Windows/browser. Please install the Windows Tamil language pack.',
        recommendedPitch: 0.9,
        recommendedRate: 1.0,
      };
    }

    // 2. TAMIL FEMALE
    if (targetLang === 'ta' && targetGender === 'female') {
      const tamilVoices = allVoices.filter((v) => v.lang.startsWith('ta') || v.lang.includes('ta'));
      const femaleTamil = tamilVoices.find((v) => this.isFemaleVoice(v.name));
      if (femaleTamil) {
        return {
          voice: femaleTamil,
          detectedName: femaleTamil.name,
          language: femaleTamil.lang,
          isLanguageMatch: true,
          isGenderMatch: true,
          isExactMatch: true,
          recommendedPitch: 1.2,
          recommendedRate: 1.0,
        };
      }

      // If only Tamil Male voice exists (e.g. Microsoft Valluvar)
      if (tamilVoices.length > 0) {
        const availableTamil = tamilVoices[0];
        return {
          voice: availableTamil,
          detectedName: availableTamil.name,
          language: availableTamil.lang,
          isLanguageMatch: true,
          isGenderMatch: false,
          isExactMatch: false,
          warningMessage: 'No Tamil female system voice is currently installed. Using the closest available system voice: ' + availableTamil.name,
          recommendedPitch: 1.35, // Pitch boost for clear feminine tone distinction
          recommendedRate: 1.0,
        };
      }

      // No Tamil voice installed at all -> fallback to Indian female or English female
      const fallbackFemale = allVoices.find((v) => v.lang.includes('IN') && this.isFemaleVoice(v.name)) ||
                             allVoices.find((v) => this.isFemaleVoice(v.name)) ||
                             allVoices[0] || null;

      return {
        voice: fallbackFemale,
        detectedName: fallbackFemale ? fallbackFemale.name : 'Browser Default Voice',
        language: fallbackFemale?.lang || 'unknown',
        isLanguageMatch: false,
        isGenderMatch: fallbackFemale ? this.isFemaleVoice(fallbackFemale.name) : false,
        isExactMatch: false,
        warningMessage: 'No Tamil female system voice is currently installed. Using the closest available system voice.',
        recommendedPitch: 1.35,
        recommendedRate: 1.0,
      };
    }

    // 3. ENGLISH MALE
    if (targetLang === 'en' && targetGender === 'male') {
      const englishVoices = allVoices.filter((v) => v.lang.startsWith('en'));
      // Prefer preferred names if provided
      if (voice.demoPreferredVoiceNames && voice.demoPreferredVoiceNames.length > 0) {
        for (const pref of voice.demoPreferredVoiceNames) {
          const match = englishVoices.find((v) => v.name.toLowerCase().includes(pref.toLowerCase()));
          if (match) {
            return {
              voice: match,
              detectedName: match.name,
              language: match.lang,
              isLanguageMatch: true,
              isGenderMatch: true,
              isExactMatch: true,
              recommendedPitch: 0.9,
              recommendedRate: 1.0,
            };
          }
        }
      }

      const maleEnglish = englishVoices.find((v) => this.isMaleVoice(v.name));
      if (maleEnglish) {
        return {
          voice: maleEnglish,
          detectedName: maleEnglish.name,
          language: maleEnglish.lang,
          isLanguageMatch: true,
          isGenderMatch: true,
          isExactMatch: true,
          recommendedPitch: 0.9,
          recommendedRate: 1.0,
        };
      }

      const fallback = englishVoices[0] || allVoices[0] || null;
      return {
        voice: fallback,
        detectedName: fallback ? fallback.name : 'Browser Default',
        language: fallback?.lang || 'en',
        isLanguageMatch: true,
        isGenderMatch: false,
        isExactMatch: false,
        warningMessage: 'No distinct English male voice detected; using available system voice.',
        recommendedPitch: 0.85,
        recommendedRate: 1.0,
      };
    }

    // 4. ENGLISH FEMALE
    if (targetLang === 'en' && targetGender === 'female') {
      const englishVoices = allVoices.filter((v) => v.lang.startsWith('en'));
      // Check preferred names
      if (voice.demoPreferredVoiceNames && voice.demoPreferredVoiceNames.length > 0) {
        for (const pref of voice.demoPreferredVoiceNames) {
          const match = englishVoices.find((v) => v.name.toLowerCase().includes(pref.toLowerCase()));
          if (match) {
            return {
              voice: match,
              detectedName: match.name,
              language: match.lang,
              isLanguageMatch: true,
              isGenderMatch: true,
              isExactMatch: true,
              recommendedPitch: 1.2,
              recommendedRate: 1.0,
            };
          }
        }
      }

      const femaleEnglish = englishVoices.find((v) => this.isFemaleVoice(v.name));
      if (femaleEnglish) {
        return {
          voice: femaleEnglish,
          detectedName: femaleEnglish.name,
          language: femaleEnglish.lang,
          isLanguageMatch: true,
          isGenderMatch: true,
          isExactMatch: true,
          recommendedPitch: 1.2,
          recommendedRate: 1.0,
        };
      }

      const fallback = englishVoices[0] || allVoices[0] || null;
      return {
        voice: fallback,
        detectedName: fallback ? fallback.name : 'Browser Default',
        language: fallback?.lang || 'en',
        isLanguageMatch: true,
        isGenderMatch: false,
        isExactMatch: false,
        warningMessage: 'No distinct English female voice detected; using closest system voice.',
        recommendedPitch: 1.3,
        recommendedRate: 1.0,
      };
    }

    // Generic fallback
    const def = allVoices[0] || null;
    return {
      voice: def,
      detectedName: def?.name || 'Default Voice',
      language: def?.lang || 'en',
      isLanguageMatch: false,
      isGenderMatch: false,
      isExactMatch: false,
      recommendedPitch: 1.0,
      recommendedRate: 1.0,
    };
  }
}
