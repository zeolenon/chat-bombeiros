# Solução para Problemas de Upload e Milvus

## Problemas Identificados

### 1. Erro 413 (Request Entity Too Large)

**Problema**: O arquivo PDF é muito grande para o limite padrão do Next.js.

**Solução Aplicada**:

- Configurado `next.config.js` para aceitar arquivos até 50MB
- Adicionado verificação de tamanho no código (máximo 50MB)
- Configurado `bodyParser: false` na rota de upload

### 2. Erro de Conexão com Milvus (UNAVAILABLE)

**Problema**: O Milvus não está respondendo corretamente na porta 19530.

**Soluções Aplicadas**:

- Melhorado tratamento de erros no código
- Criado scripts de diagnóstico e reinicialização
- Adicionado delay antes de tentar conectar
- Criado configurações alternativas do Milvus
- **NOVO**: Criado alternativa usando Qdrant (mais leve)

## Scripts Criados

### 1. `fix-milvus.sh`

Diagnostica problemas de conexão com o Milvus:

```bash
./fix-milvus.sh
```

### 2. `restart-milvus.sh`

Reinicia o Milvus e testa a conexão:

```bash
./restart-milvus.sh
```

### 3. `reset-milvus.sh` ⭐ **NOVO**

Reset completo do Milvus (remove todos os dados):

```bash
./reset-milvus.sh
```

### 4. `test-simple-milvus.sh` ⭐ **NOVO**

Testa configuração alternativa mais simples:

```bash
./test-simple-milvus.sh
```

### 5. `test-minimal-milvus.sh` ⭐ **NOVO**

Testa configuração mínima para sistemas com pouca RAM:

```bash
./test-minimal-milvus.sh
```

### 6. `test-qdrant.sh` ⭐ **NOVO**

Testa Qdrant como alternativa ao Milvus:

```bash
./test-qdrant.sh
```

### 7. `test-milvus.js`

Testa a conexão com o Milvus via Node.js:

```bash
node test-milvus.js
```

## Passos para Resolver

### ⚠️ **SISTEMA COM POUCA RAM (3.8GB)**

Seu sistema tem apenas 3.8GB de RAM, o que pode ser insuficiente para o Milvus.

### Opção 1: Qdrant (Recomendado para seu sistema)

Qdrant é mais leve e pode funcionar melhor com pouca RAM:

```bash
./test-qdrant.sh
```

### Opção 2: Milvus Configuração Mínima

Se preferir continuar com Milvus:

```bash
./test-minimal-milvus.sh
```

### Opção 3: Reset Completo do Milvus

Para problemas sérios com Milvus:

```bash
./reset-milvus.sh
```

### Opção 4: Configuração Alternativa

Para problemas menores:

```bash
./test-simple-milvus.sh
```

### Passo 2: Verificar se a aplicação está funcionando

```bash
npm run dev
```

### Passo 3: Testar upload de arquivo pequeno

Tente fazer upload de um PDF pequeno (< 1MB) primeiro.

## Configurações Alternativas

### docker-compose.yml (Atualizada)

- Versão do Milvus: v2.3.3
- Limite de memória: 4GB
- Restart automático
- Healthcheck melhorado

### docker-compose-simple.yml (Nova)

- Versão do Milvus: v2.2.11 (mais estável)
- Configuração mais simples
- Menos recursos necessários

### docker-compose-minimal.yml (Nova) ⭐

- Versão do Milvus: v2.2.11
- Limite de memória: 1GB
- Configuração otimizada para pouca RAM

### docker-compose-qdrant.yml (Nova) ⭐

- Qdrant como alternativa ao Milvus
- Limite de memória: 512MB
- Mais leve e estável

## Verificações Importantes

1. **Tamanho do arquivo**: Certifique-se de que o PDF não excede 50MB
2. **Conexão com Milvus/Qdrant**: Execute os scripts de teste
3. **Logs**: Monitore os logs da aplicação
4. **Portas**: Verifique se as portas estão acessíveis
5. **Recursos**: Verifique se há memória suficiente disponível

## Comandos Úteis

```bash
# Verificar status do Docker
docker ps

# Verificar logs
docker logs milvus
docker logs qdrant

# Testar conexões
node test-milvus.js

# Configurações específicas
./test-minimal-milvus.sh  # Para pouca RAM
./test-qdrant.sh          # Alternativa mais leve

# Verificar portas
netstat -an | grep 19530  # Milvus
netstat -an | grep 6333   # Qdrant

# Verificar recursos do sistema
free -h
df -h
```

## Troubleshooting

### Se o Milvus não inicializar:

1. Verifique se há memória suficiente: `free -h`
2. Verifique se há espaço em disco: `df -h`
3. Reinicie o Docker: `sudo systemctl restart docker`
4. **Tente Qdrant**: `./test-qdrant.sh` (recomendado para seu sistema)

### Se ainda houver problemas de conexão:

1. Verifique os logs completos: `docker logs milvus`
2. Verifique se não há conflitos de porta
3. **Use Qdrant**: É mais leve e estável para sistemas com pouca RAM

## Migração para Qdrant

Se decidir usar Qdrant:

1. Execute: `./test-qdrant.sh`
2. Se funcionar, atualize o código para usar Qdrant
3. O arquivo `src/lib/qdrant.ts` já está criado
4. Atualize as importações no código para usar Qdrant em vez de Milvus

## Configurações Modificadas

### next.config.js

- Adicionado configuração para upload de arquivos grandes (50MB)

### src/app/api/upload/route.ts

- Adicionado verificação de tamanho de arquivo
- Configurado `bodyParser: false`

### src/lib/milvus.ts

- Melhorado tratamento de erros
- Adicionado delay antes de conectar
