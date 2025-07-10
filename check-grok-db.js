const { Pool } = require('pg');

const pool = new Pool({
  user: process.env.DB_USER || "zenon",
  host: process.env.DB_HOST || "localhost",
  database: process.env.DB_NAME || "chat_bombeiros",
  password: process.env.DB_PASSWORD || "akpaloha",
  port: parseInt(process.env.DB_PORT || "5432"),
});

async function checkGrokConfig() {
  const client = await pool.connect();
  
  try {
    console.log("🔍 Verificando configuração do Grok no banco de dados...\n");
    
    // Buscar todos os modelos Grok
    const result = await client.query(
      "SELECT id, name, model, is_active, api_key, base_url FROM ai_model_configs WHERE model LIKE 'grok%' ORDER BY id"
    );
    
    console.log("📋 Modelos Grok encontrados:");
    
    if (result.rows.length === 0) {
      console.log("❌ Nenhum modelo Grok encontrado no banco de dados");
      return;
    }
    
    result.rows.forEach(row => {
      const status = row.is_active ? "✅ Ativo" : "❌ Inativo";
      const hasApiKey = row.api_key ? "✅ Configurada" : "❌ Não configurada";
      const hasBaseUrl = row.base_url ? "✅ Configurada" : "⚠️  Usando padrão";
      
      console.log(`\n  📝 ${row.name} (${row.model}):`);
      console.log(`     Status: ${status}`);
      console.log(`     API Key: ${hasApiKey}`);
      console.log(`     Base URL: ${hasBaseUrl}`);
      
      if (row.api_key) {
        console.log(`     API Key: ${row.api_key.substring(0, 10)}...${row.api_key.substring(row.api_key.length - 4)}`);
      }
      
      if (row.base_url) {
        console.log(`     Base URL: ${row.base_url}`);
      }
    });
    
    // Verificar qual modelo está ativo
    const activeResult = await client.query(
      "SELECT id, name, model FROM ai_model_configs WHERE is_active = true"
    );
    
    console.log("\n🎯 Modelo Ativo:");
    if (activeResult.rows.length > 0) {
      const active = activeResult.rows[0];
      console.log(`  ✅ ${active.name} (${active.model})`);
    } else {
      console.log("  ❌ Nenhum modelo ativo");
    }
    
    console.log("\n💡 Recomendações:");
    
    const grok4Model = result.rows.find(row => row.model === 'grok-4');
    if (grok4Model) {
      if (!grok4Model.is_active) {
        console.log("1. Ative o modelo Grok-4 nas configurações");
      }
      if (!grok4Model.api_key) {
        console.log("2. Configure a API key do Grok-4 nas configurações");
      }
    } else {
      console.log("1. Execute 'npm run update-ai-models' para adicionar o Grok-4");
    }
    
    console.log("3. Verifique se a variável GROK_API_KEY está no .env.local");
    console.log("4. Reinicie o servidor após alterações");
    
  } catch (error) {
    console.error("❌ Erro ao verificar configuração:", error);
  } finally {
    client.release();
    await pool.end();
  }
}

checkGrokConfig(); 