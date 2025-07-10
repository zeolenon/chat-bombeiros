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
  Key,
  Globe,
} from "lucide-react";

interface AIModelConfig {
  id: number;
  name: string;
  provider: string;
  model: string;
  api_key?: string;
  base_url?: string;
  is_active: boolean;
}

export default function AIModelSettings() {
  const [models, setModels] = useState<AIModelConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    provider: "",
    model: "",
    apiKey: "",
    baseUrl: "",
  });

  useEffect(() => {
    loadModels();
  }, []);

  const loadModels = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch("/api/ai-models");
      if (response.ok) {
        const data = await response.json();
        setModels(data.models || []);
      } else {
        const errorData = await response.json();
        setError(errorData.error || "Erro ao carregar modelos");
      }
    } catch (error) {
      console.error("Erro ao carregar modelos:", error);
      setError("Erro ao carregar modelos");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const response = await fetch("/api/ai-models", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setShowForm(false);
        setFormData({
          name: "",
          provider: "",
          model: "",
          apiKey: "",
          baseUrl: "",
        });
        loadModels();
      }
    } catch (error) {
      console.error("Erro ao salvar modelo:", error);
    }
  };

  const handleUpdate = async (id: number) => {
    const model = models.find((m) => m.id === id);
    if (!model) return;

    try {
      const response = await fetch("/api/ai-models", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id,
          name: model.name,
          provider: model.provider,
          model: model.model,
          apiKey: model.api_key,
          baseUrl: model.base_url,
          isActive: model.is_active,
        }),
      });

      if (response.ok) {
        setEditingId(null);
        loadModels();
      }
    } catch (error) {
      console.error("Erro ao atualizar modelo:", error);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Tem certeza que deseja remover este modelo?")) return;

    try {
      const response = await fetch(`/api/ai-models?id=${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        loadModels();
      }
    } catch (error) {
      console.error("Erro ao remover modelo:", error);
    }
  };

  const handleToggleActive = async (id: number) => {
    const model = models.find((m) => m.id === id);
    if (!model) return;

    try {
      const response = await fetch("/api/ai-models", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id,
          name: model.name,
          provider: model.provider,
          model: model.model,
          apiKey: model.api_key,
          baseUrl: model.base_url,
          isActive: !model.is_active,
        }),
      });

      if (response.ok) {
        loadModels();
      }
    } catch (error) {
      console.error("Erro ao alterar status do modelo:", error);
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
            Configurações de Modelos de IA
          </h3>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus className="h-4 w-4" />
          <span>Novo Modelo</span>
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
              onClick={loadModels}
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
            <h4 className="text-lg font-medium">Novo Modelo de IA</h4>
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
                Provedor
              </label>
              <input
                type="text"
                value={formData.provider}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, provider: e.target.value }))
                }
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Modelo
              </label>
              <input
                type="text"
                value={formData.model}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, model: e.target.value }))
                }
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                API Key (opcional)
              </label>
              <input
                type="password"
                value={formData.apiKey}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, apiKey: e.target.value }))
                }
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                URL Base (opcional)
              </label>
              <input
                type="url"
                value={formData.baseUrl}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, baseUrl: e.target.value }))
                }
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
        {models.map((model) => (
          <div
            key={model.id}
            className="bg-white border border-gray-200 rounded-lg p-6"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-2">
                  <h4 className="text-lg font-medium text-gray-900">
                    {model.name}
                  </h4>
                  {model.is_active && (
                    <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">
                      Ativo
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="text-sm text-gray-600">
                      <strong>Provedor:</strong> {model.provider}
                    </p>
                    <p className="text-sm text-gray-600">
                      <strong>Modelo:</strong> {model.model}
                    </p>
                  </div>
                  <div>
                    {model.api_key && (
                      <p className="text-sm text-gray-600">
                        <Key className="h-4 w-4 inline mr-1" />
                        API Key configurada
                      </p>
                    )}
                    {model.base_url && (
                      <p className="text-sm text-gray-600">
                        <Globe className="h-4 w-4 inline mr-1" />
                        URL Base configurada
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex space-x-2">
                  <button
                    onClick={() => handleToggleActive(model.id)}
                    className={`px-3 py-1 text-sm rounded ${
                      model.is_active
                        ? "bg-red-600 text-white hover:bg-red-700"
                        : "bg-green-600 text-white hover:bg-green-700"
                    }`}
                  >
                    {model.is_active ? "Desativar" : "Ativar"}
                  </button>
                  <button
                    onClick={() => setEditingId(model.id)}
                    className="flex items-center space-x-1 text-blue-600 hover:text-blue-700"
                  >
                    <Edit className="h-4 w-4" />
                    <span>Editar</span>
                  </button>
                  <button
                    onClick={() => handleDelete(model.id)}
                    className="flex items-center space-x-1 text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                    <span>Remover</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
