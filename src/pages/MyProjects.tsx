import React, { useState } from 'react';
import {
  FolderKanban,
  Search,
  Download,
  Trash2,
  Calendar,
  FileAudio,
  Sparkles
} from 'lucide-react';
import { GeneratedProject, PageView, Voice } from '../types';
import { AudioPlayer } from '../components/audio/AudioPlayer';

interface MyProjectsProps {
  projects: GeneratedProject[];
  onDeleteProject: (id: string) => void;
  onSelectVoice: (voice: Voice) => void;
  onNavigate: (page: PageView) => void;
}

export const MyProjects: React.FC<MyProjectsProps> = ({
  projects,
  onDeleteProject,
  onSelectVoice,
  onNavigate,
}) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(
    projects.length > 0 ? projects[0].id : null
  );

  const filteredProjects = projects.filter((p) => {
    return (
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.text.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.voice?.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  const activeProject = projects.find((p) => p.id === selectedProjectId) || projects[0] || null;

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="space-y-6 pb-16 max-w-7xl mx-auto">
      {/* Top Header Card */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#0f172a] border border-slate-800 rounded-3xl p-6 shadow-xl">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <FolderKanban className="w-5 h-5 text-cyan-400" />
            <span>My Audio Projects</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1 font-tamil">
            நீங்கள் உருவாக்கிய ஆடியோ பதிவுகள் மற்றும் டவுன்லோடுகள் ({projects.length} Saved Generations)
          </p>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search projects or voices..."
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
          />
        </div>
      </div>

      {projects.length === 0 ? (
        <div className="bg-[#0f172a] border border-dashed border-slate-800 rounded-3xl p-16 text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center mx-auto text-slate-500">
            <FileAudio className="w-8 h-8 opacity-40 text-brand-400" />
          </div>

          <div>
            <h3 className="text-base font-bold text-white">No Audio Projects Saved Yet</h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto mt-1">
              Any speech audio you generate in the Text to Speech studio can be automatically or manually saved here.
            </p>
          </div>

          <div className="pt-2">
            <button
              onClick={() => onNavigate('text-to-speech')}
              className="py-2.5 px-5 rounded-xl bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-brand-600/30 inline-flex items-center space-x-2"
            >
              <Sparkles className="w-4 h-4 text-cyan-200" />
              <span>Go to Text to Speech Studio</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Projects List */}
          <div className="lg:col-span-6 space-y-3">
            <div className="text-xs font-semibold text-slate-400 px-1">
              Saved Recordings ({filteredProjects.length})
            </div>

            <div className="space-y-2.5 max-h-[700px] overflow-y-auto custom-scrollbar pr-1">
              {filteredProjects.map((project) => {
                const isSelected = activeProject?.id === project.id;
                return (
                  <div
                    key={project.id}
                    onClick={() => setSelectedProjectId(project.id)}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-slate-900/90 border-cyan-500/80 shadow-md shadow-cyan-500/10'
                        : 'bg-[#0f172a] border-slate-800 hover:border-slate-700/80 hover:bg-slate-900/40'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="min-w-0">
                        <div className="flex items-center space-x-2 mb-1">
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                              project.language === 'ta'
                                ? 'bg-amber-500/20 text-amber-300'
                                : 'bg-indigo-500/20 text-indigo-300'
                            }`}
                          >
                            {project.language === 'ta' ? 'தமிழ்' : 'English'}
                          </span>

                          <span className="text-xs text-slate-400 font-medium">
                            Voice: <strong className="text-white">{project.voice?.name}</strong>
                          </span>
                        </div>

                        <h4 className="text-sm font-bold text-white truncate">{project.title}</h4>
                      </div>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteProject(project.id);
                        }}
                        className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors"
                        title="Delete project"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <p className="text-xs text-slate-400 line-clamp-2 mb-3">
                      {project.translatedText || project.text}
                    </p>

                    <div className="flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-800/80">
                      <div className="flex items-center space-x-1.5">
                        <Calendar className="w-3 h-3" />
                        <span>{formatDate(project.createdAt)}</span>
                      </div>

                      <div className="flex items-center space-x-2 font-mono text-slate-400">
                        <span>{project.audioDuration}s</span>
                        <span>•</span>
                        <span>{project.format.toUpperCase()}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Active Project Details & Player */}
          <div className="lg:col-span-6 space-y-4">
            <div className="text-xs font-semibold text-slate-400 px-1">
              Project Preview & Inspector
            </div>

            {activeProject ? (
              <div className="bg-[#0f172a] border border-slate-800 rounded-3xl p-6 shadow-xl space-y-5">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span
                      className={`text-xs font-bold px-2.5 py-1 rounded-lg ${
                        activeProject.language === 'ta'
                          ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                          : 'bg-indigo-500/15 text-indigo-300 border border-indigo-500/30'
                      }`}
                    >
                      {activeProject.language === 'ta' ? 'தமிழ் Audio Project' : 'English Audio Project'}
                    </span>

                    <span className="text-xs text-slate-500 font-mono">
                      {activeProject.id}
                    </span>
                  </div>

                  <h3 className="text-base sm:text-lg font-bold text-white">
                    {activeProject.title}
                  </h3>
                  <div className="text-xs text-slate-400 mt-1">
                    Created on {formatDate(activeProject.createdAt)}
                  </div>
                </div>

                {/* Embedded Audio Player */}
                <AudioPlayer
                  audioUrl={activeProject.audioBlobUrl || null}
                  duration={activeProject.audioDuration}
                  voice={activeProject.voice}
                  title={activeProject.title}
                  spokenText={activeProject.translatedText || activeProject.text}
                  systemVoiceUsed={activeProject.systemVoiceUsed}
                  systemVoiceWarning={activeProject.systemVoiceWarning}
                />

                {/* Script Full Text Box */}
                <div className="space-y-2 pt-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Source Text Script
                  </label>
                  <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 text-xs sm:text-sm text-slate-200 leading-relaxed font-mono whitespace-pre-wrap max-h-48 overflow-y-auto">
                    {activeProject.text}
                  </div>
                </div>

                {activeProject.translatedText && (
                  <div className="space-y-2">
                    <label className="text-xs font-semibold uppercase tracking-wider text-cyan-400">
                      Translated Audio Script
                    </label>
                    <div className="p-4 rounded-2xl bg-slate-950/80 border border-cyan-500/30 text-xs sm:text-sm text-cyan-200 leading-relaxed font-mono whitespace-pre-wrap max-h-48 overflow-y-auto">
                      {activeProject.translatedText}
                    </div>
                  </div>
                )}

                {/* Quick actions */}
                <div className="flex items-center justify-between pt-3 border-t border-slate-800">
                  <button
                    onClick={() => {
                      if (activeProject.voice) {
                        onSelectVoice(activeProject.voice);
                        onNavigate('text-to-speech');
                      }
                    }}
                    className="py-2 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center space-x-1.5 transition-colors"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Open in Text to Speech</span>
                  </button>

                  {activeProject.audioBlobUrl && (
                    <a
                      href={activeProject.audioBlobUrl}
                      download={`${activeProject.title.replace(/\s+/g, '_')}.wav`}
                      className="py-2 px-4 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold flex items-center space-x-1.5 shadow-md transition-colors"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download File</span>
                    </a>
                  )}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
};
