import { ExhibitionHall, Artwork, HallType } from './types';
import { generateProceduralArt } from './utils/artGenerator';

export const EXHIBITION_HALLS: ExhibitionHall[] = [
  {
    id: 'classic',
    name: '제1관 : 루브르 클래식 홀 (Louvre Classic Hall)',
    subtitle: '네오클래식 8.5m 높은 층고와 궁전 아치 구조의 품격',
    description: '따뜻한 오크 아치 천장과 고급 대리석 기둥이 늘어선 고전 영주의 미술 정원입니다. 풍부한 황금빛 천장 스포트라이트와 목재 프레임을 장식하여 중세 고전 유화 명작들의 중후한 격조를 느낄 수 있습니다.',
    ceilingHeight: 8.5,
    themeColor: '#b58a3a', // Golden bronze
    accentColor: '#4c2e05',
    lightingDescription: '풍부한 황금빛 전면 조도 & 벽면 직접 하이라이트 웜 스포트',
    exhibitionMethod: '조각된 원목 및 화려한 도금 몰딩 프레임 대칭 대형 벽면 배치',
    wallPositions: [
      { id: 'classic_w1', position: [0, 2.4, -9.5], rotation: [0, 0, 0], maxDimensions: { width: 4.5, height: 3.2 } },
      { id: 'classic_w2', position: [7.5, 2.4, -6.5], rotation: [0, -Math.PI / 4, 0], maxDimensions: { width: 3.5, height: 2.6 } },
      { id: 'classic_w3', position: [-7.5, 2.4, -6.5], rotation: [0, Math.PI / 4, 0], maxDimensions: { width: 3.5, height: 2.6 } },
      { id: 'classic_w4', position: [9.5, 2.4, 1.5], rotation: [0, -Math.PI / 2, 0], maxDimensions: { width: 4.0, height: 2.8 } },
      { id: 'classic_w5', position: [-9.5, 2.4, 1.5], rotation: [0, Math.PI / 2, 0], maxDimensions: { width: 4.0, height: 2.8 } }
    ]
  },
  {
    id: 'modern',
    name: '제2관 : 모마 추상 메이즈 (MoMA Abstract Maze)',
    subtitle: '4.8m 층고의 인더스트리얼 노출 콘크리트와 플로팅 파티션',
    description: '차가운 톤의 노출 콘크리트 바닥과 기하학적 화이트 기둥이 공중에 떠있는 듯한 모더니크 전시관입니다. 경계선 없는 캔버스 엣지 처리와 미니멀 얇은 프레임으로 세밀하고 진취적인 추상 예술의 깊이를 선보입니다.',
    ceilingHeight: 4.8,
    themeColor: '#3b82f6', // Premium Blue
    accentColor: '#1e293b',
    lightingDescription: '쿨 화이트 하이-콘트라스트 스마트 궤도 스팟 & 반사 분산광',
    exhibitionMethod: '프레임리스 엣지 캠버스 코너 배치 & 공중 부유형 레이아웃',
    wallPositions: [
      { id: 'modern_w1', position: [0, 1.8, -5.0], rotation: [0, 0, 0], maxDimensions: { width: 3.8, height: 2.2 } },
      { id: 'modern_w2', position: [5.5, 1.8, 1.0], rotation: [0, -Math.PI / 2, 0], maxDimensions: { width: 3.2, height: 2.0 } },
      { id: 'modern_w3', position: [-5.0, 1.8, -8.5], rotation: [0, 0, 0], maxDimensions: { width: 3.6, height: 2.2 } },
      { id: 'modern_w4', position: [-7.5, 1.8, -1.0], rotation: [0, Math.PI / 2, 0], maxDimensions: { width: 3.5, height: 2.2 } }
    ]
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
    wallPositions: [
      { id: 'neon_w1', position: [0, 1.5, -6.5], rotation: [0, 0, 0], maxDimensions: { width: 4.2, height: 2.4 } },
      { id: 'neon_w2', position: [6.5, 1.5, -0.5], rotation: [0, -Math.PI / 2, 0], maxDimensions: { width: 3.6, height: 2.2 } },
      { id: 'neon_w3', position: [-6.5, 1.5, -0.5], rotation: [0, Math.PI / 2, 0], maxDimensions: { width: 3.6, height: 2.2 } },
      { id: 'neon_w4', position: [-4.5, 1.5, -4.8], rotation: [0, Math.PI / 4, 0], maxDimensions: { width: 3.0, height: 2.0 } },
      { id: 'neon_w5', position: [4.5, 1.5, -4.8], rotation: [0, -Math.PI / 4, 0], maxDimensions: { width: 3.0, height: 2.0 } }
    ]
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
    wallPositions: [
      { id: 'nordic_w1', position: [0, 1.6, -7.5], rotation: [0, 0, 0], maxDimensions: { width: 4.0, height: 2.4 } },
      { id: 'nordic_w2', position: [7.0, 1.6, -2.5], rotation: [0, -Math.PI / 2, 0], maxDimensions: { width: 3.8, height: 2.2 } },
      { id: 'nordic_w3', position: [-7.0, 1.6, -2.5], rotation: [0, Math.PI / 2, 0], maxDimensions: { width: 3.8, height: 2.2 } },
      { id: 'nordic_w4', position: [-4.0, 1.6, 5.0], rotation: [0, Math.PI / 4, 0], maxDimensions: { width: 3.0, height: 2.2 } },
      { id: 'nordic_w5', position: [4.0, 1.6, 5.0], rotation: [0, -Math.PI / 4, 0], maxDimensions: { width: 3.0, height: 2.2 } }
    ]
  },
  {
    id: 'retro',
    name: '제5관 : 아타리 레트로 퓨처 (Atari Retro Future Arcade)',
    subtitle: '5.2m 층고의 메탈 플레이트와 네온 웨이브 크롬 바',
    description: '디스코 네온 스펙트럼과 70년대 비티지 퓨처리즘을 결합한 스펙터클 사이키델릭 관입니다. 자체 반사되는 황동 기둥 디자인과 사우드 시뮬레이션 웨이브가 결합한 다이내믹 시티팝 아트의 명작들을 탐독할 수 있습니다.',
    ceilingHeight: 5.2,
    themeColor: '#f59e0b', // Amber
    accentColor: '#171717',
    lightingDescription: '시티팝 오렌지-옐로우 RGB 크롬 반사 스팟 조명 체계',
    exhibitionMethod: '바이올렛-골드 하이-글로시 글로우 메탈 프레임 전시 공학',
    wallPositions: [
      { id: 'retro_w1', position: [0, 2.0, -8.0], rotation: [0, 0, 0], maxDimensions: { width: 4.6, height: 2.8 } },
      { id: 'retro_w2', position: [8.0, 2.0, -3.5], rotation: [0, -Math.PI / 2, 0], maxDimensions: { width: 4.0, height: 2.4 } },
      { id: 'retro_w3', position: [-8.0, 2.0, -3.5], rotation: [0, Math.PI / 2, 0], maxDimensions: { width: 4.0, height: 2.4 } },
      { id: 'retro_w4', position: [-4.5, 2.0, 4.5], rotation: [0, Math.PI / 3, 0], maxDimensions: { width: 3.2, height: 2.4 } },
      { id: 'retro_w5', position: [4.5, 2.0, 4.5], rotation: [0, -Math.PI / 3, 0], maxDimensions: { width: 3.2, height: 2.4 } }
    ]
  }
];

