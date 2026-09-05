import React, { useState, useEffect } from 'react';
import {
  Mic,
  Sparkles,
  Play,
  RotateCcw,
  Languages,
  Sliders,
  Check,
  ChevronDown,
  Info,
  Square,
  Volume2,
  Trash2,
  AlertTriangle
} from 'lucide-react';
import {
  AudioGenerationOptions,
  GeneratedProject,
  Language,
  StudioSettings,
  Voice,
} from '../types';
import { PRESET_VOICES } from '../data/presetVoices';
import { AudioPlayer } from '../components/audio/AudioPlayer';
import { VoiceStudioManager, TTSGenerationResult } from '../services/ttsEngineService';
import { AudioSynthesizer } from '../services/audioSynthesizer';
import { VoiceDetectionService } from '../services/voiceDetectionService';
import { StorageService } from '../services/storageService';

interface TextToSpeechProps {
  selectedVoice: Voice;
  onSelectVoice: (voice: Voice) => void;
  onSaveProject: (project: GeneratedProject) => void;
  settings: StudioSettings;
  clonedVoices: Voice[];
  onUpdateSettings?: (newSettings: StudioSettings) => void;
}

export const TextToSpeech: React.FC<TextToSpeechProps> = ({
  selectedVoice,
  onSelectVoice,
  onSaveProject,
  settings,
  clonedVoices,
  onUpdateSettings,
}) => {
  // Input state
  const [inputText, setInputText] = useState<string>(
    'வணக்கம்! தமிழ் வாய்ஸ் ஏஐ ஸ்டுடியோவிற்கு உங்களை அன்புடன் வரவேற்கிறோம். எங்கள் செயற்கை நுண்ணறிவு மாதிரி மிக இயல்பான குரலை உருவாக்குகிறது.'
  );
  const [sourceLang, setSourceLang] = useState<Language>('ta');
  const [targetLang, setTargetLang] = useState<Language>('ta');
  const [isTranslationEnabled, setIsTranslationEnabled] = useState<boolean>(false);
  const [translatedPreview, setTranslatedPreview] = useState<string>('');

  // Voice Controls
  const [speed, setSpeed] = useState<number>(1.0);
  const [pitch, setPitch] = useState<number>(1.0);
  const [stability, setStability] = useState<number>(75);
  const [clarity, setClarity] = useState<number>(85);
  const [emotion, setEmotion] = useState<'neutral' | 'cheerful' | 'dramatic' | 'serious' | 'whisper'>('neutral');

  // Generation State
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [generationProgress, setGenerationProgress] = useState<number>(0);
  const [generationStatus, setGenerationStatus] = useState<string>('');
  const [apiError, setApiError] = useState<string | null>(null);
  const [currentResult, setCurrentResult] = useState<TTSGenerationResult | null>(null);
  const [savedStatus, setSavedStatus] = useState<boolean>(false);

  // Voice preview playback state
  const [previewAudio, setPreviewAudio] = useState<HTMLAudioElement | null>(null);
  const [previewAudioUrl, setPreviewAudioUrl] = useState<string | null>(null);

  // Voice selector modal/popover state
  const [isVoicePickerOpen, setIsVoicePickerOpen] = useState<boolean>(false);
  const [voiceFilterLang, setVoiceFilterLang] = useState<'all' | 'ta' | 'en'>('all');
  const [voiceFilterGender, setVoiceFilterGender] = useState<'all' | 'male' | 'female'>('all');
  const [previewingVoiceId, setPreviewingVoiceId] = useState<string | null>(null);

  const allVoices = [...PRESET_VOICES, ...clonedVoices];

  // Character and word counts
  const charCount = inputText.length;
  const wordCount = inputText.trim() ? inputText.trim().split(/\s+/).length : 0;
  const estimatedDuration = (wordCount / 2.5).toFixed(1);

  // Handle translation mode toggle
  useEffect(() => {
    if (isTranslationEnabled) {
      const translated = VoiceStudioManager.translateText(inputText, sourceLang, targetLang);
      setTranslatedPreview(translated);
    } else {
      setTranslatedPreview('');
    }
  }, [isTranslationEnabled, inputText, sourceLang, targetLang]);

  // Adjust target language when voice changes
  useEffect(() => {
    if (!isTranslationEnabled) {
      setTargetLang(selectedVoice.language);
      setSourceLang(selectedVoice.language);
    } else {
      setTargetLang(selectedVoice.language);
    }
  }, [selectedVoice, isTranslationEnabled]);

  // Handle Quick Sample Text insertion
  const insertSampleText = (type: 'tamil' | 'english' | 'translation') => {
    if (type === 'tamil') {
      setInputText('தொழில்நுட்ப உலகில் செயற்கை நுண்ணறிவு கொண்டு வரக்கூடிய மாற்றங்கள் அளப்பரியவை.');
      setSourceLang('ta');
      setIsTranslationEnabled(false);
      // Auto-select a Tamil voice if not already
      if (selectedVoice.language !== 'ta') {
        const firstTamil = allVoices.find((v) => v.language === 'ta');
        if (firstTamil) onSelectVoice(firstTamil);
      }
    } else if (type === 'english') {
      setInputText('Welcome to TamilVoice AI Studio. Experience crystal clear neural voice synthesis and vocal cloning.');
      setSourceLang('en');
      setIsTranslationEnabled(false);
      if (selectedVoice.language !== 'en') {
        const firstEnglish = allVoices.find((v) => v.language === 'en');
        if (firstEnglish) onSelectVoice(firstEnglish);
      }
    } else if (type === 'translation') {
      setInputText('வணக்கம்! இந்தத் திட்டம் உலகளாவிய பயனர்களுக்கு மிகவும் பயனுள்ளதாக இருக்கும்.');
      setSourceLang('ta');
      setTargetLang('en');
      setIsTranslationEnabled(true);
      const firstEnglish = allVoices.find((v) => v.language === 'en');
      if (firstEnglish) onSelectVoice(firstEnglish);
    }
  };

  // Play voice sample preview
  const handlePlayVoicePreview = async (
    voice: Voice,
    e?: React.MouseEvent
  ) => {
    e?.stopPropagation();
    setApiError(null);

    const synth = AudioSynthesizer.getInstance();

    // Clean up any previously active preview audio
    if (previewAudio) {
      previewAudio.pause();
      previewAudio.currentTime = 0;
      setPreviewAudio(null);
    }
    if (previewAudioUrl) {
      URL.revokeObjectURL(previewAudioUrl);
      setPreviewAudioUrl(null);
    }

    // If the same voice is already playing, stop it
    if (previewingVoiceId === voice.id) {
      synth.stopSpeaking();
      setPreviewingVoiceId(null);
      return;
    }

    synth.stopSpeaking();
    setPreviewingVoiceId(voice.id);

    const isPiperActive = settings.activeEngine === 'piper-local' || settings.activeEngine === 'indictts-local';

    if (isPiperActive) {
      try {
        const textToPreview = voice.language === 'ta'
          ? (voice.sampleTamilText || voice.sampleText)
          : voice.sampleText;

        // Generate real neural audio using local Piper backend
        const audioUrl = await synth.synthesizeWithPiper(
          textToPreview,
          voice.id
        );

        setPreviewAudioUrl(audioUrl);
        const audio = new Audio(audioUrl);
        setPreviewAudio(audio);

        audio.onended = () => {
          URL.revokeObjectURL(audioUrl);
          setPreviewAudioUrl(null);
          setPreviewAudio(null);
          setPreviewingVoiceId(null);
        };

        audio.onerror = () => {
          URL.revokeObjectURL(audioUrl);
          setPreviewAudioUrl(null);
          setPreviewAudio(null);
          setPreviewingVoiceId(null);
          setApiError('Piper preview audio playback failed.');
        };

        await audio.play();
      } catch (error) {
        console.error('Piper voice preview failed:', error);
        setPreviewingVoiceId(null);
        const msg = error instanceof Error ? error.message : 'Piper voice preview failed';
        setApiError(msg);
      }
    } else {
      // Browser SpeechSynthesis demo preview
      const textToPreview = voice.language === 'ta'
        ? (voice.sampleTamilText || voice.sampleText)
        : voice.sampleText;

      synth.speakDemo(textToPreview, voice, {
        speed,
        pitch,
        onStart: () => {
          setPreviewingVoiceId(voice.id);
        },
        onEnd: () => {
          setPreviewingVoiceId(null);
        },
        onError: (err) => {
          setPreviewingVoiceId(null);
          setApiError(err instanceof Error ? err.message : 'Demo speech preview error');
        },
      });
    }
  };

  // Perform Audio Generation
  const handleGenerateAudio = async () => {
    if (!inputText.trim()) return;

    // Clean up previous generation audio URL
    if (currentResult?.audioUrl) {
      URL.revokeObjectURL(currentResult.audioUrl);
    }

    setApiError(null);
    setIsGenerating(true);
    setGenerationProgress(10);
    setGenerationStatus('Connecting to neural synthesizer...');
    setSavedStatus(false);

    try {
      const activeText = isTranslationEnabled && translatedPreview ? translatedPreview : inputText;

      const options: AudioGenerationOptions = {
        voiceId: selectedVoice.id,
        text: activeText,
        sourceLanguage: sourceLang,
        targetLanguage: targetLang,
        isTranslationEnabled,
        translatedText: isTranslationEnabled ? translatedPreview : undefined,
        speed,
        pitch,
        stability,
        clarity,
        emotion,
      };

      const engine = VoiceStudioManager.getActiveEngine(settings);

      const result = await engine.generateSpeech(options, selectedVoice, (percent, statusMsg) => {
        setGenerationProgress(percent);
        setGenerationStatus(statusMsg);
      });

      setCurrentResult(result);

      // Auto save project
      const newProject = VoiceStudioManager.createProject(options, selectedVoice, result);
      onSaveProject(newProject);
      setSavedStatus(true);
    } catch (err) {
      console.error('Generation failed:', err);
      const msg = err instanceof Error ? err.message : 'Generation failed. Please try again.';
      setApiError(msg);
      setGenerationStatus(`Generation failed: ${msg}`);
    } finally {
      setIsGenerating(false);
    }
  };

  // Filter voices for picker
  const filteredVoices = allVoices.filter((v) => {
    const matchLang = voiceFilterLang === 'all' || v.language === voiceFilterLang;
    const matchGender = voiceFilterGender === 'all' || v.gender === voiceFilterGender;
    return matchLang && matchGender;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Top Banner & Quick Presets */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-[#0c1322] border border-slate-800 rounded-2xl p-4">
        <div className="flex items-center space-x-2">
          <span className="text-xs font-semibold text-slate-300">Quick Samples:</span>
          <button
            onClick={() => insertSampleText('tamil')}
            className="px-2.5 py-1 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-tamil transition-colors"
          >
            தமிழ் உரை (Tamil Text)
          </button>
          <button
            onClick={() => insertSampleText('english')}
            className="px-2.5 py-1 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-xs transition-colors"
          >
            English Text
          </button>
          <button
            onClick={() => insertSampleText('translation')}
            className="px-2.5 py-1 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-xs transition-colors flex items-center space-x-1"
          >
            <Languages className="w-3 h-3" />
            <span>Tamil ➔ English Translation</span>
          </button>
        </div>

        {/* Translation Mode Switch */}
        <label className="flex items-center space-x-2 cursor-pointer text-xs font-medium text-slate-300 bg-slate-900/90 px-3 py-1.5 rounded-xl border border-slate-800 hover:border-slate-700">
          <input
            type="checkbox"
            checked={isTranslationEnabled}
            onChange={(e) => setIsTranslationEnabled(e.target.checked)}
            className="rounded border-slate-700 text-cyan-500 focus:ring-0 focus:ring-offset-0 bg-slate-800"
          />
          <Languages className="w-3.5 h-3.5 text-cyan-400" />
          <span>Cross-Lingual Translation Mode</span>
        </label>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Text Input & Translation & Audio Player */}
        <div className="lg:col-span-8 space-y-6">
          {/* Main Text Editor Card */}
          <div className="bg-[#0f172a] border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl relative">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Source Script
                </span>
                <div className="flex items-center bg-slate-900 rounded-lg p-0.5 border border-slate-800 text-xs">
                  <button
                    onClick={() => {
                      setSourceLang('ta');
                      if (!isTranslationEnabled) setTargetLang('ta');
                    }}
                    className={`px-2.5 py-1 rounded-md font-semibold transition-all ${
                      sourceLang === 'ta'
                        ? 'bg-amber-500 text-slate-950 shadow-sm font-tamil'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    தமிழ் (Tamil)
                  </button>
                  <button
                    onClick={() => {
                      setSourceLang('en');
                      if (!isTranslationEnabled) setTargetLang('en');
                    }}
                    className={`px-2.5 py-1 rounded-md font-semibold transition-all ${
                      sourceLang === 'en'
                        ? 'bg-brand-500 text-white shadow-sm'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    English
                  </button>
                </div>
              </div>

              {/* Clear button */}
              {inputText.length > 0 && (
                <button
                  onClick={() => setInputText('')}
                  className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-slate-800/80 rounded-lg transition-colors text-xs flex items-center space-x-1"
                  title="Clear text"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Clear</span>
                </button>
              )}
            </div>

            {/* Input Textarea */}
            <div className="relative">
              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder={
                  sourceLang === 'ta'
                    ? 'இங்கே தமிழில் உரையை உள்ளிடவும்... (Type or paste your Tamil text here)'
                    : 'Enter your English text here for neural voice synthesis...'
                }
                rows={6}
                className={`w-full bg-slate-950/70 border border-slate-800 focus:border-cyan-500/80 rounded-2xl p-4 text-slate-100 text-sm sm:text-base leading-relaxed placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-cyan-500/50 resize-y transition-all ${
                  sourceLang === 'ta' ? 'font-tamil' : 'font-sans'
                }`}
              />
            </div>

            {/* Editor Metrics Bar */}
            <div className="mt-3 flex flex-wrap items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-800/80">
              <div className="flex items-center space-x-3">
                <span>
                  Characters: <strong className="text-slate-200">{charCount}</strong>
                </span>
                <span>•</span>
                <span>
                  Words: <strong className="text-slate-200">{wordCount}</strong>
                </span>
                <span>•</span>
                <span>
                  Est. Audio: <strong className="text-cyan-400">~{estimatedDuration}s</strong>
                </span>
              </div>

              <div className="text-[11px] text-slate-500 flex items-center space-x-1">
                <Info className="w-3.5 h-3.5" />
                <span>Max 5,000 characters per batch</span>
              </div>
            </div>

            {/* Translation Output Box (When translation mode enabled) */}
            {isTranslationEnabled && (
              <div className="mt-4 p-4 rounded-2xl bg-slate-950/90 border border-cyan-500/30 space-y-2">
                <div className="flex items-center justify-between text-xs font-semibold text-cyan-300">
                  <div className="flex items-center space-x-1.5">
                    <Languages className="w-4 h-4 text-cyan-400" />
                    <span>
                      Translated Target ({targetLang === 'ta' ? 'தமிழ்' : 'English'}) Audio Text:
                    </span>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800">
                    Live Translation
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-slate-200 leading-relaxed font-medium bg-slate-900/60 p-3 rounded-xl border border-slate-800">
                  {translatedPreview || 'Type above to preview real-time translation...'}
                </p>
              </div>
            )}

            {/* Action Row */}
            <div className="mt-5 flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-800">
              <div className="flex items-center space-x-2 text-xs">
                <span className="text-slate-400">Engine:</span>
                <span
                  className={`px-2.5 py-1 rounded-lg font-semibold flex items-center gap-1.5 border ${
                    settings.activeEngine === 'piper-local'
                      ? 'bg-cyan-950/70 text-cyan-300 border-cyan-500/40 shadow-sm'
                      : 'bg-indigo-950/70 text-indigo-300 border-indigo-500/40 shadow-sm'
                  }`}
                >
                  <span
                    className={`w-2 h-2 rounded-full ${
                      settings.activeEngine === 'piper-local'
                        ? 'bg-cyan-400 animate-pulse'
                        : 'bg-indigo-400'
                    }`}
                  />
                  <span>
                    {settings.activeEngine === 'piper-local'
                      ? 'Local Piper Neural AI (http://127.0.0.1:8001)'
                      : settings.activeEngine === 'browser-demo'
                      ? 'Browser Demo Engine (SpeechSynthesis)'
                      : settings.activeEngine}
                  </span>
                </span>

                {onUpdateSettings && (
                  <button
                    onClick={() => {
                      const next =
                        settings.activeEngine === 'piper-local'
                          ? 'browser-demo'
                          : 'piper-local';
                      const updated: StudioSettings = {
                        ...settings,
                        activeEngine: next,
                      };
                      StorageService.saveSettings(updated);
                      onUpdateSettings(updated);
                    }}
                    className="text-[11px] font-medium text-slate-400 hover:text-cyan-300 underline transition-colors ml-1"
                    title="Toggle between Local Piper AI and Browser Demo engine"
                  >
                    Switch to {settings.activeEngine === 'piper-local' ? 'Browser Demo' : 'Local Piper'}
                  </button>
                )}
              </div>

              <button
                onClick={handleGenerateAudio}
                disabled={isGenerating || !inputText.trim()}
                className={`py-3 px-6 rounded-xl font-bold text-sm flex items-center space-x-2 transition-all shadow-lg ${
                  isGenerating || !inputText.trim()
                    ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                    : 'bg-gradient-to-r from-brand-600 via-indigo-600 to-cyan-500 hover:from-brand-500 hover:to-cyan-400 text-white shadow-brand-600/30 active:scale-95'
                }`}
              >
                {isGenerating ? (
                  <>
                    <Sparkles className="w-4 h-4 text-cyan-300 animate-spin" />
                    <span>Synthesizing Audio...</span>
                  </>
                ) : (
                  <>
                    <Mic className="w-4 h-4 text-cyan-300" />
                    <span>Generate Audio</span>
                  </>
                )}
              </button>
            </div>

            {/* API Error Notification */}
            {apiError && (
              <div className="mt-4 p-3.5 rounded-xl bg-rose-950/70 border border-rose-500/50 text-xs text-rose-200 flex items-start space-x-2.5 shadow-lg">
                <AlertTriangle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
                <div className="flex-1 space-y-1">
                  <p className="font-semibold text-rose-300">TTS Engine Notice</p>
                  <p className="leading-relaxed text-slate-300">{apiError}</p>
                </div>
                <button
                  onClick={() => setApiError(null)}
                  className="text-slate-400 hover:text-white text-[11px] font-semibold px-2 py-0.5 rounded bg-slate-900 border border-slate-800 transition-colors"
                >
                  Dismiss
                </button>
              </div>
            )}

            {/* Generation Progress Indicator */}
            {isGenerating && (
              <div className="mt-4 p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex justify-between text-xs font-semibold text-slate-300">
                  <span className="flex items-center space-x-2">
                    <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                    <span>{generationStatus}</span>
                  </span>
                  <span className="font-mono text-cyan-400">{generationProgress}%</span>
                </div>
                <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-brand-500 to-cyan-400 rounded-full transition-all duration-300"
                    style={{ width: `${generationProgress}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Generated Audio Output Player Card */}
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center space-x-2">
              <Volume2 className="w-4 h-4 text-cyan-400" />
              <span>Synthesized Audio Player</span>
            </h3>

            <AudioPlayer
              audioUrl={currentResult?.audioUrl || null}
              duration={currentResult?.duration || 0}
              voice={selectedVoice}
              title={
                isTranslationEnabled && translatedPreview
                  ? `[Translated] ${translatedPreview.slice(0, 36)}...`
                  : inputText.slice(0, 36) + '...'
              }
              spokenText={isTranslationEnabled && translatedPreview ? translatedPreview : inputText}
              systemVoiceUsed={currentResult?.systemVoiceUsed || VoiceDetectionService.getInstance().resolveVoice(selectedVoice).detectedName}
              systemVoiceWarning={currentResult?.systemVoiceWarning || VoiceDetectionService.getInstance().resolveVoice(selectedVoice).warningMessage}
              onSaveToProjects={() => {
                if (currentResult) {
                  const options: AudioGenerationOptions = {
                    voiceId: selectedVoice.id,
                    text: inputText,
                    sourceLanguage: sourceLang,
                    targetLanguage: targetLang,
                    isTranslationEnabled,
                    translatedText: translatedPreview,
                    speed,
                    pitch,
                    stability,
                    clarity,
                    emotion,
                  };
                  const proj = VoiceStudioManager.createProject(options, selectedVoice, currentResult);
                  onSaveProject(proj);
                  setSavedStatus(true);
                }
              }}
              isSaved={savedStatus}
            />
          </div>
        </div>

        {/* Right Column: Selected Voice Card, Voice Selector & Acoustic Controls */}
        <div className="lg:col-span-4 space-y-6">
          {/* Selected Voice Box */}
          <div className="bg-[#0f172a] border border-slate-800 rounded-3xl p-5 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Selected Voice Model
              </span>
              <button
                onClick={() => setIsVoicePickerOpen(!isVoicePickerOpen)}
                className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 flex items-center space-x-1"
              >
                <span>Change Voice</span>
                <ChevronDown className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Active Voice Info */}
            <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-900 to-[#121929] border border-slate-800">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <div
                    className={`w-12 h-12 rounded-xl flex items-center justify-center font-extrabold text-sm text-white shadow-md ${
                      selectedVoice.gender === 'male'
                        ? 'bg-gradient-to-tr from-sky-600 to-indigo-600'
                        : 'bg-gradient-to-tr from-pink-500 to-violet-600'
                    }`}
                  >
                    {selectedVoice.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <h4 className="text-base font-bold text-white">{selectedVoice.name}</h4>
                    <div className="text-xs text-slate-400 font-tamil">
                      {selectedVoice.nativeName || selectedVoice.accent}
                    </div>
                  </div>
                </div>

                <span
                  className={`text-xs font-semibold px-2.5 py-1 rounded-md ${
                    selectedVoice.language === 'ta'
                      ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                      : 'bg-indigo-500/15 text-indigo-300 border border-indigo-500/30'
                  }`}
                >
                  {selectedVoice.language === 'ta' ? 'தமிழ்' : 'English'}
                </span>
              </div>

              <div className="flex items-center space-x-2 text-xs text-slate-400 mb-3">
                <span className="capitalize font-medium text-slate-300">{selectedVoice.gender}</span>
                <span>•</span>
                <span>{selectedVoice.category}</span>
                <span>•</span>
                <span>{selectedVoice.accent}</span>
              </div>

              {/* Detected Browser Voice Diagnostics */}
              <div className="mb-3 p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400 font-medium">Mapped System Voice:</span>
                  <span className="font-semibold text-cyan-300 truncate max-w-[180px]">
                    {VoiceDetectionService.getInstance().resolveVoice(selectedVoice).detectedName}
                  </span>
                </div>
                {VoiceDetectionService.getInstance().resolveVoice(selectedVoice).warningMessage && (
                  <div className="p-2 rounded-lg bg-amber-950/40 border border-amber-500/30 text-[11px] text-amber-300 leading-snug flex items-start gap-1.5">
                    <Info className="w-3.5 h-3.5 text-amber-400 flex-shrink-0 mt-0.5" />
                    <span>{VoiceDetectionService.getInstance().resolveVoice(selectedVoice).warningMessage}</span>
                  </div>
                )}
              </div>

              <p className="text-xs text-slate-400 line-clamp-2 mb-3">
                {selectedVoice.description}
              </p>

              {/* Play preview button */}
              <button
                onClick={(e) => handlePlayVoicePreview(selectedVoice, e)}
                className={`w-full py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center space-x-2 transition-all ${
                  previewingVoiceId === selectedVoice.id
                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                }`}
              >
                {previewingVoiceId === selectedVoice.id ? (
                  <>
                    <Square className="w-3.5 h-3.5 fill-current text-rose-400" />
                    <span>Stop Preview</span>
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5 fill-current text-cyan-400" />
                    <span>Preview Voice Sample</span>
                  </>
                )}
              </button>
            </div>

            {/* Quick Voice Picker Dropdown Modal */}
            {isVoicePickerOpen && (
              <div className="mt-4 p-3 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between text-xs pb-2 border-b border-slate-800">
                  <span className="font-semibold text-slate-300">Choose from {allVoices.length} Voices</span>
                  <div className="flex space-x-1">
                    <button
                      onClick={() => setVoiceFilterLang('all')}
                      className={`px-2 py-0.5 rounded text-[11px] ${
                        voiceFilterLang === 'all' ? 'bg-brand-600 text-white' : 'text-slate-400'
                      }`}
                    >
                      All
                    </button>
                    <button
                      onClick={() => setVoiceFilterLang('ta')}
                      className={`px-2 py-0.5 rounded text-[11px] ${
                        voiceFilterLang === 'ta' ? 'bg-brand-600 text-white font-tamil' : 'text-slate-400'
                      }`}
                    >
                      தமிழ்
                    </button>
                    <button
                      onClick={() => setVoiceFilterLang('en')}
                      className={`px-2 py-0.5 rounded text-[11px] ${
                        voiceFilterLang === 'en' ? 'bg-brand-600 text-white' : 'text-slate-400'
                      }`}
                    >
                      Eng
                    </button>
                  </div>
                </div>

                {/* Gender quick tabs */}
                <div className="flex space-x-2 text-xs">
                  <button
                    onClick={() => setVoiceFilterGender('all')}
                    className={`flex-1 py-1 rounded-lg text-center text-[11px] border ${
                      voiceFilterGender === 'all'
                        ? 'bg-slate-800 text-white border-slate-700'
                        : 'border-slate-800/80 text-slate-500'
                    }`}
                  >
                    All Genders
                  </button>
                  <button
                    onClick={() => setVoiceFilterGender('male')}
                    className={`flex-1 py-1 rounded-lg text-center text-[11px] border ${
                      voiceFilterGender === 'male'
                        ? 'bg-sky-500/20 text-sky-300 border-sky-500/30'
                        : 'border-slate-800/80 text-slate-500'
                    }`}
                  >
                    Male
                  </button>
                  <button
                    onClick={() => setVoiceFilterGender('female')}
                    className={`flex-1 py-1 rounded-lg text-center text-[11px] border ${
                      voiceFilterGender === 'female'
                        ? 'bg-pink-500/20 text-pink-300 border-pink-500/30'
                        : 'border-slate-800/80 text-slate-500'
                    }`}
                  >
                    Female
                  </button>
                </div>

                {/* Voice List Scroll */}
                <div className="max-h-56 overflow-y-auto space-y-1.5 custom-scrollbar pr-1">
                  {filteredVoices.map((v) => {
                    const isSelected = selectedVoice.id === v.id;
                    const isPlaying = previewingVoiceId === v.id;
                    return (
                      <div
                        key={v.id}
                        onClick={() => {
                          onSelectVoice(v);
                          setIsVoicePickerOpen(false);
                        }}
                        className={`p-2.5 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                          isSelected
                            ? 'bg-cyan-950/40 border-cyan-500/40'
                            : 'bg-slate-900/80 border-slate-800/80 hover:bg-slate-800/60'
                        }`}
                      >
                        <div className="min-w-0 flex items-center space-x-2">
                          <div
                            className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-[10px] ${
                              v.gender === 'male'
                                ? 'bg-sky-500/20 text-sky-400'
                                : 'bg-pink-500/20 text-pink-400'
                            }`}
                          >
                            {v.name.slice(0, 2).toUpperCase()}
                          </div>
                          <div className="truncate">
                            <div className="text-xs font-bold text-white truncate">{v.name}</div>
                            <div className="text-[10px] text-slate-400 truncate">
                              {v.language === 'ta' ? 'தமிழ்' : 'English'} • {v.accent}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center space-x-1">
                          <button
                            onClick={(e) => handlePlayVoicePreview(v, e)}
                            className="p-1 rounded-md text-slate-400 hover:text-cyan-300"
                            title="Preview"
                          >
                            {isPlaying ? (
                              <Square className="w-3.5 h-3.5 fill-current text-rose-400" />
                            ) : (
                              <Play className="w-3.5 h-3.5 fill-current text-cyan-400" />
                            )}
                          </button>
                          {isSelected && <Check className="w-4 h-4 text-cyan-400" />}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Acoustic Controls Card */}
          <div className="bg-[#0f172a] border border-slate-800 rounded-3xl p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-cyan-400" />
                <span>Acoustic Fine-Tuning</span>
              </span>
              <button
                onClick={() => {
                  setSpeed(1.0);
                  setPitch(1.0);
                  setStability(75);
                  setClarity(85);
                  setEmotion('neutral');
                }}
                className="text-[11px] text-slate-500 hover:text-slate-300 flex items-center space-x-1"
                title="Reset to default"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset</span>
              </button>
            </div>

            {/* Speed Slider */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-slate-300">Speaking Speed (வேகம்)</span>
                <span className="font-mono text-cyan-400">{speed.toFixed(2)}x</span>
              </div>
              <input
                type="range"
                min={0.5}
                max={2.0}
                step={0.05}
                value={speed}
                onChange={(e) => setSpeed(parseFloat(e.target.value))}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
              />
              <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                <span>0.5x Slow</span>
                <span>1.0x Normal</span>
                <span>2.0x Fast</span>
              </div>
            </div>

            {/* Pitch Slider */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-slate-300">Vocal Pitch (குரல் சுருதி)</span>
                <span className="font-mono text-brand-400">{pitch.toFixed(2)}</span>
              </div>
              <input
                type="range"
                min={0.6}
                max={1.4}
                step={0.05}
                value={pitch}
                onChange={(e) => setPitch(parseFloat(e.target.value))}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-brand-500"
              />
              <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                <span>Deeper</span>
                <span>Neutral</span>
                <span>Higher</span>
              </div>
            </div>

            {/* Stability Slider */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-slate-300">Stability / Consistency</span>
                <span className="font-mono text-slate-400">{stability}%</span>
              </div>
              <input
                type="range"
                min={20}
                max={100}
                step={5}
                value={stability}
                onChange={(e) => setStability(parseInt(e.target.value))}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-400"
              />
            </div>

            {/* Emotion / Style selector */}
            <div className="space-y-1.5 pt-1">
              <label className="text-xs text-slate-300">Emotion & Delivery Style</label>
              <div className="grid grid-cols-3 gap-1.5">
                {(['neutral', 'cheerful', 'dramatic', 'serious', 'whisper'] as const).map((style) => (
                  <button
                    key={style}
                    onClick={() => setEmotion(style)}
                    className={`py-1.5 px-2 rounded-lg text-xs capitalize transition-colors ${
                      emotion === style
                        ? 'bg-brand-600 text-white font-semibold'
                        : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                    }`}
                  >
                    {style}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
