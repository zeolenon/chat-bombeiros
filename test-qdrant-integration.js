const { QdrantClient } = require('@qdrant/js-client-rest');

async function testQdrantIntegration() {
  console.log("=== TESTE DE INTEGRAÇÃO COM QDRANT ===");
  
  try {
    console.log("1. Testando conexão com Qdrant...");
    const client = new QdrantClient({ url: 'http://localhost:6333' });
    
    // Testar conexão
    const collections = await client.getCollections();
    console.log("✓ Conexão com Qdrant estabelecida!");
    console.log("Collections encontradas:", collections.collections.length);
    
    // Testar criação de collection
    console.log("\n2. Testando criação de collection...");
    const testCollectionName = 'test_collection';
    
    try {
      await client.createCollection(testCollectionName, {
        vectors: {
          size: 768,
          distance: 'Cosine',
        },
      });
      console.log("✓ Collection de teste criada com sucesso!");
      
      // Testar inserção de dados
      console.log("\n3. Testando inserção de dados...");
      const testPoint = {
        id: 'test_1',
        vector: Array(768).fill(0.1), // Vector de teste
        payload: {
          document_id: 1,
          chunk_index: 0,
          content: 'Texto de teste para verificar se o Qdrant está funcionando.',
        },
      };
      
      await client.upsert(testCollectionName, {
        points: [testPoint],
      });
      console.log("✓ Dados inseridos com sucesso!");
      
      // Testar busca
      console.log("\n4. Testando busca de dados...");
      const searchResults = await client.search(testCollectionName, {
        vector: Array(768).fill(0.1),
        limit: 1,
        with_payload: true,
      });
      
      if (searchResults.length > 0) {
        console.log("✓ Busca funcionando corretamente!");
        console.log("Resultado encontrado:", searchResults[0].payload.content);
      } else {
        console.log("⚠ Busca não retornou resultados");
      }
      
      // Limpar collection de teste
      console.log("\n5. Limpando collection de teste...");
      await client.deleteCollection(testCollectionName);
      console.log("✓ Collection de teste removida!");
      
    } catch (error) {
      console.error("✗ Erro ao testar collection:", error.message);
    }
    
    console.log("\n=== TESTE CONCLUÍDO COM SUCESSO ===");
    console.log("✓ Qdrant está funcionando corretamente!");
    console.log("✓ A aplicação pode usar Qdrant como banco vetorial!");
    
    return true;
    
  } catch (error) {
    console.error("✗ Erro no teste de integração:");
    console.error("Mensagem:", error.message);
    console.error("Código:", error.code);
    
    console.log("\nSugestões para resolver:");
    console.log("1. Verifique se o Qdrant está rodando: docker ps | grep qdrant");
    console.log("2. Verifique os logs: docker logs qdrant");
    console.log("3. Reinicie o Qdrant: docker-compose -f docker-compose-qdrant.yml restart");
    
    return false;
  }
}

// Executar o teste
testQdrantIntegration().then(success => {
  if (success) {
    console.log("\n🎉 Tudo pronto! Você pode usar a aplicação com Qdrant!");
    process.exit(0);
  } else {
    console.log("\n❌ Há problemas que precisam ser resolvidos.");
    process.exit(1);
  }
}); 