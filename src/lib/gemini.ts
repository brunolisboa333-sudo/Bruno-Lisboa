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
  const ai = new GoogleGenAI({ apiKey: apiKey || currentApiKey });
  const model = "gemini-3.1-pro-preview";
  
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

  return JSON.parse(jsonStr);
}

export async function getClinicalChatResponse(
  messages: ClinicalChatMessage[],
  context: string,
  approach: string,
  apiKey?: string
): Promise<string> {
  const ai = new GoogleGenAI({ apiKey: apiKey || currentApiKey });
  const model = "gemini-3.1-pro-preview";
  
  const systemInstruction = `Você é um assistente de supervisão clínica para psicólogos e psicanalistas. 
Sua abordagem teórica principal para esta discussão é: ${approach}.
Use o seguinte histórico clínico do paciente como contexto:
${context}

Forneça insights, hipóteses diagnósticas e direcionamentos clínicos baseados na teoria escolhida. 
Seja profissional, ético e empático.`;

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
