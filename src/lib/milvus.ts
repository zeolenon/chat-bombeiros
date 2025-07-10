import { MilvusClient, DataType } from "@zilliz/milvus2-sdk-node";

const MILVUS_ADDRESS = process.env.MILVUS_ADDRESS || "localhost:19530";
const COLLECTION_NAME = "document_chunks";
const VECTOR_DIM = 768; // Dimensão padrão do embedding do Gemini (ajuste se necessário)

export const milvus = new MilvusClient(MILVUS_ADDRESS);

export async function ensureCollection() {
  const collections = await milvus.showCollections();
  const exists = collections.data.some((c: any) => c.name === COLLECTION_NAME);
  if (!exists) {
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
    await milvus.createIndex({
      collection_name: COLLECTION_NAME,
      field_name: "embedding",
      index_name: "embedding_idx",
      index_type: "IVF_FLAT",
      metric_type: "L2",
      params: { nlist: 128 },
    });
    await milvus.loadCollectionSync({ collection_name: COLLECTION_NAME });
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
  await ensureCollection();
  await milvus.insert({
    collection_name: COLLECTION_NAME,
    fields_data: chunks.map((chunk) => ({
      id: chunk.id,
      document_id: chunk.documentId,
      chunk_index: chunk.chunkIndex,
      content: chunk.content,
      embedding: chunk.embedding,
    })),
  });
}

export async function searchSimilarChunks(embedding: number[], topK = 5) {
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
}
