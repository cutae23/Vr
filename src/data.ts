import { ExhibitionHall, Artwork, HallType } from './types';
import { generateProceduralArt } from './utils/artGenerator';

// Helper to systematically lay out 15 beautifully-spaced walls in a 24m x 24m exhibition chamber
function generate15WallPositions(hallId: string) {
  const walls = [];
  
  // 1. North Wall boundary (z = -11m): Spans 4 panels facing South (rotation = [0, 0, 0])
  const northX = [-7.5, -2.5, 2.5, 7.5];
  northX.forEach((x, i) => {
    walls.push({
      id: `${hallId}_w${walls.length + 1}`,
      position: [x, 2.0, -11.0] as [number, number, number],
      rotation: [0, 0, 0] as [number, number, number],
      maxDimensions: { width: 3.2, height: 2.2 }
    });
  });

  // 2. South Wall boundary (z = 11m): Spans 4 panels facing North (rotation = [0, Math.PI, 0])
  const southX = [7.5, 2.5, -2.5, -7.5];
  southX.forEach((x, i) => {
    walls.push({
      id: `${hallId}_w${walls.length + 1}`,
      position: [x, 2.0, 11.0] as [number, number, number],
      rotation: [0, Math.PI, 0] as [number, number, number],
      maxDimensions: { width: 3.2, height: 2.2 }
    });
  });

  // 3. West Wall boundary (x = -11m): Spans 3 panels facing East (rotation = [0, Math.PI / 2, 0])
  const westZ = [-6.0, 0.0, 6.0];
  westZ.forEach((z, i) => {
    walls.push({
      id: `${hallId}_w${walls.length + 1}`,
      position: [-11.0, 2.0, z] as [number, number, number],
      rotation: [0, Math.PI / 2, 0] as [number, number, number],
      maxDimensions: { width: 3.2, height: 2.2 }
    });
  });

  // 4. East Wall boundary (x = 11m): Spans 3 panels facing West (rotation = [0, -Math.PI / 2, 0])
  const eastZ = [-6.0, 0.0, 6.0];
  eastZ.forEach((z, i) => {
    walls.push({
      id: `${hallId}_w${walls.length + 1}`,
      position: [11.0, 2.0, z] as [number, number, number],
      rotation: [0, -Math.PI / 2, 0] as [number, number, number],
      maxDimensions: { width: 3.2, height: 2.2 }
    });
  });

  // 5. Special Center Hanging floating Partition (15th Wall slot): positioned at z = -4.5m
  walls.push({
    id: `${hallId}_w15`,
    position: [0.0, 2.0, -4.5] as [number, number, number],
    rotation: [0, 0, 0] as [number, number, number],
    maxDimensions: { width: 3.4, height: 2.3 }
  });

  return walls;
}

