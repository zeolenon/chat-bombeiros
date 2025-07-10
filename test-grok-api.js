require('dotenv').config({ path: '.env.local' });

const GROK_API_KEY = process.env.GROK_API_KEY;
const GROK_BASE_URL = process.env.GROK_BASE_URL || "https://api.x.ai";

console.log("🧪 Testando API do Grok...\n");

if (!GROK_API_KEY) {
  console.log("❌ GROK_API_KEY não encontrada no .env.local");
  console.log("   Adicione: GROK_API_KEY=sua_api_key_aqui");
  process.exit(1);
}

console.log("📋 Configuração:");
console.log(`  API Key: ${GROK_API_KEY.substring(0, 10)}...${GROK_API_KEY.substring(GROK_API_KEY.length - 4)}`);
console.log(`  Base URL: ${GROK_BASE_URL}`);

async function testGrokAPI() {
  try {
    const testMessage = "Olá, como você está?";
    
    console.log("\n🔍 Testando diferentes endpoints...");
    
    const endpoints = [
      "/v1/chat/completions",
      "/chat/completions", 
      "/v1/completions",
      "/completions"
    ];
    
    for (const endpoint of endpoints) {
      console.log(`\n📡 Testando: ${GROK_BASE_URL}${endpoint}`);
      
      try {
        const response = await fetch(`${GROK_BASE_URL}${endpoint}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${GROK_API_KEY}`,
          },
          body: JSON.stringify({
            model: "grok-beta",
            messages: [
              {
                role: "user",
                content: testMessage,
              },
            ],
            max_tokens: 100,
            temperature: 0.7,
          }),
        });
        
        console.log(`  Status: ${response.status}`);
        console.log(`  Headers: ${Object.fromEntries(response.headers.entries())}`);
        
        if (response.ok) {
          const data = await response.json();
          console.log(`  ✅ Sucesso! Resposta: ${data.choices?.[0]?.message?.content || "Sem conteúdo"}`);
          console.log(`  ✅ Endpoint correto encontrado: ${endpoint}`);
          return endpoint;
        } else {
          const errorText = await response.text();
          console.log(`  ❌ Erro: ${errorText}`);
        }
      } catch (error) {
        console.log(`  ❌ Erro de rede: ${error.message}`);
      }
    }
    
    console.log("\n❌ Nenhum endpoint funcionou. Verifique:");
    console.log("1. A API key está correta?");
    console.log("2. A URL base está correta?");
    console.log("3. O modelo 'grok-beta' existe?");
    console.log("4. A conta tem acesso ao Grok?");
    
  } catch (error) {
    console.error("❌ Erro geral:", error);
  }
}

testGrokAPI(); 