import React, { useState, useEffect } from 'react';
import { Menu, Globe, Cpu, SlidersHorizontal, Sparkles, Volume2, ChevronDown } from 'lucide-react';
import { PageView, StudioSettings } from '../../types';
import { VoiceDetectionService } from '../../services/voiceDetectionService';

interface HeaderProps {
  currentPage: PageView;
  onOpenSidebar: () => void;
  settings: StudioSettings;
  onNavigate: (page: PageView) => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentPage,
  onOpenSidebar,
  settings,
  onNavigate,
}) => {
  const [voicesSummary, setVoicesSummary] = useState(() =>
    VoiceDetectionService.getInstance().getSystemVoiceSummary()
  );
  const [showVoiceDebug, setShowVoiceDebug] = useState(false);

  useEffect(() => {
    const unsub = VoiceDetectionService.getInstance().subscribe(() => {
      setVoicesSummary(VoiceDetectionService.getInstance().getSystemVoiceSummary());
    });
    return unsub;
  }, []);

  const getPageInfo = (): { title: string; subtitle: string } => {
    switch (currentPage) {
      case 'dashboard':
        return {
          title: 'Studio Dashboard',
          subtitle: 'கட்டுப்பாட்டு பலகை - Voice synthesis overview & metrics',
        };
      case 'text-to-speech':
        return {
          title: 'Text to Speech Studio',
          subtitle: 'உரையை உயர்தர குரலாக மாற்றவும் (Tamil & English Neural TTS)',
        };
      case 'voice-library':
        return {
          title: 'Voice Library',
          subtitle: 'அனைத்து தமிழ் மற்றும் ஆங்கிலக் குரல்கள் (14 Curated Voices)',
        };
      case 'voice-cloning':
        return {
          title: 'AI Voice Cloning Studio',
          subtitle: 'தனிப்பயன் குரல் பயிற்சி (Zero-Shot Neural Cloner)',
        };
      case 'my-voices':
        return {
          title: 'My Custom Voices',
          subtitle: 'நீங்கள் உருவாக்கிய மற்றும் சேமித்த தனித்துவக் குரல்கள்',
        };
      case 'my-projects':
        return {
          title: 'My Audio Projects',
          subtitle: 'சேமிக்கப்பட்ட குரல் பதிவுகள் மற்றும் டவுன்லோடுகள்',
        };
      case 'settings':
        return {
          title: 'Studio Settings',
          subtitle: 'என்ஜின் அமைப்புகள், API விசை மற்றும் ஆடியோ விருப்பத்தேர்வுகள்',
        };
      default:
        return { title: 'TamilVoice AI Studio', subtitle: 'Modern Neural Audio Studio' };
    }
  };

  const pageInfo = getPageInfo();

  return (
    <header className="sticky top-0 z-30 h-16 bg-[#0c121e]/90 backdrop-blur-md border-b border-slate-800/80 px-4 lg:px-8 flex items-center justify-between">
      <div className="flex items-center space-x-3">
        {/* Mobile menu button */}
        <button
          onClick={onOpenSidebar}
          className="lg:hidden p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 focus:outline-none"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div>
          <h1 className="text-base sm:text-lg font-bold text-white tracking-tight flex items-center gap-2">
            <span>{pageInfo.title}</span>
          </h1>
          <p className="hidden sm:block text-xs text-slate-400 font-tamil truncate max-w-md">
            {pageInfo.subtitle}
          </p>
        </div>
      </div>

      <div className="flex items-center space-x-2 sm:space-x-3">
        {/* System Voices Status & Diagnostics Pill (Req 10) */}
        <div className="relative">
          <button
            onClick={() => setShowVoiceDebug(!showVoiceDebug)}
            className="flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-slate-700 text-xs text-slate-300 transition-colors"
            title="System Voices Detection Status"
          >
            <Volume2 className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden md:inline text-slate-400">System Voices:</span>
            <span className="font-semibold text-white">{voicesSummary.totalCount}</span>
            {voicesSummary.tamilVoices.length > 0 ? (
              <span className="hidden xl:inline text-[10px] text-emerald-400 font-mono bg-emerald-950/60 px-1.5 py-0.2 rounded border border-emerald-800/50">
                Tamil: {voicesSummary.tamilVoices[0].replace(/Microsoft | - Tamil.*$/g, '')}
              </span>
            ) : (
              <span className="hidden xl:inline text-[10px] text-amber-400 font-mono bg-amber-950/60 px-1.5 py-0.2 rounded border border-amber-800/50">
                Tamil: None
              </span>
            )}
            <ChevronDown className="w-3 h-3 text-slate-400" />
          </button>

          {/* Diagnostics Popover */}
          {showVoiceDebug && (
            <div className="absolute right-0 top-10 w-80 p-3 bg-slate-900/95 backdrop-blur-md border border-slate-800 rounded-2xl shadow-2xl z-50 text-xs space-y-2">
              <div className="flex items-center justify-between pb-1.5 border-b border-slate-800">
                <span className="font-bold text-white flex items-center gap-1.5">
                  <Cpu className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Detected System Voices</span>
                </span>
                <span className="text-[10px] text-slate-400 font-mono">
                  {voicesSummary.totalCount} loaded
                </span>
              </div>

              <div>
                <div className="text-[11px] font-semibold text-amber-400 mb-1 flex items-center justify-between">
                  <span>Tamil Voices ({voicesSummary.tamilVoices.length}):</span>
                  {voicesSummary.tamilVoices.length === 0 && (
                    <span className="text-[10px] text-amber-300 bg-amber-950/80 px-1 rounded">
                      Not installed
                    </span>
                  )}
                </div>
                {voicesSummary.tamilVoices.length > 0 ? (
                  <ul className="space-y-0.5 max-h-24 overflow-y-auto custom-scrollbar text-[11px] text-slate-200">
                    {voicesSummary.tamilVoices.map((v, i) => (
                      <li key={i} className="truncate bg-slate-950/60 px-2 py-0.5 rounded">
                        • {v}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-[10px] text-slate-400 leading-snug">
                    Windows Tamil language pack not detected. Closest system voices are used with pitch modulation.
                  </p>
                )}
              </div>

              <div>
                <div className="text-[11px] font-semibold text-indigo-400 mb-1">
                  English Voices ({voicesSummary.englishVoices.length}):
                </div>
                <ul className="space-y-0.5 max-h-28 overflow-y-auto custom-scrollbar text-[11px] text-slate-300">
                  {voicesSummary.englishVoices.slice(0, 6).map((v, i) => (
                    <li key={i} className="truncate bg-slate-950/60 px-2 py-0.5 rounded">
                      • {v}
                    </li>
                  ))}
                  {voicesSummary.englishVoices.length > 6 && (
                    <li className="text-[10px] text-slate-500 italic pl-1">
                      + {voicesSummary.englishVoices.length - 6} more English voices
                    </li>
                  )}
                </ul>
              </div>
            </div>
          )}
        </div>

        {/* Dual Language Indicator */}
        <div className="hidden md:flex items-center space-x-1 px-2.5 py-1 rounded-full bg-slate-900 border border-slate-800 text-xs text-slate-300">
          <Globe className="w-3.5 h-3.5 text-cyan-400 mr-1" />
          <span className="font-semibold text-white">தமிழ்</span>
          <span className="text-slate-600">/</span>
          <span className="font-semibold text-white">ENG</span>
        </div>

        {/* Engine Badge */}
        <div
          onClick={() => onNavigate('settings')}
          className="cursor-pointer flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-indigo-950/50 hover:bg-indigo-900/50 border border-indigo-500/30 text-xs text-indigo-200 transition-colors"
          title="Click to configure speech engine"
        >
          <Cpu className="w-3.5 h-3.5 text-indigo-400" />
          <span className="hidden sm:inline font-medium">Engine:</span>
          <span className="text-indigo-300 font-semibold truncate max-w-[120px]">
            {settings.activeEngine === 'piper-local'
              ? 'Piper AI'
              : settings.activeEngine === 'indictts-local'
              ? 'IndicTTS'
              : settings.activeEngine === 'elevenlabs-api'
              ? 'ElevenLabs'
              : 'Browser Demo'}
          </span>
          {settings.activeEngine === 'piper-local' && (
            <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
              Local AI
            </span>
          )}
          {settings.activeEngine === 'browser-demo' && (
            <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.2 rounded bg-indigo-500/30 text-indigo-300">
              Demo
            </span>
          )}
        </div>

        {/* Quick Settings Button */}
        <button
          onClick={() => onNavigate('settings')}
          className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:border-slate-700 transition-colors"
          title="Settings"
        >
          <SlidersHorizontal className="w-4 h-4" />
        </button>

        {/* Studio Badge */}
        <div className="hidden xl:flex items-center space-x-1.5 text-xs text-cyan-400/90 font-medium px-2 py-1 rounded bg-cyan-950/40 border border-cyan-800/30">
          <Sparkles className="w-3.5 h-3.5" />
          <span>v1.0 Pro</span>
        </div>
      </div>
    </header>
  );
};
