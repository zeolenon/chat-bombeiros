#!/bin/bash

echo "=== DIAGNÓSTICO E CORREÇÃO DO MILVUS ==="
echo ""

# 1. Verificar se o Docker está rodando
echo "1. Verificando Docker..."
if ! docker info > /dev/null 2>&1; then
    echo "✗ Docker não está rodando. Inicie o Docker primeiro."
    exit 1
else
    echo "✓ Docker está rodando"
fi

# 2. Verificar containers do Milvus
echo ""
echo "2. Verificando containers do Milvus..."
if docker ps | grep -q milvus; then
    echo "✓ Container do Milvus está rodando"
    echo "Detalhes do container:"
    docker ps | grep milvus
else
    echo "✗ Container do Milvus não está rodando"
    echo "Iniciando containers do Milvus..."
    docker-compose up -d
    echo "Aguardando 30 segundos para o Milvus inicializar..."
    sleep 30
fi

# 3. Verificar logs do Milvus
echo ""
echo "3. Verificando logs do Milvus..."
echo "Últimas 20 linhas dos logs:"
docker logs milvus --tail 20

# 4. Verificar se a porta 19530 está acessível
echo ""
echo "4. Verificando porta 19530..."
if netstat -an | grep -q ":19530.*LISTEN"; then
    echo "✓ Porta 19530 está acessível"
else
    echo "✗ Porta 19530 não está acessível"
    echo "Tentando reiniciar o container..."
    docker-compose restart milvus
    echo "Aguardando 30 segundos..."
    sleep 30
fi

# 5. Testar conexão com Milvus
echo ""
echo "5. Testando conexão com Milvus..."
if curl -f http://localhost:9091/healthz > /dev/null 2>&1; then
    echo "✓ Milvus está respondendo na porta 9091"
else
    echo "✗ Milvus não está respondendo na porta 9091"
fi

# 6. Verificar variáveis de ambiente
echo ""
echo "6. Verificando variáveis de ambiente..."
echo "MILVUS_ADDRESS: ${MILVUS_ADDRESS:-localhost:19530}"
echo "DB_HOST: ${DB_HOST:-localhost}"
echo "DB_PORT: ${DB_PORT:-5432}"

# 7. Testar conexão com Node.js
echo ""
echo "7. Testando conexão com Node.js..."
node -e "
const { MilvusClient } = require('@zilliz/milvus2-sdk-node');

async function testConnection() {
  try {
    const client = new MilvusClient('localhost:19530');
    console.log('Tentando conectar com Milvus...');
    await client.showCollections();
    console.log('✓ Conexão com Milvus estabelecida com sucesso!');
  } catch (error) {
    console.error('✗ Erro ao conectar com Milvus:', error.message);
    console.error('Código do erro:', error.code);
  }
}

testConnection();
"

echo ""
echo "=== DIAGNÓSTICO CONCLUÍDO ==="
echo ""
echo "Se ainda houver problemas:"
echo "1. Reinicie o Docker: sudo systemctl restart docker"
echo "2. Remova e recrie os containers: docker-compose down && docker-compose up -d"
echo "3. Verifique se há conflitos de porta: sudo netstat -tlnp | grep 19530"
echo "4. Verifique os logs completos: docker logs milvus" 