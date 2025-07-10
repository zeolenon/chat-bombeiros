"use client";

import { useState, useEffect } from "react";
import {
  FileText,
  Trash2,
  Calendar,
  AlertCircle,
  RefreshCw,
  ArrowUpDown,
} from "lucide-react";
import { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";

interface Document {
  id: number;
  original_name: string;
  filename: string;
  created_at: string;
  file_size?: number; // Tamanho em bytes
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

  const formatFileSize = (bytes?: number): string => {
    if (!bytes) return "N/A";

    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round((bytes / Math.pow(1024, i)) * 100) / 100 + " " + sizes[i];
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Definição das colunas da tabela
  const columns: ColumnDef<Document>[] = [
    {
      accessorKey: "id",
      header: "#",
      cell: ({ row }) => <div className="font-medium">{row.index + 1}</div>,
    },
    {
      accessorKey: "original_name",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="h-auto p-0 font-semibold"
          >
            Nome do Arquivo
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-blue-500" />
          <span className="font-medium">{row.getValue("original_name")}</span>
        </div>
      ),
    },
    {
      accessorKey: "created_at",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="h-auto p-0 font-semibold"
          >
            Data de Upload
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-gray-400" />
          <span>{formatDate(row.getValue("created_at"))}</span>
        </div>
      ),
    },
    {
      accessorKey: "file_size",
      header: "Tamanho",
      cell: ({ row }) => (
        <span className="text-sm text-gray-600">
          {formatFileSize(row.getValue("file_size"))}
        </span>
      ),
    },
    {
      id: "actions",
      header: "Ações",
      cell: ({ row }) => (
        <Button
          onClick={() => deleteDocument(row.original.id)}
          variant="ghost"
          size="sm"
          className="text-red-600 hover:text-red-700 hover:bg-red-50"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      ),
    },
  ];

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
        <Button
          onClick={loadDocuments}
          variant="outline"
          size="sm"
          className="flex items-center gap-2"
        >
          <RefreshCw className="h-4 w-4" />
          Atualizar
        </Button>
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
        <DataTable columns={columns} data={documents} />
      )}
    </div>
  );
}
