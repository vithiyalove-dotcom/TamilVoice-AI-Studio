import React, { useState } from 'react';
import {
  Settings as SettingsIcon,
  Cpu,
  Key,
  Volume2,
  Check,
  Save,
  RotateCcw,
  Sparkles
} from 'lucide-react';
import { StudioSettings } from '../types';
import { StorageService } from '../services/storageService';

interface SettingsProps {
  settings: StudioSettings;
  onUpdateSettings: (newSettings: StudioSettings) => void;
}

export const Settings: React.FC<SettingsProps> = ({
  settings: initialSettings,
  onUpdateSettings,
}) => {
  const [settings, setSettings] = useState<StudioSettings>(initialSettings);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);

  const handleSave = () => {
    StorageService.saveSettings(settings);
    onUpdateSettings(settings);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  const handleReset = () => {
    const defaultSettings: StudioSettings = {
      activeEngine: 'browser-demo',
      indicTtsUrl: 'http://localhost:8000/api/tts',
      elevenLabsApiKey: '',
      azureSpeechKey: '',
      azureRegion: 'southeastasia',
      customEndpointUrl: '',
      defaultAudioFormat: 'mp3',
      sampleRate: '44100',
      accentTheme: 'indigo',
      autoPlayAfterGenerate: true,
    };
    setSettings(defaultSettings);
    StorageService.saveSettings(defaultSettings);
    onUpdateSettings(defaultSettings);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#0f172a] border border-slate-800 rounded-3xl p-6 shadow-xl">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <SettingsIcon className="w-5 h-5 text-cyan-400" />
            <span>Studio Engine & Audio Settings</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1 font-tamil">
            குரல் என்ஜின், ஏபிஐ விசை மற்றும் ஒலி அமைப்புகளை உள்ளமைக்கவும்
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={handleReset}
            className="py-2 px-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white text-xs font-semibold border border-slate-800 transition-colors flex items-center space-x-1"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>

          <button
            onClick={handleSave}
            className="py-2 px-5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold shadow-lg shadow-brand-600/30 flex items-center space-x-1.5 transition-all active:scale-95"
          >
            {saveSuccess ? (
              <>
                <Check className="w-4 h-4 text-emerald-300" />
                <span>Saved!</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Save Settings</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Voice Synthesis Engine Selection */}
      <div className="bg-[#0f172a] border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
        <div>
          <h3 className="text-base font-bold text-white flex items-center space-x-2">
            <Cpu className="w-4 h-4 text-cyan-400" />
            <span>Active Speech Synthesis Engine</span>
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Switch between in-browser demo synthesis and production neural speech engines.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
          {/* Local Piper AI Engine */}
          <div
            onClick={() => setSettings({ ...settings, activeEngine: 'piper-local' })}
            className={`cursor-pointer p-4 rounded-2xl border transition-all ${
              settings.activeEngine === 'piper-local'
                ? 'bg-gradient-to-b from-cyan-950/60 to-slate-900 border-cyan-400/80 shadow-md ring-1 ring-cyan-400/40'
                : 'bg-slate-950 border-slate-800 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
                Local AI (Active)
              </span>
              {settings.activeEngine === 'piper-local' && (
                <Check className="w-4 h-4 text-cyan-400" />
              )}
            </div>
            <h4 className="text-sm font-bold text-white">Local Piper Neural Engine</h4>
            <p className="text-xs text-slate-400 mt-1">
              Real neural speech synthesis running on local Python backend at http://127.0.0.1:8001.
            </p>
          </div>

          {/* Browser Demo Engine */}
          <div
            onClick={() => setSettings({ ...settings, activeEngine: 'browser-demo' })}
            className={`cursor-pointer p-4 rounded-2xl border transition-all ${
              settings.activeEngine === 'browser-demo'
                ? 'bg-gradient-to-b from-indigo-950/60 to-slate-900 border-indigo-400/80 shadow-md ring-1 ring-indigo-400/40'
                : 'bg-slate-950 border-slate-800 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                Browser Fallback
              </span>
              {settings.activeEngine === 'browser-demo' && (
                <Check className="w-4 h-4 text-indigo-400" />
              )}
            </div>
            <h4 className="text-sm font-bold text-white">Browser Demo Engine</h4>
            <p className="text-xs text-slate-400 mt-1">
              Fallback demo speech synthesis using browser SpeechSynthesis with system voices.
            </p>
          </div>

          {/* IndicTTS Engine */}
          <div
            onClick={() => setSettings({ ...settings, activeEngine: 'indictts-local' })}
            className={`cursor-pointer p-4 rounded-2xl border transition-all ${
              settings.activeEngine === 'indictts-local'
                ? 'bg-gradient-to-b from-amber-950/40 to-slate-900 border-amber-400/80 shadow-md ring-1 ring-amber-400/40'
                : 'bg-slate-950 border-slate-800 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20">
                Tamil AI Engine
              </span>
              {settings.activeEngine === 'indictts-local' && (
                <Check className="w-4 h-4 text-amber-400" />
              )}
            </div>
            <h4 className="text-sm font-bold text-white">IndicTTS / Local Server</h4>
            <p className="text-xs text-slate-400 mt-1">
              High accuracy Tamil & Indian English neural TTS (IITM / AI4Bharat model API).
            </p>
          </div>

          {/* ElevenLabs Engine */}
          <div
            onClick={() => setSettings({ ...settings, activeEngine: 'elevenlabs-api' })}
            className={`cursor-pointer p-4 rounded-2xl border transition-all ${
              settings.activeEngine === 'elevenlabs-api'
                ? 'bg-gradient-to-b from-purple-950/40 to-slate-900 border-purple-400/80 shadow-md ring-1 ring-purple-400/40'
                : 'bg-slate-950 border-slate-800 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-purple-500/10 text-purple-300 border border-purple-500/20">
                Cloud AI
              </span>
              {settings.activeEngine === 'elevenlabs-api' && (
                <Check className="w-4 h-4 text-purple-400" />
              )}
            </div>
            <h4 className="text-sm font-bold text-white">ElevenLabs Multilingual</h4>
            <p className="text-xs text-slate-400 mt-1">
              Multilingual v2 neural cloud engine with ultra-expressive emotional delivery.
            </p>
          </div>
        </div>

        {/* API Credentials Input Form */}
        <div className="pt-4 border-t border-slate-800 space-y-4">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <Key className="w-3.5 h-3.5 text-cyan-400" />
            <span>Engine Configuration & Credentials</span>
          </div>

          {settings.activeEngine === 'indictts-local' && (
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">
                IndicTTS / FastSpeech2 API Endpoint URL
              </label>
              <input
                type="text"
                value={settings.indicTtsUrl}
                onChange={(e) => setSettings({ ...settings, indicTtsUrl: e.target.value })}
                placeholder="http://localhost:8000/api/tts"
                className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-amber-400"
              />
              <p className="text-[11px] text-slate-500">
                Point to your local PyTorch or Dockerized IndicTTS / FastSpeech2 inference server.
              </p>
            </div>
          )}

          {settings.activeEngine === 'elevenlabs-api' && (
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">
                ElevenLabs API Key
              </label>
              <input
                type="password"
                value={settings.elevenLabsApiKey}
                onChange={(e) => setSettings({ ...settings, elevenLabsApiKey: e.target.value })}
                placeholder="xi_api_key_..."
                className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-purple-400"
              />
              <p className="text-[11px] text-slate-500">
                Stored securely in your local browser storage.
              </p>
            </div>
          )}

          {settings.activeEngine === 'browser-demo' && (
            <div className="p-3.5 rounded-2xl bg-cyan-950/30 border border-cyan-500/20 text-xs text-cyan-200 flex items-start space-x-2.5">
              <Sparkles className="w-4 h-4 text-cyan-400 mt-0.5 flex-shrink-0" />
              <span>
                Browser Demo Engine is active. Voice previews and generated speech files use in-browser speech synthesis and Web Audio acoustic buffers. No external API keys or credentials required!
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Audio Export & Quality Preferences */}
      <div className="bg-[#0f172a] border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
        <div>
          <h3 className="text-base font-bold text-white flex items-center space-x-2">
            <Volume2 className="w-4 h-4 text-brand-400" />
            <span>Audio Quality & Export Preferences</span>
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Configure default sample rates, containers, and playback behavior.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          {/* Default Audio Format */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-300">Default File Format</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setSettings({ ...settings, defaultAudioFormat: 'mp3' })}
                className={`py-2 px-3 rounded-xl text-xs font-semibold border ${
                  settings.defaultAudioFormat === 'mp3'
                    ? 'bg-brand-600 text-white border-brand-500'
                    : 'bg-slate-950 border-slate-800 text-slate-400'
                }`}
              >
                MP3 (Compressed 192kbps)
              </button>
              <button
                type="button"
                onClick={() => setSettings({ ...settings, defaultAudioFormat: 'wav' })}
                className={`py-2 px-3 rounded-xl text-xs font-semibold border ${
                  settings.defaultAudioFormat === 'wav'
                    ? 'bg-brand-600 text-white border-brand-500'
                    : 'bg-slate-950 border-slate-800 text-slate-400'
                }`}
              >
                WAV (Lossless 16-bit PCM)
              </button>
            </div>
          </div>

          {/* Sample Rate */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-300">Sample Rate</label>
            <div className="grid grid-cols-3 gap-2">
              {(['24000', '44100', '48000'] as const).map((sr) => (
                <button
                  key={sr}
                  type="button"
                  onClick={() => setSettings({ ...settings, sampleRate: sr })}
                  className={`py-2 px-2 rounded-xl text-xs font-mono font-semibold border ${
                    settings.sampleRate === sr
                      ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                      : 'bg-slate-950 border-slate-800 text-slate-400'
                  }`}
                >
                  {sr === '44100' ? '44.1 kHz' : sr === '48000' ? '48.0 kHz' : '24.0 kHz'}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Auto Play Option */}
        <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-white">Auto-Play After Generation</div>
            <div className="text-[11px] text-slate-400">
              Automatically trigger audio playback once audio synthesis finishes.
            </div>
          </div>
          <input
            type="checkbox"
            checked={settings.autoPlayAfterGenerate}
            onChange={(e) =>
              setSettings({ ...settings, autoPlayAfterGenerate: e.target.checked })
            }
            className="rounded border-slate-700 text-brand-500 focus:ring-0 w-4 h-4 bg-slate-900"
          />
        </div>
      </div>
    </div>
  );
};
