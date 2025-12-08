import { useState } from 'react';
import { apiClient } from '../services/apiClient';

export function GitAnalyticsPage() {
  const [sessionId, setSessionId] = useState('');
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sessionId.trim()) {
      alert('Ingresa un ID de sesión');
      return;
    }

    setLoading(true);
    try {
      const response = await apiClient.getGitAnalytics(sessionId);
      setAnalytics(response.data);
    } catch (error: any) {
      console.error('Error:', error);
      alert(error.response?.data?.detail || 'Error al analizar Git');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Git Analytics (N2)</h1>
        <p className="text-gray-600 mt-2">Análisis de trazas Git y patrones de desarrollo</p>
      </div>

      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Analizar Repositorio</h2>
        <form onSubmit={handleAnalyze} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              ID de Sesión
            </label>
            <input
              type="text"
              value={sessionId}
              onChange={(e) => setSessionId(e.target.value)}
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Ingresa el ID de la sesión"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Analizando...' : 'Analizar Git'}
          </button>
        </form>
      </div>

      {analytics && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white shadow rounded-lg p-6">
              <div className="flex items-center mb-2">
                <span className="text-2xl mr-3">📊</span>
                <h3 className="text-lg font-semibold text-gray-900">Total Commits</h3>
              </div>
              <p className="text-3xl font-bold text-blue-600">{analytics.total_commits || 0}</p>
            </div>

            <div className="bg-white shadow rounded-lg p-6">
              <div className="flex items-center mb-2">
                <span className="text-2xl mr-3">⏱️</span>
                <h3 className="text-lg font-semibold text-gray-900">Frecuencia</h3>
              </div>
              <p className="text-3xl font-bold text-green-600">{analytics.commit_frequency || 'N/A'}</p>
              <p className="text-sm text-gray-500 mt-1">commits/día</p>
            </div>

            <div className="bg-white shadow rounded-lg p-6">
              <div className="flex items-center mb-2">
                <span className="text-2xl mr-3">✨</span>
                <h3 className="text-lg font-semibold text-gray-900">Calidad</h3>
              </div>
              <p className="text-3xl font-bold text-purple-600">{analytics.message_quality || 'N/A'}</p>
              <p className="text-sm text-gray-500 mt-1">score</p>
            </div>
          </div>

          {analytics.commits && analytics.commits.length > 0 && (
            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-xl font-semibold mb-4">Historial de Commits</h3>
              <div className="space-y-3">
                {analytics.commits.slice(0, 10).map((commit: any, idx: number) => (
                  <div key={idx} className="border-l-4 border-blue-500 pl-4 py-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium text-gray-900">{commit.message || 'Sin mensaje'}</p>
                        <p className="text-sm text-gray-500">{commit.author || 'Unknown'}</p>
                      </div>
                      <span className="text-xs text-gray-400">
                        {commit.timestamp ? new Date(commit.timestamp).toLocaleDateString() : ''}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {analytics.patterns && (
            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-xl font-semibold mb-4">Patrones Detectados</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(analytics.patterns).map(([key, value]: [string, any]) => (
                  <div key={key} className="border rounded-lg p-4">
                    <h4 className="font-semibold text-gray-900 mb-2 capitalize">{key.replace('_', ' ')}</h4>
                    <p className="text-gray-700">{typeof value === 'object' ? JSON.stringify(value) : value}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
