#!/bin/bash

echo "=== TESTANDO CONFIGURAÇÃO ALTERNATIVA DO MILVUS ==="
echo ""

echo "1. Parando containers atuais..."
docker-compose down

echo ""
echo "2. Iniciando com configuração alternativa..."
docker-compose -f docker-compose-simple.yml up -d

echo ""
echo "3. Aguardando 60 segundos para inicialização..."
sleep 60

echo ""
echo "4. Verificando status..."
docker ps | grep milvus

echo ""
echo "5. Verificando logs..."
docker logs milvus --tail 10

echo ""
echo "6. Testando conexão HTTP..."
if curl -f http://localhost:9091/healthz > /dev/null 2>&1; then
    echo "✓ Milvus está respondendo na porta 9091"
else
    echo "✗ Milvus não está respondendo na porta 9091"
fi

echo ""
echo "7. Testando conexão gRPC..."
if netstat -an | grep -q ":19530.*LISTEN"; then
    echo "✓ Porta 19530 está acessível"
else
    echo "✗ Porta 19530 não está acessível"
fi

echo ""
echo "8. Testando com Node.js..."
node test-milvus.js

echo ""
echo "=== TESTE CONCLUÍDO ===" 