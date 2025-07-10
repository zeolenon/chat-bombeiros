import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/database";

// Configuração para evitar timeouts
export const dynamic = "force-dynamic";
export const maxDuration = 30; // 30 segundos
export const runtime = "nodejs";

// Função para processar com timeout
async function processWithTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  operation: string
): Promise<T> {
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => {
      reject(
        new Error(`Timeout: ${operation} demorou mais de ${timeoutMs / 1000}s`)
      );
    }, timeoutMs);
  });

  return Promise.race([promise, timeoutPromise]);
}

export async function GET() {
  try {
    console.log("=== CARREGANDO CONFIGURAÇÕES DE CONTEXTO ===");

    const client = await pool.connect();
    try {
      const result = await processWithTimeout(
        client.query("SELECT * FROM context_settings ORDER BY id ASC"),
        10000, // 10 segundos para buscar configurações
        "buscar configurações de contexto"
      );

      console.log(
        `✓ Configurações carregadas: ${result.rows.length} encontradas`
      );

      return NextResponse.json({
        settings: result.rows,
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("✗ Erro ao buscar configurações:", error);

    let errorMessage = "Erro ao buscar configurações";
    let statusCode = 500;

    if (error instanceof Error) {
      if (error.message.includes("Timeout")) {
        errorMessage = "Carregamento demorou muito. Tente novamente.";
        statusCode = 408;
      } else {
        errorMessage = error.message;
      }
    }

    return NextResponse.json({ error: errorMessage }, { status: statusCode });
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
