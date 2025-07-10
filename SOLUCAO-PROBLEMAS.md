# Solução para Problemas de Upload e Qdrant

## Problemas Identificados

### 1. Erro 413 (Request Entity Too Large)

**Problema**: O arquivo PDF é muito grande para o limite padrão do Next.js.

**Solução Aplicada**:

- Configurado `next.config.js` para aceitar arquivos até 50MB
- Adicionado verificação de tamanho no código (máximo 50MB)
- Configurado `bodyParser: false` na rota de upload

### 2. Migração para Qdrant

**Problema**: Milvus não funcionava adequadamente em sistemas com pouca RAM.

**Solução Aplicada**:

- Migração completa para Qdrant
- Configuração otimizada para sistemas com pouca RAM
- Melhor estabilidade e performance

## Scripts Disponíveis

### 1. `test-qdrant.sh`

Testa Qdrant como banco de dados vetorial:

```bash
./test-qdrant.sh
```

### 2. `test-qdrant-integration.js`

Teste completo de integração com Qdrant:

```bash
node test-qdrant-integration.js
```

## Passos para Resolver

### ⚠️ **SISTEMA COM POUCA RAM (3.8GB)**

Seu sistema tem apenas 3.8GB de RAM, o que é adequado para o Qdrant.

### Opção 1: Testar Qdrant

```bash
./test-qdrant.sh
```

### Opção 2: Testar Integração Completa

```bash
node test-qdrant-integration.js
```

### Passo 2: Verificar se a aplicação está funcionando

```bash
npm run dev
```

### Passo 3: Testar upload de arquivo pequeno

Tente fazer upload de um PDF pequeno (< 1MB) primeiro.

## Configurações

### docker-compose-qdrant.yml

- Qdrant como banco de dados vetorial
- Limite de memória: 512MB
- Porta 6333 (HTTP) e 6334 (gRPC)
- Mais leve e estável

## Verificações Importantes

1. **Tamanho do arquivo**: Certifique-se de que o PDF não excede 50MB
2. **Conexão com Qdrant**: Execute os scripts de teste
3. **Logs**: Monitore os logs da aplicação
4. **Portas**: Verifique se a porta 6333 está acessível
5. **Recursos**: Verifique se há memória suficiente disponível

## Comandos Úteis

```bash
# Verificar status do Docker
docker ps

# Verificar logs do Qdrant
docker logs qdrant

# Testar conexão com Qdrant
node test-qdrant-integration.js

# Configurações específicas
./test-qdrant.sh

# Verificar portas
netstat -an | grep 6333

# Verificar recursos do sistema
free -h
df -h
```

## Troubleshooting

### Se o Qdrant não inicializar:

1. Verifique se há memória suficiente: `free -h`
2. Verifique se há espaço em disco: `df -h`
3. Reinicie o Docker: `sudo systemctl restart docker`
4. Reinicie o Qdrant: `docker-compose -f docker-compose-qdrant.yml restart`

### Se ainda houver problemas de conexão:

1. Verifique os logs completos: `docker logs qdrant`
2. Verifique se não há conflitos de porta
3. Teste a integração: `node test-qdrant-integration.js`

## Configurações Modificadas

### next.config.js

- Adicionado configuração para upload de arquivos grandes (50MB)

### src/app/api/upload/route.ts

- Adicionado verificação de tamanho de arquivo
- Configurado `bodyParser: false`
- Migrado para usar Qdrant

### src/lib/qdrant.ts

- Cliente Qdrant configurado
- Funções de inserção e busca
- Tratamento de erros

## Vantagens do Qdrant

### ✅ Para seu sistema (3.8GB RAM):

- **Memória**: 512MB vs 4GB do Milvus
- **Estabilidade**: Menos problemas de inicialização
- **Simplicidade**: Configuração mais simples
- **Compatibilidade**: Funciona bem com pouca RAM

### ✅ Geral:

- **Performance**: Busca vetorial otimizada
- **Escalabilidade**: Suporte a milhões de vetores
- **API**: REST API simples e intuitiva
- **Documentação**: Excelente documentação