export const EXHIBITION_HALLS: ExhibitionHall[] = [
  {
    id: 'modern',
    name: '제1관 : 모마 화이트 추상관 (MoMA White Abstract)',
    subtitle: '4.8m 층고의 미니멀 화이트 노출 콘크리트 및 전면 백색 아틀리에',
    description: '눈이 정화되는 모던 갤러리 디자인의 정수입니다. 프레임리스 캔버스 마감과 연한 그레이, 고급 브라스 골드 포인트의 백색 추상 명작들을 3D VR 공간에서 우아하게 관람할 수 있습니다.',
    ceilingHeight: 4.8,
    themeColor: '#3b82f6', // Premium Blue
    accentColor: '#1e293b',
    lightingDescription: '쿨 화이트 하이-콘트라스트 스마트 궤도 스팟 & 반사 분산광',
    exhibitionMethod: '프레임리스 엣지 캠버스 코너 배치 & 공중 부유형 레이아웃',
    wallPositions: generate15WallPositions('modern')
  },
  {
    id: 'classic',
    name: '제2관 : 루브르 클래식 홀 (Louvre Classic Hall)',
    subtitle: '네오클래식 8.5m 높은 층고와 궁전 아치 구조의 품격',
    description: '따뜻한 오크 아치 천장과 고급 대리석 기둥이 늘어선 고전 영주의 미술 정원입니다. 풍부한 황금빛 천장 스포트라이트와 목재 프레임을 장식하여 중세 고전 유화 명작들의 중후한 격조를 느낄 수 있습니다.',
    ceilingHeight: 8.5,
    themeColor: '#b58a3a', // Golden bronze
    accentColor: '#4c2e05',
    lightingDescription: '풍부한 황금빛 전면 조도 & 벽면 직접 하이라이트 웜 스포트',
    exhibitionMethod: '조각된 원목 및 화려한 도금 몰딩 프레임 대칭 대형 벽면 배치',
    wallPositions: generate15WallPositions('classic')
  },
  {
    id: 'neon',
    name: '제3관 : 네오 사이버 볼트 (Neo Cyber Grid Vault)',
    subtitle: '3.5m 콤팩트 층고와 다크 하이테크 레이저 글래스 홀',
    description: '그리드 레이저 라인과 어두운 메탈 플레이트가 결합된 미래 지향 가상 홀로그램 전시관입니다. 네온 라이팅 프레임과 자체 발광 미디어 아트 전시를 결합해 관람객에게 압도적인 입체 가상 미장센을 선사합니다.',
    ceilingHeight: 3.5,
    themeColor: '#f72585', // Electric Neon Pink
    accentColor: '#0f0f1c',
    lightingDescription: '다이내믹 RGB 네온 광륜 & 레이저 그리드 자외선 엠비언트',
    exhibitionMethod: '네온 발광 몰딩 디스플레이 프레임 & 사이버 마감 마운팅',
    wallPositions: generate15WallPositions('neon')
  },
  {
    id: 'nordic',
    name: '제4관 : 헬싱키 노르딕 미니멀 (Helsinki Nordic Minimal)',
    subtitle: '4.0m 층고의 린넨 화이트 마감과 전면 원목 가구 아틀리에',
    description: '스칸디나비아풍의 평온하고 따스한 햇살이 내리쬐는 갤러리입니다. 화이트 스톤 타일과 밝은 참나무 천장이 아우러져 정적이면서 숨이 트이는 아늑한 미학적 여백을 마련해 주며, 심플한 드로잉 콜렉션이 전시됩니다.',
    ceilingHeight: 4.0,
    themeColor: '#2dd4bf', // Teal Accent
    accentColor: '#fcfbf7', // Warm off-white
    lightingDescription: '자연 채광 시뮬레이션 탑 스카이 및 에메랄드 웜 전면 부드러운 하이라이트',
    exhibitionMethod: '원목 프레임리스 혹은 내추럴 우드 스킨 마운트 평행 간격 전시',
    wallPositions: generate15WallPositions('nordic')
  },
  {
    id: 'retro',
    name: '제5관 : 아타리 레트로 퓨처 (Atari Retro Future Arcade)',
    subtitle: '5.2m 층고의 메탈 플레이트와 네온 웨이브 크롬 바',
    description: '디스코 네온 스펙트럼과 70년대 빈티지 퓨처리즘을 결합한 스펙터클 사이키델릭 관입니다. 자체 반사되는 황동 기둥 디자인과 사운드 시뮬레이션 웨이브가 결합한 다이내믹 시티팝 아트의 명작들을 탐독할 수 있습니다.',
    ceilingHeight: 5.2,
    themeColor: '#f59e0b', // Amber
    accentColor: '#171717',
    lightingDescription: '시티팝 오렌지-옐로우 RGB 크롬 반사 스팟 조명 체계',
    exhibitionMethod: '바이올렛-골드 하이-글로시 글로우 메탈 프레임 전시 공학',
    wallPositions: generate15WallPositions('retro')
  },
  {
    id: 'monochrome',
    name: '제6관 : 모노크롬 미니멀 (Monochrome Silence)',
    subtitle: '4.2m 콘크리트 사각 기둥과 스모키 차콜 모노 캔버스',
    description: '가식적인 장식을 극도로 절제한 침묵의 예술관입니다. 무채색 콘크리트 인질감의 벽면에 순수한 기하학적 형태의 흑백 모노크롬 미술품들이 시적 고요함과 철학적 무게를 전합니다.',
    ceilingHeight: 4.2,
    themeColor: '#64748b', // Slate Gray
    accentColor: '#0f172a',
    lightingDescription: '스모키 실버 스핀 조명 및 간접적인 천장 리플렉트 광',
    exhibitionMethod: '얇고 단순한 다크 알루미늄 프레임 집중 대칭 배치형 갤러리',
    wallPositions: generate15WallPositions('monochrome')
  },
  {
    id: 'vanguard',
    name: '제7관 : 뱅가드 하이테크 (Vanguard Steel Platform)',
    subtitle: '6.0m 탁 트인 층고의 크롬 용골 스틸 그리드 격자',
    description: '구조적 아름다움을 강조한 미래형 플랫폼 전시실입니다. 블루프린트 벡터 와이어 그리드와 발광 회로 아트를 통해 하이엔드 테크놀로지와 시각 예술의 유기적 융합을 조각합니다.',
    ceilingHeight: 6.0,
    themeColor: '#38bdf8', // Blue laser sky
    accentColor: '#090d10',
    lightingDescription: '서늘한 사파이어 쿨 빔 디렉팅 및 자외선 바닥 광원 효과',
    exhibitionMethod: '황동 구리 및 알루미늄 크롬 스킨으로 감싼 인더스트리얼 프레임 전시',
    wallPositions: generate15WallPositions('vanguard')
  },
  {
    id: 'cyberpunk',
    name: '제8관 : 네오 도쿄 클럽 (NEO TOKYO Cyber Club)',
    subtitle: '3.2m 벙커 층고의 산성 그린 발광과 고주파 테크노 비전',
    description: '강렬한 애시드 브라이트 오렌지와 자외선 레이저 글로우가 밤새 일렁이는 서브컬처 크리에이티브 공간입니다. 디지털 사운드 파장과 글리치 디자인을 결합한 격투적인 네오 아트들이 역동성을 전합니다.',
    ceilingHeight: 3.2,
    themeColor: '#10b981', // Acid green
    accentColor: '#06010a',
    lightingDescription: '비선형 무지개빛 스트로보 백 라이팅 및 고주파 주파수 그리드 네온',
    exhibitionMethod: '자가 발광 자체 네온 하이라이팅 아크릴 프레임 스킨 배치',
    wallPositions: generate15WallPositions('cyberpunk')
  },
  {
    id: 'zen',
    name: '제9관 : 젠 가든 사색정원 (Zen Pavilion)',
    subtitle: '4.5m 대나무 셰이드 안개와 부드러운 화이트 린넨 스크린',
    description: '동양의 한옥 및 다도 양식에서 영감을 받은 명상과 안식의 공간입니다. 대나무 그림자가 비추는 아늑한 샌드톤 바닥에서 이끼, 모래 리플, 대나무 드로잉을 감상하며 영혼의 숨소리를 나눕니다.',
    ceilingHeight: 4.5,
    themeColor: '#84cc16', // Moss Lime Green
    accentColor: '#fefaf2', // Rich cream
    lightingDescription: '창호지를 통과하는 자연 산란광 효과 및 녹색 엠비언트 플로어 스팟',
    exhibitionMethod: '내추럴 대나무 및 밝은 우드 몰딩 스킨 혹은 프레임리스 여백 정지',
    wallPositions: generate15WallPositions('zen')
  },
  {
    id: 'renaissance',
    name: '제10관 : 바티칸 르네상스 (Renaissance Cathedral)',
    subtitle: '9.0m 대성당 장엄 천장과 극적인 명암 촛불 프로젝션',
    description: '인간성의 부흥을 은유한 장엄하고 경이로운 대성당 성화 미술홀입니다. 어둡고 무거운 마호가니 그림자 아래서 극적이고 화려한 촛불 조도를 받으며 중후한 역사 유화의 숭고미를 정면으로 배견합니다.',
    ceilingHeight: 9.0,
    themeColor: '#ea580c', // Fire Amber orange
    accentColor: '#1a0802',
    lightingDescription: '정수리에서 쏟아지는 대하향 극적 단일 천장 스팟 및 가상 촛불 엠비언트',
    exhibitionMethod: '화려한 앤티크 몰딩을 수놓은 육중하고 두터운 오크 골드 프레임 고정',
    wallPositions: generate15WallPositions('renaissance')
  }
];

