import React, { useState } from 'react';
import {
  BookmarkCheck,
  Plus,
  Play,
  Square,
  Trash2,
  Sparkles,
  Volume2,
  CheckCircle2
} from 'lucide-react';
import { PageView, Voice } from '../types';
import { AudioSynthesizer } from '../services/audioSynthesizer';

interface MyVoicesProps {
  clonedVoices: Voice[];
  onSelectVoice: (voice: Voice) => void;
  onNavigate: (page: PageView) => void;
  onDeleteClonedVoice: (voiceId: string) => void;
}

export const MyVoices: React.FC<MyVoicesProps> = ({
  clonedVoices,
  onSelectVoice,
  onNavigate,
  onDeleteClonedVoice,
}) => {
  const [previewingVoiceId, setPreviewingVoiceId] = useState<string | null>(null);

  const handlePlayVoice = (voice: Voice) => {
    const synth = AudioSynthesizer.getInstance();
    if (previewingVoiceId === voice.id) {
      synth.stopSpeaking();
      setPreviewingVoiceId(null);
      return;
    }

    setPreviewingVoiceId(voice.id);
    synth.speakDemo(voice.sampleText, voice, {
      onEnd: () => setPreviewingVoiceId(null),
      onError: () => setPreviewingVoiceId(null),
    });
  };

  const handleUseVoice = (voice: Voice) => {
    onSelectVoice(voice);
    onNavigate('text-to-speech');
  };

  return (
    <div className="space-y-6 pb-16 max-w-6xl mx-auto">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#0f172a] border border-slate-800 rounded-3xl p-6 shadow-xl">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <BookmarkCheck className="w-5 h-5 text-cyan-400" />
            <span>My Custom Voices</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1 font-tamil">
            நீங்கள் உருவாக்கிய மற்றும் பயிற்சி செய்த தனிப்பயன் குரல்கள் ({clonedVoices.length} Models)
          </p>
        </div>

        <button
          onClick={() => onNavigate('voice-cloning')}
          className="py-2.5 px-4 rounded-xl bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white font-semibold text-xs flex items-center space-x-2 shadow-lg shadow-brand-600/25 transition-all active:scale-95"
        >
          <Plus className="w-4 h-4 text-cyan-300" />
          <span>Clone New Voice</span>
        </button>
      </div>

      {/* Voice Cards or Empty State */}
      {clonedVoices.length === 0 ? (
        <div className="bg-[#0f172a] border border-dashed border-slate-800 rounded-3xl p-12 text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center mx-auto text-slate-500">
            <Volume2 className="w-8 h-8 opacity-40 text-cyan-400" />
          </div>

          <div>
            <h3 className="text-base font-bold text-white">No Custom Voices Yet</h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto mt-1">
              You haven't cloned any custom voice models. Upload an audio sample or record your microphone to build a personalized speaker profile.
            </p>
          </div>

          <div className="pt-2">
            <button
              onClick={() => onNavigate('voice-cloning')}
              className="py-2.5 px-5 rounded-xl bg-gradient-to-r from-brand-600 to-cyan-600 hover:from-brand-500 hover:to-cyan-500 text-white font-bold text-xs shadow-lg shadow-brand-600/30 inline-flex items-center space-x-2"
            >
              <Sparkles className="w-4 h-4 text-cyan-200" />
              <span>Clone Your First Voice</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {clonedVoices.map((voice) => {
            const isPlaying = previewingVoiceId === voice.id;
            return (
              <div
                key={voice.id}
                className="bg-[#0f172a] border border-slate-800 hover:border-slate-700 rounded-3xl p-5 shadow-lg flex flex-col justify-between transition-all"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex items-center space-x-3">
                      <div
                        className={`w-11 h-11 rounded-xl flex items-center justify-center font-bold text-sm text-white shadow-md ${
                          voice.gender === 'male'
                            ? 'bg-gradient-to-tr from-sky-600 to-indigo-600'
                            : 'bg-gradient-to-tr from-pink-500 to-violet-600'
                        }`}
                      >
                        {voice.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-white truncate">{voice.name}</h4>
                        <div className="text-[11px] text-slate-400 font-tamil truncate">
                          {voice.nativeName || voice.accent}
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => onDeleteClonedVoice(voice.id)}
                      className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors"
                      title="Delete voice profile"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Badges */}
                  <div className="flex flex-wrap items-center gap-1.5 mb-3">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center space-x-1">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>Ready</span>
                    </span>

                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                        voice.language === 'ta'
                          ? 'bg-amber-500/20 text-amber-300'
                          : 'bg-indigo-500/20 text-indigo-300'
                      }`}
                    >
                      {voice.language === 'ta' ? 'தமிழ்' : 'English'}
                    </span>

                    <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                      {voice.gender === 'male' ? 'Male' : 'Female'}
                    </span>
                  </div>

                  <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed mb-3">
                    {voice.description}
                  </p>

                  <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800/80 text-[11px] text-slate-300 italic mb-4">
                    “{voice.sampleText}”
                  </div>
                </div>

                <div className="flex items-center space-x-2 pt-3 border-t border-slate-800/80">
                  <button
                    onClick={() => handlePlayVoice(voice)}
                    className={`flex-1 py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center space-x-1.5 transition-colors ${
                      isPlaying
                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                        : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                    }`}
                  >
                    {isPlaying ? (
                      <>
                        <Square className="w-3 h-3 fill-current text-rose-400" />
                        <span>Stop</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-3 h-3 fill-current text-cyan-400" />
                        <span>Preview</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => handleUseVoice(voice)}
                    className="flex-1 py-2 px-3 rounded-xl text-xs font-semibold bg-brand-600 hover:bg-brand-500 text-white flex items-center justify-center space-x-1 transition-colors"
                  >
                    <Sparkles className="w-3 h-3" />
                    <span>Use in TTS</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
