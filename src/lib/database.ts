import { Pool } from "pg";

const pool = new Pool({
  user: process.env.DB_USER || "zenon",
  host: process.env.DB_HOST || "localhost",
  database: process.env.DB_NAME || "chat_bombeiros",
  password: process.env.DB_PASSWORD || "akpaloha",
  port: parseInt(process.env.DB_PORT || "5432"),
});

// Inicializar tabelas
export async function initializeDatabase() {
  const client = await pool.connect();

  try {
    // Tabela de chats
    await client.query(`
      CREATE TABLE IF NOT EXISTS chats (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Tabela de mensagens
    await client.query(`
      CREATE TABLE IF NOT EXISTS messages (
        id SERIAL PRIMARY KEY,
        chat_id INTEGER REFERENCES chats(id) ON DELETE CASCADE,
        role VARCHAR(10) NOT NULL CHECK (role IN ('user', 'assistant')),
        content TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Tabela de documentos
    await client.query(`
      CREATE TABLE IF NOT EXISTS documents (
        id SERIAL PRIMARY KEY,
        filename VARCHAR(255) NOT NULL,
        original_name VARCHAR(255) NOT NULL,
        content TEXT NOT NULL,
        chunks JSONB,
        embeddings JSONB,
        file_size BIGINT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Tabela de configurações de contexto
    await client.query(`
      CREATE TABLE IF NOT EXISTS context_settings (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        prompt_template TEXT NOT NULL,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Inserir configuração padrão
    await client.query(`
      INSERT INTO context_settings (name, description, prompt_template) 
      VALUES (
        'Padrão',
        'Configuração padrão para análise de normas do CBM-RN',
        'Você é um especialista em normas e resoluções do Corpo de Bombeiros Militar do Rio Grande do Norte (CBM-RN). Sua função é analisar, vistoriar e fiscalizar edificações e eventos seguindo rigorosamente as normas estabelecidas. Sempre baseie suas respostas nas normas e resoluções fornecidas, citando especificamente os trechos relevantes. Seja preciso, técnico e fundamentado em suas análises.'
      ) ON CONFLICT DO NOTHING
    `);
  } finally {
    client.release();
  }
}

export default pool;
