#!/bin/bash

echo "🚀 Configurando CBM-RN Chat..."

# Verificar se o Node.js está instalado
if ! command -v node &> /dev/null; then
    echo "❌ Node.js não está instalado. Por favor, instale o Node.js 18+ primeiro."
    exit 1
fi

# Verificar se o npm está instalado
if ! command -v npm &> /dev/null; then
    echo "❌ npm não está instalado. Por favor, instale o npm primeiro."
    exit 1
fi

echo "📦 Instalando dependências..."
npm install

# Criar diretório de uploads
echo "📁 Criando diretório de uploads..."
mkdir -p uploads

# Verificar se o arquivo .env.local existe
if [ ! -f .env.local ]; then
    echo "📝 Criando arquivo .env.local..."
    cat > .env.local << EOF
# Google Gemini API
GOOGLE_API_KEY=your_google_api_key_here

# PostgreSQL Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=chat_bombeiros
DB_USER=postgres
DB_PASSWORD=password

# Next.js
NEXTAUTH_SECRET=your_nextauth_secret_here
NEXTAUTH_URL=http://localhost:3000
EOF
    echo "⚠️  Por favor, configure suas variáveis de ambiente no arquivo .env.local"
fi

echo "✅ Setup concluído!"
echo ""
echo "📋 Próximos passos:"
echo "1. Configure suas variáveis de ambiente no arquivo .env.local"
echo "2. Configure o banco de dados PostgreSQL"
echo "3. Execute: npm run init-db"
echo "4. Execute: npm run dev"
echo ""
echo "🌐 Acesse http://localhost:3000 após iniciar o projeto" 