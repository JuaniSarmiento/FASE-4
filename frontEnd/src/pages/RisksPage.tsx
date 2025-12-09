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
  const [risks, setRisks] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sessionId.trim()) {
      alert('Ingresa un ID de sesión');
      return;
    }

    setLoading(true);
    setMessage('');
    try {
      // Usar el nuevo endpoint de análisis automático
      const response = await apiClient.analyzeSessionRisks(sessionId);
      setRisks(response.data || []);
      setMessage(response.message || `${response.data?.length || 0} riesgos detectados`);
    } catch (error: any) {
      console.error('Error:', error);
      alert(error.response?.data?.detail || 'Error al analizar riesgos');
      setRisks([]);
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

      {message && (
        <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded">
          <p className="text-blue-700">{message}</p>
        </div>
      )}

      {risks.length > 0 && (
        <div className="space-y-4">
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Riesgos Detectados</h2>
            <p className="text-gray-600 mb-6">Total: {risks.length} riesgos identificados automáticamente por AR-IA</p>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {risks.map((risk: any, idx: number) => (
              <div key={idx} className="bg-white shadow rounded-lg p-6 border-l-4" style={{
                borderLeftColor: risk.risk_level === 'CRITICAL' ? '#DC2626' : 
                                risk.risk_level === 'HIGH' ? '#F59E0B' : 
                                risk.risk_level === 'MEDIUM' ? '#FBBF24' : '#10B981'
              }}>
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                        risk.risk_level === 'CRITICAL' ? 'bg-red-100 text-red-800' :
                        risk.risk_level === 'HIGH' ? 'bg-orange-100 text-orange-800' :
                        risk.risk_level === 'MEDIUM' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {risk.risk_level}
                      </span>
                      <span className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
                        {risk.dimension}
                      </span>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      Riesgo #{idx + 1}
                    </h3>
                    <p className="text-gray-700 mb-3">{risk.description}</p>
                    
                    {risk.recommendations && risk.recommendations.length > 0 && (
                      <div className="mt-4">
                        <h4 className="font-semibold text-gray-900 text-sm mb-2">📋 Recomendaciones:</h4>
                        <ul className="space-y-1">
                          {risk.recommendations.map((rec: string, i: number) => (
                            <li key={i} className="text-sm text-gray-600 flex items-start">
                              <span className="text-green-600 mr-2">✓</span>
                              <span>{rec}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {risk.mitigation_strategies && risk.mitigation_strategies.length > 0 && (
                      <div className="mt-3">
                        <h4 className="font-semibold text-gray-900 text-sm mb-2">🛡️ Estrategias de Mitigación:</h4>
                        <ul className="space-y-1">
                          {risk.mitigation_strategies.map((strategy: string, i: number) => (
                            <li key={i} className="text-sm text-gray-600">• {strategy}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
                
                {risk.evidence && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <p className="text-xs text-gray-500">
                      <strong>Evidencia:</strong> {JSON.stringify(risk.evidence)}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {!loading && risks.length === 0 && sessionId && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
          <p className="text-gray-600">No se detectaron riesgos en esta sesión</p>
        </div>
      )}
    </div>
  );
}
