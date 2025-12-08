import { useState } from 'react';
import { apiClient } from '../services/apiClient';

const levels = [
  { id: 'N1', name: 'Raw Data', color: 'blue', icon: '📥' },
  { id: 'N2', name: 'Preprocessed', color: 'green', icon: '⚙️' },
  { id: 'N3', name: 'LLM Processing', color: 'purple', icon: '🤖' },
  { id: 'N4', name: 'Postprocessed', color: 'orange', icon: '📤' },
];

export function TraceabilityPage() {
  const [interactionId, setInteractionId] = useState('');
  const [traceData, setTraceData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const handleGetTrace = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!interactionId.trim()) {
      alert('Ingresa un ID de interacción');
      return;
    }

    setLoading(true);
    try {
      const response = await apiClient.getTraceability(interactionId);
      setTraceData(response.data);
    } catch (error: any) {
      console.error('Error:', error);
      alert(error.response?.data?.detail || 'Error al obtener trazabilidad');
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
              ID de Interacción
            </label>
            <input
              type="text"
              value={interactionId}
              onChange={(e) => setInteractionId(e.target.value)}
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Ingresa el ID de la interacción"
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
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-xl font-semibold mb-4">Flujo de Procesamiento</h3>
            <div className="relative">
              <div className="flex justify-between items-start">
                {levels.map((level, idx) => (
                  <div key={level.id} className="flex-1 relative">
                    <div className="text-center">
                      <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full bg-${level.color}-100 text-${level.color}-600 text-2xl mb-2`}>
                        {level.icon}
                      </div>
                      <h4 className="font-semibold text-gray-900">{level.id}</h4>
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

          {traceData.nodes && traceData.nodes.map((node: any) => (
            <div key={node.id} className="bg-white shadow rounded-lg p-6">
              <div className="flex items-center mb-4">
                <span className="text-2xl mr-3">
                  {levels.find(l => l.id === node.level)?.icon || '📄'}
                </span>
                <div>
                  <h4 className="font-semibold text-gray-900">{node.level} - {node.data?.description || 'Sin descripción'}</h4>
                  <p className="text-sm text-gray-500">{new Date(node.timestamp).toLocaleString()}</p>
                </div>
              </div>
              <div className="bg-gray-50 rounded p-4 overflow-x-auto">
                <pre className="text-xs text-gray-700">{JSON.stringify(node.data, null, 2)}</pre>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
