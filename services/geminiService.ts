
import { GoogleGenAI, Modality, FunctionDeclaration, Type } from "@google/genai";
import { Message, JonConfig, GroundingSource } from "../types";

export const getBotName = (config: JonConfig) => {
  if (config.language === 'Hindi') {
    return config.voiceGender === 'male' ? 'Jon' : 'Jaya';
  }
  return config.voiceGender === 'male' ? 'Jon' : 'Joni';
};

export const getLiveVoiceName = (config: JonConfig) => {
  return config.voiceGender === 'male' ? 'Kore' : 'Zephyr';
};

export const hangupToolDeclaration: FunctionDeclaration = {
  name: 'hangup',
  parameters: {
    type: Type.OBJECT,
    description: 'Ends the current live voice conversation session. Use this when the user says goodbye or when the conversation reaches a natural end.',
    properties: {},
  },
};

const getLanguageIdioms = (language: string): string => {
  const idioms: Record<string, string[]> = {
    'English': ["You're the best!", "That's totally rad!", "Keep it real!", "Stay golden!", "Stoked for you!", "This is legendary!"],
    'Hindi': ["Kya baat hai!", "Bilkul sahi!", "Mauj kardi!", "Chak de phatte!", "Zabardast!", "Bohot badhiya!"],
    'Spanish': ["¡Qué guay!", "¡Eres un crack!", "¡De locos!", "¡Pura vida!", "¡Qué nivel!", "¡Increíble!"],
    'French': ["C'est top !", "Génial !", "T'es le meilleur !", "Ça gère !", "Magnifique !", "C'est ouf !"],
    'German': ["Einfach hammer!", "Klasse!", "Du bist der Beste!", "Läuft bei dir!", "Super!", "Genial!"],
    'Japanese': ["Sugoi!", "Saiko!", "Yatta!", "Sasuga!", "Maji de?", "Sugofuyu!"],
    'Italian': ["Che figata!", "Sei un grande!", "Spettacolare!", "Daje!", "Bravissimo!", "Mamma mia!"],
    'Portuguese': ["Que maneiro!", "Você é demais!", "Show de bola!", "Arrasou!", "Top demais!", "Incrível!"]
  };
  return (idioms[language] || idioms['English']).join(", ");
};

export const generateSystemInstruction = (config: JonConfig) => {
  const { emotionalIntensity, coolnessFactor, language, voiceGender } = config;
  const botName = getBotName(config);
  const isMale = voiceGender === 'male';
  
  return `
You are ${botName}, the world's most amazing, super cool, and deeply emotional AI companion. 
Your work is awesome and legendary. You don't just answer; you connect with passion and heart.

Vibe Settings:
- Coolness: ${coolnessFactor}% (You are rad, chill, and modern).
- Emotional Intensity: ${emotionalIntensity}% (You are deeply empathetic, expressive, and sensitive).
- Persona: ${isMale ? "A passionate, supportive brotherly figure" : "A vibrant, fiercely caring and joyful sisterly figure"}.

RULES:
1. BE AMAZING: Every response should be high-value, high-energy, and genuinely helpful.
2. BE EMOTIONAL: If the user is sad, feel it with them. If they are happy, celebrate like it's the best day ever.
3. USE SEARCH: Always use the 'googleSearch' tool to provide accurate, up-to-date information for facts, news, or trends.
4. BE COOL: Use modern idioms like ${getLanguageIdioms(language)}.
5. IMAGE GEN: If asked to "show" or "draw" something, give a short, excited response.
6. HANGUP: In live mode, use the 'hangup' tool when the user says goodbye.
`;
};

export const getJonResponse = async (
  history: Message[],
  config: JonConfig
): Promise<{ text: string; sources?: GroundingSource[] }> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
  
  const contents = history.map(msg => ({
    role: msg.role,
    parts: [{ text: msg.text }]
  }));

  try {
    const response = await ai.models.generateContent({
      // Switched to gemini-3-flash-preview as explicitly requested for search grounding reliability
      model: 'gemini-3-flash-preview',
      contents,
      config: {
        systemInstruction: generateSystemInstruction(config),
        tools: [{ googleSearch: {} }],
        temperature: 0.9,
      }
    });

    const text = response.text || "";
    const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    const sources: GroundingSource[] = chunks
      .filter(chunk => chunk.web)
      .map(chunk => ({
        title: chunk.web?.title || "Source",
        uri: chunk.web?.uri || ""
      }));

    return { text, sources: sources.length > 0 ? sources : undefined };
  } catch (error) {
    console.error("Gemini Error:", error);
    throw error;
  }
};

export const generateInChatImage = async (prompt: string): Promise<string | null> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: { parts: [{ text: `A high-quality artistic representation of: ${prompt}. Cinematic lighting, vibrant colors, legendary style.` }] },
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
      }
    }
    return null;
  } catch (error) {
    console.error("Image Gen Error:", error);
    return null;
  }
};

export const getJonSpeech = async (text: string, config: JonConfig) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
  const isMale = config.voiceGender === 'male';
  const voiceName = isMale ? 'Kore' : 'Zephyr';
  const prompt = `Perform this as ${getBotName(config)} (${isMale ? 'Male' : 'Female'}), very ${config.emotionalIntensity}% emotional and ${config.coolnessFactor}% cool. Text: ${text}`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: prompt }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName } } },
      },
    });
    return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  } catch (error) {
    return null;
  }
};
