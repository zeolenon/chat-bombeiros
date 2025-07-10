#!/bin/bash

echo "=== TESTANDO CONFIGURAÇÃO MÍNIMA DO MILVUS ==="
echo "Sistema detectado: 3.8GB RAM"
echo ""

echo "1. Parando containers atuais..."
docker-compose down

echo ""
echo "2. Limpando recursos do sistema..."
sudo sync && sudo echo 3 > /proc/sys/vm/drop_caches 2>/dev/null || echo "Não foi possível limpar cache"

echo ""
echo "3. Verificando recursos disponíveis..."
echo "Memória disponível:"
free -h
echo ""
echo "Espaço em disco:"
df -h /

echo ""
echo "4. Iniciando Milvus com configuração mínima..."
docker-compose -f docker-compose-minimal.yml up -d

echo ""
echo "5. Aguardando 120 segundos para inicialização completa..."
for i in {1..12}; do
    echo "Aguardando... ($i/12)"
    sleep 10
done

echo ""
echo "6. Verificando status do container..."
docker ps | grep milvus

echo ""
echo "7. Verificando uso de memória do container..."
docker stats --no-stream milvus

echo ""
echo "8. Verificando logs do Milvus..."
echo "Últimas 15 linhas dos logs:"
docker logs milvus --tail 15

echo ""
echo "9. Testando conexão HTTP..."
if curl -f http://localhost:9091/healthz > /dev/null 2>&1; then
    echo "✓ Milvus está respondendo na porta 9091"
else
    echo "✗ Milvus não está respondendo na porta 9091"
    echo "Aguardando mais 30 segundos..."
    sleep 30
    if curl -f http://localhost:9091/healthz > /dev/null 2>&1; then
        echo "✓ Milvus está respondendo agora!"
    else
        echo "✗ Milvus ainda não está respondendo"
    fi
fi

echo ""
echo "10. Testando conexão gRPC..."
if netstat -an | grep -q ":19530.*LISTEN"; then
    echo "✓ Porta 19530 está acessível"
else
    echo "✗ Porta 19530 não está acessível"
fi

echo ""
echo "11. Testando com Node.js..."
node test-milvus.js

echo ""
echo "=== TESTE CONCLUÍDO ==="
echo ""
echo "Se o Milvus funcionar, você pode usar esta configuração:"
echo "docker-compose -f docker-compose-minimal.yml up -d" 