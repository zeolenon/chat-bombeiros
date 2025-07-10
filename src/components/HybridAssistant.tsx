"use client";

import { useState } from "react";
import { AssistantRuntimeProvider } from "@assistant-ui/react";
import { useChatRuntime } from "@assistant-ui/react-ai-sdk";
import { Thread } from "@/components/assistant-ui/thread";
import CustomThreadList from "./CustomThreadList";

export default function HybridAssistant() {
  const [currentThreadId, setCurrentThreadId] = useState<string | null>(null);

  const runtime = useChatRuntime({
    api: "/api/chat",
    // Passar o threadId atual para a API
    body: {
      threadId: currentThreadId,
    },
  });

  return (
    <AssistantRuntimeProvider runtime={runtime}>
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
          />
        </div>

        {/* Área do chat */}
        <div className="flex flex-col">
          <Thread />
        </div>
      </div>
    </AssistantRuntimeProvider>
  );
}
