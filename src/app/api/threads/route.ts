import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/database";

// GET - Listar todas as threads
export async function GET() {
  try {
    const client = await pool.connect();
    try {
      const result = await client.query(
        "SELECT id, title, created_at, updated_at FROM chats ORDER BY updated_at DESC"
      );

      return NextResponse.json({
        threads: result.rows.map((row) => ({
          id: row.id.toString(),
          title: row.title,
          createdAt: row.created_at,
          updatedAt: row.updated_at,
        })),
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Erro ao buscar threads:", error);
    return NextResponse.json(
      { error: "Erro ao buscar threads" },
      { status: 500 }
    );
  }
}

// POST - Criar nova thread
export async function POST(request: NextRequest) {
  try {
    const { title } = await request.json();

    const client = await pool.connect();
    try {
      const result = await client.query(
        "INSERT INTO chats (title) VALUES ($1) RETURNING id, title, created_at",
        [title || "Nova conversa"]
      );

      const thread = result.rows[0];

      return NextResponse.json({
        id: thread.id.toString(),
        title: thread.title,
        createdAt: thread.created_at,
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Erro ao criar thread:", error);
    return NextResponse.json(
      { error: "Erro ao criar thread" },
      { status: 500 }
    );
  }
}

// DELETE - Deletar thread
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const threadId = searchParams.get("id");

    if (!threadId) {
      return NextResponse.json(
        { error: "ID da thread é obrigatório" },
        { status: 400 }
      );
    }

    const client = await pool.connect();
    try {
      await client.query("DELETE FROM chats WHERE id = $1", [threadId]);

      return NextResponse.json({
        success: true,
        message: "Thread removida com sucesso",
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Erro ao remover thread:", error);
    return NextResponse.json(
      { error: "Erro ao remover thread" },
      { status: 500 }
    );
  }
}
