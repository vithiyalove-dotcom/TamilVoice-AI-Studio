import React, { useState } from 'react';
import {
  Search,
  Filter,
  Volume2,
  Users,
  Star,
  Tag
} from 'lucide-react';
import { PageView, Voice } from '../types';
import { PRESET_VOICES } from '../data/presetVoices';
import { VoiceCard } from '../components/voice/VoiceCard';
import { AudioSynthesizer } from '../services/audioSynthesizer';
import { StorageService } from '../services/storageService';

interface VoiceLibraryProps {
  selectedVoice: Voice;
  onSelectVoice: (voice: Voice) => void;
  onNavigate: (page: PageView) => void;
  clonedVoices: Voice[];
}

export const VoiceLibrary: React.FC<VoiceLibraryProps> = ({
  selectedVoice,
  onSelectVoice,
  onNavigate,
  clonedVoices,
}) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeLang, setActiveLang] = useState<'all' | 'ta' | 'en'>('all');
  const [activeGender, setActiveGender] = useState<'all' | 'male' | 'female'>('all');
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [onlyFavorites, setOnlyFavorites] = useState<boolean>(false);

  const [previewingVoiceId, setPreviewingVoiceId] = useState<string | null>(null);
  const [favorites, setFavorites] = useState<string[]>(() => StorageService.getFavorites());

  const allVoices = [...PRESET_VOICES, ...clonedVoices];

  const handleToggleFavorite = (voiceId: string) => {
    const updated = StorageService.toggleFavorite(voiceId);
    setFavorites(updated);
  };

  const handlePlayPreview = async (voice: Voice) => {
    const synth = AudioSynthesizer.getInstance();
    if (previewingVoiceId === voice.id) {
      synth.stopSpeaking();
      setPreviewingVoiceId(null);
      return;
    }

    const currentSettings = StorageService.getSettings();
    const isPiperSelected =
      currentSettings.activeEngine === 'piper-local' ||
      currentSettings.activeEngine === 'indictts-local';

    setPreviewingVoiceId(voice.id);

    const sampleText =
      voice.language === 'ta'
        ? voice.sampleTamilText || voice.sampleText
        : voice.sampleText;

    if (isPiperSelected) {
      try {
        await synth.speakWithPiper(sampleText, voice.id, {
          onEnd: () => setPreviewingVoiceId(null),
          onError: () => setPreviewingVoiceId(null),
        });
      } catch (err) {
        console.warn('Piper preview failed, falling back to demo speech:', err);
        synth.speakDemo(sampleText, voice, {
          onEnd: () => setPreviewingVoiceId(null),
          onError: () => setPreviewingVoiceId(null),
        });
      }
    } else {
      synth.speakDemo(sampleText, voice, {
        onEnd: () => setPreviewingVoiceId(null),
        onError: () => setPreviewingVoiceId(null),
      });
    }
  };

  const handleSelectAndNavigate = (voice: Voice) => {
    onSelectVoice(voice);
    onNavigate('text-to-speech');
  };

  // Categories list
  const categories = [
    'all',
    'Conversational',
    'News Broadcast',
    'Storytelling',
    'Audiobook',
    'Cinema & Dubbing',
    'Calm & Meditation',
  ];

  // Filtering
  const filteredVoices = allVoices.filter((v) => {
    const matchSearch =
      v.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (v.nativeName && v.nativeName.toLowerCase().includes(searchQuery.toLowerCase())) ||
      v.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchLang = activeLang === 'all' || v.language === activeLang;
    const matchGender = activeGender === 'all' || v.gender === activeGender;
    const matchCategory = activeCategory === 'all' || v.category === activeCategory;
    const matchFav = !onlyFavorites || favorites.includes(v.id);

    return matchSearch && matchLang && matchGender && matchCategory && matchFav;
  });

  // Groupings for quick stats
  const tamilMaleCount = allVoices.filter((v) => v.language === 'ta' && v.gender === 'male').length;
  const tamilFemaleCount = allVoices.filter((v) => v.language === 'ta' && v.gender === 'female').length;
  const englishMaleCount = allVoices.filter((v) => v.language === 'en' && v.gender === 'male').length;
  const englishFemaleCount = allVoices.filter((v) => v.language === 'en' && v.gender === 'female').length;

  return (
    <div className="space-y-6 pb-16">
      {/* Category Quick Selector Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div
          onClick={() => {
            setActiveLang('ta');
            setActiveGender('male');
            setOnlyFavorites(false);
          }}
          className={`cursor-pointer p-4 rounded-2xl border transition-all ${
            activeLang === 'ta' && activeGender === 'male'
              ? 'bg-amber-950/40 border-amber-500/80 shadow-lg shadow-amber-500/10'
              : 'bg-[#0f172a] border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-semibold text-amber-300 font-tamil">தமிழ் ஆண் குரல்கள்</span>
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold">
              {tamilMaleCount}
            </span>
          </div>
          <div className="text-sm font-bold text-white">Tamil Male Voices</div>
          <p className="text-[11px] text-slate-400 mt-1">Broadcast, narration & drama</p>
        </div>

        <div
          onClick={() => {
            setActiveLang('ta');
            setActiveGender('female');
            setOnlyFavorites(false);
          }}
          className={`cursor-pointer p-4 rounded-2xl border transition-all ${
            activeLang === 'ta' && activeGender === 'female'
              ? 'bg-pink-950/40 border-pink-500/80 shadow-lg shadow-pink-500/10'
              : 'bg-[#0f172a] border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-semibold text-pink-300 font-tamil">தமிழ் பெண் குரல்கள்</span>
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-pink-500/20 text-pink-300 font-bold">
              {tamilFemaleCount}
            </span>
          </div>
          <div className="text-sm font-bold text-white">Tamil Female Voices</div>
          <p className="text-[11px] text-slate-400 mt-1">Warm, conversational & storytelling</p>
        </div>

        <div
          onClick={() => {
            setActiveLang('en');
            setActiveGender('male');
            setOnlyFavorites(false);
          }}
          className={`cursor-pointer p-4 rounded-2xl border transition-all ${
            activeLang === 'en' && activeGender === 'male'
              ? 'bg-indigo-950/40 border-indigo-500/80 shadow-lg shadow-indigo-500/10'
              : 'bg-[#0f172a] border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-semibold text-indigo-300">English Male</span>
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-bold">
              {englishMaleCount}
            </span>
          </div>
          <div className="text-sm font-bold text-white">English Male Voices</div>
          <p className="text-[11px] text-slate-400 mt-1">Baritone, Indian & Global English</p>
        </div>

        <div
          onClick={() => {
            setActiveLang('en');
            setActiveGender('female');
            setOnlyFavorites(false);
          }}
          className={`cursor-pointer p-4 rounded-2xl border transition-all ${
            activeLang === 'en' && activeGender === 'female'
              ? 'bg-cyan-950/40 border-cyan-500/80 shadow-lg shadow-cyan-500/10'
              : 'bg-[#0f172a] border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-semibold text-cyan-300">English Female</span>
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-bold">
              {englishFemaleCount}
            </span>
          </div>
          <div className="text-sm font-bold text-white">English Female Voices</div>
          <p className="text-[11px] text-slate-400 mt-1">Melodic, British, US & Indian</p>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="bg-[#0f172a] border border-slate-800 rounded-3xl p-5 shadow-lg space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by voice name, accent, Tamil name, or style (e.g., Arun, Madurai, News, Storytelling)..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950/80 border border-slate-800 focus:border-cyan-500/80 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-cyan-500/50"
            />
          </div>

          {/* Reset Filters / Bookmarks toggle */}
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setOnlyFavorites(!onlyFavorites)}
              className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition-colors ${
                onlyFavorites
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  : 'bg-slate-950 border border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              <Star className="w-3.5 h-3.5 fill-current text-amber-400" />
              <span>Favorites ({favorites.length})</span>
            </button>

            <button
              onClick={() => {
                setActiveLang('all');
                setActiveGender('all');
                setActiveCategory('all');
                setSearchQuery('');
                setOnlyFavorites(false);
              }}
              className="px-3 py-2 rounded-xl text-xs text-slate-400 hover:text-white bg-slate-950 border border-slate-800 transition-colors"
            >
              Reset Filters
            </button>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-800/80 text-xs">
          <div className="flex items-center space-x-1 mr-2 text-slate-400">
            <Filter className="w-3.5 h-3.5" />
            <span>Language:</span>
          </div>

          <button
            onClick={() => setActiveLang('all')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
              activeLang === 'all'
                ? 'bg-brand-600 text-white shadow-sm'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            All Languages
          </button>
          <button
            onClick={() => setActiveLang('ta')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
              activeLang === 'ta'
                ? 'bg-amber-500 text-slate-950 font-bold font-tamil'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            தமிழ் (Tamil)
          </button>
          <button
            onClick={() => setActiveLang('en')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
              activeLang === 'en'
                ? 'bg-brand-600 text-white'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            English
          </button>

          <div className="h-4 w-[1px] bg-slate-800 mx-2 hidden sm:block" />

          <div className="flex items-center space-x-1 mr-2 text-slate-400">
            <Users className="w-3.5 h-3.5" />
            <span>Gender:</span>
          </div>
          <button
            onClick={() => setActiveGender('all')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
              activeGender === 'all'
                ? 'bg-slate-700 text-white'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setActiveGender('male')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
              activeGender === 'male'
                ? 'bg-sky-500/30 text-sky-200 border border-sky-500/50'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            Male
          </button>
          <button
            onClick={() => setActiveGender('female')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
              activeGender === 'female'
                ? 'bg-pink-500/30 text-pink-200 border border-pink-500/50'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            Female
          </button>

          <div className="h-4 w-[1px] bg-slate-800 mx-2 hidden lg:block" />

          <div className="flex items-center space-x-1 mr-2 text-slate-400">
            <Tag className="w-3.5 h-3.5" />
            <span>Category:</span>
          </div>

          <div className="flex flex-wrap gap-1">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-colors ${
                  activeCategory === cat
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-semibold'
                    : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                {cat === 'all' ? 'All Styles' : cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Voice Cards Grid */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <p className="text-xs text-slate-400">
            Showing <strong className="text-white">{filteredVoices.length}</strong> available voice models
          </p>

          <div className="text-xs text-slate-400">
            Current Studio Voice:{' '}
            <span className="text-cyan-400 font-bold">{selectedVoice.name}</span>
          </div>
        </div>

        {filteredVoices.length === 0 ? (
          <div className="text-center py-16 bg-[#0f172a] rounded-3xl border border-dashed border-slate-800">
            <Volume2 className="w-10 h-10 text-slate-600 mx-auto mb-2" />
            <p className="text-base font-medium text-slate-300">No voices match your search criteria</p>
            <p className="text-xs text-slate-500 mt-1">Try resetting the language or gender filter.</p>
            <button
              onClick={() => {
                setActiveLang('all');
                setActiveGender('all');
                setSearchQuery('');
                setOnlyFavorites(false);
              }}
              className="mt-4 px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold"
            >
              Show All Voices
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {filteredVoices.map((voice) => (
              <VoiceCard
                key={voice.id}
                voice={voice}
                isSelected={selectedVoice.id === voice.id}
                isPlayingPreview={previewingVoiceId === voice.id}
                isFavorite={favorites.includes(voice.id)}
                onPlayPreview={handlePlayPreview}
                onSelectVoice={handleSelectAndNavigate}
                onToggleFavorite={handleToggleFavorite}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
