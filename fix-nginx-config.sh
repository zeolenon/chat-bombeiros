#!/bin/bash

echo "=== CORREÇÃO DE CONFIGURAÇÃO NGINX PARA UPLOADS GRANDES ==="

# Verificar se o nginx está instalado
if ! command -v nginx &> /dev/null; then
    echo "❌ Nginx não está instalado. Instalando..."
    sudo apt update
    sudo apt install -y nginx
else
    echo "✅ Nginx está instalado"
fi

# Verificar se o nginx está rodando
if systemctl is-active --quiet nginx; then
    echo "✅ Nginx está rodando"
else
    echo "⚠️  Nginx não está rodando. Iniciando..."
    sudo systemctl start nginx
    sudo systemctl enable nginx
fi

# Função para verificar se uma configuração existe
check_config() {
    local config_file="$1"
    local setting="$2"
    
    if grep -q "$setting" "$config_file" 2>/dev/null; then
        echo "✅ $setting encontrado em $config_file"
        grep "$setting" "$config_file"
        return 0
    else
        echo "❌ $setting não encontrado em $config_file"
        return 1
    fi
}

# Função para adicionar configuração se não existir
add_config() {
    local config_file="$1"
    local setting="$2"
    local value="$3"
    
    if ! check_config "$config_file" "$setting"; then
        echo "➕ Adicionando $setting $value em $config_file"
        
        # Fazer backup
        sudo cp "$config_file" "${config_file}.backup.$(date +%Y%m%d_%H%M%S)"
        
        # Adicionar configuração no bloco http
        if grep -q "http {" "$config_file"; then
            sudo sed -i "/http {/a\    $setting $value;" "$config_file"
        else
            # Se não há bloco http, adicionar no início
            sudo sed -i "1i $setting $value;" "$config_file"
        fi
        
        echo "✅ Configuração adicionada"
    fi
}

# Verificar e corrigir configurações principais
echo -e "\n--- Verificando configuração principal ---"
NGINX_CONF="/etc/nginx/nginx.conf"

if [ -f "$NGINX_CONF" ]; then
    echo "📁 Arquivo de configuração: $NGINX_CONF"
    
    # Verificar client_max_body_size
    if ! check_config "$NGINX_CONF" "client_max_body_size"; then
        add_config "$NGINX_CONF" "client_max_body_size" "50M"
    fi
    
    # Verificar client_body_timeout
    if ! check_config "$NGINX_CONF" "client_body_timeout"; then
        add_config "$NGINX_CONF" "client_body_timeout" "300s"
    fi
    
    # Verificar proxy_read_timeout
    if ! check_config "$NGINX_CONF" "proxy_read_timeout"; then
        add_config "$NGINX_CONF" "proxy_read_timeout" "300s"
    fi
    
    # Verificar proxy_send_timeout
    if ! check_config "$NGINX_CONF" "proxy_send_timeout"; then
        add_config "$NGINX_CONF" "proxy_send_timeout" "300s"
    fi
    
else
    echo "❌ Arquivo de configuração não encontrado: $NGINX_CONF"
fi

# Verificar configurações de sites
echo -e "\n--- Verificando configurações de sites ---"
SITES_AVAILABLE="/etc/nginx/sites-available"
SITES_ENABLED="/etc/nginx/sites-enabled"

if [ -d "$SITES_AVAILABLE" ]; then
    for site in "$SITES_AVAILABLE"/*; do
        if [ -f "$site" ]; then
            site_name=$(basename "$site")
            echo "📁 Verificando site: $site_name"
            
            # Verificar se é um proxy para nossa aplicação
            if grep -q "proxy_pass" "$site"; then
                echo "🔍 Site parece ser um proxy reverso"
                
                # Adicionar configurações específicas para proxy
                if ! check_config "$site" "client_max_body_size"; then
                    add_config "$site" "client_max_body_size" "50M"
                fi
                
                if ! check_config "$site" "proxy_read_timeout"; then
                    add_config "$site" "proxy_read_timeout" "300s"
                fi
                
                if ! check_config "$site" "proxy_send_timeout"; then
                    add_config "$site" "proxy_send_timeout" "300s"
                fi
                
                if ! check_config "$site" "proxy_connect_timeout"; then
                    add_config "$site" "proxy_connect_timeout" "300s"
                fi
            fi
        fi
    done
fi

# Verificar configurações em conf.d
echo -e "\n--- Verificando configurações em conf.d ---"
CONF_D="/etc/nginx/conf.d"

if [ -d "$CONF_D" ]; then
    for conf in "$CONF_D"/*.conf; do
        if [ -f "$conf" ]; then
            conf_name=$(basename "$conf")
            echo "📁 Verificando configuração: $conf_name"
            
            # Verificar se é um proxy para nossa aplicação
            if grep -q "proxy_pass" "$conf"; then
                echo "🔍 Configuração parece ser um proxy reverso"
                
                # Adicionar configurações específicas para proxy
                if ! check_config "$conf" "client_max_body_size"; then
                    add_config "$conf" "client_max_body_size" "50M"
                fi
                
                if ! check_config "$conf" "proxy_read_timeout"; then
                    add_config "$conf" "proxy_read_timeout" "300s"
                fi
                
                if ! check_config "$conf" "proxy_send_timeout"; then
                    add_config "$conf" "proxy_send_timeout" "300s"
                fi
                
                if ! check_config "$conf" "proxy_connect_timeout"; then
                    add_config "$conf" "proxy_connect_timeout" "300s"
                fi
            fi
        fi
    done
fi

# Testar configuração
echo -e "\n--- Testando configuração do nginx ---"
if sudo nginx -t; then
    echo "✅ Configuração do nginx é válida"
    
    # Recarregar nginx
    echo "🔄 Recarregando nginx..."
    sudo systemctl reload nginx
    
    if [ $? -eq 0 ]; then
        echo "✅ Nginx recarregado com sucesso"
    else
        echo "❌ Erro ao recarregar nginx"
        echo "Tentando reiniciar..."
        sudo systemctl restart nginx
    fi
else
    echo "❌ Configuração do nginx é inválida"
    echo "Verifique os logs: sudo nginx -t"
    exit 1
fi

echo -e "\n=== CONFIGURAÇÃO CONCLUÍDA ==="
echo "✅ Nginx configurado para uploads de até 50MB"
echo "✅ Timeouts configurados para 300 segundos"
echo ""
echo "🔧 Próximos passos:"
echo "1. Reiniciar a aplicação: pm2 restart chat-bombeiros"
echo "2. Testar upload: node test-upload-size.js"
echo "3. Verificar logs: pm2 logs chat-bombeiros" 