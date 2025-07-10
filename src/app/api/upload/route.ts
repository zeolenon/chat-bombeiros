import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir, access } from "fs/promises";
import { join } from "path";
import { PDFProcessor } from "@/lib/pdfProcessor";
import pool from "@/lib/database";
import { insertChunks } from "@/lib/milvus";

// Configuração para upload de arquivos grandes
export const config = {
  api: {
    bodyParser: false,
  },
};

// Função para garantir que a pasta uploads existe e tem permissões
async function ensureUploadsDirectory() {
  const uploadDir = join(process.cwd(), "uploads");

  try {
    // Verificar se a pasta existe
    await access(uploadDir);
    console.log("Pasta uploads já existe");
  } catch (error) {
    // Se não existe, criar
    console.log("Criando pasta uploads...");
    await mkdir(uploadDir, { recursive: true });
    console.log("Pasta uploads criada com sucesso");
  }

  return uploadDir;
}

export async function POST(request: NextRequest) {
  try {
    console.log("=== INICIANDO PROCESSO DE UPLOAD ===");

    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      console.log("ERRO: Nenhum arquivo foi enviado");
      return NextResponse.json(
        { error: "Nenhum arquivo foi enviado" },
        { status: 400 }
      );
    }

    console.log(`Arquivo recebido: ${file.name}, tamanho: ${file.size} bytes`);

    // Verificar se é um PDF
    if (!file.type.includes("pdf")) {
      console.log("ERRO: Arquivo não é PDF");
      return NextResponse.json(
        { error: "Apenas arquivos PDF são aceitos" },
        { status: 400 }
      );
    }

    // Verificar tamanho do arquivo (máximo 50MB)
    const maxSize = 50 * 1024 * 1024; // 50MB
    if (file.size > maxSize) {
      console.log(`ERRO: Arquivo muito grande (${file.size} bytes)`);
      return NextResponse.json(
        { error: "Arquivo muito grande. Tamanho máximo: 50MB" },
        { status: 413 }
      );
    }

    // Garantir que a pasta uploads existe
    console.log("Verificando pasta uploads...");
    const uploadDir = await ensureUploadsDirectory();

    // Salvar arquivo temporariamente
    console.log("Convertendo arquivo para buffer...");
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    console.log(`Buffer criado: ${buffer.length} bytes`);

    const filename = `${Date.now()}_${file.name}`;
    const filepath = join(uploadDir, filename);
    console.log(`Tentando salvar em: ${filepath}`);

    try {
      await writeFile(filepath, buffer);
      console.log(`✓ Arquivo salvo com sucesso em: ${filepath}`);
    } catch (error) {
      console.error("✗ Erro ao salvar arquivo:", error);
      return NextResponse.json(
        {
          error:
            "Erro ao salvar arquivo. Verifique as permissões da pasta uploads.",
        },
        { status: 500 }
      );
    }

    // Processar PDF
    console.log("=== PROCESSANDO PDF ===");
    const processor = new PDFProcessor();
    const documentId = Date.now();

    try {
      const { content, chunks, embeddings } = await processor.processPDF(
        buffer,
        documentId
      );
      console.log(`✓ PDF processado: ${chunks.length} chunks gerados`);
      console.log(`✓ Embeddings gerados: ${embeddings.length}`);

      // Salvar embeddings no Milvus
      console.log("=== SALVANDO NO MILVUS ===");
      try {
        await insertChunks(
          chunks.map((chunk, i) => ({
            id: chunk.id,
            documentId: chunk.metadata.documentId,
            chunkIndex: chunk.metadata.chunkIndex,
            content: chunk.content,
            embedding: embeddings[i]?.embedding || [],
          }))
        );
        console.log("✓ Embeddings salvos no Milvus com sucesso");
      } catch (milvusError) {
        console.error("✗ Erro ao salvar no Milvus:", milvusError);
        return NextResponse.json(
          {
            error: "Erro ao salvar embeddings no Milvus. Verifique a conexão.",
          },
          { status: 500 }
        );
      }

      // Salvar no banco de dados
      console.log("=== SALVANDO NO BANCO DE DADOS ===");
      const client = await pool.connect();
      try {
        const result = await client.query(
          `INSERT INTO documents (filename, original_name, content, chunks, embeddings) 
           VALUES ($1, $2, $3, $4, $5) RETURNING id`,
          [
            filename,
            file.name,
            content,
            JSON.stringify(chunks),
            JSON.stringify(embeddings),
          ]
        );

        console.log("✓ Documento salvo com sucesso no banco de dados");

        return NextResponse.json({
          success: true,
          documentId: result.rows[0].id,
          filename: file.name,
          chunksCount: chunks.length,
          message: "Documento processado e salvo com sucesso",
        });
      } finally {
        client.release();
      }
    } catch (pdfError) {
      console.error("✗ Erro ao processar PDF:", pdfError);
      return NextResponse.json(
        { error: "Erro ao processar PDF" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("✗ Erro geral no upload:", error);
    return NextResponse.json(
      { error: "Erro ao processar o arquivo" },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const client = await pool.connect();
    try {
      const result = await client.query(
        "SELECT id, original_name, filename, created_at FROM documents ORDER BY created_at DESC"
      );

      return NextResponse.json({
        documents: result.rows,
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Erro ao buscar documentos:", error);
    return NextResponse.json(
      { error: "Erro ao buscar documentos" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const documentId = searchParams.get("id");

    if (!documentId) {
      return NextResponse.json(
        { error: "ID do documento é obrigatório" },
        { status: 400 }
      );
    }

    const client = await pool.connect();
    try {
      await client.query("DELETE FROM documents WHERE id = $1", [documentId]);

      return NextResponse.json({
        success: true,
        message: "Documento removido com sucesso",
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Erro ao remover documento:", error);
    return NextResponse.json(
      { error: "Erro ao remover documento" },
      { status: 500 }
    );
  }
}
