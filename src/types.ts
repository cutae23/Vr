export type FrameType = 'none' | 'thin-black' | 'ornate-gold' | 'cyber-neon' | 'wooden';

export interface Artwork {
  id: string; // matches wall ID
  title: string;
  artist: string;
  year: string;
  description: string;
  imageUrl: string;
  width: number; // in meters
  height: number; // in meters
  frameType: FrameType;
}

export type HallType = 
  | 'modern'       // 제1관: 모던 추상 (Modern White)
  | 'classic'      // 제2관: 루브르 클래식 (Classic Louvre)
  | 'neon'         // 제3관: 네온 보이드 (Cyber Neon)
  | 'nordic'       // 제4관: 헬싱키 노르딕 (Nordic Silence)
  | 'retro'        // 제5관: 아타리 레트로 (Atari Future)
  | 'monochrome'   // 제6관: 모노크롬 미니멀 (Monochrome Silence)
  | 'vanguard'     // 제7관: 뱅가드 하이테크 (Vanguard Steel)
  | 'cyberpunk'    // 제8관: 차세대 사이버펑크 (Cyberpunk Club)
  | 'zen'          // 제9관: 젠 가든 자연 (Zen Pavilion)
  | 'renaissance'; // 제10관: 르네상스 마스터 (Renaissance Glow)

export interface ExhibitionHall {
  id: HallType;
  name: string;
  subtitle: string;
  description: string;
  ceilingHeight: number; // in meters (Classic: 8m, Modern: 5m, Neon: 4m)
  themeColor: string; // Tailwind hex color
  accentColor: string;
  lightingDescription: string;
  exhibitionMethod: string;
  wallPositions: {
    id: string;
    position: [number, number, number]; // x, y, z relative to room center
    rotation: [number, number, number]; // pitch, yaw, roll in radians
    maxDimensions: { width: number; height: number };
  }[];
}

export interface PlayerPosition {
  x: number;
  z: number;
  angle: number; // rotation yaw in radians
}
