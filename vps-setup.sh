#!/bin/bash

echo "=== CONFIGURAÇÃO PARA VPS ==="
echo "Este script verifica se o Qdrant está rodando e se as conexões estão funcionando"
echo ""

# Verificar se o Docker está rodando
echo "1. Verificando Docker..."
if ! docker info > /dev/null 2>&1; then
    echo "✗ Docker não está rodando. Inicie o Docker primeiro."
    exit 1
else
    echo "✓ Docker está rodando"
fi

# Verificar se o container do Qdrant está rodando
echo ""
echo "2. Verificando container do Qdrant..."
if ! docker ps | grep -q qdrant; then
    echo "✗ Container do Qdrant não está rodando"
    echo "Iniciando container do Qdrant..."
    docker-compose -f docker-compose-qdrant.yml up -d
    sleep 10
else
    echo "✓ Container do Qdrant está rodando"
fi

# Verificar se a porta 6333 está acessível
echo ""
echo "3. Verificando porta 6333..."
if netstat -an | grep -q ":6333.*LISTEN"; then
    echo "✓ Porta 6333 está acessível"
else
    echo "✗ Porta 6333 não está acessível"
    echo "Verificando logs do Qdrant..."
    docker logs qdrant --tail 20
fi

# Verificar se a pasta uploads existe e tem permissões
echo ""
echo "4. Verificando pasta uploads..."
if [ ! -d "uploads" ]; then
    echo "Criando pasta uploads..."
    mkdir -p uploads
    chmod 755 uploads
    echo "✓ Pasta uploads criada"
else
    echo "✓ Pasta uploads já existe"
fi

# Testar se a pasta é gravável
if [ -w "uploads" ]; then
    echo "✓ Pasta uploads é gravável"
else
    echo "✗ Pasta uploads não é gravável"
    echo "Ajustando permissões..."
    chmod 755 uploads
fi

# Verificar se o PostgreSQL está rodando
echo ""
echo "5. Verificando PostgreSQL..."
if pg_isready -h localhost -p 5432 > /dev/null 2>&1; then
    echo "✓ PostgreSQL está rodando"
else
    echo "✗ PostgreSQL não está rodando ou não está acessível"
    echo "Verifique se o PostgreSQL está instalado e rodando na porta 5432"
fi

# Verificar se as dependências do Node.js estão instaladas
echo ""
echo "6. Verificando dependências do Node.js..."
if [ ! -d "node_modules" ]; then
    echo "Instalando dependências..."
    npm install
else
    echo "✓ Dependências já estão instaladas"
fi

# Criar arquivo de configuração para PM2
echo ""
echo "7. Criando configuração para PM2..."
cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'chat-bombeiros',
    script: 'npm',
    args: 'start',
    cwd: './',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 3002,
      QDRANT_URL: 'http://localhost:6333',
      DB_HOST: 'localhost',
      DB_PORT: 5432,
      DB_NAME: 'chat_bombeiros',
      DB_USER: 'zenon',
      DB_PASSWORD: 'akpaloha'
    }
  }]
};
EOF
echo "✓ Configuração do PM2 criada"

echo ""
echo "=== CONFIGURAÇÃO CONCLUÍDA ==="
echo ""
echo "Para iniciar a aplicação com PM2:"
echo "  pm2 start ecosystem.config.js"
echo ""
echo "Para verificar logs:"
echo "  pm2 logs chat-bombeiros"
echo ""
echo "Para parar a aplicação:"
echo "  pm2 stop chat-bombeiros"
echo ""
echo "Para reiniciar:"
echo "  pm2 restart chat-bombeiros" 