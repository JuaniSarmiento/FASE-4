import { useState } from 'react';
import { apiClient } from '../services/apiClient';

const levels = [
  { id: 1, name: 'Eventos de Simulador', color: 'blue', icon: '📥' },
  { id: 2, name: 'Trazas Cognitivas', color: 'green', icon: '🧠' },
  { id: 3, name: 'Riesgos Detectados', color: 'orange', icon: '⚠️' },
  { id: 4, name: 'Evaluaciones', color: 'purple', icon: '📊' },
];

export function TraceabilityPage() {
  const [sessionId, setSessionId] = useState('');
  const [traceData, setTraceData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const handleGetTrace = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sessionId.trim()) {
      alert('Ingresa un ID de sesión');
      return;
    }

    setLoading(true);
    try {
      // Usar endpoint de trazabilidad por sesión (TC-N4)
      const response = await apiClient.getSessionTraceability(sessionId);
      setTraceData(response.data);
    } catch (error: any) {
      console.error('Error:', error);
      alert(error.response?.data?.detail || 'Error al obtener trazabilidad');
      setTraceData(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Trazabilidad Cognitiva (TC-N4)</h1>
        <p className="text-gray-600 mt-2">Seguimiento completo en 4 niveles de procesamiento</p>
      </div>

      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Consultar Trazabilidad</h2>
        <form onSubmit={handleGetTrace} className="space-y-4">
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
            {loading ? 'Consultando...' : 'Obtener Trazabilidad'}
          </button>
        </form>
      </div>

      {traceData && (
        <div className="space-y-4">
          {/* Resumen */}
          {traceData.summary && (
            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-xl font-semibold mb-4">Resumen de Trazabilidad</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded">
                  <div className="text-2xl font-bold text-blue-600">{traceData.summary.total_events || 0}</div>
                  <div className="text-sm text-gray-600">Eventos</div>
                </div>
                <div className="text-center p-4 bg-green-50 rounded">
                  <div className="text-2xl font-bold text-green-600">{traceData.summary.total_traces || 0}</div>
                  <div className="text-sm text-gray-600">Trazas</div>
                </div>
                <div className="text-center p-4 bg-orange-50 rounded">
                  <div className="text-2xl font-bold text-orange-600">{traceData.summary.total_risks || 0}</div>
                  <div className="text-sm text-gray-600">Riesgos</div>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded">
                  <div className="text-2xl font-bold text-purple-600">{traceData.summary.total_evaluations || 0}</div>
                  <div className="text-sm text-gray-600">Evaluaciones</div>
                </div>
              </div>
              {traceData.summary.avg_ai_involvement !== undefined && (
                <div className="mt-4 text-center">
                  <p className="text-sm text-gray-600">
                    Promedio de involucramiento de IA: <strong>{(traceData.summary.avg_ai_involvement * 100).toFixed(1)}%</strong>
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Flujo de 4 niveles */}
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-xl font-semibold mb-4">Flujo de Procesamiento (TC-N4)</h3>
            <div className="relative">
              <div className="flex justify-between items-start">
                {levels.map((level, idx) => (
                  <div key={level.id} className="flex-1 relative">
                    <div className="text-center">
                      <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full bg-${level.color}-100 text-${level.color}-600 text-2xl mb-2`}>
                        {level.icon}
                      </div>
                      <h4 className="font-semibold text-gray-900">Nivel {level.id}</h4>
                      <p className="text-sm text-gray-600">{level.name}</p>
                    </div>
                    {idx < levels.length - 1 && (
                      <div className="absolute top-8 left-1/2 w-full h-0.5 bg-gray-300" style={{ zIndex: -1 }}></div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Artefactos por nivel */}
          {traceData.artifacts && traceData.artifacts.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-xl font-semibold">Artefactos de Trazabilidad</h3>
              {traceData.artifacts.map((artifact: any, idx: number) => (
                <div key={idx} className="bg-white shadow rounded-lg p-6">
                  <div className="flex items-center mb-4">
                    <span className="text-2xl mr-3">
                      {levels.find(l => l.id === artifact.level)?.icon || '📄'}
                    </span>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold text-gray-900">{artifact.type}</h4>
                        <span className="px-2 py-1 text-xs rounded bg-blue-100 text-blue-800">
                          Nivel {artifact.level}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500">ID: {artifact.id}</p>
                    </div>
                  </div>
                  
                  {artifact.metadata && (
                    <div className="bg-gray-50 rounded p-4 mb-4">
                      <p className="text-sm text-gray-700">{artifact.metadata.description || 'Sin descripción'}</p>
                      {artifact.metadata.timestamp && (
                        <p className="text-xs text-gray-500 mt-2">
                          {new Date(artifact.metadata.timestamp).toLocaleString()}
                        </p>
                      )}
                    </div>
                  )}

                  {artifact.children && artifact.children.length > 0 && (
                    <div className="mt-4 pl-4 border-l-2 border-gray-200">
                      <p className="text-sm font-medium text-gray-700 mb-2">
                        Elementos relacionados ({artifact.children.length}):
                      </p>
                      <div className="space-y-2">
                        {artifact.children.slice(0, 5).map((child: any, childIdx: number) => (
                          <div key={childIdx} className="text-sm text-gray-600 flex items-start">
                            <span className="mr-2">→</span>
                            <span>{child.type} (Nivel {child.level})</span>
                          </div>
                        ))}
                        {artifact.children.length > 5 && (
                          <p className="text-xs text-gray-500">
                            ... y {artifact.children.length - 5} más
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Distribución de riesgos */}
          {traceData.summary?.risks_by_level && Object.keys(traceData.summary.risks_by_level).length > 0 && (
            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-xl font-semibold mb-4">Distribución de Riesgos</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {Object.entries(traceData.summary.risks_by_level).map(([level, count]: [string, any]) => (
                  <div key={level} className={`p-4 rounded text-center ${
                    level === 'CRITICAL' ? 'bg-red-50' :
                    level === 'HIGH' ? 'bg-orange-50' :
                    level === 'MEDIUM' ? 'bg-yellow-50' :
                    'bg-green-50'
                  }`}>
                    <div className={`text-2xl font-bold ${
                      level === 'CRITICAL' ? 'text-red-600' :
                      level === 'HIGH' ? 'text-orange-600' :
                      level === 'MEDIUM' ? 'text-yellow-600' :
                      'text-green-600'
                    }`}>{count}</div>
                    <div className="text-sm text-gray-600">{level}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
