import React from 'react';
import {
  LayoutDashboard,
  Mic,
  Library,
  CopyPlus,
  BookmarkCheck,
  FolderKanban,
  Settings,
  Sparkles,
  Volume2,
  X
} from 'lucide-react';
import { PageView } from '../../types';

interface SidebarProps {
  currentPage: PageView;
  onNavigate: (page: PageView) => void;
  isOpen: boolean;
  onClose: () => void;
  projectCount: number;
  clonedVoiceCount: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentPage,
  onNavigate,
  isOpen,
  onClose,
  projectCount,
  clonedVoiceCount,
}) => {
  const navItems = [
    {
      id: 'dashboard' as PageView,
      label: 'Dashboard',
      subLabel: 'கட்டுப்பாட்டு பலகை',
      icon: LayoutDashboard,
    },
    {
      id: 'text-to-speech' as PageView,
      label: 'Text to Speech',
      subLabel: 'குரல் உருவாக்கம்',
      icon: Mic,
      highlight: true,
    },
    {
      id: 'voice-library' as PageView,
      label: 'Voice Library',
      subLabel: 'குரல் தொகுப்பு',
      icon: Library,
      badge: '14 Voices',
    },
    {
      id: 'voice-cloning' as PageView,
      label: 'Voice Cloning',
      subLabel: 'குரல் குளோனிங்',
      icon: CopyPlus,
      badge: 'AI Neural',
    },
    {
      id: 'my-voices' as PageView,
      label: 'My Voices',
      subLabel: 'எனது குரல்கள்',
      icon: BookmarkCheck,
      count: clonedVoiceCount > 0 ? clonedVoiceCount : undefined,
    },
    {
      id: 'my-projects' as PageView,
      label: 'My Projects',
      subLabel: 'எனது திட்டங்கள்',
      icon: FolderKanban,
      count: projectCount > 0 ? projectCount : undefined,
    },
    {
      id: 'settings' as PageView,
      label: 'Settings',
      subLabel: 'அமைப்புகள்',
      icon: Settings,
    },
  ];

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-72 bg-[#0c121e] border-r border-slate-800/80 flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="p-5 border-b border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => onNavigate('dashboard')}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 via-indigo-500 to-cyan-400 p-[2px] shadow-lg shadow-indigo-500/20">
              <div className="w-full h-full bg-[#0c121e] rounded-[10px] flex items-center justify-center">
                <Volume2 className="w-5 h-5 text-cyan-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center space-x-1.5">
                <span className="font-bold text-base text-white tracking-tight">TamilVoice</span>
                <span className="text-xs font-semibold px-1.5 py-0.5 rounded bg-brand-500/20 text-brand-400 border border-brand-500/30">
                  AI
                </span>
              </div>
              <div className="text-[11px] text-slate-400 font-tamil font-medium tracking-wide">
                தமிழ் வாய்ஸ் ஸ்டுடியோ
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Launch Action */}
        <div className="p-4 pb-2">
          <button
            onClick={() => {
              onNavigate('text-to-speech');
              onClose();
            }}
            className="w-full py-2.5 px-3.5 rounded-xl bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white font-medium text-sm flex items-center justify-center space-x-2 shadow-lg shadow-brand-600/25 transition-all transform active:scale-[0.98]"
          >
            <Sparkles className="w-4 h-4 text-cyan-300 animate-pulse" />
            <span>New Voice Project</span>
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-1 custom-scrollbar">
          <div className="px-3 py-1.5 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
            Studio Core
          </div>

          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;

            return (
              <button
                key={item.id}
                onClick={() => {
                  onNavigate(item.id);
                  onClose();
                }}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-left transition-all duration-150 group ${
                  isActive
                    ? 'bg-gradient-to-r from-brand-600/20 to-cyan-500/10 text-white font-medium border border-brand-500/30 shadow-sm'
                    : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
                }`}
              >
                <div className="flex items-center space-x-3 min-w-0">
                  <div
                    className={`p-2 rounded-lg transition-colors ${
                      isActive
                        ? 'bg-brand-500 text-white shadow-md shadow-brand-500/40'
                        : 'bg-slate-800/80 text-slate-400 group-hover:text-cyan-300 group-hover:bg-slate-700'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm truncate font-medium">{item.label}</div>
                    <div className="text-[10px] text-slate-400 truncate font-tamil">{item.subLabel}</div>
                  </div>
                </div>

                {item.badge && (
                  <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                    {item.badge}
                  </span>
                )}
                {item.count !== undefined && (
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-brand-500/20 text-brand-300 border border-brand-500/30">
                    {item.count}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Footer info & Engine Status */}
        <div className="p-4 border-t border-slate-800/80 bg-[#080d17]">
          <div className="bg-slate-900/90 rounded-xl p-3 border border-slate-800 text-xs">
            <div className="flex items-center justify-between text-slate-300 mb-1">
              <span className="font-semibold text-slate-200">Audio Engine</span>
              <span className="flex items-center space-x-1 text-emerald-400">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping inline-block" />
                <span className="text-[11px]">Ready</span>
              </span>
            </div>
            <div className="text-[11px] text-slate-400 truncate">
              Tamil & English Neural TTS
            </div>
            <div className="mt-2 text-[10px] text-slate-400 flex items-center justify-between pt-1 border-t border-slate-800">
              <span>Studio v1.0</span>
              <span className="text-cyan-400">TamilVoice AI</span>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};