export const getPresetArtworks = (): Record<HallType, Artwork[]> => ({
  modern: [
    {
      id: 'modern_w1',
      title: '화이트 사색 무제 (Pure White Breath)',
      artist: '진 민 영 (Min-young Jin)',
      year: '2026',
      description: '순수하고 투명한 화이트 톤과 연한 브라스 골드 선이 어우러져 현대 미술의 차분한 정취적 여백을 마련해 줍니다. 1관의 고요한 공간과 동기화됩니다.',
      imageUrl: generateProceduralArt('modern', '화이트 사색 무제 (Pure White Breath)'),
      width: 2.8,
      height: 1.8,
      frameType: 'thin-black'
    },
    {
      id: 'modern_w2',
      title: '기하학적 투명 잔상 (Beige Geometry)',
      artist: '소피아 베르크 (Sofia Berg)',
      year: '2024',
      description: '빛 바랜 아이보리와 고운 모래색 종이 위에 미세한 은빛 원들이 교차하는 미니멀리즘 대표 드로잉 작품입니다.',
      imageUrl: generateProceduralArt('modern', '기하학적 투명 잔상 (Beige Geometry)'),
      width: 2.5,
      height: 1.6,
      frameType: 'none'
    },
    {
      id: 'modern_w3',
      title: '영원의 백색 미학',
      artist: '이우환 칼라 연구회 (Anonymous)',
      year: '#Minimalism',
      description: '극도로 정돈되고 얇은 회백색 선들과 침묵이 전달하는 감동적인 여백의 깊이를 표현했습니다.',
      imageUrl: generateProceduralArt('modern', '영원의 백색 미학'),
      width: 2.6,
      height: 1.8,
      frameType: 'thin-black'
    },
    {
      id: 'modern_w4',
      title: '구조의 균형 (Balance No. 12)',
      artist: '빅터 차레키 (Victor Tsaretsky)',
      year: '2025',
      description: '한 가닥의 은은한 골드 빛줄기가 밝은 캔버스 한가운데를 비정형 구조로 분할하며 생동하고 시각적인 활기찬 숨결을 선사합니다.',
      imageUrl: generateProceduralArt('modern', '구조의 균형 (Balance No. 12)'),
      width: 2.4,
      height: 1.5,
      frameType: 'none'
    }
  ],
  classic: [
    {
      id: 'classic_w1',
      title: '아르카디아의 저녁',
      artist: '클로드 뒤퐁 (Claude Dupont)',
      year: '1842',
      description: '금빛 태양이 내려앉은 고대 평원과 깊은 산맥의 무드를 담은 오일 캔버스입니다. 깊고 장엄한 원근 붓터치가 특징입니다.',
      imageUrl: generateProceduralArt('classic', '아르카디아의 저녁'),
      width: 3.2,
      height: 2.2,
      frameType: 'ornate-gold'
    },
    {
      id: 'classic_w2',
      title: '황금 계곡의 가을',
      artist: '장-바티스트 루소 (Jean-Baptiste Rousseau)',
      year: '1856',
      description: '풍요로운 추수 언덕과 호수 위를 비추는 따스한 햇볕을 특유의 클래식 옐로우 임파스토 기법으로 묘사한 대표작입니다.',
      imageUrl: generateProceduralArt('classic', '황금 계곡의 가을'),
      width: 2.4,
      height: 1.8,
      frameType: 'wooden'
    },
    {
      id: 'classic_w3',
      title: '영원한 숲의 서곡',
      artist: '샤를 에밀 자크 (Charles-Émile Jacque)',
      year: '1871',
      description: '중세 고향 숲의 실루엣과 저녁 안개가 자아내는 신비롭고 아스라한 자연의 침묵을 묘사했습니다.',
      imageUrl: generateProceduralArt('classic', '영원한 숲의 서곡'),
      width: 2.4,
      height: 1.8,
      frameType: 'wooden'
    },
    {
      id: 'classic_w4',
      title: '아테네의 황혼',
      artist: '헬레나 폰 바이어 (Helena von Bayer)',
      year: '1888',
      description: '신전의 기둥 사이로 흘러내리는 붉은 노을이 고대 도시국가의 쓸쓸하고 찬란했던 지혜를 은유합니다.',
      imageUrl: generateProceduralArt('classic', '아테네의 황혼'),
      width: 2.8,
      height: 2.0,
      frameType: 'ornate-gold'
    }
  ],
  neon: [
    {
      id: 'neon_w1',
      title: '신시사이저 일몰 (Synth Solaris 2099)',
      artist: '네오해커 V (NeoHacker_V)',
      year: '3024',
      description: '사이버 미래도시의 메가스트럭처와 오렌지빛 레이저 선셋 비주얼을 시네마틱 해상도로 구축한 정수입니다.',
      imageUrl: generateProceduralArt('neon', '신시사이저 일몰'),
      width: 3.2,
      height: 1.9,
      frameType: 'cyber-neon'
    },
    {
      id: 'neon_w2',
      title: '암호화된 도파민 (Crypto Dopamine)',
      artist: 'D-Grid 101',
      year: '2026',
      description: '메탈릭 서킷 보드 위를 질주하는 정보 데이터 라인들을 다이내믹 바이올렛 입자 구체로 형상화했습니다.',
      imageUrl: generateProceduralArt('neon', '암호화된 도파민'),
      width: 2.6,
      height: 1.8,
      frameType: 'cyber-neon'
    },
    {
      id: 'neon_w3',
      title: '네트웍 잔재 (Neural Drift)',
      artist: 'Cyber-Zen Lab',
      year: '2042',
      description: '의식이 업로딩되는 가상 공간의 경계선을 따라 피어나는 푸른색 노드를 앰비언트 브레싱 리듬으로 코딩하였습니다.',
      imageUrl: generateProceduralArt('neon', '네트웍 잔재'),
      width: 2.6,
      height: 1.8,
      frameType: 'cyber-neon'
    }
  ],
  nordic: [
    {
      id: 'nordic_w1',
      title: '자작나무 언덕의 고요',
      artist: '에일리 사리넨 (Eili Saarinen)',
      year: '2023',
      description: '핀란드 북부의 첫 서리가 내린 자작나무 숲을 고요하고 잔잔한 라이브 톤으로 채색한 미니멀 드로잉입니다.',
      imageUrl: generateProceduralArt('nordic', '자작나무 언덕의 고요'),
      width: 3.0,
      height: 1.8,
      frameType: 'wooden'
    },
    {
      id: 'nordic_w2',
      title: '피오르드의 메아리',
      artist: '루카스 아스프룬드 (Lucas Asplund)',
      year: '2021',
      description: '안개가 은은하게 걷히는 노르웨이 피오르드 절벽과 투명한 심연을 세로축 가이드 실루엣으로 포착했습니다.',
      imageUrl: generateProceduralArt('nordic', '피오르드의 메아리'),
      width: 2.4,
      height: 1.6,
      frameType: 'none'
    }
  ],
  retro: [
    {
      id: 'retro_w1',
      title: '도쿄 메트로 아케이드 1986',
      artist: 'Kenji Suzuki',
      year: '1986',
      description: '반짝이는 크롬 마감 빌딩과 시티팝 감성의 핑크-네온 그라데이션 광원을 아날로그 레트로 질감으로 재구성했습니다.',
      imageUrl: generateProceduralArt('retro', '도쿄 메트로 아케이드 1986'),
      width: 3.2,
      height: 2.0,
      frameType: 'cyber-neon'
    },
    {
      id: 'retro_w2',
      title: '아웃런 시티 웨이브',
      artist: 'Outrun Legend',
      year: '1989',
      description: '야자수가 늘어선 해변가 고속도로를 질주할 때 느껴지는 자유로움과 마젠타 석양을 픽셀 벡터 아트로 연출했습니다.',
      imageUrl: generateProceduralArt('retro', '아웃런 시티 웨이브'),
      width: 2.8,
      height: 1.8,
      frameType: 'none'
    }
  ],
  monochrome: [
    {
      id: 'monochrome_w1',
      title: '흑백의 대위법 (Contrast Balance)',
      artist: '안 준 호 (Jun-ho Ahn)',
      year: '2026',
      description: '극명한 흑백 대비만이 갖는 본질의 무게감과 미니멀 콘크리트 사각 틀과의 구조적 균형을 선보입니다.',
      imageUrl: generateProceduralArt('monochrome', '흑백의 대위법'),
      width: 2.6,
      height: 1.8,
      frameType: 'thin-black'
    },
    {
      id: 'monochrome_w2',
      title: '무제 : 침묵하는 밤',
      artist: 'D-Stone Co.',
      year: '2024',
      description: '질감이 가미된 린넨과 짙은 차콜이 빚어내는 장엄하고 가벼운 흑야의 리무진 터치 시뮬러입니다.',
      imageUrl: generateProceduralArt('monochrome', '무제 : 침묵하는 밤'),
      width: 2.5,
      height: 1.6,
      frameType: 'none'
    }
  ],
  vanguard: [
    {
      id: 'vanguard_w1',
      title: '강제 전개 벡터 No. 9',
      artist: 'K-Blue Sector',
      year: '2026',
      description: '하이테크 블루프린트 벡터 필드와 발광 회로가 만나 개척하는 인더스트리얼 기하 예술의 경지입니다.',
      imageUrl: generateProceduralArt('vanguard', '강제 전개 벡터 No. 9'),
      width: 2.8,
      height: 1.9,
      frameType: 'cyber-neon'
    },
    {
      id: 'vanguard_w2',
      title: '구리의 반란 (Copper Core)',
      artist: 'Platform Operator 4',
      year: '2025',
      description: '따뜻한 구리 판재와 레이저 빔이 직물처럼 결합된 메카트로닉스 인화 캔버스입니다.',
      imageUrl: generateProceduralArt('vanguard', '구리의 반란'),
      width: 2.6,
      height: 1.8,
      frameType: 'wooden'
    }
  ],
  cyberpunk: [
    {
      id: 'cyberpunk_w1',
      title: '애시드 도쿄 글리치 펑크',
      artist: 'DJ_Hack_82',
      year: '2088',
      description: '산성 녹색과 장렬한 마젠타 고해상도 글리치 데이터 신호들이 불규칙하게 일렁이는 네오 비주얼 스트럭처입니다.',
      imageUrl: generateProceduralArt('cyberpunk', '애시드 도쿄 글리치 펑크'),
      width: 3.0,
      height: 1.8,
      frameType: 'cyber-neon'
    },
    {
      id: 'cyberpunk_w2',
      title: '전자기 의식의 해체 No. 4',
      artist: 'Subgrid-A',
      year: '2026',
      description: '복잡한 테크노 벙커 속 광륜 같은 주파수 파형들이 자각을 시작한 인공지능의 사색을 형상화합니다.',
      imageUrl: generateProceduralArt('cyberpunk', '전자기 의식의 해체 No. 4'),
      width: 2.6,
      height: 1.6,
      frameType: 'none'
    }
  ],
  zen: [
    {
      id: 'zen_w1',
      title: '대나무 고요와 가을 이끼',
      artist: '다도선사 (Tea Master Zen)',
      year: '2023',
      description: '명상의 깊은 평안을 전하는 모래 드로잉과 맑은 대나무 먹색 터치입니다. 고요와 힐링을 안겨주는 무색 사색 드로잉입니다.',
      imageUrl: generateProceduralArt('zen', '대나무 고요와 가을 이끼'),
      width: 2.8,
      height: 1.8,
      frameType: 'wooden'
    },
    {
      id: 'zen_w2',
      title: '모래 물결의 율동 (Raked Sand ripple)',
      artist: 'S. Landscape',
      year: '2024',
      description: '동심원으로 곱게 빗어낸 은유적 정원 모래 무늬에서 우주의 성단과 자연의 평온한 순환을 성찰합니다.',
      imageUrl: generateProceduralArt('zen', '모래 물결의 율동'),
      width: 2.4,
      height: 1.6,
      frameType: 'none'
    }
  ],
  renaissance: [
    {
      id: 'renaissance_w1',
      title: '성당의 일출 (Sacred Glow)',
      artist: '조반니 벨리니 학파 (Bellini School)',
      year: '1512',
      description: '극적인 빛과 짙은 어둠의 대비(명암 기법)를 통해 세례의 장엄함과 역사적 승화를 고전 기법 그대로 고취시킨 대작입니다.',
      imageUrl: generateProceduralArt('renaissance', '성당의 일출'),
      width: 3.2,
      height: 2.3,
      frameType: 'ornate-gold'
    },
    {
      id: 'renaissance_w2',
      title: '명암의 숲과 가상 헌사',
      artist: '이탈리 가상 도슨트 (Docent Vatican)',
      year: '1615',
      description: '황량하고 마호가니 그늘진 고대 역사와 참회의 계곡 위로 스포트라이트 조명이 비추며 인본을 수놓습니다.',
      imageUrl: generateProceduralArt('renaissance', '명암의 숲과 가상 헌사'),
      width: 2.6,
      height: 1.8,
      frameType: 'wooden'
    }
  ]
});
