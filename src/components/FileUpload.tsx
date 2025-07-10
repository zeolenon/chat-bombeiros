"use client";

import { useState, useCallback, useRef } from "react";
import { useDropzone } from "react-dropzone";
import {
  Upload,
  FileText,
  X,
  CheckCircle,
  AlertCircle,
  RefreshCw,
} from "lucide-react";

interface FileUploadProps {
  onUploadSuccess: () => void;
}

interface UploadProgress {
  percentage: number;
  stage: "uploading" | "processing" | "saving" | "complete";
  message: string;
}

export default function FileUpload({ onUploadSuccess }: FileUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress | null>(
    null
  );
  const [uploadStatus, setUploadStatus] = useState<{
    type: "success" | "error" | null;
    message: string;
  }>({ type: null, message: "" });

  const abortControllerRef = useRef<AbortController | null>(null);
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const uploadWithRetry = useCallback(
    async (
      formData: FormData,
      retryCount = 0,
      maxRetries = 3
    ): Promise<Response> => {
      const controller = new AbortController();
      abortControllerRef.current = controller;

      try {
        const response = await fetch("/api/upload", {
          method: "POST",
          body: formData,
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        return response;
      } catch (error) {
        if (error instanceof Error && error.name === "AbortError") {
          throw error; // Re-throw abort errors
        }

        if (retryCount < maxRetries) {
          console.log(
            `Tentativa ${retryCount + 1} falhou, tentando novamente em 2s...`
          );

          // Wait before retry
          await new Promise((resolve) => {
            retryTimeoutRef.current = setTimeout(resolve, 2000);
          });

          return uploadWithRetry(formData, retryCount + 1, maxRetries);
        }

        throw error;
      }
    },
    []
  );

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      if (acceptedFiles.length === 0) return;

      const file = acceptedFiles[0];
      setUploading(true);
      setUploadStatus({ type: null, message: "" });
      setUploadProgress({
        percentage: 0,
        stage: "uploading",
        message: "Iniciando upload...",
      });

      try {
        const formData = new FormData();
        formData.append("file", file);

        // Simular progresso de upload para arquivos grandes
        const fileSize = file.size;
        const isLargeFile = fileSize > 5 * 1024 * 1024; // 5MB

        if (isLargeFile) {
          // Para arquivos grandes, simular progresso
          const progressInterval = setInterval(() => {
            setUploadProgress((prev) => {
              if (!prev) return prev;
              const newPercentage = Math.min(prev.percentage + 10, 80);
              return {
                ...prev,
                percentage: newPercentage,
                message: `Enviando arquivo... ${newPercentage}%`,
              };
            });
          }, 500);

          // Limpar intervalo quando upload terminar
          setTimeout(() => clearInterval(progressInterval), 10000);
        }

        setUploadProgress({
          percentage: 20,
          stage: "uploading",
          message: "Enviando arquivo...",
        });

        const response = await uploadWithRetry(formData);

        setUploadProgress({
          percentage: 60,
          stage: "processing",
          message: "Processando PDF...",
        });

        const result = await response.json();

        setUploadProgress({
          percentage: 80,
          stage: "saving",
          message: "Salvando no banco de dados...",
        });

        if (response.ok) {
          setUploadProgress({
            percentage: 100,
            stage: "complete",
            message: "Upload concluído!",
          });

          setUploadStatus({
            type: "success",
            message: `Arquivo "${file.name}" processado com sucesso! ${result.chunksCount} chunks criados.`,
          });
          onUploadSuccess();
        } else {
          throw new Error(result.error || "Erro ao processar arquivo");
        }
      } catch (error) {
        console.error("Erro no upload:", error);

        let errorMessage = "Erro ao fazer upload do arquivo";

        if (error instanceof Error) {
          if (error.name === "AbortError") {
            errorMessage = "Upload cancelado";
          } else if (error.message.includes("413")) {
            errorMessage = "Arquivo muito grande. Tamanho máximo: 50MB";
          } else if (error.message.includes("timeout")) {
            errorMessage =
              "Timeout na conexão. Verifique sua internet e tente novamente.";
          } else {
            errorMessage = error.message;
          }
        }

        setUploadStatus({
          type: "error",
          message: errorMessage,
        });
      } finally {
        setUploading(false);
        setUploadProgress(null);

        // Limpar referências
        abortControllerRef.current = null;
        if (retryTimeoutRef.current) {
          clearTimeout(retryTimeoutRef.current);
          retryTimeoutRef.current = null;
        }
      }
    },
    [onUploadSuccess, uploadWithRetry]
  );

  const cancelUpload = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
    }
    setUploading(false);
    setUploadProgress(null);
    setUploadStatus({ type: null, message: "" });
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/pdf": [".pdf"],
    },
    multiple: false,
    disabled: uploading,
  });

  const getProgressColor = (stage: string) => {
    switch (stage) {
      case "uploading":
        return "bg-blue-500";
      case "processing":
        return "bg-yellow-500";
      case "saving":
        return "bg-green-500";
      case "complete":
        return "bg-green-500";
      default:
        return "bg-gray-500";
    }
  };

  const getStageMessage = (stage: string) => {
    switch (stage) {
      case "uploading":
        return "Enviando arquivo";
      case "processing":
        return "Processando PDF";
      case "saving":
        return "Salvando dados";
      case "complete":
        return "Concluído";
      default:
        return "Processando";
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div
        {...getRootProps()}
        className={`
          border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
          ${
            isDragActive
              ? "border-blue-500 bg-blue-50"
              : "border-gray-300 hover:border-gray-400"
          }
          ${uploading ? "opacity-50 cursor-not-allowed" : ""}
        `}
      >
        <input {...getInputProps()} />

        <div className="flex flex-col items-center space-y-4">
          {uploading ? (
            <div className="relative">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
              {uploadProgress && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-xs font-medium text-blue-600">
                    {uploadProgress.percentage}%
                  </span>
                </div>
              )}
            </div>
          ) : (
            <Upload className="h-12 w-12 text-gray-400" />
          )}

          <div>
            <p className="text-lg font-medium text-gray-900">
              {isDragActive
                ? "Solte o arquivo aqui"
                : uploading
                ? "Processando..."
                : "Arraste um PDF aqui ou clique para selecionar"}
            </p>
            <p className="text-sm text-gray-500 mt-2">
              {uploading
                ? uploadProgress?.message || "Processando arquivo..."
                : "Apenas arquivos PDF são aceitos (máx. 50MB)"}
            </p>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      {uploadProgress && (
        <div className="mt-4">
          <div className="flex justify-between text-sm text-gray-600 mb-1">
            <span>{getStageMessage(uploadProgress.stage)}</span>
            <span>{uploadProgress.percentage}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all duration-300 ${getProgressColor(
                uploadProgress.stage
              )}`}
              style={{ width: `${uploadProgress.percentage}%` }}
            ></div>
          </div>
        </div>
      )}

      {/* Cancel Button */}
      {uploading && (
        <div className="mt-4 flex justify-center">
          <button
            onClick={cancelUpload}
            className="flex items-center space-x-2 px-4 py-2 text-sm text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors"
          >
            <X className="h-4 w-4" />
            <span>Cancelar Upload</span>
          </button>
        </div>
      )}

      {/* Status Messages */}
      {uploadStatus.type && (
        <div
          className={`mt-4 p-4 rounded-lg flex items-center space-x-2 ${
            uploadStatus.type === "success"
              ? "bg-green-50 text-green-800 border border-green-200"
              : "bg-red-50 text-red-800 border border-red-200"
          }`}
        >
          {uploadStatus.type === "success" ? (
            <CheckCircle className="h-5 w-5" />
          ) : (
            <AlertCircle className="h-5 w-5" />
          )}
          <span className="text-sm">{uploadStatus.message}</span>
        </div>
      )}
    </div>
  );
}
