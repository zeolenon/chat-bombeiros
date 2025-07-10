const { MilvusClient } = require('@zilliz/milvus2-sdk-node');

async function testMilvusConnection() {
  console.log("=== TESTE DE CONEXÃO COM MILVUS ===");
  
  try {
    console.log("1. Criando cliente Milvus...");
    const client = new MilvusClient('localhost:19530');
    
    console.log("2. Aguardando 5 segundos para o Milvus inicializar...");
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    console.log("3. Tentando conectar com Milvus...");
    const collections = await client.showCollections();
    
    console.log("✓ Conexão com Milvus estabelecida com sucesso!");
    console.log("Collections encontradas:", collections.data.length);
    
    if (collections.data.length > 0) {
      console.log("Collections:", collections.data.map(c => c.name));
    }
    
    return true;
  } catch (error) {
    console.error("✗ Erro ao conectar com Milvus:");
    console.error("Mensagem:", error.message);
    console.error("Código:", error.code);
    console.error("Detalhes:", error.details);
    
    if (error.code === 14) {
      console.error("\nSugestões para resolver:");
      console.error("1. Verifique se o container está rodando: docker ps");
      console.error("2. Reinicie o container: docker-compose restart milvus");
      console.error("3. Aguarde alguns minutos e tente novamente");
      console.error("4. Verifique os logs: docker logs milvus");
    }
    
    return false;
  }
}

// Executar o teste
testMilvusConnection().then(success => {
  if (success) {
    console.log("\n✓ Teste concluído com sucesso!");
    process.exit(0);
  } else {
    console.log("\n✗ Teste falhou!");
    process.exit(1);
  }
}); 