import React, { useState, useRef, useEffect } from 'react';
import { Artwork, FrameType, HallType } from '../types';
import { X, Upload, Palette, AlertCircle, ArrowRight } from 'lucide-react';
import { generateProceduralArt } from '../utils/artGenerator';

interface ArtworkModalProps {
  isOpen: boolean;
  onClose: () => void;
  wallId: string;
  hallStyle: HallType;
  maxDimensions: { width: number; height: number };
  currentArtwork: Artwork | null;
  onSave: (artwork: Artwork) => void;
}

export default function ArtworkModal({
  isOpen,
  onClose,
  wallId,
  hallStyle,
  maxDimensions,
  currentArtwork,
  onSave
}: ArtworkModalProps) {
  const [title, setTitle] = useState('');
  const [artist, setArtist] = useState('');
  const [year, setYear] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [width, setWidth] = useState(1.5);
  const [height, setHeight] = useState(1.2);
  const [frameType, setFrameType] = useState<FrameType>('none');
  const [mediaType, setMediaType] = useState<'image' | 'video'>('image');
  
  const [dragActive, setDragActive] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Call the server-side API to analyze the uploaded/generated image using Gemini 3.5 Flash
  const analyzeArtworkImage = async (base64Image: string) => {
    setIsAnalyzing(true);
    setErrorMsg('');
    try {
      const savedKey = (import.meta as any).env?.VITE_GEMINI_API_KEY || "";
      const headers: Record<string, string> = {
        "Content-Type": "application/json"
      };
      if (savedKey) {
        headers["x-gemini-api-key"] = savedKey;
      }

      let data: any = null;
      let handledByClient = false;

      try {
        const res = await fetch("/api/analyze-artwork", {
          method: "POST",
          headers,
          body: JSON.stringify({ image: base64Image, currentHallId: hallStyle })
        });

        if (res.status === 404 || res.status === 405) {
          // If server endpoints 404/not available (like on Vercel's static router), use direct client-side fallback
          console.warn(`Server API returned status ${res.status}. Falling back to dynamic client-side direct calling...`);
          handledByClient = true;
        } else if (!res.ok) {
          let errMsg = "서버 분석 요청에 실패했습니다.";
          try {
            const errJson = await res.json();
            errMsg = errJson.error || errMsg;
          } catch (_) {}
          throw new Error(errMsg);
        } else {
          data = await res.json();
        }
      } catch (fetchErr: any) {
        // If it's a specific custom error from the server, rethrow it directly so the user sees the real message!
        if (fetchErr instanceof Error && !fetchErr.message.includes("Failed to fetch") && !fetchErr.message.includes("network") && !fetchErr.message.includes("fetch")) {
          throw fetchErr;
        }
        console.warn("Express endpoint is unreachable. Falling back to secure direct client-side Gemini call...", fetchErr);
        handledByClient = true;
      }

      if (handledByClient) {
        // Direct Client-Side Call Fallback for Vercel
        const finalKey = savedKey || "";
        if (!finalKey) {
          throw new Error("서버 API 연동에 실패했습니다. Vercel 환경 변수에 GEMINI_API_KEY가 올바르게 설정되어 있는지 대시보드를 확인해주세요.");
        }

        const { GoogleGenAI } = await import("@google/genai");
        const ai = new GoogleGenAI({ apiKey: finalKey });

        const parts = base64Image.split(",");
        const mime = parts[0].match(/data:(.*?);/)?.[1] || "image/png";
        const base64Data = parts[1] || parts[0];

        const promptText = `현재 가상 전시장 테마는 '${hallStyle}' 입니다.
이 업로드된 전시 작품 이미지를 감상한 전문가 큐레이터 관점에서 다음 6가지 항목을 분석해 한국어로 정밀하게 채워진 JSON 데이터만 리턴하세요. 다른 서문, 수식어, Markdown 백틱(\`\`\`) 등은 일절 제외하고 순수 파싱 가능한 JSON 텍스트 오브젝트 하나만 리턴해야 합니다.

출력 JSON 스펙:
{
  "title": "분석된 작품 제목 (한국어, 신비롭고 어울리게 15자 내외)",
  "artist": "가상 예술가명 (감각적인 동서양 이름 구성)",
  "year": "제작년도 (2020~2026 사이의 연도 숫자)",
  "description": "한글 3~4문장의 극적이고 시적이며 전문적인 3D 공간 큐레이션 및 작품 도슨트 해설",
  "width": 1.5, // 1.5 ~ 3.0 사이의 추천 전시 가로 치수 (실수 단위: 미터)
  "height": 1.2, // 1.0 ~ 2.2 사이의 추천 전시 세로 치수 (실수 단위: 미터)
  "frameType": "다음 5개 액자 스타일 키 중 하나: 'none', 'thin-black', 'ornate-gold', 'wooden', 'cyber-neon'"
}`;

        const apiModel = "gemini-3.5-flash";
        const response = await ai.models.generateContent({
          model: apiModel,
          contents: [
            promptText,
            {
              inlineData: {
                data: base64Data,
                mimeType: mime
              }
            }
          ]
        });

        const rawText = response.text || "";
        const cleanText = rawText.replace(/```json/g, "").replace(/```/g, "").trim();
        data = JSON.parse(cleanText);
      }

      if (data) {
        if (data.title) setTitle(data.title.trim());
        if (data.artist) setArtist(data.artist.trim());
        if (data.year) setYear(data.year.toString().trim());
        if (data.description) setDescription(data.description.trim());
        if (data.width && typeof data.width === 'number') {
          setWidth(Math.max(0.5, Math.min(data.width, maxDimensions.width)));
        }
        if (data.height && typeof data.height === 'number') {
          setHeight(Math.max(0.5, Math.min(data.height, maxDimensions.height)));
        }
        if (data.frameType) {
          setFrameType(data.frameType);
        }
      }
    } catch (e: any) {
      console.error(e);
      setErrorMsg(`AI 정보 분석 실패: ${e.message || "서버 혹은 클라이언트 API 호출에 실패하였습니다. 비밀키 구성을 확인해주세요."}`);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Initialize form with existing artwork details if editing
  useEffect(() => {
    if (isOpen) {
      if (currentArtwork) {
        setTitle(currentArtwork.title);
        setArtist(currentArtwork.artist);
        setYear(currentArtwork.year);
        setDescription(currentArtwork.description);
        setImageUrl(currentArtwork.imageUrl);
        setWidth(currentArtwork.width);
        setHeight(currentArtwork.height);
        setFrameType(currentArtwork.frameType);
        setMediaType(currentArtwork.mediaType || 'image');
      } else {
        // Safe standard presets based on hall style
        setTitle('');
        setArtist('익명 아티스트');
        setYear(new Date().getFullYear().toString());
        setDescription('');
        setImageUrl('');
        setFrameType(hallStyle === 'classic' ? 'ornate-gold' : hallStyle === 'modern' ? 'thin-black' : 'cyber-neon');
        setMediaType('image');
        
        // Match default size nicely proportional to maximum dimensions
        setWidth(Math.min(2.0, maxDimensions.width * 0.7));
        setHeight(Math.min(1.5, maxDimensions.height * 0.7));
      }
      setErrorMsg('');
    }
  }, [isOpen, currentArtwork, hallStyle, maxDimensions]);

  if (!isOpen) return null;

  // Handles image and video reads
  const handleFile = (file: File) => {
    if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) {
      setErrorMsg('전시 가능한 파일 형식은 이미지(*.png, *.jpg, *.webp 등) 또는 동영상(*.mp4, *.webm) 입니다.');
      return;
    }
    setErrorMsg('');
    const isVid = file.type.startsWith('video/');
    
    // Check sizing warning if file is exceptionally heavy
    if (file.size > 15 * 1024 * 1024) {
      setErrorMsg('파일의 크기가 약간 큽니다(최대 권장 15MB). 스마트폰이나 PC의 가상 3D 환경 성능을 위해 더 저용량의 비디오 파일 사용을 제안합니다.');
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        const base64 = e.target.result as string;
        setImageUrl(base64);
        setMediaType(isVid ? 'video' : 'image');
        
        if (!isVid) {
          analyzeArtworkImage(base64);
        } else {
          if (!title.trim()) {
            setTitle(file.name.split('.')[0] || '나만의 가상 전시 비디오');
          }
          if (!artist.trim() || artist === '익명 아티스트') {
            setArtist('나의 큐레이션');
          }
          if (!description.trim()) {
            setDescription('나의 컴퓨터 또는 핸드폰 장치로부터 직접 연동해 전시장 3D 가상 벽면에 투사시킨 미디어 비디오 영상 작품관입니다.');
          }
        }
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const handleProceduralGenerate = () => {
    const artTitle = title.trim() || '영감의 파동';
    const base64 = generateProceduralArt(hallStyle, artTitle);
    setImageUrl(base64);
    analyzeArtworkImage(base64);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setErrorMsg('작품 제목을 입력해 주세요.');
      return;
    }
    if (!imageUrl) {
      setErrorMsg('전시할 이미지 또는 영상 파일을 업로드하거나 하단의 AI 아트 제너레이터를 눌러 이미지를 선택해 주세요.');
      return;
    }

    // Clip sizes to max dimension safely
    const finalWidth = Math.min(width, maxDimensions.width);
    const finalHeight = Math.min(height, maxDimensions.height);

    onSave({
      id: wallId,
      title: title.trim(),
      artist: artist.trim() || 'Anonymous',
      year: year.trim() || new Date().getFullYear().toString(),
      description: description.trim() || '등록된 해설이 없습니다.',
      imageUrl,
      width: finalWidth,
      height: finalHeight,
      frameType,
      mediaType
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in" id="artwork_modal">
      <div className="relative w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl flex flex-col md:flex-row overflow-hidden max-h-[90vh]" id="artwork_modal_body">
        
        {/* Left Side: Real-time Live Art Preview Box */}
        <div className="relative md:w-1/2 bg-slate-950 p-6 flex flex-col justify-between items-center border-b md:border-b-0 md:border-r border-slate-800 overflow-y-auto">
          
          {isAnalyzing && (
            <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-sm flex flex-col items-center justify-center gap-4 z-30 p-6 text-center animate-fade-in">
              <div className="relative w-16 h-16">
                <div className="absolute inset-0 border-4 border-indigo-500/20 rounded-full animate-ping" />
                <div className="absolute inset-2 border-4 border-t-pink-500 border-pink-500/20 rounded-full animate-spin [animation-duration:1.5s]" />
                <div className="absolute inset-4 border-4 border-t-indigo-400 border-indigo-400/20 rounded-full animate-spin [animation-direction:reverse] [animation-duration:1s]" />
              </div>
              <div className="space-y-1">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-500/15 border border-indigo-500/30 text-[10px] font-bold text-indigo-300 uppercase tracking-widest animate-pulse">
                  AI DOCENT ENGINE
                </span>
                <h4 className="text-sm font-extrabold text-slate-100 mt-2">AI 도슨트가 작품 정밀 분석 중...</h4>
                <p className="text-[11px] text-slate-400 max-w-[280px] mx-auto mt-2 leading-relaxed">
                  이미지의 구도와 분위기를 파악하여 <strong className="text-white">제목, 작가, 가상 3D 크기 및 매칭 프레임 스타일, 큐레이팅 도슨트 해설</strong>을 자동 생성 중입니다.
                </p>
              </div>
            </div>
          )}

          <div className="w-full">
            <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-2">실시간 프리뷰 (미리보기)</h3>
            <p className="text-xs text-slate-500 mb-4">현재 지정된 크기 및 프레임 타입이 가상 월에 동적 투사됩니다.</p>
          </div>

          <div className="w-full flex-1 flex flex-col items-center justify-center py-6 min-h-[220px]">
            {imageUrl ? (
              <div 
                className={`relative shadow-2xl transition-all duration-300 max-w-full max-h-[300px] flex items-center justify-center`}
                style={{
                  aspectRatio: `${width}/${height}`,
                  width: `${Math.min(300, width * 100)}px`,
                  boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8)'
                }}
              >
                {/* Frame Overlays */}
                {frameType === 'ornate-gold' && (
                  <div className="absolute -inset-4 border-[12px] border-double border-[#d4af37] ring-4 ring-[#b8860b] shadow-inner pointer-events-none rounded-sm bg-transparent z-10" />
                )}
                {frameType === 'wooden' && (
                  <div className="absolute -inset-3 border-[10px] border-[#8b5a2b] border-t-[#a05a2c] border-b-[#5c3a21] shadow-md pointer-events-none rounded-sm bg-transparent z-10" />
                )}
                {frameType === 'thin-black' && (
                  <div className="absolute -inset-1.5 border-[4px] border-black pointer-events-none z-10" />
                )}
                {frameType === 'cyber-neon' && (
                  <div className="absolute -inset-2.5 border-2 border-[#f72585] rounded-sm shadow-[0_0_15px_rgba(247,37,133,0.8)] animate-pulse pointer-events-none bg-transparent z-10" />
                )}

                {mediaType === 'video' ? (
                  <video 
                    src={imageUrl} 
                    className="w-full h-full object-cover rounded-sm z-0"
                    controls
                    autoPlay
                    muted
                    loop
                    playsInline
                  />
                ) : (
                  <img 
                    src={imageUrl} 
                    alt="Live Artwork Preview" 
                    className="w-full h-full object-cover rounded-sm"
                    referrerPolicy="no-referrer"
                  />
                )}
              </div>
            ) : (
              <div className="text-center text-slate-600 flex flex-col items-center">
                <Palette size={48} className="text-slate-700 mb-2 animate-bounce" />
                <p className="text-sm">이미지 또는 영상을 업로드해주시면</p>
                <p className="text-xs">여기에 가상 비주얼이 액자 레이아웃으로 표시됩니다.</p>
              </div>
            )}
          </div>

          {/* Details below art */}
          {imageUrl && (
            <div className="w-full border-t border-slate-900 pt-4 text-center">
              <h4 className="text-sm font-semibold text-slate-200">{title || '제목 없음'}</h4>
              <p className="text-xs text-slate-400 mt-1">{artist || '작가 미상'}, {year || '연도 미상'}</p>
              <div className="inline-flex gap-4 items-center justify-center mt-3 px-3 py-1 bg-slate-900 border border-slate-800 rounded-full text-[11px] text-slate-400">
                <span>실제 가로: <strong className="text-blue-400">{width.toFixed(1)}m</strong></span>
                <span>실제 세로: <strong className="text-emerald-400">{height.toFixed(1)}m</strong></span>
              </div>
            </div>
          )}
        </div>

        {/* Right Side: Configuration Form */}
        <form onSubmit={handleSave} className="md:w-1/2 p-6 flex flex-col justify-between overflow-y-auto max-h-[85vh]">
          
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4">
            <div>
              <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                <span>벽면 리디자인</span>
                <span className="text-xs bg-indigo-950 text-indigo-300 font-medium px-2 py-0.5 rounded-full border border-indigo-800">ID: {wallId.toUpperCase()}</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">이 벽의 최대 허용 크기는 {maxDimensions.width}m × {maxDimensions.height}m 입니다.</p>
            </div>
            <button 
              type="button" 
              onClick={onClose}
              className="p-1 px-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition"
            >
              <X size={20} />
            </button>
          </div>

          {/* Error Message */}
          {errorMsg && (
            <div className="mb-4 p-3 bg-red-950/50 border border-red-900 text-red-300 text-xs rounded-xl flex items-start gap-2 animate-shake">
              <AlertCircle size={16} className="mt-0.5 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Form Content Scrolling Portion */}
          <div className="flex-1 space-y-4 mb-6 pr-1 overflow-y-auto" style={{ maxHeight: 'calc(80vh - 180px)' }}>
            
            {/* 1. Image/Video Upload Section */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5 flex items-center justify-between">
                <span>1. 이미지 또는 동영상 업로드</span>
                {mediaType === 'video' && (
                  <span className="text-[10px] bg-indigo-950 text-indigo-300 border border-indigo-900 px-2 py-0.5 rounded-full uppercase tracking-wider">Video Mode Active</span>
                )}
              </label>
              
              <div 
                className={`border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-all duration-200 flex flex-col items-center justify-center ${
                  dragActive ? 'border-primary bg-indigo-950/20' : 'border-slate-800 hover:border-slate-700 bg-slate-950'
                }`}
                onDragEnter={handleDrag}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
                onClick={triggerFileInput}
              >
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  className="hidden" 
                  accept="image/*,video/*"
                  onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
                />
                
                <Upload size={24} className="text-slate-500 mb-2" />
                <p className="text-xs text-slate-300 font-medium">컴퓨터/핸드폰에서 이미지 또는 영상 선택</p>
                <p className="text-[10px] text-slate-500 mt-1">드래그 앤 드롭 또는 클릭하여 파일 등록 (.mp4, .webm, .png, .jpg, .webp)</p>
              </div>

              {/* URL paste helper */}
              <div className="mt-2 text-left">
                <label className="block text-[10px] font-medium text-slate-400 mb-1">인터넷 이미지/동영상 URL 링크 투사 (선택사항)</label>
                <input 
                  type="text" 
                  value={imageUrl.startsWith('data:') ? '' : imageUrl}
                  onChange={(e) => {
                    const val = e.target.value.trim();
                    setImageUrl(val);
                    if (val) {
                      const isVideoUrl = val.endsWith('.mp4') || val.endsWith('.webm') || val.includes('/video') || val.includes('.mov') || val.includes('mp4');
                      setMediaType(isVideoUrl ? 'video' : 'image');
                    }
                  }}
                  placeholder="https://example.com/movie.mp4 또는 .jpg 경로 직접 입력"
                  className="w-full text-[11px] bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-slate-300 placeholder-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              {/* Procedural Generator Option as a handy helper */}
              <div className="mt-2.5 flex items-center justify-between gap-1 p-2.5 bg-slate-950 border border-slate-850 rounded-xl">
                <div className="hidden sm:block">
                  <p className="text-[10px] text-slate-300 font-semibold flex items-center gap-1">
                    <Palette size={12} className="text-pink-500" />
                    <span>혹시 준비된 미디어가 없으신가요?</span>
                  </p>
                  <p className="text-[9px] text-slate-500">한국어로 지정한 제목에 맞는 고해상도 AI 아트 이미지를 즉석 생성합니다.</p>
                </div>
                <button
                  type="button"
                  onClick={handleProceduralGenerate}
                  className="w-full sm:w-auto px-3 py-1.5 bg-indigo-600/20 hover:bg-indigo-600 text-indigo-300 hover:text-white border border-indigo-700/50 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all text-center self-end cursor-pointer"
                >
                  <span>AI 제너레이터 이미지 생성</span>
                  <ArrowRight size={12} />
                </button>
              </div>
            </div>

            {/* 2. Text Details */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">작품 제목 *</label>
                <input 
                  type="text" 
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="예: 영원의 가치"
                  className="w-full text-xs bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 placeholder-slate-650 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">작가 이름</label>
                <input 
                  type="text" 
                  value={artist}
                  onChange={(e) => setArtist(e.target.value)}
                  placeholder="예: 김화백 (or 생략 가능)"
                  className="w-full text-xs bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 placeholder-slate-650 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">제작년도</label>
                <input 
                  type="text" 
                  value={year}
                  onChange={(e) => setYear(e.target.value)}
                  placeholder="예: 2026"
                  className="w-full text-xs bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 placeholder-slate-650 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">프레임 (액자 스타일) 선택</label>
                <select
                  value={frameType}
                  onChange={(e) => setFrameType(e.target.value as FrameType)}
                  className="w-full text-xs bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="none">프레임리스 (Canvas Margin None)</option>
                  <option value="thin-black">미니멀리스트 씬 플랫 (Thin Black)</option>
                  <option value="ornate-gold">앤티크 화려한 금장 몰딩 (Ornate Gold)</option>
                  <option value="wooden">클래식 월넛 우드 띠지 (Walnut Wooden)</option>
                  <option value="cyber-neon">네온 마감 펄스 발광 프레임 (Cyber Neon)</option>
                </select>
              </div>
            </div>

            {/* 3. Artwork Size Controllers (In meters) */}
            <div className="bg-slate-950/70 border border-slate-800/80 p-3.5 rounded-xl space-y-3">
              <span className="block text-xs font-semibold text-slate-300">3. 가상 갤러리 내 실제 3D 크기 설정 (단위: 미터)</span>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-450">작품 가로 폭 (Width)</span>
                  <span className="font-mono text-indigo-400 font-bold">{width.toFixed(2)}m <span className="text-[10px] text-slate-500">(최대 {maxDimensions.width}m)</span></span>
                </div>
                <input 
                  type="range"
                  min="0.5"
                  max={maxDimensions.width}
                  step="0.05"
                  value={width}
                  onChange={(e) => setWidth(parseFloat(e.target.value))}
                  className="w-full accent-indigo-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-450">작품 세로 높이 (Height)</span>
                  <span className="font-mono text-emerald-400 font-bold">{height.toFixed(2)}m <span className="text-[10px] text-slate-500">(최대 {maxDimensions.height}m)</span></span>
                </div>
                <input 
                  type="range"
                  min="0.5"
                  max={maxDimensions.height}
                  step="0.05"
                  value={height}
                  onChange={(e) => setHeight(parseFloat(e.target.value))}
                  className="w-full accent-emerald-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                />
              </div>
            </div>

            {/* 4. Description */}
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">작품 소개 / 큐레이션 도슨트 해설</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="관람객들에게 3D VR 공간에서 우측 패널에 노출될 작품에 대한 생각과 주안점을 적어주세요."
                rows={3}
                className="w-full text-xs bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 placeholder-slate-650 focus:outline-none focus:ring-1 focus:ring-indigo-500 resize-none"
              />
            </div>

          </div>

          {/* Footer Action Buttons */}
          <div className="flex items-center justify-end gap-3 border-t border-slate-800 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isAnalyzing}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold cursor-pointer transition disabled:opacity-55 disabled:cursor-not-allowed"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={isAnalyzing}
              className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold cursor-pointer shadow-lg shadow-indigo-600/20 transition disabled:opacity-55 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isAnalyzing ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-t-transparent border-white rounded-full animate-spin" />
                  <span>AI 분석 대기 중...</span>
                </>
              ) : (
                <span>전시 장착하기 (Apply)</span>
              )}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}
