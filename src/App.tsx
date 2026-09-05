import React, { useState } from 'react';
import { GeneratedProject, PageView, StudioSettings, Voice } from './types';
import { PRESET_VOICES } from './data/presetVoices';
import { StorageService } from './services/storageService';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { Dashboard } from './pages/Dashboard';
import { TextToSpeech } from './pages/TextToSpeech';
import { VoiceLibrary } from './pages/VoiceLibrary';
import { VoiceCloning } from './pages/VoiceCloning';
import { MyVoices } from './pages/MyVoices';
import { MyProjects } from './pages/MyProjects';
import { Settings } from './pages/Settings';

export const App: React.FC = () => {
  // Navigation
  const [currentPage, setCurrentPage] = useState<PageView>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);

  // App State
  const [selectedVoice, setSelectedVoice] = useState<Voice>(PRESET_VOICES[0]);
  const [projects, setProjects] = useState<GeneratedProject[]>(() => StorageService.getProjects());
  const [clonedVoices, setClonedVoices] = useState<Voice[]>(() => StorageService.getClonedVoices());
  const [settings, setSettings] = useState<StudioSettings>(() => StorageService.getSettings());

  // Save project handler
  const handleSaveProject = (project: GeneratedProject) => {
    StorageService.saveProject(project);
    setProjects(StorageService.getProjects());
  };

  // Delete project handler
  const handleDeleteProject = (projectId: string) => {
    StorageService.deleteProject(projectId);
    setProjects(StorageService.getProjects());
  };

  // Voice cloned handler
  const handleVoiceCloned = (voice: Voice) => {
    setClonedVoices(StorageService.getClonedVoices());
    setSelectedVoice(voice);
  };

  // Delete cloned voice handler
  const handleDeleteClonedVoice = (voiceId: string) => {
    StorageService.deleteClonedVoice(voiceId);
    setClonedVoices(StorageService.getClonedVoices());
    if (selectedVoice.id === voiceId) {
      setSelectedVoice(PRESET_VOICES[0]);
    }
  };

  return (
    <div className="min-h-screen bg-[#090d16] text-slate-100 flex flex-col antialiased">
      {/* Sidebar navigation */}
      <Sidebar
        currentPage={currentPage}
        onNavigate={(page) => setCurrentPage(page)}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        projectCount={projects.length}
        clonedVoiceCount={clonedVoices.length}
      />

      {/* Main Studio Content Area */}
      <div className="lg:pl-72 flex flex-col flex-1 min-h-screen">
        <Header
          currentPage={currentPage}
          onOpenSidebar={() => setIsSidebarOpen(true)}
          settings={settings}
          onNavigate={(page) => setCurrentPage(page)}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {currentPage === 'dashboard' && (
            <Dashboard
              onNavigate={(page) => setCurrentPage(page)}
              onSelectVoiceForTts={(voice) => setSelectedVoice(voice)}
              projects={projects}
              clonedVoices={clonedVoices}
            />
          )}

          {currentPage === 'text-to-speech' && (
            <TextToSpeech
              selectedVoice={selectedVoice}
              onSelectVoice={(voice) => setSelectedVoice(voice)}
              onSaveProject={handleSaveProject}
              settings={settings}
              clonedVoices={clonedVoices}
              onUpdateSettings={(newSettings) => setSettings(newSettings)}
            />
          )}

          {currentPage === 'voice-library' && (
            <VoiceLibrary
              selectedVoice={selectedVoice}
              onSelectVoice={(voice) => setSelectedVoice(voice)}
              onNavigate={(page) => setCurrentPage(page)}
              clonedVoices={clonedVoices}
            />
          )}

          {currentPage === 'voice-cloning' && (
            <VoiceCloning
              onVoiceCloned={handleVoiceCloned}
              onNavigate={(page) => setCurrentPage(page)}
            />
          )}

          {currentPage === 'my-voices' && (
            <MyVoices
              clonedVoices={clonedVoices}
              onSelectVoice={(voice) => setSelectedVoice(voice)}
              onNavigate={(page) => setCurrentPage(page)}
              onDeleteClonedVoice={handleDeleteClonedVoice}
            />
          )}

          {currentPage === 'my-projects' && (
            <MyProjects
              projects={projects}
              onDeleteProject={handleDeleteProject}
              onSelectVoice={(voice) => setSelectedVoice(voice)}
              onNavigate={(page) => setCurrentPage(page)}
            />
          )}

          {currentPage === 'settings' && (
            <Settings
              settings={settings}
              onUpdateSettings={(newSettings) => setSettings(newSettings)}
            />
          )}
        </main>
      </div>
    </div>
  );
};

export default App;
