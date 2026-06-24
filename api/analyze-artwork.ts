import { GoogleGenAI, Type } from "@google/genai";

export default async function handler(req: any, res: any) {
  // Add CORS headers so it works smoothly
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS,PATCH,DELETE,POST,PUT");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, x-gemini-api-key"
  );

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { image, currentHallId } = req.body;
    if (!image) {
      return res.status(400).json({ error: "No image payload supplied." });
    }

    // Try reading GEMINI_API_KEY from environment variables (provided securely in Vercel dashboard)
    const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
    
    if (!apiKey) {
      return res.status(500).json({ 
        error: "GEMINI_API_KEY가 존재하지 않습니다. Vercel 대시보드 -> Settings -> Environment Variables에 GEMINI_API_KEY를 추가하고 다시 배포해주세요." 
      });
    }

    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });

    let mimeType = "image/png";
    let base64Data = image;

    if (image.startsWith("data:")) {
      const matches = image.match(/^data:([^;]+);base64,(.+)$/);
      if (matches && matches.length === 3) {
        mimeType = matches[1];
        base64Data = matches[2];
      }
    }

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
    return res.status(200).json(parsedResult);
  } catch (error: any) {
    console.error("Error in Vercel Serverless Function:", error);
    return res.status(500).json({ 
      error: error.message || "Failed to analyze artwork. Please check if GEMINI_API_KEY is correct." 
    });
  }
}
