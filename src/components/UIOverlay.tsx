import React, { useRef, useEffect, useState } from 'react';
import { Artwork, ExhibitionHall, HallType, PlayerPosition } from '../types';
import { 
  Compass, 
  Map as MapIcon, 
  Disc, 
  VolumeX, 
  Volume2, 
  ChevronUp, 
  ChevronDown, 
  ChevronLeft, 
  ChevronRight, 
  RotateCcw, 
  RotateCw,
  Columns4,
  Layers,
  Sparkles,
  Bookmark,
  BookOpen,
  Key,
  Eye,
  EyeOff,
  Check,
  Settings
} from 'lucide-react';
import { EXHIBITION_HALLS } from '../data';

interface UIOverlayProps {
  currentHall: ExhibitionHall;
  onSelectHall: (hallId: HallType) => void;
  artworks: Artwork[];
  playerPosition: PlayerPosition;
  onFocusArtwork: (artId: string) => void;
  audioMuted: boolean;
  onToggleAudio: () => void;
  isPlayingMusic: boolean;
  onStartMusic: () => void;
  dpadControl: {
    forward: boolean;
    backward: boolean;
    left: boolean;
    right: boolean;
    turnLeft: boolean;
    turnRight: boolean;
  };
  setDpadControl: React.Dispatch<React.SetStateAction<{
    forward: boolean;
    backward: boolean;
    left: boolean;
    right: boolean;
    turnLeft: boolean;
    turnRight: boolean;
  }>>;
  visibleHallsCount: number;
  setVisibleHallsCount: (count: number) => void;
  activeArtworksLimit: number;
  setActiveArtworksLimit: (limit: number) => void;
  activeDocentId?: string | null;
}

