# CBM-RN Chat - Assistente de Normas e Resoluções

Sistema de chat inteligente para análise, vistoria e fiscalização de edificações e eventos baseado nas normas e resoluções do Corpo de Bombeiros Militar do Rio Grande do Norte (CBM-RN).

## 🚀 Funcionalidades

- **Chat Inteligente**: Interface de conversa com IA para consultas sobre normas
- **Upload de PDFs**: Sistema para carregar documentos PDF com normas e resoluções
- **Busca Vetorial**: Otimização de busca usando embeddings e palavras-chave relevantes
- **Histórico de Conversas**: Manutenção do contexto das conversas
- **Configurações de Contexto**: Personalização dos prompts para diferentes tipos de análise
- **Gerenciamento de Documentos**: Interface para adicionar e remover documentos

## 🛠️ Tecnologias Utilizadas

- **Frontend**: Next.js 14, React, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes
- **Banco de Dados**: PostgreSQL
- **IA**: Google Gemini API
- **Processamento de PDF**: pdf-parse, LangChain
- **Busca Vetorial**: Embeddings do Google
- **Interface**: Lucide React Icons

## 📋 Pré-requisitos

- Node.js 18+
- PostgreSQL 12+
- Conta Google Cloud com API do Gemini habilitada

## 🔧 Instalação

### 1. Clone o repositório

```bash
git clone <url-do-repositorio>
cd chat-bombeiros
```

### 2. Instale as dependências

```bash
npm install
```

### 3. Configure o banco de dados PostgreSQL

Crie um banco de dados PostgreSQL:

```sql
CREATE DATABASE chat_bombeiros;
```

### 4. Configure as variáveis de ambiente

Crie um arquivo `.env.local` na raiz do projeto:

```env
# Google Gemini API
GOOGLE_API_KEY=sua_chave_api_do_google_aqui

# PostgreSQL Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=chat_bombeiros
DB_USER=postgres
DB_PASSWORD=sua_senha_do_postgres

# Next.js
NEXTAUTH_SECRET=seu_secret_aqui
NEXTAUTH_URL=http://localhost:3000
```

### 5. Inicialize o banco de dados

```bash
npx tsx src/lib/init-db.ts
```

### 6. Execute o projeto

```bash
npm run dev
```

Acesse `http://localhost:3000` no seu navegador.

## 📁 Estrutura do Projeto

```
src/
├── app/
│   ├── api/
│   │   ├── chat/          # Endpoints do chat
│   │   ├── upload/        # Endpoints de upload de documentos
│   │   └── context/       # Endpoints de configurações
│   └── page.tsx           # Página principal
├── components/
│   ├── Chat.tsx           # Componente do chat
│   ├── FileUpload.tsx     # Componente de upload
│   ├── DocumentManager.tsx # Gerenciador de documentos
│   └── ContextSettings.tsx # Configurações de contexto
└── lib/
    ├── database.ts        # Configuração do PostgreSQL
    ├── geminiService.ts   # Serviço do Gemini
    └── pdfProcessor.ts    # Processamento de PDFs
```

## 🔌 APIs

### Upload de Documentos

- `POST /api/upload` - Upload de PDF
- `GET /api/upload` - Listar documentos
- `DELETE /api/upload?id={id}` - Remover documento

### Chat

- `POST /api/chat` - Enviar mensagem
- `GET /api/chat` - Listar chats
- `GET /api/chat?chatId={id}` - Buscar mensagens do chat
- `DELETE /api/chat?chatId={id}` - Remover chat

### Configurações de Contexto

- `GET /api/context` - Listar configurações
- `POST /api/context` - Criar configuração
- `PUT /api/context` - Atualizar configuração
- `DELETE /api/context?id={id}` - Remover configuração

## 🎯 Como Usar

### 1. Upload de Documentos

1. Acesse a aba "Documentos"
2. Arraste PDFs ou clique para selecionar
3. Os documentos serão processados e indexados automaticamente

### 2. Chat

1. Acesse a aba "Chat"
2. Digite suas perguntas sobre normas do CBM-RN
3. O sistema buscará informações relevantes nos documentos carregados
4. As respostas serão fundamentadas nas normas

### 3. Configurações

1. Acesse a aba "Configurações"
2. Crie ou edite templates de prompt
3. Personalize o contexto para diferentes tipos de análise

## 🔍 Funcionalidades Avançadas

### Busca Otimizada

- Extração de palavras-chave relevantes
- Busca por similaridade semântica
- Chunking inteligente de documentos

### Contexto Inteligente

- Manutenção do histórico de conversas
- Reutilização de contexto em perguntas subsequentes
- Configuração personalizada de prompts

### Processamento de PDFs

- Extração automática de texto
- Divisão em chunks otimizados
- Geração de embeddings para busca vetorial

## 🚨 Configuração da API do Google

1. Acesse o [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Crie uma nova API key
3. Adicione a chave no arquivo `.env.local`
4. Habilite a API do Gemini no Google Cloud Console

## 📊 Banco de Dados

O sistema cria automaticamente as seguintes tabelas:

- `chats` - Conversas
- `messages` - Mensagens das conversas
- `documents` - Documentos PDF processados
- `context_settings` - Configurações de contexto

## 🔧 Desenvolvimento

### Scripts Disponíveis

```bash
npm run dev          # Desenvolvimento
npm run build        # Build de produção
npm run start        # Executar produção
npm run lint         # Linting
```

### Estrutura de Dados

#### Documentos

```typescript
interface Document {
  id: number;
  filename: string;
  original_name: string;
  content: string;
  chunks: DocumentChunk[];
  embeddings: DocumentEmbedding[];
  created_at: string;
}
```

#### Chats

```typescript
interface Chat {
  id: number;
  title: string;
  created_at: string;
  updated_at: string;
}
```

#### Mensagens

```typescript
interface Message {
  id: number;
  chat_id: number;
  role: "user" | "assistant";
  content: string;
  created_at: string;
}
```

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📝 Licença

Este projeto está sob a licença MIT. Veja o arquivo `LICENSE` para mais detalhes.

## 🆘 Suporte

Para suporte, entre em contato através dos canais oficiais do CBM-RN.

---

**Desenvolvido para o Corpo de Bombeiros Militar do Rio Grande do Norte**
