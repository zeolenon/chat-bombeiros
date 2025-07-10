import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/database";

export async function GET() {
  try {
    const client = await pool.connect();
    try {
      const result = await client.query(
        "SELECT * FROM context_settings ORDER BY id ASC"
      );

      return NextResponse.json({
        settings: result.rows,
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Erro ao buscar configurações:", error);
    return NextResponse.json(
      { error: "Erro ao buscar configurações" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { name, description, promptTemplate } = await request.json();

    if (!name || !promptTemplate) {
      return NextResponse.json(
        { error: "Nome e template do prompt são obrigatórios" },
        { status: 400 }
      );
    }

    const client = await pool.connect();
    try {
      const result = await client.query(
        `INSERT INTO context_settings (name, description, prompt_template) 
         VALUES ($1, $2, $3) RETURNING id`,
        [name, description, promptTemplate]
      );

      return NextResponse.json({
        success: true,
        settingId: result.rows[0].id,
        message: "Configuração criada com sucesso",
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Erro ao criar configuração:", error);
    return NextResponse.json(
      { error: "Erro ao criar configuração" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { id, name, description, promptTemplate, isActive } =
      await request.json();

    if (!id) {
      return NextResponse.json(
        { error: "ID da configuração é obrigatório" },
        { status: 400 }
      );
    }

    const client = await pool.connect();
    try {
      await client.query(
        `UPDATE context_settings 
         SET name = $1, description = $2, prompt_template = $3, is_active = $4 
         WHERE id = $5`,
        [name, description, promptTemplate, isActive, id]
      );

      return NextResponse.json({
        success: true,
        message: "Configuração atualizada com sucesso",
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Erro ao atualizar configuração:", error);
    return NextResponse.json(
      { error: "Erro ao atualizar configuração" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const settingId = searchParams.get("id");

    if (!settingId) {
      return NextResponse.json(
        { error: "ID da configuração é obrigatório" },
        { status: 400 }
      );
    }

    const client = await pool.connect();
    try {
      await client.query("DELETE FROM context_settings WHERE id = $1", [
        settingId,
      ]);

      return NextResponse.json({
        success: true,
        message: "Configuração removida com sucesso",
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Erro ao remover configuração:", error);
    return NextResponse.json(
      { error: "Erro ao remover configuração" },
      { status: 500 }
    );
  }
}
