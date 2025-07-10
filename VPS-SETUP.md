# Configuração para VPS

Este documento descreve como configurar a aplicação em uma VPS onde:

- **Milvus**: Roda no Docker
- **PostgreSQL**: Roda na máquina host
- **Node.js**: Roda via PM2

## Pré-requisitos

1. **Docker e Docker Compose** instalados
2. **PostgreSQL** instalado e rodando na porta 5432
3. **Node.js** (versão 18+) instalado
4. **PM2** instalado globalmente: `npm install -g pm2`

## Configuração

### 1. Preparar o ambiente

```bash
# Clonar o repositório (se ainda não fez)
git clone <seu-repositorio>
cd AT

# Instalar dependências
npm install

# Criar pasta uploads
mkdir -p uploads
chmod 755 uploads
```

### 2. Configurar o banco de dados

```bash
# Criar banco de dados
createdb chat_bombeiros

# Executar script de inicialização
npm run init-db
```

### 3. Iniciar o Milvus

```bash
# Iniciar apenas o Milvus
docker-compose up -d milvus

# Verificar se está rodando
docker ps
```

### 4. Executar testes de configuração

```bash
# Testar se tudo está funcionando
node test-vps.js

# Ou usar o script de configuração
./vps-setup.sh
```

### 5. Configurar variáveis de ambiente

Crie um arquivo `.env` na raiz do projeto:

```env
NODE_ENV=production
PORT=3002
MILVUS_ADDRESS=localhost:19530
DB_HOST=localhost
DB_PORT=5432
DB_NAME=chat_bombeiros
DB_USER=zenon
DB_PASSWORD=akpaloha
GOOGLE_API_KEY=sua_chave_api_aqui
```

### 6. Iniciar com PM2

```bash
# Iniciar a aplicação
pm2 start ecosystem.config.js

# Verificar status
pm2 status

# Ver logs
pm2 logs chat-bombeiros

# Para parar
pm2 stop chat-bombeiros

# Para reiniciar
pm2 restart chat-bombeiros
```

## Solução de Problemas

### Erro DEADLINE_EXCEEDED no Milvus

Se você está recebendo erro `DEADLINE_EXCEEDED` ao fazer upload:

1. **Verificar se o Milvus está rodando:**

   ```bash
   docker ps
   docker logs milvus
   ```

2. **Reiniciar o Milvus se necessário:**

   ```bash
   docker-compose restart milvus
   ```

3. **Verificar se a porta está acessível:**

   ```bash
   netstat -an | grep 19530
   ```

4. **Aguardar inicialização completa:**
   O Milvus pode demorar alguns minutos para inicializar completamente.

### Problemas com pasta uploads

1. **Verificar se a pasta existe:**

   ```bash
   ls -la uploads
   ```

2. **Criar pasta se não existir:**

   ```bash
   mkdir -p uploads
   chmod 755 uploads
   ```

3. **Verificar permissões:**
   ```bash
   ls -la | grep uploads
   ```

### Problemas com PostgreSQL

1. **Verificar se está rodando:**

   ```bash
   pg_isready -h localhost -p 5432
   ```

2. **Verificar configurações de conexão no código**

### Logs detalhados

A aplicação agora tem logs detalhados que mostram cada etapa do processo de upload:

- ✅ Verificação da pasta uploads
- ✅ Salvamento do arquivo
- ✅ Processamento do PDF
- ✅ Geração de embeddings
- ✅ Salvamento no Milvus
- ✅ Salvamento no PostgreSQL

## Comandos úteis

```bash
# Verificar status de todos os serviços
./vps-setup.sh

# Testar configuração
node test-vps.js

# Ver logs do Milvus
docker logs milvus --tail 50

# Ver logs da aplicação
pm2 logs chat-bombeiros --lines 100

# Reiniciar tudo
docker-compose restart milvus
pm2 restart chat-bombeiros
```

## Monitoramento

Para monitorar a aplicação em produção:

```bash
# Status geral
pm2 monit

# Logs em tempo real
pm2 logs chat-bombeiros -f

# Estatísticas
pm2 show chat-bombeiros
```

## Backup

Para fazer backup dos dados:

```bash
# Backup do PostgreSQL
pg_dump chat_bombeiros > backup_$(date +%Y%m%d).sql

# Backup do Milvus (dados do volume)
docker run --rm -v milvus_data:/data -v $(pwd):/backup alpine tar czf /backup/milvus_backup_$(date +%Y%m%d).tar.gz -C /data .
```
