import React, { useEffect, useRef, useState } from 'react';
import {
  Play,
  Pause,
  Download,
  RotateCcw,
  Volume2,
  VolumeX,
  BookmarkPlus,
  Check,
  Music2,
  AlertTriangle,
  Cpu
} from 'lucide-react';
import { Voice } from '../../types';
import { WaveformVisualizer } from './WaveformVisualizer';
import { AudioSynthesizer } from '../../services/audioSynthesizer';

interface AudioPlayerProps {
  audioUrl: string | null;
  duration?: number;
  voice?: Voice;
  title?: string;
  spokenText?: string;
  systemVoiceUsed?: string;
  systemVoiceWarning?: string;
  onSaveToProjects?: () => void;
  isSaved?: boolean;
}

export const AudioPlayer: React.FC<AudioPlayerProps> = ({
  audioUrl,
  duration = 0,
  voice,
  title = 'Generated Audio',
  spokenText,
  systemVoiceUsed,
  systemVoiceWarning,
  onSaveToProjects,
  isSaved = false,
}) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [totalDuration, setTotalDuration] = useState<number>(duration);
  const [playbackRate, setPlaybackRate] = useState<number>(1);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [volume, setVolume] = useState<number>(1);
  const [justSaved, setJustSaved] = useState<boolean>(false);

  useEffect(() => {
    setIsPlaying(false);
    setCurrentTime(0);
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.playbackRate = playbackRate;
    }
    if (duration > 0) {
      setTotalDuration(duration);
    }
    return () => {
      AudioSynthesizer.getInstance().stopSpeaking();
    };
  }, [audioUrl, duration, playbackRate]);

  const togglePlay = () => {
    if (isPlaying) {
      AudioSynthesizer.getInstance().stopSpeaking();
      if (audioRef.current) audioRef.current.pause();
      setIsPlaying(false);
    } else {
      // Determine if this is a real synthesized audio file (e.g. from Piper) vs a browser demo container
      const isBrowserDemoFallback =
        systemVoiceUsed?.includes('Microsoft') ||
        systemVoiceUsed?.includes('Valluvar') ||
        systemVoiceUsed?.includes('Browser Demo');

      if (isBrowserDemoFallback && spokenText && voice) {
        // Play speech via browser SpeechSynthesis for demo mode
        AudioSynthesizer.getInstance().speakDemo(spokenText, voice, {
          speed: playbackRate,
          onStart: () => {
            setIsPlaying(true);
            if (audioRef.current) {
              audioRef.current.play().catch(() => {});
            }
          },
          onEnd: () => {
            setIsPlaying(false);
            if (audioRef.current) {
              audioRef.current.currentTime = 0;
            }
            setCurrentTime(0);
          },
          onError: () => {
            setIsPlaying(false);
          }
        });
      } else if (audioRef.current) {
        // Play real Piper neural audio directly through HTMLAudioElement
        AudioSynthesizer.getInstance().stopSpeaking();
        audioRef.current.play().then(() => {
          setIsPlaying(true);
        }).catch((err) => {
          console.error('Real audio playback failed:', err);
          setIsPlaying(false);
        });
      }
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
      if (!isNaN(audioRef.current.duration) && audioRef.current.duration > 0) {
        setTotalDuration(audioRef.current.duration);
      }
    }
  };

  const handleEnded = () => {
    setIsPlaying(false);
    setCurrentTime(0);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    setCurrentTime(time);
    if (audioRef.current) {
      audioRef.current.currentTime = time;
    }
  };

  const handleRateChange = () => {
    const rates = [1, 1.25, 1.5, 0.75];
    const nextIndex = (rates.indexOf(playbackRate) + 1) % rates.length;
    const newRate = rates[nextIndex];
    setPlaybackRate(newRate);
    if (audioRef.current) {
      audioRef.current.playbackRate = newRate;
    }
    if (isPlaying) {
      AudioSynthesizer.getInstance().stopSpeaking();
      setIsPlaying(false);
    }
  };

  const toggleMute = () => {
    if (audioRef.current) {
      const nextMuted = !isMuted;
      audioRef.current.muted = nextMuted;
      setIsMuted(nextMuted);
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    if (audioRef.current) {
      audioRef.current.volume = val;
      if (val === 0) setIsMuted(true);
      else setIsMuted(false);
    }
  };

  const restartAudio = () => {
    AudioSynthesizer.getInstance().stopSpeaking();
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      setCurrentTime(0);
    }
    setIsPlaying(false);
    setTimeout(() => {
      togglePlay();
    }, 100);
  };

  const formatTime = (secs: number) => {
    if (isNaN(secs) || secs < 0) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const handleSave = () => {
    if (onSaveToProjects) {
      onSaveToProjects();
      setJustSaved(true);
      setTimeout(() => setJustSaved(false), 2500);
    }
  };

  if (!audioUrl) {
    return (
      <div className="bg-slate-900/60 border border-dashed border-slate-800 rounded-2xl p-6 flex flex-col items-center justify-center text-slate-500">
        <Music2 className="w-8 h-8 mb-2 opacity-40 text-brand-400" />
        <p className="text-sm font-medium text-slate-400">Audio player standby</p>
        <p className="text-xs text-slate-500 mt-1">
          Type Tamil or English text and click "Generate Audio" to speak and preview speech
        </p>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-b from-[#111928] to-[#0d1422] border border-slate-700/60 rounded-2xl p-4 sm:p-5 shadow-xl shadow-black/40 space-y-3">
      <audio
        ref={audioRef}
        src={audioUrl}
        onTimeUpdate={handleTimeUpdate}
        onEnded={handleEnded}
        onLoadedMetadata={() => {
          if (audioRef.current && !isNaN(audioRef.current.duration)) {
            setTotalDuration(audioRef.current.duration);
          }
        }}
      />

      {/* Header info */}
      <div className="flex items-center justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              {voice?.language === 'ta' ? 'தமிழ் Speech' : 'English Speech'}
            </span>
            {voice && (
              <span className="text-xs text-slate-400 font-medium">
                Profile: <strong className="text-slate-200">{voice.name}</strong> ({voice.gender})
              </span>
            )}
            {systemVoiceUsed && (
              <span className="text-[11px] text-indigo-300 bg-indigo-950/80 px-2 py-0.5 rounded border border-indigo-800/50 flex items-center gap-1">
                <Cpu className="w-3 h-3 text-cyan-400" />
                <span>System Voice: <strong>{systemVoiceUsed}</strong></span>
              </span>
            )}
          </div>
          <h4 className="text-sm font-semibold text-slate-200 truncate mt-1">{title}</h4>
        </div>

        {/* Action buttons */}
        <div className="flex items-center space-x-2 ml-3">
          {onSaveToProjects && (
            <button
              onClick={handleSave}
              disabled={isSaved || justSaved}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center space-x-1.5 transition-all ${
                isSaved || justSaved
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 hover:text-white'
              }`}
            >
              {isSaved || justSaved ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Saved</span>
                </>
              ) : (
                <>
                  <BookmarkPlus className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Save Project</span>
                </>
              )}
            </button>
          )}

          <a
            href={audioUrl}
            download={`TamilVoice_${Date.now()}.wav`}
            className="px-3 py-1.5 rounded-lg text-xs font-medium bg-brand-600 hover:bg-brand-500 text-white flex items-center space-x-1.5 shadow-md shadow-brand-600/30 transition-all active:scale-95"
            title="Download speech audio"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download</span>
          </a>
        </div>
      </div>

      {/* Warning Notice if no female voice installed */}
      {systemVoiceWarning && (
        <div className="p-2.5 rounded-xl bg-amber-950/40 border border-amber-500/30 text-xs text-amber-200 flex items-start space-x-2">
          <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
          <span className="leading-snug">{systemVoiceWarning}</span>
        </div>
      )}

      {/* Waveform Visualizer */}
      <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-2.5">
        <WaveformVisualizer isPlaying={isPlaying} height={42} />
      </div>

      {/* Progress timeline */}
      <div className="space-y-1">
        <input
          type="range"
          min={0}
          max={totalDuration || 100}
          step={0.05}
          value={currentTime}
          onChange={handleSeek}
          className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400 focus:outline-none"
        />
        <div className="flex justify-between text-[11px] text-slate-400 font-mono">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(totalDuration)}</span>
        </div>
      </div>

      {/* Playback controls */}
      <div className="flex items-center justify-between pt-1">
        <div className="flex items-center space-x-2">
          <button
            onClick={restartAudio}
            className="p-2 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
            title="Restart Speech"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          <button
            onClick={togglePlay}
            className="p-3 rounded-xl bg-gradient-to-r from-brand-500 to-cyan-500 text-white shadow-lg shadow-cyan-500/20 hover:scale-105 active:scale-95 transition-all"
            title={isPlaying ? 'Pause Speech' : 'Play Speech'}
          >
            {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
          </button>

          <button
            onClick={handleRateChange}
            className="px-2.5 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-xs font-mono text-cyan-300 font-medium transition-colors"
            title="Playback Speed"
          >
            {playbackRate}x
          </button>
        </div>

        {/* Volume controls */}
        <div className="flex items-center space-x-2">
          <button
            onClick={toggleMute}
            className="p-2 rounded-lg text-slate-400 hover:text-white transition-colors"
          >
            {isMuted || volume === 0 ? (
              <VolumeX className="w-4 h-4 text-rose-400" />
            ) : (
              <Volume2 className="w-4 h-4 text-slate-300" />
            )}
          </button>
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={isMuted ? 0 : volume}
            onChange={handleVolumeChange}
            className="w-16 sm:w-20 h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-brand-500"
          />
        </div>
      </div>
    </div>
  );
};
