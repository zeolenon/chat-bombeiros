"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Send,
  Shield,
  MessageSquare,
  Plus,
  Trash2,
  Edit,
  Save,
  X,
} from "lucide-react";
import CustomThreadList from "./CustomThreadList";
import ReactMarkdown from "react-markdown";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  created_at: string;
}

interface ChatInfo {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

export default function SimpleChat() {
  const [currentThreadId, setCurrentThreadId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [chatInfo, setChatInfo] = useState<ChatInfo | null>(null);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editingTitle, setEditingTitle] = useState("");
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Carregar mensagens quando uma thread é selecionada
  const loadMessages = async (threadId: string) => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/chat?chatId=${threadId}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.messages) {
        setMessages(data.messages);
      } else {
        setMessages([]);
      }
    } catch (error) {
      console.error("Erro ao carregar mensagens:", error);
      setMessages([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Carregar informações do chat
  const loadChatInfo = async (threadId: string) => {
    try {
      const response = await fetch(`/api/chats/${threadId}`);
      if (response.ok) {
        const data = await response.json();
        setChatInfo(data.chat);
        setEditingTitle(data.chat.title);
      }
    } catch (error) {
      console.error("Erro ao carregar informações do chat:", error);
    }
  };

  useEffect(() => {
    if (currentThreadId) {
      loadMessages(currentThreadId);
      loadChatInfo(currentThreadId);
    } else {
      setMessages([]);
      setChatInfo(null);
    }
  }, [currentThreadId]);

  const sendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    setIsLoading(true);
    const userMessage = inputMessage;
    setInputMessage("");

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          question: userMessage,
          chatId: currentThreadId,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data && data.length > 0) {
        // Atualizar mensagens
        const newMessages = [
          ...messages,
          {
            id: `user-${Date.now()}`,
            role: "user" as const,
            content: userMessage,
            created_at: new Date().toISOString(),
          },
          {
            id: `assistant-${Date.now()}`,
            role: "assistant" as const,
            content: data[0]?.content || "Erro ao gerar resposta",
            created_at: new Date().toISOString(),
          },
        ];
        setMessages(newMessages);

        // Se não havia thread, atualizar o ID
        if (!currentThreadId && data[0]?.id) {
          setCurrentThreadId(data[0].id);
        }
      }
    } catch (error) {
      console.error("Erro ao enviar mensagem:", error);
      // Adicionar mensagem de erro para o usuário
      setMessages((prev) => [
        ...prev,
        {
          id: `error-${Date.now()}`,
          role: "assistant" as const,
          content:
            "Desculpe, ocorreu um erro ao processar sua mensagem. Tente novamente.",
          created_at: new Date().toISOString(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleTitleEdit = async () => {
    if (!currentThreadId || !editingTitle.trim()) return;

    try {
      const response = await fetch(`/api/chats/${currentThreadId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: editingTitle.trim(),
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setChatInfo(data.chat);
        setIsEditingTitle(false);
        // Atualizar a lista de chats
        setRefreshTrigger((prev) => prev + 1);
      }
    } catch (error) {
      console.error("Erro ao atualizar título:", error);
    }
  };

  const cancelTitleEdit = () => {
    setIsEditingTitle(false);
    setEditingTitle(chatInfo?.title || "");
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="grid h-dvh grid-cols-[250px_1fr] gap-x-2">
      {/* Sidebar com threads */}
      <div className="bg-white border-r border-gray-200">
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Conversas</h2>
          <p className="text-sm text-gray-600">Gerencie suas conversas</p>
        </div>
        <CustomThreadList
          onThreadSelect={setCurrentThreadId}
          currentThreadId={currentThreadId}
          refreshTrigger={refreshTrigger}
        />
      </div>

      {/* Área do chat */}
      <div className="flex flex-col bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Shield className="h-8 w-8 text-red-600" />
              <div>
                {isEditingTitle ? (
                  <div className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={editingTitle}
                      onChange={(e) => setEditingTitle(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === "Enter") {
                          handleTitleEdit();
                        } else if (e.key === "Escape") {
                          cancelTitleEdit();
                        }
                      }}
                      className="text-xl font-bold text-gray-900 bg-transparent border-b border-blue-500 focus:outline-none focus:border-blue-600"
                      autoFocus
                    />
                    <button
                      onClick={handleTitleEdit}
                      className="p-1 text-green-600 hover:text-green-700"
                    >
                      <Save className="h-4 w-4" />
                    </button>
                    <button
                      onClick={cancelTitleEdit}
                      className="p-1 text-gray-500 hover:text-gray-700"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <h1
                      className="text-xl font-bold text-gray-900 cursor-pointer hover:text-blue-600"
                      onClick={() => setIsEditingTitle(true)}
                    >
                      {chatInfo?.title || "CBM-RN Chat"}
                    </h1>
                    <button
                      onClick={() => setIsEditingTitle(true)}
                      className="p-1 text-gray-400 hover:text-gray-600"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                  </div>
                )}
                {chatInfo && (
                  <p className="text-sm text-gray-600">
                    Criado em {formatDate(chatInfo.created_at)}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Mensagens */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 && !currentThreadId && (
            <div className="text-center py-8">
              <MessageSquare className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Bem-vindo ao CBM-RN Chat
              </h3>
              <p className="text-gray-600">
                Selecione uma conversa ou crie uma nova para começar
              </p>
            </div>
          )}

          {messages.map((message, index) => {
            // Garante chave única: usa id se existir e for string/number, senão fallback
            const key =
              (typeof message.id === "string" ||
                typeof message.id === "number") &&
              message.id
                ? message.id
                : `${message.role}-${message.created_at}-${index}`;
            return (
              <div
                key={key}
                className={`flex ${
                  message.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-[70%] rounded-lg px-4 py-2 ${
                    message.role === "user"
                      ? "bg-blue-600 text-white"
                      : "bg-white border border-gray-200"
                  }`}
                >
                  <div className="flex items-start space-x-2">
                    {message.role === "assistant" && (
                      <Shield className="h-5 w-5 mt-1 flex-shrink-0 text-red-600" />
                    )}
                    <div className="flex-1">
                      {message.role === "assistant" ? (
                        <div className="prose prose-sm max-w-none">
                          <ReactMarkdown
                            components={{
                              p: ({ children }) => (
                                <p className="mb-2 last:mb-0">{children}</p>
                              ),
                              ul: ({ children }) => (
                                <ul className="list-disc list-inside mb-2">
                                  {children}
                                </ul>
                              ),
                              ol: ({ children }) => (
                                <ol className="list-decimal list-inside mb-2">
                                  {children}
                                </ol>
                              ),
                              li: ({ children }) => (
                                <li className="mb-1">{children}</li>
                              ),
                              strong: ({ children }) => (
                                <strong className="font-semibold">
                                  {children}
                                </strong>
                              ),
                              em: ({ children }) => (
                                <em className="italic">{children}</em>
                              ),
                              code: ({ children }) => (
                                <code className="bg-gray-100 px-1 py-0.5 rounded text-sm">
                                  {children}
                                </code>
                              ),
                              pre: ({ children }) => (
                                <pre className="bg-gray-100 p-2 rounded text-sm overflow-x-auto">
                                  {children}
                                </pre>
                              ),
                              blockquote: ({ children }) => (
                                <blockquote className="border-l-4 border-gray-300 pl-4 italic">
                                  {children}
                                </blockquote>
                              ),
                            }}
                          >
                            {message.content}
                          </ReactMarkdown>
                        </div>
                      ) : (
                        <p className="text-sm whitespace-pre-wrap">
                          {message.content}
                        </p>
                      )}
                      <p className="text-xs opacity-70 mt-1">
                        {new Date(message.created_at).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-white border border-gray-200 rounded-lg px-4 py-2">
                <div className="flex items-center space-x-2">
                  <Shield className="h-5 w-5 text-red-600" />
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div
                      className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                      style={{ animationDelay: "0.1s" }}
                    ></div>
                    <div
                      className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                      style={{ animationDelay: "0.2s" }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Input */}
        <div className="bg-white border-t border-gray-200 p-4">
          <div className="flex space-x-2">
            <textarea
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Digite sua pergunta sobre as normas do CBM-RN..."
              className="flex-1 resize-none border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={1}
              disabled={isLoading}
            />
            <Button
              onClick={sendMessage}
              disabled={!inputMessage.trim() || isLoading}
              className="px-4"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
