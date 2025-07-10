import { NextRequest, NextResponse } from "next/server";
import { AIService } from "@/lib/aiService";
import pool from "@/lib/database";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // O assistant-ui pode enviar dados em diferentes formatos
    let messages, question, chatId;

    if (body.messages && Array.isArray(body.messages)) {
      // Formato do assistant-ui
      messages = body.messages;
      question = messages[messages.length - 1]?.content || "";
      chatId = body.threadId || body.chatId || null;
    } else {
      // Formato legado
      question = body.question;
      chatId = body.chatId;
    }

    console.log("=== PROCESSANDO PERGUNTA ===");
    console.log("Pergunta:", question);
    console.log("Chat ID:", chatId);

    if (!question) {
      return NextResponse.json(
        { error: "Pergunta é obrigatória" },
        { status: 400 }
      );
    }

    const aiService = new AIService();
    const client = await pool.connect();

    try {
      let currentChatId = chatId;

      // Se não há chatId, criar novo chat
      if (!currentChatId) {
        const chatResult = await client.query(
          "INSERT INTO chats (title) VALUES ($1) RETURNING id",
          [question.substring(0, 50) + "..."]
        );
        currentChatId = chatResult.rows[0].id;
        console.log("Novo chat criado:", currentChatId);
      }

      // Buscar histórico do chat
      const historyResult = await client.query(
        "SELECT role, content FROM messages WHERE chat_id = $1 ORDER BY created_at ASC",
        [currentChatId]
      );

      const chatHistory = historyResult.rows.map((row) => ({
        role: row.role,
        content: row.content,
      }));

      console.log("Histórico do chat:", chatHistory.length, "mensagens");

      // Buscar chunks relevantes
      console.log("Buscando chunks relevantes...");
      const relevantChunks = await aiService.getRelevantChunks(question);
      console.log("Chunks encontrados:", relevantChunks.length);

      if (relevantChunks.length > 0) {
        console.log(
          "Primeiro chunk:",
          relevantChunks[0].content.substring(0, 100) + "..."
        );
      } else {
        console.log("⚠️  Nenhum chunk relevante encontrado");
      }

      // Gerar resposta
      console.log("Gerando resposta...");
      const response = await aiService.generateResponse(
        question,
        chatHistory,
        relevantChunks
      );

      console.log("Resposta gerada:", response.length, "caracteres");

      // Salvar mensagem do usuário
      await client.query(
        "INSERT INTO messages (chat_id, role, content) VALUES ($1, $2, $3)",
        [currentChatId, "user", question]
      );

      // Salvar resposta do assistente
      await client.query(
        "INSERT INTO messages (chat_id, role, content) VALUES ($1, $2, $3)",
        [currentChatId, "assistant", response]
      );

      // Atualizar título do chat
      await client.query(
        "UPDATE chats SET updated_at = CURRENT_TIMESTAMP WHERE id = $1",
        [currentChatId]
      );

      console.log("=== RESPOSTA ENVIADA ===");

      // Retornar no formato esperado pelo assistant-ui
      return NextResponse.json([
        {
          id: currentChatId,
          role: "assistant",
          content: response,
          createdAt: new Date().toISOString(),
        },
      ]);
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Erro no chat:", error);
    return NextResponse.json(
      { error: "Erro ao processar a pergunta" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const chatId = searchParams.get("chatId");

    const client = await pool.connect();
    try {
      if (chatId) {
        // Buscar mensagens de um chat específico
        const result = await client.query(
          "SELECT role, content, created_at FROM messages WHERE chat_id = $1 ORDER BY created_at ASC",
          [chatId]
        );

        return NextResponse.json({
          messages: result.rows,
        });
      } else {
        // Buscar todos os chats
        const result = await client.query(
          "SELECT id, title, created_at, updated_at FROM chats ORDER BY updated_at DESC"
        );

        return NextResponse.json({
          chats: result.rows,
        });
      }
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Erro ao buscar chats:", error);
    return NextResponse.json(
      { error: "Erro ao buscar chats" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const chatId = searchParams.get("chatId");

    if (!chatId) {
      return NextResponse.json(
        { error: "ID do chat é obrigatório" },
        { status: 400 }
      );
    }

    const client = await pool.connect();
    try {
      await client.query("DELETE FROM chats WHERE id = $1", [chatId]);

      return NextResponse.json({
        success: true,
        message: "Chat removido com sucesso",
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Erro ao remover chat:", error);
    return NextResponse.json(
      { error: "Erro ao remover chat" },
      { status: 500 }
    );
  }
}
