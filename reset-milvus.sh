#!/bin/bash

echo "=== RESET COMPLETO DO MILVUS ==="
echo "ATENÇÃO: Isso vai remover todos os dados do Milvus!"
echo ""

read -p "Tem certeza que deseja continuar? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Operação cancelada."
    exit 1
fi

echo ""
echo "1. Parando todos os containers..."
docker-compose down

echo ""
echo "2. Removendo volumes do Milvus..."
docker volume rm chat-bombeiros_milvus_data 2>/dev/null || echo "Volume não encontrado"

echo ""
echo "3. Removendo container do Milvus..."
docker rm -f milvus 2>/dev/null || echo "Container não encontrado"

echo ""
echo "4. Limpando imagens antigas..."
docker image prune -f

echo ""
echo "5. Baixando nova imagem do Milvus..."
docker pull milvusdb/milvus:v2.3.3

echo ""
echo "6. Iniciando Milvus com nova configuração..."
docker-compose up -d

echo ""
echo "7. Aguardando 90 segundos para inicialização completa..."
sleep 90

echo ""
echo "8. Verificando status do container..."
docker ps | grep milvus

echo ""
echo "9. Verificando logs do Milvus..."
echo "Últimas 20 linhas dos logs:"
docker logs milvus --tail 20

echo ""
echo "10. Testando conexão..."
if curl -f http://localhost:9091/healthz > /dev/null 2>&1; then
    echo "✓ Milvus está respondendo na porta 9091"
else
    echo "✗ Milvus ainda não está respondendo"
    echo "Aguardando mais 30 segundos..."
    sleep 30
    if curl -f http://localhost:9091/healthz > /dev/null 2>&1; then
        echo "✓ Milvus está respondendo agora!"
    else
        echo "✗ Milvus ainda não está respondendo"
        echo "Verifique os logs: docker logs milvus"
    fi
fi

echo ""
echo "11. Testando conexão com Node.js..."
node test-milvus.js

echo ""
echo "=== RESET CONCLUÍDO ==="
echo ""
echo "Se o Milvus ainda não estiver funcionando:"
echo "1. Verifique os logs: docker logs milvus"
echo "2. Verifique recursos do sistema: free -h && df -h"
echo "3. Reinicie o Docker: sudo systemctl restart docker" 