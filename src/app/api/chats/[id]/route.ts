import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/database";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const chatId = params.id;

    const client = await pool.connect();
    try {
      const result = await client.query(
        "SELECT id, title, created_at, updated_at FROM chats WHERE id = $1",
        [chatId]
      );

      if (result.rows.length === 0) {
        return NextResponse.json(
          { error: "Chat não encontrado" },
          { status: 404 }
        );
      }

      return NextResponse.json({
        chat: result.rows[0],
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Erro ao buscar chat:", error);
    return NextResponse.json({ error: "Erro ao buscar chat" }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const chatId = params.id;
    const body = await request.json();
    const { title } = body;

    if (!title || title.trim() === "") {
      return NextResponse.json(
        { error: "Título é obrigatório" },
        { status: 400 }
      );
    }

    const client = await pool.connect();
    try {
      const result = await client.query(
        "UPDATE chats SET title = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING id, title, created_at, updated_at",
        [title.trim(), chatId]
      );

      if (result.rows.length === 0) {
        return NextResponse.json(
          { error: "Chat não encontrado" },
          { status: 404 }
        );
      }

      return NextResponse.json({
        chat: result.rows[0],
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Erro ao atualizar chat:", error);
    return NextResponse.json(
      { error: "Erro ao atualizar chat" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const chatId = params.id;

    const client = await pool.connect();
    try {
      const result = await client.query(
        "DELETE FROM chats WHERE id = $1 RETURNING id",
        [chatId]
      );

      if (result.rows.length === 0) {
        return NextResponse.json(
          { error: "Chat não encontrado" },
          { status: 404 }
        );
      }

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
