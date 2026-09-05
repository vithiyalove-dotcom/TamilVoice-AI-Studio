import React from 'react';
import { Play, Square, Star, Sparkles, Check, AlertCircle, Cpu } from 'lucide-react';
import { Voice } from '../../types';
import { VoiceDetectionService } from '../../services/voiceDetectionService';

interface VoiceCardProps {
  voice: Voice;
  isSelected?: boolean;
  isPlayingPreview?: boolean;
  isFavorite?: boolean;
  onSelectVoice?: (voice: Voice) => void;
  onPlayPreview: (voice: Voice) => void;
  onToggleFavorite?: (voiceId: string) => void;
}

export const VoiceCard: React.FC<VoiceCardProps> = ({
  voice,
  isSelected = false,
  isPlayingPreview = false,
  isFavorite = false,
  onSelectVoice,
  onPlayPreview,
  onToggleFavorite,
}) => {
  const isTamil = voice.language === 'ta';
  const isMale = voice.gender === 'male';

  const resolution = VoiceDetectionService.getInstance().resolveVoice(voice);

  return (
    <div
      className={`group relative rounded-2xl border transition-all duration-200 overflow-hidden flex flex-col justify-between ${
        isSelected
          ? 'bg-gradient-to-b from-[#162034] to-[#0f172a] border-cyan-400/80 shadow-lg shadow-cyan-500/10 ring-1 ring-cyan-400/50'
          : 'bg-[#0f172a]/90 hover:bg-[#131d33] border-slate-800 hover:border-slate-700/80 shadow-md'
      }`}
    >
      {/* Top Bar */}
      <div className="p-4 sm:p-5 pb-3">
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex items-center space-x-3 min-w-0">
            {/* Avatar Pill / Icon */}
            <div
              className={`w-11 h-11 rounded-xl flex items-center justify-center font-bold text-sm tracking-wider shadow-inner ${
                isMale
                  ? 'bg-gradient-to-tr from-sky-600 to-indigo-500 text-white'
                  : 'bg-gradient-to-tr from-pink-500 to-violet-500 text-white'
              }`}
            >
              {voice.name.slice(0, 2).toUpperCase()}
            </div>

            <div className="min-w-0">
              <div className="flex items-center space-x-2">
                <h3 className="text-sm sm:text-base font-bold text-white truncate">
                  {voice.name}
                </h3>
                {voice.isCloned && (
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    CLONED
                  </span>
                )}
              </div>
              {voice.nativeName && (
                <div className="text-xs font-tamil text-slate-400 truncate">
                  {voice.nativeName}
                </div>
              )}
            </div>
          </div>

          {/* Favorite Toggle */}
          {onToggleFavorite && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleFavorite(voice.id);
              }}
              className={`p-1.5 rounded-lg transition-colors ${
                isFavorite
                  ? 'text-amber-400 bg-amber-400/10'
                  : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800'
              }`}
              title="Bookmark voice"
            >
              <Star className="w-4 h-4 fill-current" />
            </button>
          )}
        </div>

        {/* Badges: Language, Gender, Accent */}
        <div className="flex flex-wrap items-center gap-1.5 mb-2.5">
          <span
            className={`text-[11px] font-semibold px-2 py-0.5 rounded-md border ${
              isTamil
                ? 'bg-amber-500/10 text-amber-300 border-amber-500/20'
                : 'bg-indigo-500/10 text-indigo-300 border-indigo-500/20'
            }`}
          >
            {isTamil ? 'தமிழ் (Tamil)' : 'English'}
          </span>

          <span className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-slate-800/80 text-slate-300 border border-slate-700/60">
            {isMale ? 'Male' : 'Female'}
          </span>

          <span className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-slate-800/80 text-slate-400 border border-slate-700/60">
            {voice.accent}
          </span>
        </div>

        {/* System Voice Mapping debug / status badge */}
        <div className="mb-2.5 flex items-center gap-1 text-[11px] text-slate-400 bg-slate-950/70 p-1.5 rounded-lg border border-slate-800/80">
          <Cpu className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" />
          <span className="truncate">
            System Voice: <strong className="text-slate-200">{resolution.detectedName}</strong>
          </span>
        </div>

        {/* Warning if no distinct female voice is installed */}
        {resolution.warningMessage && (
          <div className="mb-3 p-2 rounded-lg bg-amber-950/30 border border-amber-500/25 text-[11px] text-amber-300 flex items-start space-x-1.5 leading-snug">
            <AlertCircle className="w-3.5 h-3.5 text-amber-400 flex-shrink-0 mt-0.5" />
            <span>{resolution.warningMessage}</span>
          </div>
        )}

        {/* Description */}
        <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed mb-3">
          {voice.description}
        </p>

        {/* Sample text preview quote */}
        <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80 text-[11px] text-slate-300 italic">
          <span className="text-slate-500 mr-1 font-serif">“</span>
          <span className={isTamil ? 'font-tamil' : ''}>{voice.sampleText}</span>
          <span className="text-slate-500 ml-1 font-serif">”</span>
        </div>
      </div>

      {/* Card Footer Actions */}
      <div className="p-4 sm:p-5 pt-0 mt-2 flex items-center justify-between gap-2 border-t border-slate-800/60 pt-3 bg-slate-900/40">
        {/* Play Preview Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onPlayPreview(voice);
          }}
          className={`flex-1 py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center space-x-1.5 transition-all ${
            isPlayingPreview
              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
              : 'bg-slate-800 hover:bg-slate-700/90 text-slate-200 border border-slate-700 hover:text-white'
          }`}
        >
          {isPlayingPreview ? (
            <>
              <Square className="w-3.5 h-3.5 fill-current text-rose-400" />
              <span>Stop Speech</span>
            </>
          ) : (
            <>
              <Play className="w-3.5 h-3.5 fill-current text-cyan-400" />
              <span>Play Preview</span>
            </>
          )}
        </button>

        {/* Select Voice / Use in Studio Button */}
        {onSelectVoice && (
          <button
            onClick={() => onSelectVoice(voice)}
            className={`py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center space-x-1 transition-all ${
              isSelected
                ? 'bg-cyan-500 text-slate-950 font-bold shadow-md shadow-cyan-500/20'
                : 'bg-brand-600 hover:bg-brand-500 text-white shadow-md shadow-brand-600/20'
            }`}
          >
            {isSelected ? (
              <>
                <Check className="w-3.5 h-3.5 stroke-[3]" />
                <span>Selected</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5" />
                <span>Use Voice</span>
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
};
