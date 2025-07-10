const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);

console.log('=== TESTE DE CONFIGURAÇÃO PARA VPS ===');
console.log('Verificando se tudo está configurado corretamente...\n');

async function testDocker() {
  console.log('1. Verificando Docker e Milvus...');
  try {
    const { stdout } = await execAsync('docker ps --filter "name=milvus" --format "table {{.Names}}\t{{.Status}}"');
    if (stdout.includes('milvus')) {
      console.log('✓ Container do Milvus está rodando');
      return true;
    } else {
      console.log('✗ Container do Milvus não está rodando');
      return false;
    }
  } catch (error) {
    console.log('✗ Erro ao verificar Docker:', error.message);
    return false;
  }
}

async function testPort() {
  console.log('\n2. Verificando porta 19530...');
  try {
    const { stdout } = await execAsync('netstat -an | grep ":19530" | grep LISTEN');
    if (stdout) {
      console.log('✓ Porta 19530 está acessível');
      return true;
    } else {
      console.log('✗ Porta 19530 não está acessível');
      return false;
    }
  } catch (error) {
    console.log('✗ Porta 19530 não está acessível');
    return false;
  }
}

async function testUploadsDir() {
  console.log('\n3. Verificando pasta uploads...');
  const uploadDir = path.join(process.cwd(), 'uploads');
  
  try {
    // Verificar se existe
    await fs.promises.access(uploadDir);
    console.log('✓ Pasta uploads existe');
    
    // Verificar permissões
    const stats = await fs.promises.stat(uploadDir);
    console.log(`✓ Permissões: ${stats.mode.toString(8)}`);
    
    // Testar escrita
    const testFile = path.join(uploadDir, 'test-vps.txt');
    await fs.promises.writeFile(testFile, 'test');
    console.log('✓ Pasta uploads é gravável');
    
    // Limpar arquivo de teste
    await fs.promises.unlink(testFile);
    console.log('✓ Arquivo de teste removido');
    
    return true;
  } catch (error) {
    console.error('✗ Erro com pasta uploads:', error.message);
    return false;
  }
}

async function testPostgreSQL() {
  console.log('\n4. Verificando PostgreSQL...');
  try {
    const { stdout } = await execAsync('pg_isready -h localhost -p 5432');
    if (stdout.includes('accepting connections')) {
      console.log('✓ PostgreSQL está rodando e aceitando conexões');
      return true;
    } else {
      console.log('✗ PostgreSQL não está acessível');
      return false;
    }
  } catch (error) {
    console.log('✗ PostgreSQL não está acessível:', error.message);
    return false;
  }
}

async function testMilvusConnection() {
  console.log('\n5. Testando conexão com Milvus via Node.js...');
  
  // Simular uma conexão básica
  const net = require('net');
  
  return new Promise((resolve) => {
    const socket = new net.Socket();
    const timeout = 10000; // 10 segundos
    
    socket.setTimeout(timeout);
    
    socket.on('connect', () => {
      console.log('✓ Conexão TCP com Milvus estabelecida');
      socket.destroy();
      resolve(true);
    });
    
    socket.on('timeout', () => {
      console.log('✗ Timeout ao conectar com Milvus');
      socket.destroy();
      resolve(false);
    });
    
    socket.on('error', (error) => {
      console.log('✗ Erro ao conectar com Milvus:', error.message);
      socket.destroy();
      resolve(false);
    });
    
    socket.connect(19530, 'localhost');
  });
}

async function runTests() {
  const results = {
    docker: await testDocker(),
    port: await testPort(),
    uploads: await testUploadsDir(),
    postgresql: await testPostgreSQL(),
    milvusConnection: await testMilvusConnection()
  };
  
  console.log('\n=== RESULTADOS DOS TESTES ===');
  console.log(`Docker/Milvus: ${results.docker ? '✓' : '✗'}`);
  console.log(`Porta 19530: ${results.port ? '✓' : '✗'}`);
  console.log(`Pasta uploads: ${results.uploads ? '✓' : '✗'}`);
  console.log(`PostgreSQL: ${results.postgresql ? '✓' : '✗'}`);
  console.log(`Conexão Milvus: ${results.milvusConnection ? '✓' : '✗'}`);
  
  console.log('\n=== RECOMENDAÇÕES ===');
  
  if (!results.docker) {
    console.log('• Inicie o container do Milvus: docker-compose up -d milvus');
  }
  
  if (!results.port) {
    console.log('• Verifique se o Milvus está rodando: docker logs milvus');
    console.log('• Reinicie o container se necessário: docker-compose restart milvus');
  }
  
  if (!results.uploads) {
    console.log('• Crie a pasta uploads: mkdir -p uploads');
    console.log('• Ajuste as permissões: chmod 755 uploads');
  }
  
  if (!results.postgresql) {
    console.log('• Verifique se o PostgreSQL está rodando na porta 5432');
    console.log('• Verifique as configurações de conexão no código');
  }
  
  if (!results.milvusConnection) {
    console.log('• O Milvus pode estar demorando para inicializar');
    console.log('• Aguarde alguns minutos e tente novamente');
    console.log('• Verifique os logs: docker logs milvus');
  }
  
  if (Object.values(results).every(Boolean)) {
    console.log('\n🎉 Todos os testes passaram! A aplicação deve funcionar corretamente.');
  } else {
    console.log('\n⚠️  Alguns testes falharam. Corrija os problemas antes de continuar.');
  }
}

runTests().catch(console.error); 