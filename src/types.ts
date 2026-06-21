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

export type HallType = 'classic' | 'modern' | 'neon' | 'nordic' | 'retro';

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
