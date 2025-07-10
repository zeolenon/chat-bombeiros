#!/bin/bash

echo "=== RESOLUÇÃO DO PROBLEMA DE UPLOAD DE ARQUIVOS GRANDES ==="
echo "Este script irá verificar e corrigir todas as configurações necessárias"
echo ""

# Função para verificar se estamos no VPS
check_vps() {
    if [ -f "/etc/os-release" ]; then
        echo "✅ Executando em ambiente Linux (VPS)"
        return 0
    else
        echo "⚠️  Não parece ser um ambiente Linux. Alguns comandos podem falhar."
        return 1
    fi
}

# Função para verificar se o PM2 está instalado
check_pm2() {
    if command -v pm2 &> /dev/null; then
        echo "✅ PM2 está instalado"
        return 0
    else
        echo "❌ PM2 não está instalado"
        echo "Instalando PM2..."
        npm install -g pm2
        return $?
    fi
}

# Função para verificar se a aplicação está rodando
check_app() {
    if pm2 list | grep -q "chat-bombeiros"; then
        echo "✅ Aplicação está rodando no PM2"
        return 0
    else
        echo "❌ Aplicação não está rodando no PM2"
        return 1
    fi
}

# Função para reiniciar a aplicação
restart_app() {
    echo "🔄 Reiniciando aplicação..."
    pm2 restart chat-bombeiros
    
    if [ $? -eq 0 ]; then
        echo "✅ Aplicação reiniciada com sucesso"
        return 0
    else
        echo "❌ Erro ao reiniciar aplicação"
        return 1
    fi
}

# Função para verificar logs
check_logs() {
    echo "📋 Últimos logs da aplicação:"
    pm2 logs chat-bombeiros --lines 10
}

# Função para testar upload
test_upload() {
    echo "🧪 Testando upload de arquivo pequeno..."
    
    # Criar arquivo de teste pequeno
    echo "test" > test-small.txt
    
    # Testar upload via curl
    response=$(curl -s -w "%{http_code}" -X POST \
        -F "file=@test-small.txt" \
        https://at.zenon.ninja/api/upload)
    
    http_code="${response: -3}"
    body="${response%???}"
    
    echo "Status: $http_code"
    
    if [ "$http_code" = "200" ]; then
        echo "✅ Upload de teste funcionou"
        rm -f test-small.txt
        return 0
    else
        echo "❌ Upload de teste falhou: $body"
        rm -f test-small.txt
        return 1
    fi
}

# Função principal
main() {
    echo "🔍 Verificando ambiente..."
    check_vps
    
    echo -e "\n🔧 Verificando dependências..."
    check_pm2
    check_app
    
    echo -e "\n📋 Verificando configuração atual..."
    node check-server-config.js
    
    echo -e "\n🔧 Corrigindo configuração do nginx..."
    ./fix-nginx-config.sh
    
    echo -e "\n🔄 Reiniciando aplicação..."
    restart_app
    
    echo -e "\n⏳ Aguardando aplicação inicializar..."
    sleep 10
    
    echo -e "\n🧪 Testando upload..."
    test_upload
    
    echo -e "\n📋 Verificando logs..."
    check_logs
    
    echo -e "\n=== RESUMO ==="
    echo "✅ Configurações corrigidas:"
    echo "   - Nginx configurado para 50MB"
    echo "   - Timeouts aumentados para 300s"
    echo "   - Aplicação reiniciada"
    echo ""
    echo "🔧 Para testar uploads grandes:"
    echo "   node test-upload-size.js"
    echo ""
    echo "📋 Para ver logs em tempo real:"
    echo "   pm2 logs chat-bombeiros -f"
    echo ""
    echo "⚠️  Se ainda houver problemas:"
    echo "   1. Verifique se há proxy reverso adicional"
    echo "   2. Verifique configurações do provedor de hospedagem"
    echo "   3. Considere usar upload em chunks para arquivos muito grandes"
}

# Executar função principal
main "$@" 