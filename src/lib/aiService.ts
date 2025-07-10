import { GoogleGenerativeAI } from "@google/generative-ai";
import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import pool from "./database";
import { searchSimilarChunks } from "./qdrant";

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export type AIModel =
  | "gemini-1.5-pro"
  | "gemini-1.5-flash"
  | "grok-beta"
  | "grok-4"
  | "grok-1"
  | "grok-2";

export interface AIModelConfig {
  id: string;
  name: string;
  provider: string;
  model: AIModel;
  is_active: boolean;
  api_key?: string;
  base_url?: string;
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

    console.log("🔍 Debug - Modelo ativo:", activeModel);
    console.log(
      "🔍 Debug - API key do banco:",
      activeModel?.api_key ? "Configurada" : "Não configurada"
    );
    console.log(
      "🔍 Debug - API key do env:",
      process.env.GROK_API_KEY ? "Configurada" : "Não configurada"
    );

    // Usar API key do banco de dados ou da variável de ambiente
    const apiKey = activeModel?.api_key || process.env.GROK_API_KEY;
    const baseUrl =
      activeModel?.base_url || process.env.GROK_BASE_URL || "https://api.x.ai";

    console.log(
      "🔍 Debug - API key final:",
      apiKey ? "Configurada" : "Não configurada"
    );
    console.log("🔍 Debug - Base URL:", baseUrl);

    if (!apiKey) {
      throw new Error(
        "API key do Grok não configurada. Configure no banco de dados ou na variável de ambiente GROK_API_KEY"
      );
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
      console.log("🔍 Debug - Fazendo requisição para Grok:");
      console.log("  URL:", `${baseUrl}/v1/chat/completions`);
      console.log("  Modelo:", activeModel?.model);
      console.log("  API Key:", apiKey ? "Configurada" : "Não configurada");

      const requestBody = {
        model: activeModel?.model || "grok-beta",
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
      };

      console.log("  Request Body:", JSON.stringify(requestBody, null, 2));

      const response = await fetch(`${baseUrl}/v1/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify(requestBody),
      });

      console.log("  Response Status:", response.status);
      console.log(
        "  Response Headers:",
        Object.fromEntries(response.headers.entries())
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.log("  Error Response:", errorText);
        throw new Error(
          `Erro na API do Grok: ${response.status} - ${errorText}`
        );
      }

      const data = await response.json();
      console.log("  Response Data:", JSON.stringify(data, null, 2));

      const content = data.choices?.[0]?.message?.content;
      if (!content) {
        console.log("  No content in response");
        return "Erro: Resposta vazia da API do Grok";
      }

      return content;
    } catch (error) {
      console.error("Erro ao gerar resposta com Grok:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Erro desconhecido";
      return `Desculpe, ocorreu um erro ao processar sua pergunta: ${errorMessage}`;
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
    } else if (activeModel.model.startsWith("grok")) {
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
