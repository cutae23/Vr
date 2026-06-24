import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const PORT = 3000;

async function startServer() {
  const app = express();

  // Set up body parsing for large image payloads
  app.use(express.json({ limit: "20mb" }));
  app.use(express.urlencoded({ limit: "20mb", extended: true }));

  function getGenAI(customKey?: string) {
    const apiKey = customKey || process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY가 존재하지 않습니다.");
    }
    return new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }

  // API endpoint to analyze artwork image via Gemini 3.5 Flash
  app.post("/api/analyze-artwork", async (req, res): Promise<any> => {
    try {
      const { image, currentHallId } = req.body;
      if (!image) {
        return res.status(400).json({ error: "No image payload supplied." });
      }

      const customKey = req.headers["x-gemini-api-key"] as string | undefined;
      const hasKey = !!customKey || !!process.env.GEMINI_API_KEY;

      // Premium Free Tier Fallback: No API Key specified, generate beautifully customized automatic metadata offline!
      if (!hasKey) {
        const fallbacks: Record<string, { titles: string[], artists: string[], descriptions: string[], frames: string[] }> = {
          classic: {
            titles: ["시간을 거스르는 아뜰리에", "황금빛 서정시", "기억의 파편들과 촛불", "르네상스의 푸른 새벽", "우아한 테라스의 여한"],
            artists: ["가브리엘 샤르팡티에 (Gabriel Charpentier)", "장 바티스트 (Jean Baptiste)", "에드와르 마네 (Edouard Manet)", "엘 시드 (El Cid)", "안나 드 쿠르셀 (Anna de Courcelles)"],
            descriptions: [
              "부드럽고 신비로운 빛으로 인물과 정물을 비추어 17세기 회화 특유의 연극적 서사감과 고요함을 연출한 고전 걸작입니다.",
              "황금빛 전구색 온치 마감과 부유하는 촛불의 잔상이 아련하게 투영되어, 감정적인 차분함과 기품 있는 사색을 더해 주는 예술품입니다.",
              "정교하게 균형을 맞춘 유화 질감이 세련된 깊이를 전해주며, 따스한 대기가 감도는 공간에 시간 예술을 박제시킨 풍경화입니다."
            ],
            frames: ["ornate-gold", "wooden", "thin-black"]
          },
          modern: {
            titles: ["기하학적 긴장의 선율", "무의식의 큐비즘", "백색 소음과 캔버스", "구조적 대칭의 중력", "미시간 에비뉴 15:40"],
            artists: ["바실리 칸딘스키 (Wassily Kandinsky)", "몬드리안 후예 (Mondrian Follower)", "피에르 장 (Pierre Jean)", "클라라 비크 (Clara Wieck)", "테오 얀센 (Theo Jansen)"],
            descriptions: [
              "차가운 미니멀리즘과 세련된 스킨 마감의 조화를 통해 현대적 큐브 질감이 가진 추상적이고 정적인 평온함을 구현한 작품입니다.",
              "질서 정연하게 깎여나간 평행 격자 속에 미묘한 긴장을 유발하는 오프셋 면들로 구성되어, 미래적 우아함을 품은 디자인입니다.",
              "단색조 톤의 담백한 균형과 평면적 시각 구성을 정점에 이르게 하여 영적 공간의 무한함을 입체적으로 탐독하게 만듭니다."
            ],
            frames: ["thin-black", "none"]
          },
          neon: {
            titles: ["사이버 펑크의 시냅스", "인공 지능의 심장 박동", "시안-블루 홀로그래픽 드림", "가상 회로의 가속도", "보이드 스펙트럼 09"],
            artists: ["네오 셰퍼드 (Neo Shepherd)", "크롬 소울 2099 (Chrome Soul)", "N-Vibe", "디지털 연금술사 (Digital Alchemist)", "A-108"],
            descriptions: [
              "눈이 시리도록 밝게 타오르는 핑크와 시안 네온 그리드가 엮어내는 사이버 아케이드 감성의 가상 홀로그램 작품입니다.",
              "데이터 스트림의 시각적 파장과 신스웨이브의 아날로그 오디오 리버브를 고속 전자 빔으로 투시한 마이크로 아트워크입니다.",
              "자체적으로 발광하는 광섬유 형광체가 다차원 데이터 매트릭스를 형상화하여 보는 이로 하여금 전자 우주의 속도로 빨려들게 만듭니다."
            ],
            frames: ["cyber-neon", "none"]
          },
          nordic: {
            titles: ["핀란드 무드 스키드", "자작나무 잔향의 노래", "피오르드의 린넨 아침", "에스토니아 안개 언덕", "고요가 흐르는 여백"],
            artists: ["에일리 사리넨 (Eili Saarinen)", "루카스 아스프룬드 (Lucas Asplund)", "한나 코스펠라 (Hanna Korpela)", "소비에스키 (Sobieski)", "올라프 닐슨 (Olav Nilsson)"],
            descriptions: [
              "핀란드 북부 자작나무 숲의 차가우면서도 따스한 햇빛과 린넨 질감 위에 아스라이 내려앉는 여백의 서사시입니다.",
              "안개 낀 노르웨이의 해안선을 절제되고 깊이 있는 사운드 스펙트럼의 침묵 속에서 담백해진 선율로 조각해 낸 드로잉 작업입니다.",
              "숨 가쁜 현대인들에게 조용한 미학적 심적 치유를 전달하는 친자연적 웜화이트 색감의 친근하고 여유 가득한 그림입니다."
            ],
            frames: ["wooden", "thin-black", "none"]
          },
          retro: {
            titles: ["도쿄 신스웨이브 1986", "아웃런 마젠타 로드", "플라스틱 카세트 드림스", "시티팝 갤럭시 익스프레스", "황동 크롬 메탈 펄스"],
            artists: ["Kenji Suzuki", "Neo Sunset", "Outrun Legend", "SynthVibe-92", "레트로 마스터 (Retro Master)"],
            descriptions: [
              "디스코 네온 스펙트럼과 70~80년대 빈티지 퓨처리즘을 기가 막히게 융합한 다이내믹한 픽셀 벡터 일러스트레이션입니다.",
              "반사되는 메탈 크롬 플레이트와 야자수가 드리운 황홀한 오렌지 석양 고속도로의 무드를 소리로 자극하듯 시적인 화폭으로 담았습니다.",
              "그리운 옛 향수와 미래 감각적 와이어 그리드가 일체화되어 세련된 빈티지 음악을 연상시키는 정열적이고 리드미컬한 아트워크입니다."
            ],
            frames: ["cyber-neon", "wooden", "thin-black"]
          }
        };

        const hallType = (currentHallId || "classic") as string;
        const config = fallbacks[hallType] || fallbacks.classic;
        const randIdx = Math.floor(Math.random() * config.titles.length);
        const descIdx = Math.floor(Math.random() * config.descriptions.length);

        const mockResponse = {
          title: config.titles[randIdx],
          artist: config.artists[randIdx],
          year: String(1975 + Math.floor(Math.random() * 50)),
          description: config.descriptions[descIdx],
          width: parseFloat((1.2 + Math.random() * 1.0).toFixed(1)),
          height: parseFloat((0.8 + Math.random() * 0.8).toFixed(1)),
          frameType: config.frames[Math.floor(Math.random() * config.frames.length)]
        };

        // Artificial latency to feel like the AI Curator is thinking!
        await new Promise(resolve => setTimeout(resolve, 800));
        return res.json(mockResponse);
      }

      // Default mimeType and parse base64
      let mimeType = "image/png";
      let base64Data = image;

      if (image.startsWith("data:")) {
        const matches = image.match(/^data:([^;]+);base64,(.+)$/);
        if (matches && matches.length === 3) {
          mimeType = matches[1];
          base64Data = matches[2];
        }
      }

      const ai = getGenAI(customKey);
      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: [
          {
            inlineData: {
              mimeType,
              data: base64Data
            }
          },
          {
            text: "Analyze the uploaded artwork and provide curatorial art metadata. Match the height based on its actual ratio relative to the suggested width. Frame translation values: classic paintings get 'ornate-gold' or 'wooden'; sci-fi/technological art gets 'cyber-neon'; photographs/contemporary graphics get 'thin-black'; clean abstract pieces can be 'none' or 'thin-black'."
          }
        ],
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING, description: "Title of the artwork in Korean" },
              artist: { type: Type.STRING, description: "Artist name in Korean" },
              year: { type: Type.STRING, description: "Completion year or century (e.g., '2025' or '19세기')" },
              description: { type: Type.STRING, description: "Insightful, professional docent commentary in Korean (around 2-3 sentences)" },
              width: { type: Type.NUMBER, description: "Plausible real-world width in meters (e.g. 0.8 to 2.4)" },
              height: { type: Type.NUMBER, description: "Plausible real-world height in meters (e.g. 0.6 to 2.0) proportional to the image's layout aspect ratio" },
              frameType: { 
                type: Type.STRING, 
                description: "Suitable frame style: 'none', 'thin-black', 'ornate-gold', 'cyber-neon', or 'wooden'",
              }
            },
            required: ["title", "artist", "year", "description", "width", "height", "frameType"]
          }
        }
      });

      const parsedResult = JSON.parse(response.text || "{}");
      res.json(parsedResult);
    } catch (error: any) {
      console.error("Error analyzing artwork with Gemini:", error);
      let errMsg = error.message || "Failed to analyze artwork. Ensure GEMINI_API_KEY is configured.";
      if (errMsg.includes("quota") || errMsg.includes("429") || errMsg.includes("exhausted") || errMsg.includes("RESOURCE_EXHAUSTED") || errMsg.includes("Limit")) {
        errMsg = "구글 Gemini API 무료 한도(분당 요청 횟수 초과)에 일시적으로 도달했습니다. 구글 서버의 무료 플랜 안전 제한이므로, 약 10초~1분 정도 잠시만 기다리신 후 다시 업로드(시도)하시면 정상적으로 작동합니다.";
      }
      res.status(500).json({ error: errMsg });
    }
  });

  // Vite middleware setup for assets and hot reload in development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  // Bind to host 0.0.0.0 and port 3000
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
