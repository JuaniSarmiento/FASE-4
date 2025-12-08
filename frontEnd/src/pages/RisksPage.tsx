import { useState } from 'react';
import { apiClient } from '../services/apiClient';

const riskDimensions = [
  { name: 'Cognitiva', key: 'cognitive', color: 'blue', icon: '🧠' },
  { name: 'Ética', key: 'ethical', color: 'green', icon: '⚖️' },
  { name: 'Epistémica', key: 'epistemic', color: 'purple', icon: '📚' },
  { name: 'Técnica', key: 'technical', color: 'yellow', icon: '⚙️' },
  { name: 'Gobernanza', key: 'governance', color: 'red', icon: '🛡️' },
];

export function RisksPage() {
  const [sessionId, setSessionId] = useState('');
  const [analysis, setAnalysis] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sessionId.trim()) {
      alert('Ingresa un ID de sesión');
      return;
    }

    setLoading(true);
    try {
      const response = await apiClient.analyzeRisks(sessionId);
      setAnalysis(response.data);
    } catch (error: any) {
      console.error('Error:', error);
      alert(error.response?.data?.detail || 'Error al analizar riesgos');
    } finally {
      setLoading(false);
    }
  };

  const getRiskColor = (level: string) => {
    const colors: any = {
      low: 'green',
      medium: 'yellow',
      high: 'orange',
      critical: 'red'
    };
    return colors[level?.toLowerCase()] || 'gray';
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Análisis de Riesgos (AR-IA)</h1>
        <p className="text-gray-600 mt-2">Detección de riesgos en 5 dimensiones</p>
      </div>

      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Analizar Sesión</h2>
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
              placeholder="Ingresa el ID de la sesión a analizar"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Analizando...' : 'Analizar Riesgos'}
          </button>
        </form>
      </div>

      {analysis && (
        <>
          <div className="bg-white shadow rounded-lg p-6">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Nivel de Riesgo General</h2>
                <p className="text-gray-600">Puntuación: {analysis.overall_score || 0}/100</p>
              </div>
              <div className={`px-4 py-2 rounded-lg bg-${getRiskColor(analysis.risk_level)}-100 text-${getRiskColor(analysis.risk_level)}-800`}>
                <span className="font-semibold uppercase">{analysis.risk_level || 'N/A'}</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {riskDimensions.map((dim) => {
              const dimData = analysis.dimensions?.[dim.key];
              return (
                <div key={dim.key} className="bg-white shadow rounded-lg p-6">
                  <div className="flex items-center mb-4">
                    <span className="text-3xl mr-3">{dim.icon}</span>
                    <h3 className="text-lg font-semibold text-gray-900">{dim.name}</h3>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Puntuación:</span>
                      <span className="font-bold text-lg">{dimData?.score || 0}/10</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Nivel:</span>
                      <span className={`px-2 py-1 rounded text-xs font-semibold bg-${getRiskColor(dimData?.level)}-100 text-${getRiskColor(dimData?.level)}-800`}>
                        {dimData?.level || 'N/A'}
                      </span>
                    </div>
                    {dimData?.indicators && dimData.indicators.length > 0 && (
                      <div className="mt-3">
                        <p className="text-xs text-gray-500 mb-1">Indicadores:</p>
                        <ul className="text-xs text-gray-700 space-y-1">
                          {dimData.indicators.slice(0, 3).map((ind: string, idx: number) => (
                            <li key={idx}>• {ind}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {analysis.recommendations && analysis.recommendations.length > 0 && (
            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-xl font-semibold mb-4">Recomendaciones</h3>
              <ul className="space-y-2">
                {analysis.recommendations.map((rec: string, idx: number) => (
                  <li key={idx} className="flex items-start">
                    <span className="text-blue-600 mr-2">✓</span>
                    <span className="text-gray-700">{rec}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}
    </div>
  );
}