export const getPresetArtworks = (): Record<HallType, Artwork[]> => ({
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
    },
    {
      id: 'classic_w5',
      title: '알프스의 눈보라',
      artist: '카를 마이어 (Karl Meyer)',
      year: '1895',
      description: '어두운 청회색 폭풍우 구름 아래 눈 덮인 거대한 산봉우리의 대조를 통해 숭고미를 역설적으로 드러낸 전형적 낭만주의 작입니다.',
      imageUrl: generateProceduralArt('classic', '알프스의 눈보라'),
      width: 2.8,
      height: 2.0,
      frameType: 'ornate-gold'
    }
  ],
  modern: [
    {
      id: 'modern_w1',
      title: '해체적 역동의 구성 No. 4',
      artist: '소피아 베르크 (Sofia Berg)',
      year: '1968',
      description: '기하학적인 바 무늬와 과감하게 삽입된 붉은 원을 통해 현대 문명 속 개인이 체감하는 도심의 속도감과 소외를 시각화했습니다.',
      imageUrl: generateProceduralArt('modern', '해체적 역동의 구성 No. 4'),
      width: 2.8,
      height: 1.8,
      frameType: 'thin-black'
    },
    {
      id: 'modern_w2',
      title: '공간의 긴장감',
      artist: '한스 호프만 (Hans Hofmann)',
      year: '1974',
      description: '노란 사각 캔버스와 스패칭 기법을 이용하여 빈 여백과 덩어리진 물감의 밀도 균형을 입체적으로 탐구한 아방가르드 걸작입니다.',
      imageUrl: generateProceduralArt('modern', '공간의 긴장감'),
      width: 2.2,
      height: 1.6,
      frameType: 'none'
    },
    {
      id: 'modern_w3',
      title: '침묵의 프레셔',
      artist: '이우환 연구회 일원 (Anonymous)',
      year: '#Modernism',
      description: '단순하고 우아한 검은 획과 따뜻한 모눈 질감만이 선사하는 여백의 깊은 잔향과 고요함을 대변합니다.',
      imageUrl: generateProceduralArt('modern', '침묵의 프레셔'),
      width: 2.6,
      height: 1.6,
      frameType: 'thin-black'
    },
    {
      id: 'modern_w4',
      title: '무제 (Blue Tension)',
      artist: '빅터 차레키 (Victor Tsaretsky)',
      year: '1982',
      description: '깊은 블루 필드가 중심을 양분하는 레이아웃으로, 차가움과 따뜻한 용기 사이의 과도기적인 정체성을 은유합니다.',
      imageUrl: generateProceduralArt('modern', '무제 (Blue Tension)'),
      width: 2.5,
      height: 1.6,
      frameType: 'none'
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
      width: 3.5,
      height: 2.0,
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
    },
    {
      id: 'neon_w4',
      title: '홀로그램 펄스',
      artist: 'K-09',
      year: '2050',
      description: '불안정하게 일렁이는 초록색 레이저 노이즈와 별빛 가루의 디지털 폭포를 차세대 비주얼 그리드로 수놓았습니다.',
      imageUrl: generateProceduralArt('neon', '홀로그램 펄스'),
      width: 2.2,
      height: 1.5,
      frameType: 'none'
    },
    {
      id: 'neon_w5',
      title: '자외선 지옥 (UV Sublevel-7)',
      artist: 'A-309',
      year: '2119',
      description: '눈부신 시안색 레이저와 강렬한 디스코 자외선 조화가 폭발적으로 발산하는 미디어 디스플레이입니다.',
      imageUrl: generateProceduralArt('neon', '자외선 지옥'),
      width: 2.2,
      height: 1.5,
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
    },
    {
      id: 'nordic_w3',
      title: '오로라 린넨 스케치',
      artist: '한나 코스펠라 (Hanna Korpela)',
      year: '2025',
      description: '희미하게 일렁이는 밤하늘의 시안색 그린 오로라 잔상을 백자 질감 캔버스에 수묵처럼 표현해 낸 걸작입니다.',
      imageUrl: generateProceduralArt('nordic', '오로라 린넨 스케치'),
      width: 2.4,
      height: 1.6,
      frameType: 'thin-black'
    },
    {
      id: 'nordic_w4',
      title: '빛과 그림자의 오후',
      artist: '에릭 그란센 (Erik Gransen)',
      year: '2024',
      description: '거실 창가를 통과하는 긴 오후의 직사각형 빛줄기가 빚어내는 아늑함과 멜랑콜리를 그렸습니다.',
      imageUrl: generateProceduralArt('nordic', '빛과 그림자의 오후'),
      width: 2.2,
      height: 1.5,
      frameType: 'wooden'
    },
    {
      id: 'nordic_w5',
      title: '눈 내리는 북유럽의 숲',
      artist: '소피아 한센 (Sophia Hansen)',
      year: '2024',
      description: '고요하게 눈송이가 내려앉는 침엽수림의 설경을 은은한 모노톤 수채로 담백하게 절제 가공한 미니멀 스케치입니다.',
      imageUrl: generateProceduralArt('nordic', '눈 내리는 북유럽의 숲'),
      width: 2.2,
      height: 1.5,
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
      width: 3.5,
      height: 2.2,
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
    },
    {
      id: 'retro_w3',
      title: '카세트 테이프 플라스틱 드림',
      artist: 'SynthWave-88',
      year: '1992',
      description: '아날로그 오디오 테이프 릴과 마이크로칩들이 결합해 만들어 내는 그리운 향수의 회로를 표현했습니다.',
      imageUrl: generateProceduralArt('retro', '카세트 테이프 플라스틱 드림'),
      width: 2.8,
      height: 1.8,
      frameType: 'wooden'
    },
    {
      id: 'retro_w4',
      title: '레이저 선셋 호라이즌',
      artist: 'Neo Sunset',
      year: '2026',
      description: '수평선 너머로 저무는 붉은 태양이 그리드 와이어프레임과 아트로 맞닿는 레트로 일러스트입니다.',
      imageUrl: generateProceduralArt('retro', '레이저 선셋 호라이즌'),
      width: 2.2,
      height: 1.5,
      frameType: 'cyber-neon'
    },
    {
      id: 'retro_w5',
      title: '메탈릭 리버브 펄스',
      artist: 'S. Vibe',
      year: '1995',
      description: '골드 크롬 튜브와 화려한 프리즘 반사를 통과하는 신스사운드를 고해상도 그래픽 아트로 풀어낸 가상 미디어입니다.',
      imageUrl: generateProceduralArt('retro', '메탈릭 리버브 펄스'),
      width: 2.2,
      height: 1.5,
      frameType: 'thin-black'
    }
  ]
});
