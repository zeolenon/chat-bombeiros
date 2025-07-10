#!/bin/bash

echo "=== REINICIANDO MILVUS ==="
echo ""

# 1. Parar containers
echo "1. Parando containers..."
docker-compose down

# 2. Aguardar um pouco
echo "2. Aguardando 5 segundos..."
sleep 5

# 3. Iniciar containers
echo "3. Iniciando containers..."
docker-compose up -d

# 4. Aguardar inicialização
echo "4. Aguardando 60 segundos para o Milvus inicializar completamente..."
sleep 60

# 5. Verificar status
echo "5. Verificando status dos containers..."
docker ps | grep milvus

# 6. Verificar logs
echo ""
echo "6. Últimas linhas dos logs do Milvus:"
docker logs milvus --tail 10

# 7. Testar conexão
echo ""
echo "7. Testando conexão com Node.js..."
node test-milvus.js

echo ""
echo "=== REINICIALIZAÇÃO CONCLUÍDA ===" 