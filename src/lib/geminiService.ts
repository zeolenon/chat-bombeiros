import { GoogleGenerativeAI } from "@google/generative-ai";
import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import pool from "./database";
import { searchSimilarChunks } from "./qdrant";

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export class GeminiService {
  private genAI: GoogleGenerativeAI;
  private model: any;
  private embeddings: GoogleGenerativeAIEmbeddings;

  constructor() {
    this.genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY!);
    this.model = this.genAI.getGenerativeModel({ model: "gemini-1.5-pro" });
    this.embeddings = new GoogleGenerativeAIEmbeddings({
      modelName: "embedding-001",
      apiKey: process.env.GOOGLE_API_KEY!,
    });
  }

  async getContextSettings() {
    const client = await pool.connect();
    try {
      const result = await client.query(
        "SELECT * FROM context_settings WHERE is_active = true ORDER BY id ASC"
      );
      return result.rows;
    } finally {
      client.release();
    }
  }

  async getRelevantChunks(question: string, limit: number = 5): Promise<any[]> {
    // Gerar embedding da pergunta usando o modelo correto para embeddings
    const embedding = await this.embeddings.embedQuery(question);
    // Buscar chunks mais próximos no Qdrant
    const similarChunks = await searchSimilarChunks(embedding, limit);
    return similarChunks;
  }

  async generateResponse(
    question: string,
    chatHistory: ChatMessage[],
    contextChunks: any[] = []
  ): Promise<string> {
    const contextSettings = await this.getContextSettings();
    const basePrompt =
      contextSettings[0]?.prompt_template ||
      "Você é um especialista em normas do CBM-RN. Responda com base nas informações fornecidas.";

    let contextText = "";
    if (contextChunks.length > 0) {
      contextText =
        "\n\nContexto das normas:\n" +
        contextChunks.map((chunk) => chunk.content).join("\n\n");
    }

    const historyText =
      chatHistory.length > 0
        ? "\n\nHistórico da conversa:\n" +
          chatHistory.map((msg) => `${msg.role}: ${msg.content}`).join("\n")
        : "";

    const fullPrompt = `${basePrompt}${contextText}${historyText}\n\nPergunta: ${question}\n\nResposta:`;

    try {
      const result = await this.model.generateContent(fullPrompt);
      const response = await result.response;
      return response.text();
    } catch (error) {
      console.error("Erro ao gerar resposta:", error);
      return "Desculpe, ocorreu um erro ao processar sua pergunta. Tente novamente.";
    }
  }
}
