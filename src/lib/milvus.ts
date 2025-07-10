import { MilvusClient, DataType } from "@zilliz/milvus2-sdk-node";

// Para VPS: Milvus rodando no Docker, Node.js na máquina host
const MILVUS_ADDRESS = process.env.MILVUS_ADDRESS || "localhost:19530";
const COLLECTION_NAME = "document_chunks";
const VECTOR_DIM = 768; // Dimensão padrão do embedding do Gemini (ajuste se necessário)

// Configuração do cliente Milvus
export const milvus = new MilvusClient(MILVUS_ADDRESS);

// Função para verificar se o Milvus está disponível
export async function checkMilvusConnection() {
  try {
    console.log("Verificando conexão com Milvus...");
    console.log(`Tentando conectar em: ${MILVUS_ADDRESS}`);

    // Aguardar um pouco antes de tentar conectar
    await new Promise((resolve) => setTimeout(resolve, 2000));

    await milvus.showCollections();
    console.log("✓ Conexão com Milvus estabelecida");
    return true;
  } catch (error) {
    console.error("✗ Erro ao conectar com Milvus:", error);

    // Verificar se é um erro de deadline
    if (error && typeof error === "object" && "code" in error) {
      const errorCode = (error as any).code;
      if (errorCode === 4) {
        console.error(
          "✗ Erro DEADLINE_EXCEEDED: Milvus não respondeu no tempo esperado"
        );
        console.error(
          "  - Verifique se o container do Milvus está rodando: docker ps"
        );
        console.error(
          "  - Verifique se a porta 19530 está acessível: netstat -an | grep 19530"
        );
        console.error("  - Verifique os logs do container: docker logs milvus");
        console.error(
          "  - Reinicie o container se necessário: docker-compose restart milvus"
        );
      } else if (errorCode === 14) {
        console.error("✗ Erro UNAVAILABLE: Milvus não está disponível");
        console.error(
          "  - O container do Milvus pode não estar inicializado completamente"
        );
        console.error("  - Aguarde alguns minutos e tente novamente");
        console.error("  - Verifique os logs: docker logs milvus");
      }
    }

    return false;
  }
}

export async function ensureCollection() {
  try {
    // Verificar conexão primeiro
    const isConnected = await checkMilvusConnection();
    if (!isConnected) {
      throw new Error("Milvus não está disponível");
    }

    const collections = await milvus.showCollections();
    const exists = collections.data.some(
      (c: any) => c.name === COLLECTION_NAME
    );

    if (!exists) {
      console.log("Criando collection:", COLLECTION_NAME);

      await milvus.createCollection({
        collection_name: COLLECTION_NAME,
        fields: [
          {
            name: "id",
            description: "ID do chunk",
            data_type: DataType.VarChar,
            is_primary_key: true,
            max_length: 64,
          },
          { name: "document_id", data_type: DataType.Int64 },
          { name: "chunk_index", data_type: DataType.Int64 },
          { name: "content", data_type: DataType.VarChar, max_length: 2048 },
          {
            name: "embedding",
            data_type: DataType.FloatVector,
            type_params: { dim: VECTOR_DIM },
          },
        ],
      });

      console.log("Criando índice para collection:", COLLECTION_NAME);

      await milvus.createIndex({
        collection_name: COLLECTION_NAME,
        field_name: "embedding",
        index_name: "embedding_idx",
        index_type: "IVF_FLAT",
        metric_type: "L2",
        params: { nlist: 128 },
      });

      console.log("Carregando collection:", COLLECTION_NAME);

      await milvus.loadCollectionSync({ collection_name: COLLECTION_NAME });

      console.log("Collection criada e carregada com sucesso");
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
    id: string;
    documentId: number;
    chunkIndex: number;
    content: string;
    embedding: number[];
  }>
) {
  try {
    console.log(`Inserindo ${chunks.length} chunks no Milvus`);

    await ensureCollection();

    // Dividir em lotes menores se necessário
    const batchSize = 100;
    for (let i = 0; i < chunks.length; i += batchSize) {
      const batch = chunks.slice(i, i + batchSize);

      await milvus.insert({
        collection_name: COLLECTION_NAME,
        fields_data: batch.map((chunk) => ({
          id: chunk.id,
          document_id: chunk.documentId,
          chunk_index: chunk.chunkIndex,
          content: chunk.content,
          embedding: chunk.embedding,
        })),
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
  try {
    await ensureCollection();

    const results = await milvus.search({
      collection_name: COLLECTION_NAME,
      vector: [embedding],
      limit: topK,
      output_fields: ["id", "document_id", "chunk_index", "content"],
      search_params: {
        anns_field: "embedding",
        metric_type: "L2",
        params: JSON.stringify({ nprobe: 16 }),
      },
    });

    return results.results.map((r: any) => ({
      id: r.id,
      documentId: r.document_id,
      chunkIndex: r.chunk_index,
      content: r.content,
      score: r.score,
    }));
  } catch (error) {
    console.error("Erro ao buscar chunks similares:", error);
    throw error;
  }
}
