import React, { useState, useEffect } from 'react';
import { Artwork, ExhibitionHall, HallType, PlayerPosition } from './types';
import { EXHIBITION_HALLS, getPresetArtworks } from './data';
import GalleryCanvas from './components/GalleryCanvas';
import UIOverlay from './components/UIOverlay';
import ArtworkModal from './components/ArtworkModal';
import { ambientPlayer } from './utils/audio';
import { 
  Building, 
  Layers, 
  Maximize2, 
  HelpCircle, 
  Compass, 
  Crown,
  Volume2,
  VolumeX,
  RefreshCw,
  Palette
} from 'lucide-react';

const LOCAL_STORAGE_KEY = 'vr_gallery_artworks_v3';

export default function App() {
  // Dynamic exhibition planner limits (User requests: Open Hall count and Artwork partition counts per hall)
  const [visibleHallsCount, setVisibleHallsCount] = useState<number>(5); // Show first 5 halls by default, can be adjusted up to 10

  // Per-hall independent artwork limit state, up to a maximum of 15
  const [hallsArtworksLimits, setHallsArtworksLimits] = useState<Record<HallType, number>>({
    modern: 4,
    classic: 4,
    neon: 3,
    nordic: 2,
    retro: 2,
    monochrome: 2,
    vanguard: 2,
    cyberpunk: 2,
    zen: 2,
    renaissance: 2
  });

  // Current active hall - starts seamlessly in the new modern white gallery hall
  const [activeHallId, setActiveHallId] = useState<HallType>('modern');
  const rawHall = EXHIBITION_HALLS.find(h => h.id === activeHallId) || EXHIBITION_HALLS[0];

  const activeArtworksLimit = hallsArtworksLimits[activeHallId] || 5;

  const currentHall: ExhibitionHall = {
    ...rawHall,
    wallPositions: rawHall.wallPositions.slice(0, activeArtworksLimit)
  };

  const setActiveArtworksLimit = (limit: number) => {
    setHallsArtworksLimits(prev => ({
      ...prev,
      [activeHallId]: limit
    }));
  };

  // Synchronize active hall index bounds when hall count changes
  useEffect(() => {
    const activeHalls = EXHIBITION_HALLS.slice(0, visibleHallsCount);
    const exists = activeHalls.some(h => h.id === activeHallId);
    if (!exists && activeHalls.length > 0) {
      setActiveHallId(activeHalls[activeHalls.length - 1].id as HallType);
    }
  }, [visibleHallsCount, activeHallId]);

  // Artworks state across different exhibition chambers
  const [galleryArtworks, setGalleryArtworks] = useState<Record<HallType, Artwork[]>>(() => {
    const presets = getPresetArtworks();
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        // Safely merge saved artworks with missing hall categories to prevent crash
        return {
          ...presets,
          ...parsed
        };
      }
    } catch (e) {
      console.warn('Failed to parse saved artworks, loading preset default assets instead.', e);
    }
    return presets;
  });

  // Current wall ID being edited in our designer modal
  const [selectedWallId, setSelectedWallId] = useState<string | null>(null);

  // Player position synchronizer (emitted continuously from canvas to drive 2D Minimap)
  const [playerPosition, setPlayerPosition] = useState<PlayerPosition>({ x: 0, z: 6, angle: 0 });

  // Guided docent tour: smooth focus on a target artwork
  const [focusArtworkId, setFocusArtworkId] = useState<string | null>(null);

  // Synth Audio state indicators
  const [isPlayingMusic, setIsPlayingMusic] = useState(false);
  const [audioMuted, setAudioMuted] = useState(false);

  // Mobile virtual joystick control signals
  const [dpadControl, setDpadControl] = useState({
    forward: false,
    backward: false,
    left: false,
    right: false,
    turnLeft: false,
    turnRight: false
  });

  // Persist edits to localStorage safely
  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(galleryArtworks));
    } catch (e) {
      console.warn("Failed to persist artworks to localStorage (most likely QuotaExceededError due to large base64 upload limit). Visuals will still update in-memory perfectly!", e);
    }
  }, [galleryArtworks]);

  // Synchronize dynamic background audio theme when user switches halls
  useEffect(() => {
    if (isPlayingMusic && !audioMuted) {
      ambientPlayer.play(activeHallId);
    }
  }, [activeHallId, isPlayingMusic, audioMuted]);

  const handleStartMusic = () => {
    ambientPlayer.play(activeHallId);
    setIsPlayingMusic(true);
    setAudioMuted(false);
  };

  const handleToggleAudio = () => {
    const isMuted = ambientPlayer.toggleMute();
    setAudioMuted(isMuted);
  };

  const handleSelectHall = (hallId: HallType) => {
    setActiveHallId(hallId);
    setFocusArtworkId(null); // Clear focus state
  };

  const handleOpenArtworkModal = (wallId: string) => {
    setSelectedWallId(wallId);
  };

  const handleSaveArtwork = (updatedArtwork: Artwork) => {
    setGalleryArtworks(prev => {
      const list = prev[activeHallId] || [];
      const index = list.findIndex(art => art.id === updatedArtwork.id);
      
      let updatedList = [...list];
      if (index >= 0) {
        // Edit existing wall artwork
        updatedList[index] = updatedArtwork;
      } else {
        // Install new artwork on the wall
        updatedList.push(updatedArtwork);
      }

      return {
        ...prev,
        [activeHallId]: updatedList
      };
    });

    setSelectedWallId(null);
  };

  const handleResetGalleryToPresets = () => {
    if (window.confirm('가상 갤러리를 원래 작가분들의 초기 기획전 전시 세팅으로 되돌리시겠습니까? (커스텀 등록한 모든 이미지가 리셋됩니다)')) {
      const defaults = getPresetArtworks();
      setGalleryArtworks(defaults);
      localStorage.removeItem(LOCAL_STORAGE_KEY);
    }
  };

  const activeWallDef = currentHall.wallPositions.find(w => w.id === selectedWallId);
  const activeArtwork = (galleryArtworks[activeHallId] || []).find(art => art.id === selectedWallId) || null;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-600/30">
      
      {/* Upper Navigation & Museum Credit Banner */}
      <header className="border-b border-slate-900 bg-slate-950/80 backdrop-blur-md sticky top-0 z-40 px-6 py-4 flex items-center justify-between" id="main_header">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-indigo-600/10 border border-indigo-500/30 rounded-xl flex items-center justify-center">
            <Building className="text-indigo-400" size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-md sm:text-lg font-bold tracking-tight text-white uppercase font-sans">VR Meta Gallery</h1>
              <span className="text-[10px] bg-emerald-950 text-emerald-400 font-semibold border border-emerald-900 px-2 py-0.5 rounded-full uppercase tracking-wider">Live Sandbox</span>
            </div>
            <p className="text-[10px] sm:text-xs text-slate-400 mt-0.5">다양한 층고와 독립 전시 방식을 적용한 인터랙티브 가상 3D VR 아트 미술관</p>
          </div>
        </div>

        {/* Global actions */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={handleResetGalleryToPresets}
            className="hidden sm:flex items-center gap-2 px-3 py-1.5 text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 hover:border-slate-700 rounded-xl transition cursor-pointer"
            title="기본전시로 되돌리기"
          >
            <RefreshCw size={13} />
            <span>큐레이션 초기화</span>
          </button>
          
          <div className="hidden md:flex gap-1.5 items-center bg-slate-900/60 border border-slate-850 px-3.5 py-1.5 rounded-xl text-xs text-slate-400 font-mono">
            <span>방문자 좌표:</span>
            <strong className="text-slate-200">X: {playerPosition.x.toFixed(1)}m</strong>
            <span className="text-slate-700">|</span>
            <strong className="text-slate-200">Z: {playerPosition.z.toFixed(1)}m</strong>
          </div>
        </div>
      </header>

      {/* Main Content Layout */}
      <main className="flex-1 flex flex-col lg:flex-row p-4 sm:p-6 gap-6 max-w-7xl mx-auto w-full overflow-hidden" id="main_layout">
        
        {/* Left Side: 3D VR Environment */}
        <div className="flex-1 flex flex-col gap-4 min-w-0" id="canvas_view_box">
          
          {/* Main active hall header summary */}
          <div className="bg-slate-900/20 border border-slate-900 p-4 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-start gap-2.5">
              <span 
                className="w-1.5 h-6 rounded-full self-center" 
                style={{ backgroundColor: currentHall.themeColor }}
              />
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500">현재 관람 구역</span>
                <h2 className="text-sm font-bold text-slate-100">{currentHall.name}</h2>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 text-[10px] text-slate-400">
              <span className="px-2.5 py-1 bg-slate-950 border border-slate-850 rounded-lg">
                층고 높이: <strong className="text-indigo-400 font-bold">{currentHall.ceilingHeight}m</strong>
              </span>
              <span className="px-2.5 py-1 bg-slate-950 border border-slate-850 rounded-lg">
                조색 기법: <strong className="text-emerald-400">{currentHall.id === 'classic' ? '클래식 오크' : currentHall.id === 'modern' ? '모던 실버' : '레이저 블랙'}</strong>
              </span>
            </div>
          </div>

          {/* Core Interactive Real-Time 3D Stage */}
          <GalleryCanvas
            hall={currentHall}
            artworks={galleryArtworks[activeHallId] || []}
            activeWallId={selectedWallId}
            onWallClick={handleOpenArtworkModal}
            onPlayerMove={setPlayerPosition}
            focusArtworkId={focusArtworkId}
            onClearFocus={() => setFocusArtworkId(null)}
            dpadControl={dpadControl}
          />

          {/* Quick usage Tip bar bellow 3D viewport */}
          <div className="p-3 bg-slate-900/40 border border-slate-900 rounded-2xl text-[10.5px] text-slate-400 leading-relaxed flex items-center gap-2.5">
            <Palette size={14} className="text-indigo-400 shrink-0" />
            <span>
              <strong>전시장 디자인 팁:</strong> 3D 화면 속의 거대한 화이트 벽면이나 임의의 예술 작품 액자를 직접 클릭해 보세요. 즉시 원하는 이미지를 업로드하고 실제 치수(m)와 액자 스타일을 리디자인할 수 있습니다!
            </span>
          </div>

        </div>

        {/* Right Side: Dashboard Controllers & Minipap Widget */}
        <UIOverlay
          currentHall={currentHall}
          onSelectHall={handleSelectHall}
          artworks={galleryArtworks[activeHallId] || []}
          playerPosition={playerPosition}
          onFocusArtwork={setFocusArtworkId}
          audioMuted={audioMuted}
          onToggleAudio={handleToggleAudio}
          isPlayingMusic={isPlayingMusic}
          onStartMusic={handleStartMusic}
          dpadControl={dpadControl}
          setDpadControl={setDpadControl}
          visibleHallsCount={visibleHallsCount}
          setVisibleHallsCount={setVisibleHallsCount}
          activeArtworksLimit={activeArtworksLimit}
          setActiveArtworksLimit={setActiveArtworksLimit}
        />

      </main>

      {/* Editor dialog overlay to alter wall sizes and image files */}
      <ArtworkModal
        isOpen={selectedWallId !== null}
        onClose={() => setSelectedWallId(null)}
        wallId={selectedWallId || ''}
        hallStyle={currentHall.id}
        maxDimensions={activeWallDef?.maxDimensions || { width: 3.5, height: 2.5 }}
        currentArtwork={activeArtwork}
        onSave={handleSaveArtwork}
      />

    </div>
  );
}
