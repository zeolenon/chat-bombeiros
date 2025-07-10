require('dotenv').config({ path: '.env.local' });

console.log("🔍 Verificando configuração do Grok...\n");

// Verificar variáveis de ambiente
const grokApiKey = process.env.GROK_API_KEY;
const grokBaseUrl = process.env.GROK_BASE_URL;

console.log("📋 Variáveis de Ambiente:");
console.log(`  GROK_API_KEY: ${grokApiKey ? "✅ Configurada" : "❌ Não configurada"}`);
console.log(`  GROK_BASE_URL: ${grokBaseUrl ? "✅ Configurada" : "⚠️  Usando padrão (https://api.x.ai/v1)"}`);

if (grokApiKey) {
  console.log(`  API Key: ${grokApiKey.substring(0, 10)}...${grokApiKey.substring(grokApiKey.length - 4)}`);
}

console.log("\n📝 Instruções:");

if (!grokApiKey) {
  console.log("❌ GROK_API_KEY não encontrada no .env.local");
  console.log("   Adicione ao seu .env.local:");
  console.log("   GROK_API_KEY=sua_api_key_aqui");
  console.log("   GROK_BASE_URL=https://api.x.ai/v1");
} else {
  console.log("✅ Configuração parece estar correta!");
  console.log("   Teste o chat com o modelo Grok ativo");
}

console.log("\n🔧 Alternativas:");
console.log("1. Configure via interface: Configurações > Modelos de IA > Editar Grok-4");
console.log("2. Use variáveis de ambiente no .env.local");
console.log("3. Reinicie o servidor após alterar as variáveis de ambiente"); 