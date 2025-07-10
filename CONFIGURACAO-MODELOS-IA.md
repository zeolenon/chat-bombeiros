# Configuração de Modelos de IA

Esta documentação explica como configurar e usar diferentes modelos de IA no sistema CBM-RN Chat.

## Funcionalidades Implementadas

### 1. Seleção de Modelos de IA

- **Gemini 1.5 Pro** (Google) - Modelo padrão
- **Gemini 1.5 Flash** (Google) - Versão mais rápida
- **Grok Beta** (xAI) - Modelo experimental da xAI

### 2. Interface de Configuração

- Acesse a aba "Configurações" no sistema
- Seção "Configurações de Modelos de IA" permite:
  - Visualizar todos os modelos disponíveis
  - Ativar/desativar modelos
  - Adicionar novos modelos
  - Configurar API keys e URLs base
  - Editar configurações existentes

## Como Usar

### 1. Inicialização do Banco de Dados

Primeiro, execute o script de inicialização para criar as tabelas necessárias:

```bash
npm run init-db
```

### 2. Configuração dos Modelos

#### Modelos Pré-configurados

O sistema já vem com três modelos pré-configurados:

- **Gemini 1.5 Pro** (ativo por padrão)
- **Gemini 1.5 Flash** (inativo)
- **Grok Beta** (inativo)

#### Configurando o Grok

Para usar o Grok, você precisa:

1. Obter uma API key do Grok (xAI)
2. Na interface de configurações, editar o modelo "Grok Beta"
3. Adicionar sua API key
4. Configurar a URL base (se necessário)
5. Ativar o modelo

#### Adicionando Novos Modelos

1. Clique em "Novo Modelo" na seção de configurações
2. Preencha os campos:
   - **Nome**: Nome descritivo do modelo
   - **Provedor**: Empresa que fornece o modelo (ex: Google, OpenAI, xAI)
   - **Modelo**: Identificador do modelo (ex: gemini-1.5-pro, gpt-4, grok-beta)
   - **API Key**: Chave de API (opcional, dependendo do provedor)
   - **URL Base**: URL base da API (opcional)

### 3. Ativação de Modelos

- Apenas um modelo pode estar ativo por vez
- Para ativar um modelo, clique no botão "Ativar" ao lado do modelo desejado
- O modelo ativo será usado para todas as conversas

## Estrutura Técnica

### Banco de Dados

Nova tabela `ai_model_configs`:

```sql
CREATE TABLE ai_model_configs (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  provider VARCHAR(100) NOT NULL,
  model VARCHAR(100) NOT NULL,
  api_key TEXT,
  base_url TEXT,
  is_active BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Serviço de IA

Novo arquivo `src/lib/aiService.ts` que:

- Gerencia múltiplos modelos de IA
- Suporta Gemini e Grok
- Permite fácil extensão para novos modelos
- Mantém compatibilidade com o sistema existente

### APIs

Nova API `/api/ai-models` para:

- `GET`: Listar todos os modelos
- `POST`: Criar novo modelo
- `PUT`: Atualizar modelo existente
- `DELETE`: Remover modelo

## Variáveis de Ambiente

Para o Grok funcionar, adicione ao seu `.env`:

```
GROK_API_KEY=sua_api_key_aqui
GROK_BASE_URL=https://api.x.ai/v1
```

## Compatibilidade

O sistema mantém total compatibilidade com:

- Conversas existentes
- Documentos já processados
- Configurações de contexto
- Interface do usuário

## Próximos Passos

1. Execute `npm run init-db` para criar as tabelas
2. Acesse a aba "Configurações" no sistema
3. Configure os modelos desejados
4. Teste diferentes modelos para encontrar o melhor para seu caso de uso

## Suporte

Para problemas ou dúvidas:

1. Verifique se o banco de dados foi inicializado corretamente
2. Confirme se as API keys estão configuradas
3. Verifique os logs do servidor para erros
4. Teste com o modelo Gemini primeiro (não requer configuração adicional)
