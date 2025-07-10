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

### 3. `reset-milvus.sh`

Reset completo do Milvus (remove todos os dados):

```bash
./reset-milvus.sh
```

### 4. `test-simple-milvus.sh`

Testa configuração alternativa mais simples:

```bash
./test-simple-milvus.sh
```

### 5. `test-milvus.js`

Testa a conexão com o Milvus via Node.js:

```bash
node test-milvus.js
```

## Passos para Resolver

### Opção 1: Reset Completo (Recomendado)

Se o Milvus está com problemas sérios:

```bash
./reset-milvus.sh
```

**ATENÇÃO**: Isso vai remover todos os dados do Milvus!

### Opção 2: Configuração Alternativa

Se o reset não funcionar, tente a configuração mais simples:

```bash
./test-simple-milvus.sh
```

### Opção 3: Reinicialização Normal

Para problemas menores:

```bash
./restart-milvus.sh
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

## Verificações Importantes

1. **Tamanho do arquivo**: Certifique-se de que o PDF não excede 50MB
2. **Conexão com Milvus**: Execute `./fix-milvus.sh` para diagnosticar
3. **Logs**: Monitore os logs da aplicação e do Milvus
4. **Portas**: Verifique se as portas 19530 e 9091 estão acessíveis
5. **Recursos**: Verifique se há memória suficiente disponível

## Comandos Úteis

```bash
# Verificar status do Docker
docker ps

# Verificar logs do Milvus
docker logs milvus

# Testar conexão com Milvus
node test-milvus.js

# Reset completo
./reset-milvus.sh

# Configuração alternativa
./test-simple-milvus.sh

# Verificar portas
netstat -an | grep 19530
netstat -an | grep 9091

# Verificar recursos do sistema
free -h
df -h
```

## Troubleshooting

### Se o Milvus não inicializar:

1. Verifique se há memória suficiente: `free -h`
2. Verifique se há espaço em disco: `df -h`
3. Reinicie o Docker: `sudo systemctl restart docker`
4. Tente a configuração alternativa: `./test-simple-milvus.sh`

### Se ainda houver problemas de conexão:

1. Verifique os logs completos: `docker logs milvus`
2. Verifique se não há conflitos de porta
3. Tente uma versão ainda mais antiga do Milvus
4. Considere usar uma alternativa como Qdrant ou Chroma

## Configurações Modificadas

### next.config.js

- Adicionado configuração para upload de arquivos grandes (50MB)

### src/app/api/upload/route.ts

- Adicionado verificação de tamanho de arquivo
- Configurado `bodyParser: false`

### src/lib/milvus.ts

- Melhorado tratamento de erros
- Adicionado delay antes de conectar
