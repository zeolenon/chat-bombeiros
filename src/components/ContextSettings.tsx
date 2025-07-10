"use client";

import { useState, useEffect } from "react";
import {
  Settings,
  Edit,
  Save,
  X,
  Plus,
  Trash2,
  AlertCircle,
} from "lucide-react";

interface ContextSetting {
  id: number;
  name: string;
  description: string;
  prompt_template: string;
  is_active: boolean;
}

export default function ContextSettings() {
  const [settings, setSettings] = useState<ContextSetting[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    promptTemplate: "",
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      setError(null);

      // Tentar até 3 vezes com delay entre tentativas
      for (let attempt = 1; attempt <= 3; attempt++) {
        try {
          const response = await fetch("/api/context", {
            signal: AbortSignal.timeout(15000), // 15 segundos timeout
          });

          if (response.ok) {
            const data = await response.json();
            setSettings(data.settings || []);
            setError(null);
            return; // Sucesso, sair do loop
          } else {
            const errorData = await response.json();
            console.error(`Tentativa ${attempt} falhou:`, errorData.error);
            setError(errorData.error || "Erro ao carregar configurações");
          }
        } catch (error) {
          console.error(`Tentativa ${attempt} falhou:`, error);

          if (attempt < 3) {
            console.log(`Aguardando 2s antes da próxima tentativa...`);
            await new Promise((resolve) => setTimeout(resolve, 2000));
          } else {
            setError("Falha ao conectar com o servidor. Tente novamente.");
          }
        }
      }

      // Se chegou aqui, todas as tentativas falharam
      console.error("Todas as tentativas de carregar configurações falharam");
    } catch (error) {
      console.error("Erro ao carregar configurações:", error);
      setError("Erro inesperado ao carregar configurações");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const response = await fetch("/api/context", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setShowForm(false);
        setFormData({ name: "", description: "", promptTemplate: "" });
        loadSettings();
      }
    } catch (error) {
      console.error("Erro ao salvar configuração:", error);
    }
  };

  const handleUpdate = async (id: number) => {
    const setting = settings.find((s) => s.id === id);
    if (!setting) return;

    try {
      const response = await fetch("/api/context", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id,
          name: setting.name,
          description: setting.description,
          promptTemplate: setting.prompt_template,
          isActive: setting.is_active,
        }),
      });

      if (response.ok) {
        setEditingId(null);
        loadSettings();
      }
    } catch (error) {
      console.error("Erro ao atualizar configuração:", error);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Tem certeza que deseja remover esta configuração?")) return;

    try {
      const response = await fetch(`/api/context?id=${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        loadSettings();
      }
    } catch (error) {
      console.error("Erro ao remover configuração:", error);
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Settings className="h-6 w-6 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900">
            Configurações de Contexto
          </h3>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus className="h-4 w-4" />
          <span>Nova Configuração</span>
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <AlertCircle className="h-5 w-5 text-red-500" />
              <span className="text-red-700">{error}</span>
            </div>
            <button
              onClick={loadSettings}
              className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700"
            >
              Tentar Novamente
            </button>
          </div>
        </div>
      )}

      {showForm && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-lg font-medium">Nova Configuração</h4>
            <button
              onClick={() => setShowForm(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nome
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, name: e.target.value }))
                }
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Descrição
              </label>
              <input
                type="text"
                value={formData.description}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Template do Prompt
              </label>
              <textarea
                value={formData.promptTemplate}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    promptTemplate: e.target.value,
                  }))
                }
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={6}
                required
                placeholder="Digite o template do prompt que será usado para gerar respostas..."
              />
            </div>

            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <Save className="h-4 w-4" />
                <span>Salvar</span>
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="space-y-4">
        {settings.map((setting) => (
          <div
            key={setting.id}
            className="bg-white border border-gray-200 rounded-lg p-6"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-2">
                  <h4 className="text-lg font-medium text-gray-900">
                    {setting.name}
                  </h4>
                  {setting.is_active && (
                    <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">
                      Ativo
                    </span>
                  )}
                </div>

                {setting.description && (
                  <p className="text-gray-600 mb-4">{setting.description}</p>
                )}

                {editingId === setting.id ? (
                  <div className="space-y-3">
                    <textarea
                      value={setting.prompt_template}
                      onChange={(e) => {
                        const updatedSettings = settings.map((s) =>
                          s.id === setting.id
                            ? { ...s, prompt_template: e.target.value }
                            : s
                        );
                        setSettings(updatedSettings);
                      }}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      rows={4}
                    />
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleUpdate(setting.id)}
                        className="flex items-center space-x-2 px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
                      >
                        <Save className="h-4 w-4" />
                        <span>Salvar</span>
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        className="px-3 py-1 text-gray-600 hover:text-gray-800"
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">
                      {setting.prompt_template}
                    </p>
                    <div className="flex space-x-2 mt-3">
                      <button
                        onClick={() => setEditingId(setting.id)}
                        className="flex items-center space-x-1 text-blue-600 hover:text-blue-700"
                      >
                        <Edit className="h-4 w-4" />
                        <span>Editar</span>
                      </button>
                      <button
                        onClick={() => handleDelete(setting.id)}
                        className="flex items-center space-x-1 text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                        <span>Remover</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
