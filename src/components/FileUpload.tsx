"use client";

import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, FileText, X, CheckCircle, AlertCircle } from "lucide-react";

interface FileUploadProps {
  onUploadSuccess: () => void;
}

export default function FileUpload({ onUploadSuccess }: FileUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<{
    type: "success" | "error" | null;
    message: string;
  }>({ type: null, message: "" });

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      if (acceptedFiles.length === 0) return;

      setUploading(true);
      setUploadStatus({ type: null, message: "" });

      try {
        const formData = new FormData();
        formData.append("file", acceptedFiles[0]);

        const response = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        const result = await response.json();

        if (response.ok) {
          setUploadStatus({
            type: "success",
            message: `Arquivo "${acceptedFiles[0].name}" processado com sucesso! ${result.chunksCount} chunks criados.`,
          });
          onUploadSuccess();
        } else {
          setUploadStatus({
            type: "error",
            message: result.error || "Erro ao processar arquivo",
          });
        }
      } catch (error) {
        setUploadStatus({
          type: "error",
          message: "Erro ao fazer upload do arquivo",
        });
      } finally {
        setUploading(false);
      }
    },
    [onUploadSuccess]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/pdf": [".pdf"],
    },
    multiple: false,
  });

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
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          ) : (
            <Upload className="h-12 w-12 text-gray-400" />
          )}

          <div>
            <p className="text-lg font-medium text-gray-900">
              {isDragActive
                ? "Solte o arquivo aqui"
                : "Arraste um PDF aqui ou clique para selecionar"}
            </p>
            <p className="text-sm text-gray-500 mt-2">
              Apenas arquivos PDF são aceitos
            </p>
          </div>
        </div>
      </div>

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
