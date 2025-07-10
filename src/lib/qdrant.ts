import { QdrantClient } from "@qdrant/js-client-rest";

// Configuração do cliente Qdrant
const QDRANT_URL = process.env.QDRANT_URL || "http://localhost:6333";
const COLLECTION_NAME = "document_chunks";
const VECTOR_DIM = 768; // Dimensão padrão do embedding do Gemini

// Verificar se estamos no lado do servidor
const isServer = typeof window === "undefined";

// Cliente Qdrant - apenas no servidor
export const qdrant = isServer ? new QdrantClient({ url: QDRANT_URL }) : null;

// Função para verificar se o Qdrant está disponível
export async function checkQdrantConnection() {
  if (!qdrant) {
    console.error("Qdrant client não está disponível no lado do cliente");
    return false;
  }

  try {
    console.log("Verificando conexão com Qdrant...");
    console.log(`Tentando conectar em: ${QDRANT_URL}`);

    await qdrant.getCollections();
    console.log("✓ Conexão com Qdrant estabelecida");
    return true;
  } catch (error) {
    console.error("✗ Erro ao conectar com Qdrant:", error);
    return false;
  }
}

export async function ensureCollection() {
  if (!qdrant) {
    throw new Error("Qdrant client não está disponível no lado do cliente");
  }

  try {
    // Verificar conexão primeiro
    const isConnected = await checkQdrantConnection();
    if (!isConnected) {
      throw new Error("Qdrant não está disponível");
    }

    const collections = await qdrant.getCollections();
    const exists = collections.collections.some(
      (c: any) => c.name === COLLECTION_NAME
    );

    if (!exists) {
      console.log("Criando collection:", COLLECTION_NAME);

      await qdrant.createCollection(COLLECTION_NAME, {
        vectors: {
          size: VECTOR_DIM,
          distance: "Cosine",
        },
      });

      console.log("Collection criada com sucesso");
    } else {
      console.log("Collection já existe:", COLLECTION_NAME);
    }
  } catch (error) {
    console.error("Erro ao garantir collection:", error);
    throw error;
  }
}

export async function insertChunks(
  chunks: Array<{
    id: number;
    documentId: number;
    chunkIndex: number;
    content: string;
    embedding: number[];
  }>
) {
  if (!qdrant) {
    throw new Error("Qdrant client não está disponível no lado do cliente");
  }

  try {
    console.log(`Inserindo ${chunks.length} chunks no Qdrant`);

    await ensureCollection();

    // Preparar pontos para inserção
    const points = chunks.map((chunk) => ({
      id: chunk.id,
      vector: chunk.embedding,
      payload: {
        document_id: chunk.documentId,
        chunk_index: chunk.chunkIndex,
        content: chunk.content,
      },
    }));

    // Inserir em lotes
    const batchSize = 100;
    for (let i = 0; i < points.length; i += batchSize) {
      const batch = points.slice(i, i + batchSize);

      await qdrant.upsert(COLLECTION_NAME, {
        points: batch,
      });

      console.log(`Lote ${Math.floor(i / batchSize) + 1} inserido`);
    }

    console.log("Todos os chunks inseridos com sucesso");
  } catch (error) {
    console.error("Erro ao inserir chunks:", error);
    throw error;
  }
}

export async function searchSimilarChunks(embedding: number[], topK = 5) {
  if (!qdrant) {
    throw new Error("Qdrant client não está disponível no lado do cliente");
  }

  try {
    await ensureCollection();

    const results = await qdrant.search(COLLECTION_NAME, {
      vector: embedding,
      limit: topK,
      with_payload: true,
    });

    return results.map((r: any) => ({
      id: r.id,
      documentId: r.payload.document_id,
      chunkIndex: r.payload.chunk_index,
      content: r.payload.content,
      score: r.score,
    }));
  } catch (error) {
    console.error("Erro ao buscar chunks similares:", error);
    throw error;
  }
}
