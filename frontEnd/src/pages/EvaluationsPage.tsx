import { useState } from 'react';
import { apiClient } from '../services/apiClient';

export function EvaluationsPage() {
  const [sessionId, setSessionId] = useState('');
  const [evaluation, setEvaluation] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const handleGenerateEvaluation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sessionId.trim()) {
      alert('Ingresa un ID de sesión');
      return;
    }

    setLoading(true);
    try {
      const response = await apiClient.generateEvaluation(sessionId);
      setEvaluation(response.data);
    } catch (error: any) {
      console.error('Error generating evaluation:', error);
      alert(error.response?.data?.detail || 'Error al generar evaluación');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Evaluaciones Cognitivas</h1>
        <p className="text-gray-600 mt-2">Evaluación basada en procesos (E-IA-Proc)</p>
      </div>

      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Generar Evaluación</h2>
        <form onSubmit={handleGenerateEvaluation} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              ID de Sesión
            </label>
            <input
              type="text"
              value={sessionId}
              onChange={(e) => setSessionId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Ingresa el ID de la sesión a evaluar"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {loading ? 'Generando...' : 'Generar Evaluación'}
          </button>
        </form>
      </div>

      {evaluation && (
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Resultado de la Evaluación</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            <div className="border border-gray-200 rounded-lg p-4">
              <h3 className="text-sm font-medium text-gray-500 mb-1">Planificación</h3>
              <div className="text-2xl font-bold text-blue-600">{evaluation.planning?.score || 0}/10</div>
              <div className="text-xs text-gray-500 mt-1">{evaluation.planning?.level || 'N/A'}</div>
            </div>

            <div className="border border-gray-200 rounded-lg p-4">
              <h3 className="text-sm font-medium text-gray-500 mb-1">Ejecución</h3>
              <div className="text-2xl font-bold text-green-600">{evaluation.execution?.score || 0}/10</div>
              <div className="text-xs text-gray-500 mt-1">{evaluation.execution?.level || 'N/A'}</div>
            </div>

            <div className="border border-gray-200 rounded-lg p-4">
              <h3 className="text-sm font-medium text-gray-500 mb-1">Debugging</h3>
              <div className="text-2xl font-bold text-yellow-600">{evaluation.debugging?.score || 0}/10</div>
              <div className="text-xs text-gray-500 mt-1">{evaluation.debugging?.level || 'N/A'}</div>
            </div>

            <div className="border border-gray-200 rounded-lg p-4">
              <h3 className="text-sm font-medium text-gray-500 mb-1">Reflexión</h3>
              <div className="text-2xl font-bold text-purple-600">{evaluation.reflection?.score || 0}/10</div>
              <div className="text-xs text-gray-500 mt-1">{evaluation.reflection?.level || 'N/A'}</div>
            </div>

            <div className="border border-gray-200 rounded-lg p-4">
              <h3 className="text-sm font-medium text-gray-500 mb-1">Autonomía</h3>
              <div className="text-2xl font-bold text-indigo-600">{evaluation.autonomy?.score || 0}/10</div>
              <div className="text-xs text-gray-500 mt-1">{evaluation.autonomy?.level || 'N/A'}</div>
            </div>

            <div className="border border-gray-200 rounded-lg p-4">
              <h3 className="text-sm font-medium text-gray-500 mb-1">Metacognición</h3>
              <div className="text-2xl font-bold text-pink-600">{evaluation.metacognition_score || 0}/10</div>
            </div>
          </div>

          <div className="border-t pt-4">
            <h3 className="font-semibold text-gray-900 mb-2">Feedback General</h3>
            <p className="text-gray-700 whitespace-pre-wrap">{evaluation.overall_feedback}</p>
          </div>
        </div>
      )}
    </div>
  );
}
