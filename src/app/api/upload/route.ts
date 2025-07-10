import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir, access } from "fs/promises";
import { join } from "path";
import { PDFProcessor } from "@/lib/pdfProcessor";
import pool from "@/lib/database";
import { insertChunks } from "@/lib/qdrant";

// Configuração para upload de arquivos grandes no App Router
export const dynamic = "force-dynamic";
export const maxDuration = 300; // 5 minutos
export const runtime = "nodejs";

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

export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    console.log("=== INICIANDO PROCESSO DE UPLOAD ===");

    // Verificar se a requisição foi cancelada
    if (request.signal?.aborted) {
      return NextResponse.json(
        { error: "Upload cancelado pelo usuário" },
        { status: 499 }
      );
    }

    const formData = await processWithTimeout(
      request.formData(),
      60000, // 1 minuto para receber o formData
      "receber dados do formulário"
    );

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

    // Salvar arquivo temporariamente com timeout
    console.log("Convertendo arquivo para buffer...");
    const bytes = await processWithTimeout(
      file.arrayBuffer(),
      120000, // 2 minutos para converter arquivo
      "converter arquivo para buffer"
    );

    const buffer = Buffer.from(bytes);
    console.log(`Buffer criado: ${buffer.length} bytes`);

    const filename = `${Date.now()}_${file.name}`;
    const filepath = join(uploadDir, filename);
    console.log(`Tentando salvar em: ${filepath}`);

    try {
      await processWithTimeout(
        writeFile(filepath, buffer),
        30000, // 30 segundos para salvar arquivo
        "salvar arquivo no disco"
      );
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

    // Processar PDF com timeout
    console.log("=== PROCESSANDO PDF ===");
    const processor = new PDFProcessor();
    const documentId = Date.now();

    try {
      const { content, chunks, embeddings } = await processWithTimeout(
        processor.processPDF(buffer, documentId),
        300000, // 5 minutos para processar PDF
        "processar PDF"
      );

      console.log(`✓ PDF processado: ${chunks.length} chunks gerados`);
      console.log(`✓ Embeddings gerados: ${embeddings.length}`);

      // Salvar embeddings no Qdrant com retry
      console.log("=== SALVANDO NO QDRANT ===");
      let qdrantSuccess = false;
      let qdrantError: any = null;

      // Tentar até 3 vezes com delay entre tentativas
      for (let attempt = 1; attempt <= 3; attempt++) {
        try {
          await processWithTimeout(
            insertChunks(
              chunks.map((chunk, i) => ({
                id: chunk.id,
                documentId: chunk.metadata.documentId,
                chunkIndex: chunk.metadata.chunkIndex,
                content: chunk.content,
                embedding: embeddings[i]?.embedding || [],
              }))
            ),
            120000, // 2 minutos para salvar no Qdrant
            "salvar no Qdrant"
          );

          console.log("✓ Embeddings salvos no Qdrant com sucesso");
          qdrantSuccess = true;
          break;
        } catch (error) {
          qdrantError = error;
          console.error(
            `✗ Tentativa ${attempt} falhou ao salvar no Qdrant:`,
            error
          );

          if (attempt < 3) {
            console.log(`Aguardando 2s antes da próxima tentativa...`);
            await new Promise((resolve) => setTimeout(resolve, 2000));
          }
        }
      }

      if (!qdrantSuccess) {
        console.error("✗ Todas as tentativas de salvar no Qdrant falharam");
        return NextResponse.json(
          {
            error: "Erro ao salvar embeddings no Qdrant. Verifique a conexão.",
            details: qdrantError?.message || "Erro desconhecido",
          },
          { status: 500 }
        );
      }

      // Salvar no banco de dados
      console.log("=== SALVANDO NO BANCO DE DADOS ===");
      const client = await pool.connect();
      try {
        const result = await processWithTimeout(
          client.query(
            `INSERT INTO documents (filename, original_name, content, chunks, embeddings, file_size) 
             VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
            [
              filename,
              file.name,
              content,
              JSON.stringify(chunks),
              JSON.stringify(embeddings),
              file.size,
            ]
          ),
          60000, // 1 minuto para salvar no banco
          "salvar no banco de dados"
        );

        console.log("✓ Documento salvo com sucesso no banco de dados");

        const totalTime = Date.now() - startTime;
        console.log(`✓ Upload concluído em ${totalTime}ms`);

        return NextResponse.json({
          success: true,
          documentId: result.rows[0].id,
          filename: file.name,
          chunksCount: chunks.length,
          processingTime: totalTime,
          message: "Documento processado e salvo com sucesso",
        });
      } finally {
        client.release();
      }
    } catch (pdfError) {
      console.error("✗ Erro ao processar PDF:", pdfError);
      return NextResponse.json(
        {
          error: "Erro ao processar PDF",
          details:
            pdfError instanceof Error ? pdfError.message : "Erro desconhecido",
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("✗ Erro geral no upload:", error);

    let errorMessage = "Erro ao processar o arquivo";
    let statusCode = 500;

    if (error instanceof Error) {
      if (error.message.includes("Timeout")) {
        errorMessage =
          "Processamento demorou muito. Tente com um arquivo menor.";
        statusCode = 408;
      } else if (error.message.includes("cancelado")) {
        errorMessage = "Upload cancelado pelo usuário";
        statusCode = 499;
      } else {
        errorMessage = error.message;
      }
    }

    return NextResponse.json({ error: errorMessage }, { status: statusCode });
  }
}

export async function GET() {
  try {
    const client = await pool.connect();
    try {
      const result = await client.query(
        "SELECT id, original_name, filename, created_at, file_size FROM documents ORDER BY created_at DESC"
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
