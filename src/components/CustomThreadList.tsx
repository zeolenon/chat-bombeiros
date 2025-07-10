"use client";

import { useState, useEffect } from "react";
import { Plus, MessageSquare, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Thread {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
}

interface CustomThreadListProps {
  onThreadSelect: (threadId: string | null) => void;
  currentThreadId: string | null;
}

export default function CustomThreadList({
  onThreadSelect,
  currentThreadId,
}: CustomThreadListProps) {
  const [threads, setThreads] = useState<Thread[]>([]);
  const [loading, setLoading] = useState(true);

  // Carregar threads
  const loadThreads = async () => {
    try {
      const response = await fetch("/api/threads");
      const data = await response.json();

      if (response.ok) {
        setThreads(data.threads);
      }
    } catch (error) {
      console.error("Erro ao carregar threads:", error);
    } finally {
      setLoading(false);
    }
  };

  // Criar nova thread
  const createNewThread = async () => {
    try {
      const response = await fetch("/api/threads", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ title: "Nova conversa" }),
      });

      const data = await response.json();

      if (response.ok) {
        setThreads((prev) => [data, ...prev]);
        onThreadSelect(data.id);
      }
    } catch (error) {
      console.error("Erro ao criar thread:", error);
    }
  };

  // Deletar thread
  const deleteThread = async (threadId: string) => {
    try {
      const response = await fetch(`/api/threads?id=${threadId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setThreads((prev) => prev.filter((t) => t.id !== threadId));
        if (currentThreadId === threadId) {
          onThreadSelect(null);
        }
      }
    } catch (error) {
      console.error("Erro ao deletar thread:", error);
    }
  };

  useEffect(() => {
    loadThreads();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-stretch gap-1.5 p-4">
        <div className="animate-pulse">
          <div className="h-10 bg-gray-200 rounded-lg mb-2"></div>
          <div className="h-8 bg-gray-200 rounded-lg mb-2"></div>
          <div className="h-8 bg-gray-200 rounded-lg"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-stretch gap-1.5 p-4">
      {/* Botão Nova Conversa */}
      <Button
        onClick={createNewThread}
        className="flex items-center justify-start gap-2 rounded-lg px-3 py-2 text-start"
        variant="ghost"
      >
        <Plus className="h-4 w-4" />
        Nova Conversa
      </Button>

      {/* Lista de Threads */}
      <div className="space-y-1">
        {threads.map((thread) => (
          <div
            key={thread.id}
            className={`flex items-center gap-2 rounded-lg px-3 py-2 transition-all hover:bg-gray-100 ${
              currentThreadId === thread.id
                ? "bg-blue-50 border border-blue-200"
                : ""
            }`}
          >
            <Button
              onClick={() => onThreadSelect(thread.id)}
              className="flex-1 text-start justify-start min-w-0"
              variant="ghost"
            >
              <MessageSquare className="h-4 w-4 mr-2 flex-shrink-0" />
              <div className="flex-1 min-w-0 overflow-hidden">
                <p className="text-sm font-medium truncate">{thread.title}</p>
                <p className="text-xs text-gray-500 truncate">
                  {new Date(thread.updatedAt).toLocaleDateString()}
                </p>
              </div>
            </Button>

            <Button
              onClick={() => deleteThread(thread.id)}
              className="h-6 w-6 p-0 text-gray-400 hover:text-red-500 flex-shrink-0 ml-2"
              variant="ghost"
              size="sm"
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        ))}
      </div>

      {threads.length === 0 && (
        <div className="text-center text-gray-500 py-8">
          <MessageSquare className="h-8 w-8 mx-auto mb-2 text-gray-400" />
          <p className="text-sm">Nenhuma conversa ainda</p>
          <p className="text-xs">Clique em "Nova Conversa" para começar</p>
        </div>
      )}
    </div>
  );
}
