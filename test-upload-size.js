#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const FormData = require('form-data');
const fetch = require('node-fetch');

// Configurações
const BASE_URL = 'https://at.zenon.ninja';
const UPLOAD_ENDPOINT = `${BASE_URL}/api/upload`;

// Função para criar arquivo de teste
function createTestFile(sizeInMB, filename) {
  const sizeInBytes = sizeInMB * 1024 * 1024;
  const buffer = Buffer.alloc(sizeInBytes);
  
  // Preencher com dados aleatórios
  for (let i = 0; i < buffer.length; i++) {
    buffer[i] = Math.floor(Math.random() * 256);
  }
  
  const filepath = path.join(process.cwd(), filename);
  fs.writeFileSync(filepath, buffer);
  console.log(`✓ Arquivo de teste criado: ${filename} (${sizeInMB}MB)`);
  return filepath;
}

// Função para testar upload
async function testUpload(filepath, expectedSize) {
  console.log(`\n--- Testando upload de ${expectedSize}MB ---`);
  
  try {
    const form = new FormData();
    form.append('file', fs.createReadStream(filepath));
    
    const startTime = Date.now();
    
    const response = await fetch(UPLOAD_ENDPOINT, {
      method: 'POST',
      body: form,
      headers: {
        ...form.getHeaders(),
      },
      timeout: 300000, // 5 minutos
    });
    
    const endTime = Date.now();
    const duration = (endTime - startTime) / 1000;
    
    console.log(`Status: ${response.status}`);
    console.log(`Duração: ${duration.toFixed(2)}s`);
    
    if (response.ok) {
      const result = await response.json();
      console.log('✓ Upload bem-sucedido!');
      console.log(`Resposta: ${JSON.stringify(result, null, 2)}`);
      return true;
    } else {
      const errorText = await response.text();
      console.log(`✗ Upload falhou: ${response.status}`);
      console.log(`Erro: ${errorText}`);
      return false;
    }
  } catch (error) {
    console.log(`✗ Erro na requisição: ${error.message}`);
    return false;
  }
}

// Função principal
async function runTests() {
  console.log('=== TESTE DE UPLOAD DE ARQUIVOS GRANDES ===\n');
  
  const testSizes = [1, 2, 3, 4, 5, 10, 20, 30, 40, 50];
  const results = [];
  
  for (const size of testSizes) {
    const filename = `test-${size}mb.pdf`;
    const filepath = createTestFile(size, filename);
    
    const success = await testUpload(filepath, size);
    results.push({ size, success });
    
    // Limpar arquivo de teste
    try {
      fs.unlinkSync(filepath);
    } catch (error) {
      console.log(`Aviso: Não foi possível deletar ${filename}`);
    }
    
    // Aguardar um pouco entre testes
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  // Relatório final
  console.log('\n=== RELATÓRIO FINAL ===');
  console.log('Tamanho | Status');
  console.log('--------|--------');
  
  let maxWorkingSize = 0;
  for (const result of results) {
    const status = result.success ? '✓ OK' : '✗ FALHOU';
    console.log(`${result.size.toString().padStart(6)}MB | ${status}`);
    
    if (result.success) {
      maxWorkingSize = result.size;
    }
  }
  
  console.log(`\nTamanho máximo que funciona: ${maxWorkingSize}MB`);
  
  if (maxWorkingSize < 50) {
    console.log('\n⚠️  PROBLEMA IDENTIFICADO:');
    console.log(`O upload falha para arquivos maiores que ${maxWorkingSize}MB.`);
    console.log('Possíveis causas:');
    console.log('1. Limitação no nginx (client_max_body_size)');
    console.log('2. Limitação no proxy reverso');
    console.log('3. Configuração incorreta do Next.js');
    console.log('4. Timeout muito baixo');
    
    console.log('\n🔧 SOLUÇÕES:');
    console.log('1. Verificar configuração do nginx:');
    console.log('   sudo nano /etc/nginx/nginx.conf');
    console.log('   Adicionar: client_max_body_size 50M;');
    console.log('   sudo systemctl reload nginx');
    
    console.log('\n2. Reiniciar a aplicação:');
    console.log('   pm2 restart chat-bombeiros');
    
    console.log('\n3. Verificar logs:');
    console.log('   pm2 logs chat-bombeiros');
  } else {
    console.log('\n✅ TUDO FUNCIONANDO!');
    console.log('Uploads de até 50MB estão funcionando corretamente.');
  }
}

// Executar testes
runTests().catch(console.error); 