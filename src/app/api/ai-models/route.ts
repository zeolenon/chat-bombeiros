import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/database";

export async function GET() {
  try {
    const client = await pool.connect();
    try {
      const result = await client.query(
        "SELECT * FROM ai_model_configs ORDER BY id ASC"
      );

      return NextResponse.json({
        models: result.rows,
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Erro ao buscar modelos:", error);
    return NextResponse.json(
      { error: "Erro ao buscar modelos" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, provider, model, apiKey, baseUrl } = body;

    if (!name || !provider || !model) {
      return NextResponse.json(
        { error: "Nome, provedor e modelo são obrigatórios" },
        { status: 400 }
      );
    }

    const client = await pool.connect();
    try {
      const result = await client.query(
        "INSERT INTO ai_model_configs (name, provider, model, api_key, base_url) VALUES ($1, $2, $3, $4, $5) RETURNING *",
        [name, provider, model, apiKey || null, baseUrl || null]
      );

      return NextResponse.json({
        model: result.rows[0],
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Erro ao criar modelo:", error);
    return NextResponse.json(
      { error: "Erro ao criar modelo" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, name, provider, model, apiKey, baseUrl, isActive } = body;

    if (!id) {
      return NextResponse.json({ error: "ID é obrigatório" }, { status: 400 });
    }

    const client = await pool.connect();
    try {
      if (isActive !== undefined) {
        // Se está ativando um modelo, desativar todos os outros
        if (isActive) {
          await client.query("UPDATE ai_model_configs SET is_active = false");
        }
      }

      const result = await client.query(
        "UPDATE ai_model_configs SET name = $1, provider = $2, model = $3, api_key = $4, base_url = $5, is_active = $6 WHERE id = $7 RETURNING *",
        [name, provider, model, apiKey || null, baseUrl || null, isActive, id]
      );

      if (result.rows.length === 0) {
        return NextResponse.json(
          { error: "Modelo não encontrado" },
          { status: 404 }
        );
      }

      return NextResponse.json({
        model: result.rows[0],
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Erro ao atualizar modelo:", error);
    return NextResponse.json(
      { error: "Erro ao atualizar modelo" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "ID é obrigatório" }, { status: 400 });
    }

    const client = await pool.connect();
    try {
      const result = await client.query(
        "DELETE FROM ai_model_configs WHERE id = $1 RETURNING *",
        [id]
      );

      if (result.rows.length === 0) {
        return NextResponse.json(
          { error: "Modelo não encontrado" },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        message: "Modelo removido com sucesso",
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Erro ao remover modelo:", error);
    return NextResponse.json(
      { error: "Erro ao remover modelo" },
      { status: 500 }
    );
  }
}
