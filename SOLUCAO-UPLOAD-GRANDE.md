# Solução para Upload de Arquivos Grandes

## Problema Identificado

O erro `413 (Request Entity Too Large)` ocorre quando tentamos fazer upload de arquivos maiores que o limite configurado no servidor. No seu caso, o arquivo de 4,83MB está falhando, indicando que há uma limitação de tamanho em algum lugar da infraestrutura.

## Causas Possíveis

1. **Nginx**: Limitação `client_max_body_size` muito baixa
2. **Proxy Reverso**: Configuração de timeout ou tamanho insuficiente
3. **Next.js**: Configuração incorreta para App Router
4. **PM2**: Timeout muito baixo para processamento
5. **Provedor de Hospedagem**: Limitações no nível da infraestrutura

## Solução Implementada

### 1. Correção do Next.js

Atualizei o `next.config.js` para usar a configuração correta do App Router:

```javascript
// Configurações para upload de arquivos grandes no App Router
export const dynamic = "force-dynamic";
export const maxDuration = 300; // 5 minutos
export const runtime = "nodejs";
```

### 2. Correção da Rota de Upload

Atualizei `src/app/api/upload/route.ts` para usar as configurações corretas:

```typescript
// Configuração para upload de arquivos grandes no App Router
export const dynamic = "force-dynamic";
export const maxDuration = 300; // 5 minutos
export const runtime = "nodejs";
```

### 3. Scripts de Diagnóstico e Correção

Criei vários scripts para resolver o problema:

#### `check-server-config.js`

Verifica todas as configurações do servidor:

```bash
node check-server-config.js
```

#### `fix-nginx-config.sh`

Corrige automaticamente a configuração do nginx:

```bash
./fix-nginx-config.sh
```

#### `test-upload-size.js`

Testa uploads de diferentes tamanhos:

```bash
node test-upload-size.js
```

#### `fix-upload-issue.sh`

Script principal que resolve tudo automaticamente:

```bash
./fix-upload-issue.sh
```

## Como Resolver no VPS

### Passo 1: Executar o Script Principal

```bash
cd /caminho/para/AT
./fix-upload-issue.sh
```

### Passo 2: Verificar se Funcionou

```bash
# Testar upload de arquivo grande
node test-upload-size.js

# Ver logs em tempo real
pm2 logs chat-bombeiros -f
```

### Passo 3: Se Ainda Houver Problemas

#### Verificar Nginx Manualmente

```bash
# Verificar configuração atual
sudo nginx -T | grep client_max_body_size

# Editar configuração
sudo nano /etc/nginx/nginx.conf

# Adicionar no bloco http:
client_max_body_size 50M;
client_body_timeout 300s;
proxy_read_timeout 300s;
proxy_send_timeout 300s;

# Recarregar nginx
sudo systemctl reload nginx
```

#### Verificar Configurações de Sites

```bash
# Verificar sites configurados
ls /etc/nginx/sites-available/
ls /etc/nginx/conf.d/

# Editar configuração específica do site
sudo nano /etc/nginx/sites-available/seu-site

# Adicionar no bloco server:
client_max_body_size 50M;
proxy_read_timeout 300s;
proxy_send_timeout 300s;
proxy_connect_timeout 300s;
```

#### Verificar PM2

```bash
# Reiniciar aplicação
pm2 restart chat-bombeiros

# Verificar configuração
pm2 show chat-bombeiros
```

## Configurações Recomendadas

### Nginx

```nginx
# No bloco http ou server
client_max_body_size 50M;
client_body_timeout 300s;
proxy_read_timeout 300s;
proxy_send_timeout 300s;
proxy_connect_timeout 300s;
```

### Next.js

```javascript
// next.config.js
export const maxDuration = 300;
export const runtime = "nodejs";
```

### PM2

```javascript
// ecosystem.config.js
{
  name: 'chat-bombeiros',
  script: 'npm',
  args: 'start',
  instances: 1,
  exec_mode: 'fork',
  env: {
    NODE_ENV: 'production',
    PORT: 3002,
    MAX_FILE_SIZE: '50mb',
    UPLOAD_TIMEOUT: '300000'
  }
}
```

## Testes de Validação

### Teste 1: Upload Pequeno

```bash
# Criar arquivo de teste
echo "test" > test.txt

# Fazer upload
curl -X POST -F "file=@test.txt" https://at.zenon.ninja/api/upload
```

### Teste 2: Upload Grande

```bash
# Usar o script de teste
node test-upload-size.js
```

### Teste 3: Verificar Logs

```bash
# Ver logs em tempo real
pm2 logs chat-bombeiros -f

# Ver logs do nginx
sudo tail -f /var/log/nginx/error.log
```

## Monitoramento

### Logs Importantes

- **Aplicação**: `pm2 logs chat-bombeiros`
- **Nginx**: `/var/log/nginx/error.log`
- **Sistema**: `journalctl -u nginx`

### Métricas a Observar

- Tempo de upload
- Uso de memória
- Erros 413
- Timeouts

## Solução Alternativa: Upload em Chunks

Se o problema persistir, considere implementar upload em chunks:

1. Dividir arquivo grande em partes
2. Fazer upload de cada parte
3. Reconstruir arquivo no servidor
4. Processar arquivo completo

## Contato e Suporte

Se o problema persistir após aplicar todas as soluções:

1. Execute `node check-server-config.js` e compartilhe a saída
2. Verifique logs: `pm2 logs chat-bombeiros --lines 50`
3. Teste com arquivos menores para identificar o limite exato
4. Considere contatar o provedor de hospedagem sobre limitações
