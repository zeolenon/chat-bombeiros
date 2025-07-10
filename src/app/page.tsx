"use client";

import { useState } from "react";
import {
  Shield,
  MessageCircle,
  FileText,
  Settings,
  Plus,
  X,
} from "lucide-react";
import FileUpload from "@/components/FileUpload";
import DocumentManager from "@/components/DocumentManager";
import ContextSettings from "@/components/ContextSettings";
import SimpleChat from "@/components/SimpleChat";

type TabType = "chat" | "documents" | "settings";

export default function Home() {
  const [activeTab, setActiveTab] = useState<TabType>("chat");
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleUploadSuccess = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  const startNewChat = () => {
    // Para o SimpleChat, um novo chat é iniciado automaticamente
    // quando não há chatId ativo
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <Shield className="h-8 w-8 text-red-600" />
              <div>
                <h1 className="text-xl font-bold text-gray-900">CBM-RN Chat</h1>
                <p className="text-sm text-gray-600">
                  Assistente de Normas e Resoluções
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <button
                onClick={startNewChat}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <Plus className="h-4 w-4" />
                <span>Novo Chat</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8">
            <button
              onClick={() => setActiveTab("chat")}
              className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "chat"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              <MessageCircle className="h-5 w-5" />
              <span>Chat</span>
            </button>

            <button
              onClick={() => setActiveTab("documents")}
              className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "documents"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              <FileText className="h-5 w-5" />
              <span>Documentos</span>
            </button>

            <button
              onClick={() => setActiveTab("settings")}
              className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "settings"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              <Settings className="h-5 w-5" />
              <span>Configurações</span>
            </button>
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === "chat" && (
          <div className="h-[calc(100vh-200px)]">
            <SimpleChat />
          </div>
        )}

        {activeTab === "documents" && (
          <div className="space-y-8">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Upload de Documentos
              </h2>
              <p className="text-gray-600 mb-6">
                Faça upload de PDFs com normas e resoluções do CBM-RN para que o
                assistente possa responder suas perguntas com base nesses
                documentos.
              </p>
              <FileUpload onUploadSuccess={handleUploadSuccess} />
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <DocumentManager onRefresh={handleUploadSuccess} />
            </div>
          </div>
        )}

        {activeTab === "settings" && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <ContextSettings />
          </div>
        )}
      </main>
    </div>
  );
}
