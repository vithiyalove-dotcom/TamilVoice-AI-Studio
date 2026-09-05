import React, { useState } from 'react';
import {
  Mic,
  Sparkles,
  Play,
  Volume2,
  CopyPlus,
  FolderKanban,
  CheckCircle2,
  Clock,
  ArrowRight,
  TrendingUp,
  Cpu,
  Layers
} from 'lucide-react';
import { GeneratedProject, PageView, Voice } from '../types';
import { PRESET_VOICES } from '../data/presetVoices';
import { AudioSynthesizer } from '../services/audioSynthesizer';

interface DashboardProps {
  onNavigate: (page: PageView) => void;
  onSelectVoiceForTts: (voice: Voice) => void;
  projects: GeneratedProject[];
  clonedVoices: Voice[];
}

export const Dashboard: React.FC<DashboardProps> = ({
  onNavigate,
  onSelectVoiceForTts,
  projects,
  clonedVoices,
}) => {
  const [playingVoiceId, setPlayingVoiceId] = useState<string | null>(null);

  const totalVoicesCount = PRESET_VOICES.length + clonedVoices.length;
  const tamilVoicesCount = PRESET_VOICES.filter((v) => v.language === 'ta').length + clonedVoices.filter((v) => v.language === 'ta').length;
  const englishVoicesCount = PRESET_VOICES.filter((v) => v.language === 'en').length + clonedVoices.filter((v) => v.language === 'en').length;

  const totalDurationMinutes = Math.round(
    projects.reduce((acc, p) => acc + (p.audioDuration || 0), 0) / 60
  );

  const handlePlayVoice = (voice: Voice) => {
    const synth = AudioSynthesizer.getInstance();
    if (playingVoiceId === voice.id) {
      synth.stopSpeaking();
      setPlayingVoiceId(null);
      return;
    }

    setPlayingVoiceId(voice.id);
    synth.speakDemo(voice.sampleText, voice, {
      onEnd: () => setPlayingVoiceId(null),
      onError: () => setPlayingVoiceId(null),
    });
  };

  const featuredTamil = PRESET_VOICES.filter((v) => v.language === 'ta').slice(0, 2);
  const featuredEnglish = PRESET_VOICES.filter((v) => v.language === 'en').slice(0, 2);

  return (
    <div className="space-y-8 pb-12">
      {/* Hero Studio Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-950/80 via-slate-900 to-[#090e1a] border border-indigo-500/20 p-6 sm:p-8 shadow-2xl">
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-brand-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-500/30 text-xs font-semibold text-indigo-300 mb-4">
            <Sparkles className="w-3.5 h-3.5 text-cyan-300 animate-spin" style={{ animationDuration: '6s' }} />
            <span>Next-Gen Tamil & English AI Voice Synthesis</span>
          </div>

          <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
            Bring Words to Life with{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-brand-300 to-indigo-400">
              Natural Tamil & English
            </span>{' '}
            Vocal AI
          </h2>

          <p className="mt-3 text-sm sm:text-base text-slate-300 leading-relaxed font-normal">
            Generate lifelike Tamil speech, cross-lingual translation audio, and custom cloned voice models.
            Studio-grade acoustic nuance built for creators, educators, and enterprise media.
          </p>

          {/* Quick CTAs */}
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <button
              onClick={() => onNavigate('text-to-speech')}
              className="py-3 px-5 rounded-xl bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white font-semibold text-sm flex items-center space-x-2 shadow-lg shadow-brand-600/30 transition-all hover:scale-105 active:scale-95"
            >
              <Mic className="w-4 h-4 text-cyan-300" />
              <span>Launch Text to Speech</span>
              <ArrowRight className="w-4 h-4 ml-1" />
            </button>

            <button
              onClick={() => onNavigate('voice-cloning')}
              className="py-3 px-5 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-slate-200 hover:text-white font-semibold text-sm border border-slate-700 flex items-center space-x-2 transition-all"
            >
              <CopyPlus className="w-4 h-4 text-amber-400" />
              <span>Clone a Voice</span>
            </button>

            <button
              onClick={() => onNavigate('voice-library')}
              className="py-3 px-4 rounded-xl text-slate-400 hover:text-white text-sm font-medium transition-colors"
            >
              Explore Voice Library ({totalVoicesCount})
            </button>
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#0f172a]/90 border border-slate-800 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Available Voices</span>
            <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400">
              <Volume2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-white">{totalVoicesCount}</div>
          <div className="mt-1 text-xs text-slate-400 flex items-center space-x-2">
            <span className="text-cyan-400 font-medium">{tamilVoicesCount} Tamil</span>
            <span>•</span>
            <span className="text-indigo-400 font-medium">{englishVoicesCount} English</span>
          </div>
        </div>

        <div className="bg-[#0f172a]/90 border border-slate-800 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Projects Generated</span>
            <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400">
              <FolderKanban className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-white">{projects.length}</div>
          <div className="mt-1 text-xs text-slate-400 flex items-center space-x-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>Ready for export</span>
          </div>
        </div>

        <div className="bg-[#0f172a]/90 border border-slate-800 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Audio Synthesized</span>
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-white">
            {totalDurationMinutes > 0 ? `${totalDurationMinutes}m` : 'Live'}
          </div>
          <div className="mt-1 text-xs text-slate-400 flex items-center space-x-1">
            <TrendingUp className="w-3.5 h-3.5 text-cyan-400" />
            <span>44.1kHz High-Fidelity</span>
          </div>
        </div>

        <div className="bg-[#0f172a]/90 border border-slate-800 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Acoustic Engine</span>
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
              <Cpu className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-bold text-emerald-400 truncate">Dual Model</div>
          <div className="mt-1 text-xs text-slate-400 flex items-center space-x-1">
            <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" />
            <span>Tamil & English Ready</span>
          </div>
        </div>
      </div>

      {/* Featured Voices Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
              <Layers className="w-4 h-4 text-cyan-400" />
              <span>Featured Neural Voices</span>
            </h3>
            <p className="text-xs text-slate-400 font-tamil">
              உடனடி மாதிரிக்காட்சி (Instant preview before generation)
            </p>
          </div>

          <button
            onClick={() => onNavigate('voice-library')}
            className="text-xs font-semibold text-brand-400 hover:text-brand-300 flex items-center space-x-1"
          >
            <span>View All</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...featuredTamil, ...featuredEnglish].map((voice) => {
            const isPlaying = playingVoiceId === voice.id;
            return (
              <div
                key={voice.id}
                className="bg-[#0f172a] border border-slate-800 hover:border-slate-700/80 rounded-2xl p-4 flex flex-col justify-between transition-all"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-2.5">
                      <div
                        className={`w-9 h-9 rounded-lg flex items-center justify-center font-bold text-xs ${
                          voice.gender === 'male'
                            ? 'bg-sky-500/20 text-sky-400 border border-sky-500/30'
                            : 'bg-pink-500/20 text-pink-400 border border-pink-500/30'
                        }`}
                      >
                        {voice.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-white">{voice.name}</h4>
                        <div className="text-[11px] text-slate-400 font-tamil">
                          {voice.nativeName || voice.accent}
                        </div>
                      </div>
                    </div>

                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                        voice.language === 'ta'
                          ? 'bg-amber-500/10 text-amber-300'
                          : 'bg-indigo-500/10 text-indigo-300'
                      }`}
                    >
                      {voice.language === 'ta' ? 'தமிழ்' : 'English'}
                    </span>
                  </div>

                  <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed mb-3">
                    {voice.description}
                  </p>
                </div>

                <div className="flex items-center space-x-2 pt-2 border-t border-slate-800/80">
                  <button
                    onClick={() => handlePlayVoice(voice)}
                    className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold flex items-center justify-center space-x-1.5 transition-colors ${
                      isPlaying
                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                        : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                    }`}
                  >
                    <Play className="w-3 h-3 fill-current text-cyan-400" />
                    <span>{isPlaying ? 'Stop' : 'Preview'}</span>
                  </button>

                  <button
                    onClick={() => {
                      onSelectVoiceForTts(voice);
                      onNavigate('text-to-speech');
                    }}
                    className="py-1.5 px-3 rounded-lg text-xs font-semibold bg-brand-600/80 hover:bg-brand-500 text-white transition-colors"
                  >
                    Use
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent Projects Table / Standby */}
      <div className="bg-[#0f172a] border border-slate-800 rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-white tracking-tight">Recent Audio Generations</h3>
            <p className="text-xs text-slate-400">Recently synthesized audio files</p>
          </div>

          {projects.length > 0 && (
            <button
              onClick={() => onNavigate('my-projects')}
              className="text-xs font-semibold text-brand-400 hover:text-brand-300 flex items-center space-x-1"
            >
              <span>View All ({projects.length})</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {projects.length === 0 ? (
          <div className="text-center py-10 border border-dashed border-slate-800/80 rounded-xl">
            <Mic className="w-10 h-10 text-slate-600 mx-auto mb-2" />
            <p className="text-sm font-medium text-slate-300">No audio projects created yet</p>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
              Start by typing Tamil or English text in the Text to Speech studio.
            </p>
            <button
              onClick={() => onNavigate('text-to-speech')}
              className="mt-4 py-2 px-4 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-semibold text-xs transition-colors"
            >
              Create First Project
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {projects.slice(0, 4).map((p) => (
              <div
                key={p.id}
                className="flex items-center justify-between p-3 rounded-xl bg-slate-900/60 border border-slate-800/60 hover:border-slate-700/60 transition-colors"
              >
                <div className="min-w-0 flex-1 pr-3">
                  <div className="flex items-center space-x-2">
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                        p.language === 'ta'
                          ? 'bg-amber-500/10 text-amber-300'
                          : 'bg-indigo-500/10 text-indigo-300'
                      }`}
                    >
                      {p.language === 'ta' ? 'தமிழ்' : 'English'}
                    </span>
                    <span className="text-xs font-medium text-slate-400 truncate">
                      Voice: {p.voice?.name}
                    </span>
                  </div>
                  <h4 className="text-xs sm:text-sm font-semibold text-slate-200 truncate mt-1">
                    {p.title}
                  </h4>
                </div>

                <div className="flex items-center space-x-2">
                  <span className="text-xs text-slate-400 font-mono hidden sm:inline">
                    {p.audioDuration}s
                  </span>
                  <button
                    onClick={() => onNavigate('my-projects')}
                    className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors text-xs font-medium"
                  >
                    Open
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
