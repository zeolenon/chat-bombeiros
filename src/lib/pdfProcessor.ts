import pdf from "pdf-parse";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";

export interface DocumentChunk {
  id: number;
  content: string;
  metadata: {
    documentId: number;
    chunkIndex: number;
    startChar: number;
    endChar: number;
  };
}

export interface DocumentEmbedding {
  id: number;
  embedding: number[];
  metadata: {
    documentId: number;
    chunkIndex: number;
  };
}

export class PDFProcessor {
  private embeddings: GoogleGenerativeAIEmbeddings;

  constructor() {
    this.embeddings = new GoogleGenerativeAIEmbeddings({
      modelName: "embedding-001",
      apiKey: process.env.GOOGLE_API_KEY!,
    });
  }

  async extractTextFromPDF(buffer: Buffer): Promise<string> {
    try {
      const data = await pdf(buffer);
      return data.text;
    } catch (error) {
      throw new Error(`Erro ao extrair texto do PDF: ${error}`);
    }
  }

  async createChunks(
    text: string,
    documentId: number
  ): Promise<DocumentChunk[]> {
    const splitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1000,
      chunkOverlap: 200,
      separators: ["\n\n", "\n", ". ", " ", ""],
    });

    const chunks = await splitter.splitText(text);

    return chunks.map((chunk, index) => ({
      id: documentId * 1000 + index,
      content: chunk,
      metadata: {
        documentId,
        chunkIndex: index,
        startChar: text.indexOf(chunk),
        endChar: text.indexOf(chunk) + chunk.length,
      },
    }));
  }

  async createEmbeddings(
    chunks: DocumentChunk[]
  ): Promise<DocumentEmbedding[]> {
    const embeddings = await this.embeddings.embedDocuments(
      chunks.map((chunk) => chunk.content)
    );

    return embeddings.map((embedding, index) => ({
      id: chunks[index].id,
      embedding,
      metadata: {
        documentId: chunks[index].metadata.documentId,
        chunkIndex: chunks[index].metadata.chunkIndex,
      },
    }));
  }

  async processPDF(
    buffer: Buffer,
    documentId: number
  ): Promise<{
    content: string;
    chunks: DocumentChunk[];
    embeddings: DocumentEmbedding[];
  }> {
    const text = await this.extractTextFromPDF(buffer);
    const chunks = await this.createChunks(text, documentId);
    const embeddings = await this.createEmbeddings(chunks);

    return {
      content: text,
      chunks,
      embeddings,
    };
  }
}
