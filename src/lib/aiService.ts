import { GoogleGenerativeAI } from "@google/generative-ai";
import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import pool from "./database";
import { searchSimilarChunks } from "./qdrant";

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export type AIModel = "gemini-1.5-pro" | "gemini-1.5-flash" | "grok-beta";

export interface AIModelConfig {
  id: string;
  name: string;
  provider: string;
  model: AIModel;
  isActive: boolean;
  apiKey?: string;
  baseUrl?: string;
}

export class AIService {
  private geminiGenAI: GoogleGenerativeAI | null = null;
  private geminiModel: any = null;
  private embeddings: GoogleGenerativeAIEmbeddings;
  private currentModel: AIModel = "gemini-1.5-pro";

  constructor() {
    // Inicializar embeddings do Gemini (usado para todos os modelos)
    this.embeddings = new GoogleGenerativeAIEmbeddings({
      modelName: "embedding-001",
      apiKey: process.env.GOOGLE_API_KEY!,
    });
  }

  async initializeModel(model: AIModel) {
    this.currentModel = model;

    if (model.startsWith("gemini")) {
      this.geminiGenAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY!);
      this.geminiModel = this.geminiGenAI.getGenerativeModel({ model });
    }
  }

  async getModelConfigs(): Promise<AIModelConfig[]> {
    const client = await pool.connect();
    try {
      const result = await client.query(
        "SELECT * FROM ai_model_configs ORDER BY id ASC"
      );
      return result.rows;
    } finally {
      client.release();
    }
  }

  async getActiveModel(): Promise<AIModelConfig | null> {
    const client = await pool.connect();
    try {
      const result = await client.query(
        "SELECT * FROM ai_model_configs WHERE is_active = true LIMIT 1"
      );
      return result.rows[0] || null;
    } finally {
      client.release();
    }
  }

  async setActiveModel(modelId: string): Promise<void> {
    const client = await pool.connect();
    try {
      // Desativar todos os modelos
      await client.query("UPDATE ai_model_configs SET is_active = false");

      // Ativar o modelo selecionado
      await client.query(
        "UPDATE ai_model_configs SET is_active = true WHERE id = $1",
        [modelId]
      );
    } finally {
      client.release();
    }
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
    const embedding = await this.embeddings.embedQuery(question);
    const similarChunks = await searchSimilarChunks(embedding, limit);
    return similarChunks;
  }

  async generateResponseWithGemini(
    question: string,
    chatHistory: ChatMessage[],
    contextChunks: any[] = []
  ): Promise<string> {
    if (!this.geminiModel) {
      throw new Error("Modelo Gemini não inicializado");
    }

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
      const result = await this.geminiModel.generateContent(fullPrompt);
      const response = await result.response;
      return response.text();
    } catch (error) {
      console.error("Erro ao gerar resposta com Gemini:", error);
      return "Desculpe, ocorreu um erro ao processar sua pergunta. Tente novamente.";
    }
  }

  async generateResponseWithGrok(
    question: string,
    chatHistory: ChatMessage[],
    contextChunks: any[] = []
  ): Promise<string> {
    const activeModel = await this.getActiveModel();
    if (!activeModel?.apiKey) {
      throw new Error("API key do Grok não configurada");
    }

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
      const response = await fetch(
        `${activeModel.baseUrl}/v1/chat/completions`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${activeModel.apiKey}`,
          },
          body: JSON.stringify({
            model: "grok-beta",
            messages: [
              {
                role: "system",
                content: basePrompt,
              },
              ...chatHistory,
              {
                role: "user",
                content: `${contextText}\n\nPergunta: ${question}`,
              },
            ],
            max_tokens: 4000,
            temperature: 0.7,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`Erro na API do Grok: ${response.status}`);
      }

      const data = await response.json();
      return data.choices[0]?.message?.content || "Erro ao gerar resposta";
    } catch (error) {
      console.error("Erro ao gerar resposta com Grok:", error);
      return "Desculpe, ocorreu um erro ao processar sua pergunta. Tente novamente.";
    }
  }

  async generateResponse(
    question: string,
    chatHistory: ChatMessage[],
    contextChunks: any[] = []
  ): Promise<string> {
    const activeModel = await this.getActiveModel();

    if (!activeModel) {
      // Fallback para Gemini se nenhum modelo estiver configurado
      await this.initializeModel("gemini-1.5-pro");
      return this.generateResponseWithGemini(
        question,
        chatHistory,
        contextChunks
      );
    }

    await this.initializeModel(activeModel.model);

    if (activeModel.model.startsWith("gemini")) {
      return this.generateResponseWithGemini(
        question,
        chatHistory,
        contextChunks
      );
    } else if (activeModel.model === "grok-beta") {
      return this.generateResponseWithGrok(
        question,
        chatHistory,
        contextChunks
      );
    } else {
      throw new Error(`Modelo não suportado: ${activeModel.model}`);
    }
  }
}
