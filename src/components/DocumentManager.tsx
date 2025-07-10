"use client";

import { useState, useEffect } from "react";
import { FileText, Trash2, Calendar, AlertCircle } from "lucide-react";

interface Document {
  id: number;
  original_name: string;
  filename: string;
  created_at: string;
}

interface DocumentManagerProps {
  onRefresh: () => void;
}

export default function DocumentManager({ onRefresh }: DocumentManagerProps) {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadDocuments();
  }, []);

  const loadDocuments = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/upload");
      const data = await response.json();

      if (response.ok) {
        setDocuments(data.documents || []);
        setError("");
      } else {
        setError(data.error || "Erro ao carregar documentos");
      }
    } catch (error) {
      setError("Erro de conexão");
    } finally {
      setLoading(false);
    }
  };

  const deleteDocument = async (documentId: number) => {
    if (!confirm("Tem certeza que deseja remover este documento?")) return;

    try {
      const response = await fetch(`/api/upload?id=${documentId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setDocuments((prev) => prev.filter((doc) => doc.id !== documentId));
        onRefresh();
      } else {
        const data = await response.json();
        alert(data.error || "Erro ao remover documento");
      }
    } catch (error) {
      alert("Erro ao remover documento");
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">
          Documentos Carregados
        </h3>
        <button
          onClick={loadDocuments}
          className="text-sm text-blue-600 hover:text-blue-700"
        >
          Atualizar
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center space-x-2">
          <AlertCircle className="h-5 w-5 text-red-500" />
          <span className="text-red-700">{error}</span>
        </div>
      )}

      {documents.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <FileText className="h-12 w-12 mx-auto mb-4 text-gray-400" />
          <p>Nenhum documento carregado</p>
          <p className="text-sm">Faça upload de PDFs para começar</p>
        </div>
      ) : (
        <div className="space-y-3">
          {documents.map((doc) => (
            <div
              key={doc.id}
              className="bg-white border border-gray-200 rounded-lg p-4 flex items-center justify-between hover:shadow-sm transition-shadow"
            >
              <div className="flex items-center space-x-3">
                <FileText className="h-8 w-8 text-blue-500" />
                <div>
                  <p className="font-medium text-gray-900">
                    {doc.original_name}
                  </p>
                  <div className="flex items-center space-x-2 text-sm text-gray-500">
                    <Calendar className="h-4 w-4" />
                    <span>
                      {new Date(doc.created_at).toLocaleDateString("pt-BR")}
                    </span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => deleteDocument(doc.id)}
                className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                title="Remover documento"
              >
                <Trash2 className="h-5 w-5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