export default function UIOverlay({
  currentHall,
  onSelectHall,
  artworks,
  playerPosition,
  onFocusArtwork,
  audioMuted,
  onToggleAudio,
  isPlayingMusic,
  onStartMusic,
  dpadControl,
  setDpadControl,
  visibleHallsCount,
  setVisibleHallsCount,
  activeArtworksLimit,
  setActiveArtworksLimit,
  activeDocentId
}: UIOverlayProps) {
  const minimapCanvasRef = useRef<HTMLCanvasElement>(null);

  // Trail list for tracking player footsteps & heat zones (Heatmap/Footpath)
  const trailRef = useRef<{ x: number; z: number; count: number }[]>([]);
  // Store the active hall ID so we can clear/reset trail on hall transitions
  const lastHallIdRef = useRef<string>(currentHall.id);

  // Synchronize player coordinates to update trail record & clear on hall transition
  useEffect(() => {
    // If we changed to a different hall, immediately clear trial footprints
    if (lastHallIdRef.current !== currentHall.id) {
      trailRef.current = [];
      lastHallIdRef.current = currentHall.id;
    }

    const cx = playerPosition.x;
    const cz = playerPosition.z;

    // Filter points inside the trail matching immediate coordinate
    const existing = trailRef.current.find(pt => {
      const dx = pt.x - cx;
      const dz = pt.z - cz;
      return Math.sqrt(dx * dx + dz * dz) < 0.55; // 0.55m detection cluster radius
    });

    if (existing) {
      // Accumulate lingering weights/dwell time (used to color heatmap intensity!)
      existing.count = Math.min(existing.count + 1.25, 100);
    } else {
      // Limit trail footprint array size safely to avoid leaks
      if (trailRef.current.length > 500) {
        trailRef.current.shift();
      }
      trailRef.current.push({ x: cx, z: cz, count: 1 });
    }
  }, [playerPosition.x, playerPosition.z, currentHall.id]);

  // Gemini Custom API Configuration client-side state
  const [customKey, setCustomKey] = useState(() => localStorage.getItem("gemini_custom_api_key") || "");
  const [showKey, setShowKey] = useState(false);
  const [saveStatus, setSaveStatus] = useState(false);

  const handleSaveKey = (val: string) => {
    const trimmed = val.trim();
    setCustomKey(trimmed);
    if (trimmed) {
      localStorage.setItem("gemini_custom_api_key", trimmed);
    } else {
      localStorage.removeItem("gemini_custom_api_key");
    }
    setSaveStatus(true);
    setTimeout(() => setSaveStatus(false), 2000);
  };

  // Draw 2D Minimap dynamically
  useEffect(() => {
    const canvas = minimapCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear background (Slate 950 mood)
    ctx.fillStyle = '#020617';
    ctx.fillRect(0, 0, 160, 160);

    // Central room bounds conversion: 3D Room size is -12 to 12. Convert to 10px to 150px
    const scale = (val: number) => {
      // Input: -12 to 12 -> Output: 15 to 145
      return 80 + (val / 12) * 65;
    };

    // Draw grid mesh lines inside room
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 0.5;
    for (let g = -10; g <= 10; g += 5) {
      // vertical lines
      ctx.beginPath();
      ctx.moveTo(scale(g), scale(-12));
      ctx.lineTo(scale(g), scale(12));
      ctx.stroke();

      // horizontal lines
      ctx.beginPath();
      ctx.moveTo(scale(-12), scale(g));
      ctx.lineTo(scale(12), scale(g));
      ctx.stroke();
    }

    // Draw borders of the gallery
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 2;
    ctx.strokeRect(scale(-12), scale(-12), 130, 130);

    // Draw Wall markings with paintings on map
    currentHall.wallPositions.forEach(wallDef => {
      const angle = wallDef.rotation[1];
      const length = wallDef.maxDimensions.width * 11; // scale wall length to fit map

      const wx = scale(wallDef.position[0]);
      const wz = scale(wallDef.position[2]);

      // Calculate wall line endpoints based on angle
      const dx = Math.cos(angle) * (length / 2);
      const dz = -Math.sin(angle) * (length / 2);

      const hasArtwork = artworks.some(art => art.id === wallDef.id);

      ctx.strokeStyle = hasArtwork ? currentHall.themeColor : '#475569';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(wx - dx, wz - dz);
      ctx.lineTo(wx + dx, wz + dz);
      ctx.stroke();

      // Small wall text ID (indicator)
      ctx.fillStyle = '#64748b';
      ctx.font = 'normal 8px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(wallDef.id.split('_')[1].toUpperCase(), wx, wz - 6);
    });

    // Draw Heat footprints trail (glowing heat zones)
    trailRef.current.forEach(point => {
      const tx = scale(point.x);
      const tz = scale(point.z);

      // Higher count -> larger radius and redder hue (heatmap energy!)
      const radius = 2.0 + Math.min(point.count * 0.12, 6.5);

      // Color spectrum from bluish cyan (just passed by) -> yellow -> orange -> pure coral red
      let fillStyle = 'rgba(56, 189, 248, 0.3)'; // Sky blue for footsteps
      if (point.count > 50) {
        fillStyle = 'rgba(239, 68, 68, 0.65)';   // Bright Red (Hot!)
      } else if (point.count > 18) {
        fillStyle = 'rgba(249, 115, 22, 0.5)'; // Orange (Warm)
      } else if (point.count > 5) {
        fillStyle = 'rgba(234, 179, 8, 0.4)';  // Yellow / Medium
      }

      ctx.fillStyle = fillStyle;
      ctx.beginPath();
      ctx.arc(tx, tz, radius, 0, Math.PI * 2);
      ctx.fill();
    });

    // Draw player position and orientation vector arrow
    const px = scale(playerPosition.x);
    const pz = scale(playerPosition.z);

    // Dynamic radar ripple pulse
    const rippleRad = 10 + (Date.now() % 1000) * 0.015;
    ctx.strokeStyle = 'rgba(59, 130, 246, 0.2)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(px, pz, rippleRad, 0, Math.PI * 2);
    ctx.stroke();

    // Player Direction Cone (Flashlight representation)
    ctx.fillStyle = 'rgba(59, 130, 246, 0.14)';
    ctx.beginPath();
    ctx.moveTo(px, pz);
    // Left and right fov boundaries
    const fovL = playerPosition.angle - 0.45;
    const fovR = playerPosition.angle + 0.45;
    ctx.lineTo(px - Math.sin(fovL) * 20, pz - Math.cos(fovL) * 20);
    ctx.lineTo(px - Math.sin(fovR) * 20, pz - Math.cos(fovR) * 20);
    ctx.closePath();
    ctx.fill();

    // Player dot
    ctx.fillStyle = '#3b82f6';
    ctx.beginPath();
    ctx.arc(px, pz, 5, 0, Math.PI * 2);
    ctx.fill();

    // White outline for contrast
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1;
    ctx.stroke();

  }, [playerPosition, currentHall, artworks]);

  // Controller Helper to handle button down and release states
  const bindControl = (action: keyof typeof dpadControl, status: boolean) => {
    setDpadControl(prev => ({ ...prev, [action]: status }));
  };

  return (
    <div className="w-full lg:w-[410px] flex flex-col gap-5 overflow-y-auto" id="ui_overlay_panel">
      
      {/* 1. Hall Selection Cards (Themed Banners) */}
      <div className="bg-slate-900/60 backdrop-blur-md border border-slate-800 p-5 rounded-2xl space-y-4" id="hall_selector_container">
        <div className="flex items-center gap-2">
          <Columns4 className="text-indigo-400" size={18} />
          <h3 className="text-sm font-bold text-slate-100">전시관 선택 (Hall Selector)</h3>
        </div>

        <div className="space-y-3">
          {EXHIBITION_HALLS.slice(0, visibleHallsCount).map(hall => {
            const isActive = hall.id === currentHall.id;
            return (
              <button
                key={hall.id}
                onClick={() => onSelectHall(hall.id)}
                className={`w-full text-left p-3.5 rounded-xl border transition-all duration-300 relative overflow-hidden group ${
                  isActive 
                    ? 'bg-slate-950 border-slate-700 ring-1 ring-slate-800/80 shadow-md' 
                    : 'bg-slate-950/40 border-slate-900 hover:border-slate-850 hover:bg-slate-950/80'
                }`}
              >
                {/* Accent glow line inside */}
                {isActive && (
                  <div 
                    className="absolute left-0 top-0 bottom-0 w-1.5"
                    style={{ backgroundColor: hall.themeColor }}
                  />
                )}

                <div className="flex items-start justify-between">
                  <div>
                    <h4 className={`text-xs font-bold transition-colors ${isActive ? 'text-slate-100' : 'text-slate-400 group-hover:text-slate-300'}`}>
                      {hall.name}
                    </h4>
                    <p className="text-[10px] text-slate-500 mt-1 line-clamp-1">{hall.subtitle}</p>
                  </div>
                  
                  {/* Detailed Spec Tag */}
                  <span className={`text-[9px] font-semibold px-2 py-0.5 rounded-full border ${
                    isActive 
                      ? 'bg-indigo-950/60 border-indigo-900 text-indigo-400' 
                      : 'bg-slate-900 border-slate-850 text-slate-500'
                  }`}>
                    층고: {hall.ceilingHeight}m
                  </span>
                </div>

                {isActive && (
                  <div className="mt-2 text-[10px] text-slate-400 bg-slate-900/50 p-2 rounded-lg border border-slate-850/60 animate-fade-in divide-y divide-slate-850">
                    <p className="pb-1.5 leading-relaxed">{hall.description}</p>
                    <div className="pt-1.5 flex flex-col gap-1 text-[9px] text-slate-500 font-mono">
                      <div className="line-clamp-1">조명: <strong className="text-slate-300 font-normal">{hall.lightingDescription}</strong></div>
                      <div className="line-clamp-1">스타일: <strong className="text-slate-300 font-normal">{hall.exhibitionMethod}</strong></div>
                    </div>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Dynamic Curator Planner Sliders for real-time scale adjustment */}
      <div className="bg-slate-900/60 backdrop-blur-md border border-slate-800 p-5 rounded-2xl space-y-4" id="curator_exhibition_planner">
        <div className="flex items-center gap-2">
          <Layers className="text-emerald-400" size={18} />
          <h3 className="text-sm font-bold text-slate-100">전시 규모 설정소 (Curator Planner)</h3>
        </div>

        <div className="space-y-4 text-xs">
          {/* Slider 1: Number of chambers (관 수) */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center text-slate-300">
              <span className="font-semibold text-[11px]">개방할 전시장 관 수 (Visible Halls)</span>
              <span className="text-[10px] px-2 py-0.5 bg-slate-950 border border-slate-800 text-emerald-400 rounded-md font-mono font-bold">
                {visibleHallsCount}개 관 개방 (최대 10개)
              </span>
            </div>
            <input 
              type="range" 
              min="1" 
              max="10" 
              value={visibleHallsCount} 
              onChange={(e) => setVisibleHallsCount(Number(e.target.value))}
              className="w-full h-1 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-emerald-500"
            />
            <div className="flex justify-between text-[8px] text-slate-500 font-mono">
              <span>제1관</span>
              <span>제3관</span>
              <span>제5관</span>
              <span>제8관</span>
              <span>제10관 (전체)</span>
            </div>
          </div>

          {/* Slider 2: Artworks count per chamber (관당 전시 작품 수) */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center text-slate-300">
              <span className="font-semibold text-[11px]">관람 벽면 설치 수 (Max Artworks per Hall)</span>
              <span className="text-[10px] px-2 py-0.5 bg-slate-950 border border-slate-800 text-indigo-400 rounded-md font-mono font-bold">
                {activeArtworksLimit}개 벽면 가동 (최대 15개)
              </span>
            </div>
            <input 
              type="range" 
              min="1" 
              max="15" 
              value={activeArtworksLimit} 
              onChange={(e) => setActiveArtworksLimit(Number(e.target.value))}
              className="w-full h-1 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-indigo-500"
              style={{ accentColor: '#6366f1' }}
            />
            <div className="flex justify-between text-[8px] text-slate-500 font-mono">
              <span>최소 (1개)</span>
              <span>스탠다드 (5개)</span>
              <span>미디움 (10개)</span>
              <span>맥시멈 (15개)</span>
            </div>
          </div>
        </div>
      </div>

      {/* AI Curator Setup & Local Installation Panel */}
      <div className="bg-slate-900/60 backdrop-blur-md border border-slate-800 p-5 rounded-2xl space-y-4" id="ai_api_settings_panel">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Settings className="text-pink-400 rotate-45" size={17} />
            <h3 className="text-sm font-bold text-slate-100">AI 도슨트 큐레이션 설정 (Gemini API)</h3>
          </div>
          <span className="text-[10px] font-semibold text-pink-400 bg-pink-950/40 px-2 py-0.5 rounded border border-pink-900/50">
            Gemini 3.5
          </span>
        </div>

        {/* 1. Api Info Brief */}
        <div className="space-y-2 text-xs leading-relaxed text-slate-400 border-b border-slate-800/60 pb-3.5">
          <p>
            본 갤러리는 이미지를 지능적으로 분석하여 작품명, 작가명, 설명 및 어울리는 액자 스타일을 자동 큐레이션해주는 <strong>Google Gemini 3.5 Flash API</strong>를 채택하고 있습니다.
          </p>
          <div className="flex flex-col gap-1.5 mt-2 p-3 bg-slate-950/80 rounded-xl border border-slate-850/60 text-[11px]">
            <div className="flex items-center gap-2 text-emerald-400 font-semibold text-[11px]">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span>Q. 요금이 청구되는 유료 API인가요?</span>
            </div>
            <p className="text-slate-400 text-[10px] leading-relaxed">
              <strong>아닙니다!</strong> Gemini 3.5 Flash는 무료 한도(분당 15요청) 내에서 <strong>완전히 무료</strong>로 가동됩니다.
            </p>
            <p className="text-slate-500 text-[9px] leading-relaxed">
              * 추가적으로 API 없이도 무인 가동할 수 있도록 <strong>오프라인 고성능 자체 템플릿 큐레이팅</strong>을 탑재하여, 설정 없이도 전체 기능을 영구히 무료로 즐길 수 있습니다.
            </p>
          </div>
        </div>

        {/* 2. Personal Key Slot */}
        <div className="space-y-2" id="personal_api_key_section">
          <div className="flex justify-between items-center text-xs">
            <span className="font-semibold text-slate-300 flex items-center gap-1.5">
              <Key size={13} className="text-amber-400" />
              개인 API Key 입력란 (Personal Key)
            </span>
            <span className={`text-[9px] font-mono px-2 py-0.5 rounded-full border flex items-center gap-1 font-bold ${
              customKey 
                ? 'bg-emerald-950/60 border-emerald-900 text-emerald-400' 
                : 'bg-indigo-950/50 border-indigo-900/60 text-indigo-400'
            }`}>
              <div className={`w-1.5 h-1.5 rounded-full ${customKey ? 'bg-emerald-500' : 'bg-indigo-500'}`} />
              {customKey ? '개인키 연동중' : '기본 서버 API 가동'}
            </span>
          </div>

          <div className="relative">
            <input
              type={showKey ? "text" : "password"}
              value={customKey}
              onChange={(e) => handleSaveKey(e.target.value)}
              placeholder="Google AI Studio에서 발급받은 GEMINI_API_KEY 입력"
              className="w-full bg-slate-950 hover:bg-slate-950/80 focus:bg-slate-950 border border-slate-800 focus:border-slate-700/85 focus:outline-none rounded-xl py-2 pl-3.5 pr-12 text-[11px] font-mono text-slate-200 placeholder-slate-600 transition"
            />
            <button
              onClick={() => setShowKey(!showKey)}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center text-slate-500 hover:text-slate-300 transition"
              title={showKey ? "가리기" : "보여주기"}
            >
              {showKey ? <EyeOff size={14} /> : <Eye size={14} />}
            </button>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-[9px] text-slate-500">
              * 입력한 비밀키는 안전하게 기기 웹브라우저 로컬(localStorage)에만 저장됩니다.
            </span>
            {saveStatus && (
              <span className="text-[9px] font-bold text-emerald-400 flex items-center gap-1 animate-pulse">
                <Check size={11} />
                로컬 저장 완료!
              </span>
            )}
          </div>
        </div>


      </div>

      {/* 2. Interactive Guided Curation Tour (Artworks Walkthrough) */}
      <div className="bg-slate-900/60 backdrop-blur-md border border-slate-800 p-5 rounded-2xl flex-1 flex flex-col min-h-[300px]" id="docent_tour_container">
        <div className="flex items-center justify-between mb-3 shrink-0">
          <div className="flex items-center gap-2">
            <BookOpen className="text-pink-400" size={18} />
            <h3 className="text-sm font-bold text-slate-100">도슨트 작품 일람 & 시선 고정</h3>
          </div>
          <span className="text-[10px] bg-slate-950 px-2.5 py-1 text-slate-400 border border-slate-850 rounded-full font-mono">
            {artworks.length}개 전시 중
          </span>
        </div>

        <p className="text-[10px] text-slate-500 mb-3.5 leading-relaxed shrink-0">
          아래의 작품을 클릭하면 가상 3D 카메라가 해당 벽면 앞마당으로 부드럽게 글라이딩 주행하며, 도슨트 큐레이터 관점이 잠금 조준됩니다.
        </p>

        {/* Scrollable listing box */}
        <div className="flex-1 overflow-y-auto space-y-2.5 max-h-[280px]" id="tour_artworks_list">
          {artworks.map(art => {
            const wallDef = currentHall.wallPositions.find(w => w.id === art.id);
            const isActive = art.id === activeDocentId;
            return (
              <div
                key={art.id}
                onClick={() => onFocusArtwork(art.id)}
                className={`group flex gap-3 p-2 rounded-xl cursor-pointer transition text-left ${
                  isActive 
                    ? 'bg-indigo-950 border-indigo-500/80 shadow-[0_0_15px_rgba(99,102,241,0.25)]' 
                    : 'bg-slate-950/70 hover:bg-slate-950 border-slate-850/50 hover:border-slate-800'
                }`}
              >
                {/* Thumb preview image */}
                <div className="w-12 h-12 rounded-lg bg-slate-900 overflow-hidden shrink-0 border border-slate-800 flex items-center justify-center relative">
                  <img 
                    src={art.imageUrl} 
                    alt={art.title} 
                    className="w-full h-full object-cover transition duration-300 group-hover:scale-110" 
                    referrerPolicy="no-referrer"
                  />
                  {/* Aspect Ratio icon label */}
                  <span className="absolute bottom-0 right-0 bg-black/85 text-[8px] text-slate-400 px-1 font-mono">
                    {art.width.toFixed(1)}m
                  </span>
                </div>

                {/* Meta details */}
                <div className="flex-1 min-w-0 pr-1 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between gap-1">
                      <h4 className={`text-[11px] font-bold truncate transition-colors ${isActive ? 'text-pink-400' : 'text-slate-200 group-hover:text-indigo-300'}`}>
                        {art.title}
                      </h4>
                      {isActive ? (
                        <span className="text-[8.5px] px-1.5 py-0.5 bg-pink-900 text-pink-200 border border-pink-700 rounded animate-pulse shrink-0 uppercase font-bold font-mono">
                          🔊 ACTIVE
                        </span>
                      ) : (
                        <span className="text-[8px] px-1 py-0.5 bg-slate-900 rounded text-slate-500 border border-slate-850/50 shrink-0 uppercase font-mono">
                          {art.id.split('_')[1]}
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-slate-400 truncate mt-0.5">{art.artist} ({art.year})</p>
                  </div>
                  <p className="text-[9px] text-slate-500 truncate italic mt-1 font-sans">
                    {art.description}
                  </p>
                </div>
              </div>
            );
          })}

          {artworks.length === 0 && (
            <div className="text-center py-10 text-slate-600 flex flex-col items-center">
              <Compass size={32} className="text-slate-800 mb-2 animate-spin" />
              <p className="text-xs">현재 이 관에 배치된 예술 작품이 전혀 없습니다.</p>
              <p className="text-[10px] text-slate-500 mt-1">벽면을 클릭해 첫 작품을 걸어보세요!</p>
            </div>
          )}
        </div>
      </div>

      {/* 3. Audio & Minimap Panel (Two Col compact widget) */}
      <div className="grid grid-cols-2 gap-4 shrink-0" id="audio_minimap_col">
        
        {/* Playback controller */}
        <div className="bg-slate-900/60 backdrop-blur-md border border-slate-800 p-4 rounded-2xl flex flex-col justify-between" id="audio_control_widget">
          <div className="flex items-center gap-2">
            <Disc className={`text-[#f72585] ${isPlayingMusic && !audioMuted ? 'animate-spin' : ''}`} style={{ animationDuration: '6s' }} size={16} />
            <h4 className="text-xs font-bold text-slate-200">뮤지엄 앰비언트</h4>
          </div>
          
          <p className="text-[9px] text-slate-500 leading-relaxed mt-2">
            3D 갤러리에 어울리는 백그라운드 오르간/신스패드 화음을 실시간 주파수로 자동 생성합니다. <strong className="text-pink-400 font-normal">(작품 선택 시 AI 한국어 도슨트 성우 낭독가이드 자동 발화!)</strong>
          </p>

          <div className="mt-3.5 space-y-2">
            {!isPlayingMusic ? (
              <button
                onClick={onStartMusic}
                className="w-full py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-[10px] font-bold cursor-pointer transition flex items-center justify-center gap-1.5"
              >
                <Sparkles size={11} className="animate-pulse" />
                <span>앰비언트 사운드 켜기</span>
              </button>
            ) : (
              <button
                onClick={onToggleAudio}
                className={`w-full py-1.5 rounded-lg text-[10px] font-bold cursor-pointer transition flex items-center justify-center gap-1.5 border ${
                  audioMuted 
                    ? 'bg-slate-950 border-slate-850 text-slate-400 hover:bg-slate-900' 
                    : 'bg-indigo-650/40 border-indigo-900 text-indigo-400 hover:bg-indigo-650/60'
                }`}
              >
                {audioMuted ? <VolumeX size={12} /> : <Volume2 size={12} />}
                <span>{audioMuted ? '음소거 해제' : '배경 소리 끄기'}</span>
              </button>
            )}
            
            <div className="text-center text-[8px] text-slate-600 font-mono">
              Web Audio Synthesizer Engine v1.0
            </div>
          </div>
        </div>

        {/* 2D Minimap showing live coordinates, footprints heatmap and spectator icons */}
        <div className="bg-slate-900/60 backdrop-blur-md border border-slate-800 p-4 rounded-2xl flex flex-col items-center justify-between" id="minimap_widget">
          <div className="w-full flex items-center justify-between shrink-0 mb-1.5">
            <h4 className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
              <MapIcon size={13} className="text-emerald-400" />
              <span>미니맵 및 발자취</span>
            </h4>
            <span className="text-[8px] font-mono text-slate-550">
              X: {playerPosition.x.toFixed(1)}, Z: {playerPosition.z.toFixed(1)}
            </span>
          </div>

          <div className="w-[110px] h-[110px] rounded-xl overflow-hidden border border-slate-800 flex items-center justify-center bg-slate-950 relative group">
            <canvas 
              ref={minimapCanvasRef} 
              width={160} 
              height={160} 
              className="w-full h-full block" 
            />
          </div>

          <div className="flex flex-col gap-1.5 w-full mt-2.5">
            {/* Heatmap Legend */}
            <div className="flex items-center justify-between w-full text-[8.5px] text-slate-400/80 font-mono bg-slate-950/40 p-1 px-1.5 rounded-md border border-slate-850/40">
              <span className="flex items-center gap-1 font-bold text-sky-400">● <span className="text-[8px] text-slate-450 font-normal">통과</span></span>
              <span className="flex items-center gap-1 font-bold text-yellow-500">● <span className="text-[8px] text-slate-450 font-normal">관람</span></span>
              <span className="flex items-center gap-1 font-bold text-red-500 animate-pulse">● <span className="text-[8px] text-slate-450 font-normal">체류</span></span>
            </div>
            
            {/* Clear Button */}
            <button
              onClick={() => { trailRef.current = []; }}
              className="w-full py-1 text-[8.5px] bg-slate-950/60 hover:bg-slate-950 border border-slate-850/50 hover:border-slate-800 text-slate-400 font-bold rounded-lg transition-colors cursor-pointer select-none hover:text-slate-200"
            >
              발자취 기록 초기화
            </button>
          </div>
        </div>

      </div>

      {/* 4. Touch Virtual Controller (Virtual Joystick/Keys overlay for device friendliness) */}
      <div className="bg-slate-900/60 backdrop-blur-md border border-slate-800 p-4 rounded-2xl shrink-0" id="virtual_dpad_controller">
        <h4 className="text-xs font-bold text-slate-350 mb-3 text-center flex items-center justify-center gap-1.5">
          <Compass size={13} className="text-slate-450" />
          <span>모바일 가상 컨트롤 마우스패드</span>
        </h4>

        <div className="flex items-center justify-center gap-6">
          {/* Positional movement cross */}
          <div className="grid grid-cols-3 gap-1">
            <div />
            <button
              onPointerDown={() => bindControl('forward', true)}
              onPointerUp={() => bindControl('forward', false)}
              onPointerCancel={() => bindControl('forward', false)}
              className="w-9 h-9 bg-slate-950 hover:bg-slate-850 active:bg-slate-800 border border-slate-800 rounded-lg flex items-center justify-center text-slate-400 cursor-pointer select-none touch-none"
              title="앞으로 이동"
            >
              <ChevronUp size={18} />
            </button>
            <div />

            <button
              onPointerDown={() => bindControl('left', true)}
              onPointerUp={() => bindControl('left', false)}
              onPointerCancel={() => bindControl('left', false)}
              className="w-9 h-9 bg-slate-950 hover:bg-slate-850 active:bg-slate-800 border border-slate-800 rounded-lg flex items-center justify-center text-slate-400 cursor-pointer select-none touch-none"
              title="왼쪽 게걸음"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              onPointerDown={() => bindControl('backward', true)}
              onPointerUp={() => bindControl('backward', false)}
              onPointerCancel={() => bindControl('backward', false)}
              className="w-9 h-9 bg-slate-950 hover:bg-slate-850 active:bg-slate-800 border border-slate-800 rounded-lg flex items-center justify-center text-slate-400 cursor-pointer select-none touch-none"
              title="뒤로 이동"
            >
              <ChevronDown size={18} />
            </button>
            <button
              onPointerDown={() => bindControl('right', true)}
              onPointerUp={() => bindControl('right', false)}
              onPointerCancel={() => bindControl('right', false)}
              className="w-9 h-9 bg-slate-950 hover:bg-slate-850 active:bg-slate-800 border border-slate-800 rounded-lg flex items-center justify-center text-slate-400 cursor-pointer select-none touch-none"
              title="오른쪽 게걸음"
            >
              <ChevronRight size={18} />
            </button>
          </div>

          <div className="w-px h-14 bg-slate-800 shrink-0" />

          {/* Camera Look Yaw Rotate Buttons */}
          <div className="flex flex-col gap-1.5">
            <span className="text-[8px] text-slate-500 uppercase text-center tracking-wider font-mono">Camera Seek</span>
            <div className="flex gap-2">
              <button
                onPointerDown={() => bindControl('turnLeft', true)}
                onPointerUp={() => bindControl('turnLeft', false)}
                onPointerCancel={() => bindControl('turnLeft', false)}
                className="p-2.5 bg-slate-950 hover:bg-slate-850 active:bg-slate-800 border border-slate-800 rounded-lg flex items-center gap-1.5 text-[10px] text-slate-350 cursor-pointer font-semibold select-none touch-none"
                title="왼쪽 회전"
              >
                <RotateCcw size={14} className="text-indigo-400" />
                <span>Turn L</span>
              </button>
              <button
                onPointerDown={() => bindControl('turnRight', true)}
                onPointerUp={() => bindControl('turnRight', false)}
                onPointerCancel={() => bindControl('turnRight', false)}
                className="p-2.5 bg-slate-950 hover:bg-slate-850 active:bg-slate-800 border border-slate-800 rounded-lg flex items-center gap-1.5 text-[10px] text-slate-350 cursor-pointer font-semibold select-none touch-none"
                title="오른쪽 회전"
              >
                <span>Turn R</span>
                <RotateCw size={14} className="text-pink-400" />
              </button>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
