#!/bin/bash

echo "=== TESTANDO QDRANT COMO ALTERNATIVA AO MILVUS ==="
echo "Qdrant é mais leve e pode funcionar melhor em sistemas com pouca RAM"
echo ""

echo "1. Parando containers atuais..."
docker-compose down

echo ""
echo "2. Iniciando Qdrant..."
docker-compose -f docker-compose-qdrant.yml up -d

echo ""
echo "3. Aguardando 30 segundos para inicialização..."
sleep 30

echo ""
echo "4. Verificando status do container..."
docker ps | grep qdrant

echo ""
echo "5. Verificando uso de memória..."
docker stats --no-stream qdrant

echo ""
echo "6. Verificando logs do Qdrant..."
docker logs qdrant --tail 10

echo ""
echo "7. Testando conexão HTTP..."
if curl -f http://localhost:6333/collections > /dev/null 2>&1; then
    echo "✓ Qdrant está respondendo na porta 6333"
else
    echo "✗ Qdrant não está respondendo na porta 6333"
    echo "Aguardando mais 30 segundos..."
    sleep 30
    if curl -f http://localhost:6333/collections > /dev/null 2>&1; then
        echo "✓ Qdrant está respondendo agora!"
    else
        echo "✗ Qdrant ainda não está respondendo"
    fi
fi

echo ""
echo "8. Testando com Node.js..."
node -e "
const { QdrantClient } = require('@qdrant/js-client-rest');

async function testQdrant() {
  try {
    console.log('Testando conexão com Qdrant...');
    const client = new QdrantClient({ url: 'http://localhost:6333' });
    
    const collections = await client.getCollections();
    console.log('✓ Conexão com Qdrant estabelecida!');
    console.log('Collections encontradas:', collections.collections.length);
    
    return true;
  } catch (error) {
    console.error('✗ Erro ao conectar com Qdrant:', error.message);
    return false;
  }
}

testQdrant();
"

echo ""
echo "=== TESTE CONCLUÍDO ==="
echo ""
echo "Se o Qdrant funcionar, você pode usar esta configuração:"
echo "docker-compose -f docker-compose-qdrant.yml up -d"
echo ""
echo "E atualizar o código para usar Qdrant em vez de Milvus." 