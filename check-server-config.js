#!/usr/bin/env node

const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');

console.log('=== VERIFICAÇÃO DE CONFIGURAÇÃO DO SERVIDOR ===\n');

// Verificar configurações do Node.js
console.log('1. Configurações do Node.js:');
console.log(`   - Versão: ${process.version}`);
console.log(`   - Platform: ${process.platform}`);
console.log(`   - Arquitetura: ${process.arch}`);
console.log(`   - Memória heap: ${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB`);
console.log(`   - Memória total: ${Math.round(process.memoryUsage().heapTotal / 1024 / 1024)}MB`);

// Verificar variáveis de ambiente relacionadas a uploads
console.log('\n2. Variáveis de ambiente:');
const uploadVars = [
  'NODE_ENV',
  'PORT',
  'MAX_FILE_SIZE',
  'UPLOAD_TIMEOUT',
  'BODY_PARSER_LIMIT'
];

uploadVars.forEach(varName => {
  const value = process.env[varName];
  if (value) {
    console.log(`   - ${varName}: ${value}`);
  } else {
    console.log(`   - ${varName}: não definida`);
  }
});

// Verificar se existe configuração de nginx
console.log('\n3. Verificando configurações de proxy:');
const nginxPaths = [
  '/etc/nginx/nginx.conf',
  '/etc/nginx/sites-available/default',
  '/etc/nginx/conf.d/default.conf'
];

nginxPaths.forEach(nginxPath => {
  try {
    if (fs.existsSync(nginxPath)) {
      console.log(`   - ${nginxPath}: existe`);
      const content = fs.readFileSync(nginxPath, 'utf8');
      
      // Procurar por client_max_body_size
      const maxBodySizeMatch = content.match(/client_max_body_size\s+(\d+[kmg]?)/i);
      if (maxBodySizeMatch) {
        console.log(`     → client_max_body_size: ${maxBodySizeMatch[1]}`);
      } else {
        console.log(`     → client_max_body_size: não encontrado`);
      }
      
      // Procurar por proxy_read_timeout
      const proxyTimeoutMatch = content.match(/proxy_read_timeout\s+(\d+)/i);
      if (proxyTimeoutMatch) {
        console.log(`     → proxy_read_timeout: ${proxyTimeoutMatch[1]}s`);
      } else {
        console.log(`     → proxy_read_timeout: não encontrado`);
      }
    } else {
      console.log(`   - ${nginxPath}: não existe`);
    }
  } catch (error) {
    console.log(`   - ${nginxPath}: erro ao ler - ${error.message}`);
  }
});

// Verificar configuração do PM2
console.log('\n4. Verificando configuração do PM2:');
const ecosystemPath = path.join(process.cwd(), 'ecosystem.config.js');
if (fs.existsSync(ecosystemPath)) {
  console.log(`   - ecosystem.config.js: existe`);
  try {
    const ecosystem = require(ecosystemPath);
    if (ecosystem.apps && ecosystem.apps[0]) {
      const app = ecosystem.apps[0];
      console.log(`   - Nome da aplicação: ${app.name}`);
      console.log(`   - Script: ${app.script}`);
      console.log(`   - Instâncias: ${app.instances || 1}`);
      console.log(`   - Porta: ${app.env?.PORT || 'não definida'}`);
    }
  } catch (error) {
    console.log(`   - Erro ao ler ecosystem.config.js: ${error.message}`);
  }
} else {
  console.log(`   - ecosystem.config.js: não existe`);
}

// Verificar pasta uploads
console.log('\n5. Verificando pasta uploads:');
const uploadsPath = path.join(process.cwd(), 'uploads');
if (fs.existsSync(uploadsPath)) {
  console.log(`   - Pasta uploads: existe`);
  try {
    const stats = fs.statSync(uploadsPath);
    console.log(`   - Permissões: ${stats.mode.toString(8)}`);
    console.log(`   - Proprietário: ${stats.uid}`);
    console.log(`   - Grupo: ${stats.gid}`);
  } catch (error) {
    console.log(`   - Erro ao verificar permissões: ${error.message}`);
  }
} else {
  console.log(`   - Pasta uploads: não existe`);
}

// Verificar configuração do Next.js
console.log('\n6. Verificando configuração do Next.js:');
const nextConfigPath = path.join(process.cwd(), 'next.config.js');
if (fs.existsSync(nextConfigPath)) {
  console.log(`   - next.config.js: existe`);
  try {
    const content = fs.readFileSync(nextConfigPath, 'utf8');
    
    // Verificar se há configurações de upload
    if (content.includes('maxBodySize')) {
      console.log(`   - maxBodySize: configurado`);
    } else {
      console.log(`   - maxBodySize: não configurado`);
    }
    
    if (content.includes('uploadTimeout')) {
      console.log(`   - uploadTimeout: configurado`);
    } else {
      console.log(`   - uploadTimeout: não configurado`);
    }
  } catch (error) {
    console.log(`   - Erro ao ler next.config.js: ${error.message}`);
  }
} else {
  console.log(`   - next.config.js: não existe`);
}

console.log('\n=== FIM DA VERIFICAÇÃO ===');
console.log('\nRecomendações:');
console.log('1. Se estiver usando nginx, adicione: client_max_body_size 50M;');
console.log('2. Se estiver usando PM2, reinicie a aplicação após mudanças');
console.log('3. Verifique se não há proxy reverso limitando o tamanho');
console.log('4. Considere aumentar o timeout do servidor se necessário'); 