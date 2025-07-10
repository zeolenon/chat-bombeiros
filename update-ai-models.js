const { Pool } = require('pg');

const pool = new Pool({
  user: process.env.DB_USER || "zenon",
  host: process.env.DB_HOST || "localhost",
  database: process.env.DB_NAME || "chat_bombeiros",
  password: process.env.DB_PASSWORD || "akpaloha",
  port: parseInt(process.env.DB_PORT || "5432"),
});

async function updateAIModels() {
  const client = await pool.connect();
  
  try {
    console.log("Adicionando novos modelos Grok...");
    
    // Adicionar novos modelos Grok
    await client.query(`
      INSERT INTO ai_model_configs (name, provider, model, is_active) 
      VALUES 
        ('Grok-4', 'xAI', 'grok-4', false),
        ('Grok-1', 'xAI', 'grok-1', false),
        ('Grok-2', 'xAI', 'grok-2', false)
      ON CONFLICT (model) DO NOTHING
    `);
    
    console.log("✅ Novos modelos Grok adicionados com sucesso!");
    
    // Listar todos os modelos disponíveis
    const result = await client.query("SELECT name, model, is_active FROM ai_model_configs ORDER BY id");
    console.log("\n📋 Modelos disponíveis:");
    result.rows.forEach(row => {
      const status = row.is_active ? "✅ Ativo" : "❌ Inativo";
      console.log(`  - ${row.name} (${row.model}): ${status}`);
    });
    
  } catch (error) {
    console.error("❌ Erro ao atualizar modelos:", error);
  } finally {
    client.release();
    await pool.end();
  }
}

updateAIModels(); 