import { NextRequest, NextResponse } from "next/server";
import { writeFile } from "fs/promises";
import { join } from "path";
import { PDFProcessor } from "@/lib/pdfProcessor";
import pool from "@/lib/database";
import { insertChunks } from "@/lib/milvus";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json(
        { error: "Nenhum arquivo foi enviado" },
        { status: 400 }
      );
    }

    // Verificar se é um PDF
    if (!file.type.includes("pdf")) {
      return NextResponse.json(
        { error: "Apenas arquivos PDF são aceitos" },
        { status: 400 }
      );
    }

    // Salvar arquivo temporariamente
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const filename = `${Date.now()}_${file.name}`;
    const uploadDir = join(process.cwd(), "uploads");
    const filepath = join(uploadDir, filename);

    await writeFile(filepath, buffer);

    // Processar PDF
    const processor = new PDFProcessor();
    const documentId = Date.now();
    const { content, chunks, embeddings } = await processor.processPDF(
      buffer,
      documentId
    );

    // Salvar embeddings no Milvus
    await insertChunks(
      chunks.map((chunk, i) => ({
        id: chunk.id,
        documentId: chunk.metadata.documentId,
        chunkIndex: chunk.metadata.chunkIndex,
        content: chunk.content,
        embedding: embeddings[i]?.embedding || [],
      }))
    );

    // Salvar no banco de dados
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
  } catch (error) {
    console.error("Erro no upload:", error);
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
