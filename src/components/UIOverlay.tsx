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
  Settings,
  Upload,
  Trash2,
  X
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
  onBulkUpload: (uploadedData: { imageUrl: string; width: number; height: number; title: string; artist: string }[]) => void;
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
  activeDocentId,
  onBulkUpload
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
  }, [playerPosition.x, playerPosition.z, currentHall.id]);  // Gemini Custom API Configuration client-side state
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

  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const bulkFileInputRef = useRef<HTMLInputElement>(null);
  const [uploadTab, setUploadTab] = useState<'file' | 'url' | 'demopack'>('file');
  const [urlInputText, setUrlInputText] = useState('');
  const [stagedArtworks, setStagedArtworks] = useState<{ imageUrl: string; width: number; height: number; title: string; artist: string }[]>([]);

  const handleRemoveStaged = (index: number) => {
    setStagedArtworks(prev => prev.filter((_, i) => i !== index));
  };

  const handleClearStaged = () => {
    setStagedArtworks([]);
  };

  const handleApplyStaged = () => {
    if (stagedArtworks.length === 0) {
      alert('대기열에 추가된 작품이 없습니다. 이미지를 먼저 등록해주세요!');
      return;
    }
    onBulkUpload(stagedArtworks);
    setStagedArtworks([]); // clear queue on success
  };

  const DEMO_PACKS = [
    {
      id: 'classic',
      name: '🏛️ 명화 & 고전 회화 컬렉션',
      desc: '반 고흐, 모네 등 감성적이고 기품 있는 정통 유화 및 클래식 예술 작품 5점',
      artworks: [
        { imageUrl: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=1000&q=80', width: 800, height: 1000, title: '꽃 피는 가든', artist: '빈센트 에튜드' },
        { imageUrl: 'https://images.unsplash.com/photo-1579783928621-7a13d66a6211?w=1000&q=80', width: 800, height: 1100, title: '빅토리안 사색', artist: '마담 뒤바리' },
        { imageUrl: 'https://images.unsplash.com/photo-1580136579312-94651dfd596d?w=1000&q=80', width: 900, height: 700, title: '서정적 숲', artist: '장 프라고나르' },
        { imageUrl: 'https://images.unsplash.com/photo-1549490349-8643362247b5?w=1000&q=80', width: 800, height: 960, title: '황금 장식 무늬', artist: '구스타프 아뜰리에' },
        { imageUrl: 'https://images.unsplash.com/photo-1605721911519-3dfeb3be25e7?w=1000&q=80', width: 1200, height: 800, title: '천상의 붓터치', artist: '미켈란 키드' }
      ]
    },
    {
      id: 'modern',
      name: '🎨 네온 팝아트 & 현대 추상',
      desc: '감각적인 컬러 비주얼과 기하학 형태의 미래지향적 네온 및 현대 추상 5점',
      artworks: [
        { imageUrl: 'https://images.unsplash.com/photo-1541701494587-cb58502866ab?w=1000&q=80', width: 1000, height: 750, title: '사이키델릭 브레인', artist: '팝 큐레이션' },
        { imageUrl: 'https://images.unsplash.com/photo-1500462961340-e119ca1904a0?w=1000&q=80', width: 800, height: 1200, title: '스펙트럼 에너지', artist: '일루전 크레이터' },
        { imageUrl: 'https://images.unsplash.com/photo-1507608869274-d3177c8bb4c7?w=1000&q=80', width: 1100, height: 730, title: '네온 라이트 로망', artist: '플래시 일렉트로' },
        { imageUrl: 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?w=1000&q=80', width: 950, height: 630, title: '미니멀 나이트', artist: '모노 스타일' },
        { imageUrl: 'https://images.unsplash.com/photo-1561214115-f2f134cc4912?w=1000&q=80', width: 850, height: 1060, title: '큐비즘 무브먼트', artist: '바실리 디지털' }
      ]
    },
    {
      id: 'nature',
      name: '🌲 깊은 산림 & 우주의 평화',
      desc: '마음의 안정과 풍성한 사색을 돕는 심산유곡, 해저 세계, 은하 성운 풍경 5점',
      artworks: [
        { imageUrl: 'https://images.unsplash.com/photo-1448375240586-882707db888b?w=1000&q=80', width: 1200, height: 800, title: '안개 숲의 햇살', artist: '네이처 프레임' },
        { imageUrl: 'https://images.unsplash.com/photo-1505118380757-91f5f5632de0?w=1000&q=80', width: 1000, height: 660, title: '해저의 푸른 심연', artist: '아쿠아 블루' },
        { imageUrl: 'https://images.unsplash.com/photo-1464802686167-b939a6910659?w=1000&q=80', width: 1200, height: 750, title: '은하수 파노라마', artist: '아스트로 코스모스' },
        { imageUrl: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=1000&q=80', width: 1100, height: 730, title: '알프스 고도 고산', artist: '마운틴 리더' },
        { imageUrl: 'https://images.unsplash.com/photo-1504618223053-559bdef9dd5a?w=1000&q=80', width: 900, height: 1200, title: '대나무 숲의 청정', artist: '죽림 거사' }
      ]
    }
  ];

  const handleUrlUpload = async () => {
    if (!urlInputText.trim()) {
      alert('이미지 웹 주소(URL)를 입력해주세요.');
      return;
    }

    setIsUploading(true);
    const urls = urlInputText
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0 && (line.startsWith('http://') || line.startsWith('https://') || line.startsWith('data:image')));

    if (urls.length === 0) {
      alert('올바른 이미지 웹 주소(http:// 또는 https://로 시작)를 입력해주세요.');
      setIsUploading(false);
      return;
    }

    const loadedArtworks: { imageUrl: string; width: number; height: number; title: string; artist: string }[] = [];

    try {
      for (let i = 0; i < urls.length; i++) {
        const url = urls[i];
        try {
          const dims = await new Promise<{ width: number; height: number }>((resolve) => {
            const img = new Image();
            img.onload = () => {
              resolve({ width: img.naturalWidth || img.width || 800, height: img.naturalHeight || img.height || 600 });
            };
            img.onerror = () => {
              resolve({ width: 800, height: 600 }); // default fallback ratio
            };
            img.src = url;
          });

          let title = `무제 (웹 컬렉션 #${i + 1})`;
          try {
            const urlObj = new URL(url);
            const pathname = urlObj.pathname;
            const filename = pathname.substring(pathname.lastIndexOf('/') + 1);
            if (filename && filename.includes('.')) {
              title = decodeURIComponent(filename.split('.')[0]).substring(0, 20);
            }
          } catch (_) {}

          const randomArtists = ["디지털 아티스트", "AI 큐레이터", "글로벌 비주얼 크리에이터", "웹 콜렉터", "네트 아트 서퍼"];
          const artist = randomArtists[Math.floor(Math.random() * randomArtists.length)];

          loadedArtworks.push({
            imageUrl: url,
            width: dims.width,
            height: dims.height,
            title: title || `디지털 가상 예술 #${i + 1}`,
            artist: artist
          });
        } catch (innerErr) {
          console.warn(`Error loading url: ${url}`, innerErr);
        }
      }

      if (loadedArtworks.length > 0) {
        setStagedArtworks(prev => [...prev, ...loadedArtworks]);
        setUrlInputText(''); // clear on success
      } else {
        alert('이미지 정보를 불러올 수 없었습니다. 웹 주소가 유효하고 접근 가능한지 확인해 주세요.');
      }
    } catch (err) {
      console.error(err);
      alert('이미지 분석 처리 중 에러가 발생했습니다.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const processFiles = async (files: FileList) => {
    if (files.length === 0) return;
    setIsUploading(true);
    const loadedArtworks: { imageUrl: string; width: number; height: number; title: string; artist: string }[] = [];

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (!file.type.startsWith('image/')) {
          continue; // skip non-image
        }

        try {
          const base64 = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (evt) => resolve(evt.target?.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(file);
          });

          const dims = await new Promise<{ width: number; height: number }>((resolve) => {
            const img = new Image();
            img.onload = () => {
              resolve({ width: img.naturalWidth, height: img.naturalHeight });
            };
            img.onerror = () => {
              resolve({ width: 800, height: 600 }); // fallback
            };
            img.src = base64;
          });

          const randomArtists = ["큐레이터 수집가", "나만의 아틀리에", "가상 예술 애호가", "시각 디자이너", "익명의 크리에이터"];
          const artist = randomArtists[Math.floor(Math.random() * randomArtists.length)];

          loadedArtworks.push({
            imageUrl: base64,
            width: dims.width,
            height: dims.height,
            title: file.name.replace(/\.[^/.]+$/, ""), // file name without extension
            artist: artist
          });
        } catch (innerErr) {
          console.warn(`Error processing file ${file.name}:`, innerErr);
        }
      }

      if (loadedArtworks.length > 0) {
        setStagedArtworks(prev => [...prev, ...loadedArtworks]);
      } else {
        alert('업로드 가능한 이미지 파일을 선택해주세요.');
      }
    } catch (err) {
      console.error(err);
      alert('이미지 비율 분석 처리 중 에러가 발생했습니다.');
    } finally {
      setIsUploading(false);
      setIsDragging(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files) {
      processFiles(e.dataTransfer.files);
    }
  };

  const handleBulkFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      processFiles(e.target.files);
    }
    e.target.value = ''; // reset
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

      {/* 2.5 Bulk Image Upload Card with high-fidelity visual layout */}
      <div className="bg-slate-900/60 backdrop-blur-md border border-slate-800 p-5 rounded-2xl space-y-4 animate-fade-in" id="bulk_image_uploader_panel">
        <div className="flex items-center gap-2">
          <Upload className="text-indigo-400" size={18} />
          <h3 className="text-sm font-bold text-slate-100">그림 한 번에 올리기 (일괄 업로드)</h3>
        </div>

        <p className="text-[10px] text-slate-400 leading-relaxed">
          현재 선택된 <strong>{currentHall.name.split(' : ')[0]}</strong>에 여러 장의 이미지를 배치해 나만의 전시를 한 번에 큐레이션해 보세요!
        </p>

        {/* Tab triggers */}
        <div className="grid grid-cols-3 gap-1 bg-slate-950/80 p-1 rounded-xl border border-slate-850">
          <button
            onClick={() => setUploadTab('file')}
            className={`py-1.5 text-[9px] font-bold rounded-lg transition-all duration-200 ${
              uploadTab === 'file'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            📂 내 PC 파일
          </button>
          <button
            onClick={() => setUploadTab('url')}
            className={`py-1.5 text-[9px] font-bold rounded-lg transition-all duration-200 ${
              uploadTab === 'url'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            🔗 이미지 주소
          </button>
          <button
            onClick={() => setUploadTab('demopack')}
            className={`py-1.5 text-[9px] font-bold rounded-lg transition-all duration-200 ${
              uploadTab === 'demopack'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            🎁 추천 큐레이션
          </button>
        </div>

        {uploadTab === 'file' && (
          <div className="space-y-2 animate-fade-in">
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => bulkFileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-6 flex flex-col items-center justify-center gap-2.5 cursor-pointer transition-all duration-300 ${
                isDragging 
                  ? 'border-indigo-500 bg-indigo-950/25 shadow-[0_0_15px_rgba(99,102,241,0.15)] scale-[0.99]' 
                  : 'border-slate-800 hover:border-slate-700 bg-slate-950/40 hover:bg-slate-950/80'
              }`}
              title="클릭하여 이미지를 여러 장 선택하거나 이곳에 드래그 앤 드롭 하세요!"
            >
              {isUploading ? (
                <div className="flex flex-col items-center gap-2 py-2">
                  <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                  <span className="text-[10px] font-bold text-slate-300 animate-pulse">이미지 비율 분석 및 3D 배치 중...</span>
                </div>
              ) : (
                <>
                  <div className="p-2.5 bg-indigo-600/10 rounded-xl border border-indigo-500/20 text-indigo-400">
                    <Upload size={18} />
                  </div>
                  <div className="text-center">
                    <p className="text-[11px] font-bold text-slate-200">여러 개의 이미지 선택 또는 드래그</p>
                    <p className="text-[9px] text-slate-500 mt-1">모바일은 사진첩에서 다중 선택이 가능합니다</p>
                  </div>
                </>
              )}
            </div>

            {/* Mobile Multi-select Tips */}
            <div className="bg-slate-950/60 border border-slate-850/50 rounded-xl p-2.5 text-[9px] text-slate-400 space-y-1">
              <p className="font-bold text-indigo-400 flex items-center gap-1">
                <span>📱</span> 모바일 다중 업로드 꿀팁!
              </p>
              <ul className="list-disc pl-3.5 space-y-0.5 text-slate-400 text-[8.5px] leading-relaxed">
                <li>카카오톡/네이버 인앱이 아닌 <strong className="text-slate-200">순정 Safari / Chrome 브라우저</strong>로 접속해 주세요.</li>
                <li>파일 선택 창이 열리면 우측 상단의 <strong className="text-slate-200">선택</strong> 버튼을 누르거나 이미지를 길게 터치하여 여러 장을 지정해 보세요!</li>
                <li>갤러리 앱에 따라 다중 선택 아이콘(<span className="text-indigo-400">✓</span>)을 터치해야 한 번에 올라갑니다.</li>
              </ul>
            </div>
          </div>
        )}

        {uploadTab === 'url' && (
          <div className="space-y-2 animate-fade-in">
            <textarea
              value={urlInputText}
              onChange={(e) => setUrlInputText(e.target.value)}
              placeholder="예시:&#10;https://images.unsplash.com/photo-1579783900882-c0d3dad7b119&#10;https://images.unsplash.com/photo-1549490349-8643362247b5&#10;(한 줄에 하나씩 이미지 웹주소를 입력해주세요)"
              className="w-full h-24 bg-slate-950/80 border border-slate-850 p-2 text-[9px] rounded-lg text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500 font-mono resize-none leading-relaxed"
            />
            <button
              onClick={handleUrlUpload}
              disabled={isUploading || !urlInputText.trim()}
              className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-500 text-white text-[10px] font-bold rounded-lg shadow-md transition-all active:scale-[0.98] flex items-center justify-center gap-1.5 cursor-pointer"
            >
              {isUploading ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  웹 이미지 주소 분석 및 추가 중...
                </>
              ) : (
                '🔗 입력한 이미지 대기열에 추가하기'
              )}
            </button>
          </div>
        )}

        {uploadTab === 'demopack' && (
          <div className="space-y-2 animate-fade-in">
            <p className="text-[9px] text-slate-400 leading-tight">
              이미지 주소를 찾기 번거로우신가요? 1초 만에 최고 화질의 명작 / 아트를 벽면 가득 채워보세요!
            </p>
            <div className="space-y-1.5 max-h-[145px] overflow-y-auto pr-1">
              {DEMO_PACKS.map((pack) => (
                <button
                  key={pack.id}
                  onClick={() => {
                    setStagedArtworks(prev => [...prev, ...pack.artworks]);
                  }}
                  className="w-full p-2 bg-slate-950/50 hover:bg-slate-950/90 border border-slate-850 hover:border-indigo-500/50 rounded-xl text-left transition-all group flex items-start gap-1.5 cursor-pointer"
                >
                  <div className="mt-0.5 text-[10px]">✨</div>
                  <div className="space-y-0.5">
                    <div className="text-[10px] font-bold text-slate-200 group-hover:text-indigo-400 transition-colors">
                      {pack.name}
                    </div>
                    <div className="text-[8px] text-slate-500 leading-tight">
                      {pack.desc}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Staging Queue Section */}
        {stagedArtworks.length > 0 && (
          <div className="p-3 bg-slate-950/75 border border-indigo-900/40 rounded-2xl space-y-2.5 animate-fade-in">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-200 flex items-center gap-1">
                <span className="text-indigo-400">📋</span> 업로드 대기열 ({stagedArtworks.length}개 작품)
              </span>
              <button
                onClick={handleClearStaged}
                className="text-[8px] text-slate-500 hover:text-rose-400 transition-colors flex items-center gap-0.5 cursor-pointer"
                title="대기열 비우기"
              >
                <Trash2 size={10} />
                전체 비우기
              </button>
            </div>

            {/* Horizontal Scroll of Thumbnails */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1.5 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent">
              {stagedArtworks.map((art, index) => (
                <div key={index} className="relative w-14 h-14 rounded-lg bg-slate-900 border border-slate-800 flex-shrink-0 overflow-hidden group">
                  <img
                    src={art.imageUrl}
                    alt={art.title}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                  {/* Delete Button */}
                  <button
                    onClick={() => handleRemoveStaged(index)}
                    className="absolute top-0.5 right-0.5 p-0.5 bg-slate-950/80 hover:bg-rose-600 rounded-md text-slate-400 hover:text-white transition-all shadow-sm cursor-pointer"
                    title="대기열에서 삭제"
                  >
                    <X size={8} />
                  </button>
                  {/* Miniature Ratio Badge */}
                  <div className="absolute bottom-0 left-0 right-0 bg-slate-950/70 text-[7px] text-slate-400 text-center py-0.5 font-mono truncate">
                    {Math.round(art.width)}:{Math.round(art.height)}
                  </div>
                </div>
              ))}

              {/* Extra Add Button inside the row */}
              <button
                onClick={() => bulkFileInputRef.current?.click()}
                className="w-14 h-14 rounded-lg border border-dashed border-slate-800 hover:border-indigo-500 hover:bg-indigo-950/20 text-slate-500 hover:text-indigo-400 flex flex-col items-center justify-center gap-0.5 transition-colors flex-shrink-0 cursor-pointer"
                title="이미지 추가"
              >
                <span className="text-xs font-bold">+</span>
                <span className="text-[7px]">추가</span>
              </button>
            </div>

            <p className="text-[8px] text-slate-500 leading-normal">
              💡 모바일 환경 등에서 일괄 지정이 어려운 경우, <strong>'+ 추가'</strong> 버튼을 눌러 하나씩 차례로 대기열에 담은 후 마지막에 한 번에 배치할 수 있습니다.
            </p>

            <button
              onClick={handleApplyStaged}
              className="w-full py-2 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-[10px] font-bold rounded-lg shadow-[0_2px_10px_rgba(99,102,241,0.2)] hover:shadow-[0_4px_15px_rgba(99,102,241,0.35)] transition-all active:scale-[0.98] flex items-center justify-center gap-1.5 cursor-pointer animate-pulse"
            >
              <span>🎨</span> <strong>대기열 작품 미술관에 일괄 배치하기 ({stagedArtworks.length}개)</strong>
            </button>
          </div>
        )}

        <input
          type="file"
          ref={bulkFileInputRef}
          onChange={handleBulkFileChange}
          multiple
          accept="image/*"
          className="hidden"
          onClick={(e) => e.stopPropagation()}
        />

        {/* Curation Guide badges */}
        <div className="grid grid-cols-3 gap-1.5 text-[9px] text-slate-400">
          <div className="p-1.5 bg-slate-950/60 border border-slate-850/80 rounded-lg text-center flex flex-col justify-center items-center">
            <span className="font-bold text-indigo-400">비례 100% 보존</span>
            <span className="text-[8px] text-slate-500 mt-0.5 leading-none">원본 종횡비 유지</span>
          </div>
          <div className="p-1.5 bg-slate-950/60 border border-slate-850/80 rounded-lg text-center flex flex-col justify-center items-center">
            <span className="font-bold text-emerald-400">동서남북 분산</span>
            <span className="text-[8px] text-slate-500 mt-0.5 leading-none">텅 비지 않는 배치</span>
          </div>
          <div className="p-1.5 bg-slate-950/60 border border-slate-850/80 rounded-lg text-center flex flex-col justify-center items-center">
            <span className="font-bold text-amber-400">크기 율동감</span>
            <span className="text-[8px] text-slate-500 mt-0.5 leading-none">지루하지 않은 리듬</span>
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
        <div className="space-y-2 text-xs leading-relaxed text-slate-400">
          <p>
            본 갤러리는 이미지를 지능적으로 분석하여 작품명, 작가명, 설명 및 어울리는 액자 스타일을 자동 큐레이션해주는 <strong>Google Gemini 3.5 Flash API</strong>를 채택하고 있습니다.
          </p>
          <div className="flex flex-col gap-1.5 mt-2 p-3 bg-slate-950/80 rounded-xl border border-slate-850/60 text-[11px]">
            <div className="flex items-center gap-2 text-emerald-400 font-semibold text-[11px]">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span>서버사이드 API 연동 작동 중</span>
            </div>
            <p className="text-slate-400 text-[10px] leading-relaxed">
              기본 서버 API 외에, 구글 무료 API 분당 할당량 제한(429)을 피하고 더 빠르고 무제한으로 사용하시려면 아래에 <strong>개인 API Key</strong>를 입력해 연동해 주세요!
            </p>
          </div>
        </div>

        {/* 2. Personal Key Slot */}
        <div className="space-y-2 pt-1.5" id="personal_api_key_section">
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

          {/* Quick Guide */}
          <div className="p-3 bg-slate-950/45 border border-slate-855 rounded-xl text-[10px] text-slate-400 space-y-1.5 leading-relaxed">
            <p className="font-semibold text-slate-300 flex items-center gap-1">
              <span>💡</span> Gemini API 키 무료 발급 방법:
            </p>
            <ol className="list-decimal pl-3.5 space-y-1 text-slate-400 text-[10px]">
              <li>
                <a 
                  href="https://aistudio.google.com/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-indigo-400 hover:underline inline-flex items-center gap-0.5 font-bold"
                >
                  Google AI Studio (aistudio.google.com)
                </a>에 로그인(구글 계정 연동)합니다.
              </li>
              <li>화면 상단의 <strong>'Get API key'</strong> 파란색 버튼을 클릭합니다.</li>
              <li><strong>'Create API Key'</strong> 버튼을 클릭하여 새 키를 발급 받습니다.</li>
              <li>생성된 <code>AIzaSy...</code> 형식의 긴 키를 복사한 뒤, 위의 입력란에 붙여넣어주세요!</li>
            </ol>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-[9px] text-slate-500">
              * 입력하신 API 키는 브라우저 로컬(localStorage)에만 안전하게 저장됩니다.
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
