import { GoogleGenAI, Type } from "@google/genai";
import { SessionRecord, ClinicalEvolutionReport, ClinicalChatMessage, ClinicSettings } from "../types";

let currentApiKey = process.env.GEMINI_API_KEY || "";

export const setGeminiApiKey = (key: string) => {
  currentApiKey = key;
};

export const getBestApiKey = (settings: ClinicSettings): string | undefined => {
  const keys = settings.geminiKeys?.filter(k => k.trim() !== '') || [];
  if (keys.length > 0) {
    return keys[Math.floor(Math.random() * keys.length)];
  }
  return process.env.GEMINI_API_KEY;
};

export async function analyzeEvolution(
  patientName: string,
  records: SessionRecord[],
  apiKey?: string
): Promise<Partial<ClinicalEvolutionReport>> {
  const key = apiKey || currentApiKey;
  if (!key) throw new Error('Chave de API do Gemini não configurada.');
  
  const ai = new GoogleGenAI({ apiKey: key });
  // Try Pro first, fallback to Flash if it fails (quota/availability)
  const models = ["gemini-3.1-pro-preview", "gemini-3-flash-preview"];
  let lastError = null;

  for (const model of models) {
    try {
      const recordsSummary = records.map(r => `Data: ${r.date}\nEvolução: ${r.evolution}/10\nNotas Clínicas: ${r.clinicalNotes}${r.transcription ? `\nTranscrição: ${r.transcription}` : ''}`).join('\n\n');
      
      const prompt = `Analise a evolução clínica do paciente ${patientName} com base nos seguintes registros de sessões e suas transcrições/notas:\n\n${recordsSummary}\n\nIdentifique padrões, determine o status de evolução (evoluindo, estagnado ou regredindo) e forneça recomendações clínicas estruturadas baseadas na evolução clínica.`;

      const response = await ai.models.generateContent({
        model,
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              summary: { type: Type.STRING },
              status: { type: Type.STRING, enum: ["evoluindo", "estagnado", "regredindo"] },
              patterns: { type: Type.ARRAY, items: { type: Type.STRING } },
              recommendations: { type: Type.ARRAY, items: { type: Type.STRING } }
            },
            required: ["summary", "status", "patterns", "recommendations"]
          }
        }
      });

      let jsonStr = response.text || "{}";
      if (jsonStr.includes('```')) {
        jsonStr = jsonStr.replace(/```json\n?|```\n?/g, '').trim();
      }

      // Final attempt to clean if there's text around the JSON
      if (jsonStr.includes('{')) {
        const firstBrace = jsonStr.indexOf('{');
        const lastBrace = jsonStr.lastIndexOf('}');
        if (firstBrace !== -1 && lastBrace !== -1) {
          jsonStr = jsonStr.substring(firstBrace, lastBrace + 1);
        }
      }

      return JSON.parse(jsonStr);
    } catch (error) {
      console.warn(`Erro com modelo ${model}:`, error);
      lastError = error;
      continue; // try next model
    }
  }

  throw lastError || new Error('Falha total na geração da análise clínica.');
}

export async function getClinicalChatResponse(
  messages: ClinicalChatMessage[],
  context: string,
  approach: string,
  apiKey?: string
): Promise<string> {
  const key = apiKey || currentApiKey;
  if (!key) throw new Error('Chave de API do Gemini não configurada.');

  const ai = new GoogleGenAI({ apiKey: key });
  // Use Gemini 3 Flash by default for chat as it is faster and more responsive
  const model = "gemini-3-flash-preview";
  
  const systemInstruction = `Você é um assistente de supervisão clínica para psicólogos e psicanalistas. 
Sua abordagem teórica principal para esta discussão é: ${approach}.
Use o seguinte histórico clínico do paciente como contexto:
${context}

Forneça insights, hipóteses diagnósticas e direcionamentos clínicos baseados na teoria escolhida. 
Seja profissional, ético e empático.`;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: messages.map(m => ({ 
        role: m.role === 'assistant' ? 'model' : 'user', 
        parts: [{ text: m.content }] 
      })),
      config: {
        systemInstruction
      }
    });

    return response.text || "Desculpe, não consegui processar sua solicitação.";
  } catch (error) {
    console.error("Erro no Chat Clínico:", error);
    // If Pro fails (e.g. quota), we could retry with another model, but Flash is usually more available.
    // For now, let's just throw and handle in UI
    throw error;
  }
}

export async function generateBirthdayMessage(patientName: string, apiKey?: string): Promise<string> {
  const ai = new GoogleGenAI({ apiKey: apiKey || currentApiKey });
  const model = "gemini-3-flash-preview";
  
  const prompt = `Gere uma mensagem curta e carinhosa de aniversário para o paciente ${patientName} enviada pelo seu terapeuta (Bruno Lisboa). A mensagem deve ser profissional mas acolhedora.`;

  const response = await ai.models.generateContent({
    model,
    contents: prompt
  });

  return response.text || `Parabéns, ${patientName}! Muita saúde e paz no seu novo ciclo. Um abraço, Bruno Lisboa.`;
}
