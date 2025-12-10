import React from 'react';
import { GitBranch, Zap, CheckCircle, ChevronRight } from 'lucide-react';
import { TraceabilityN4, TraceabilityNode } from '../types';

interface TraceabilityViewerProps {
  data: TraceabilityN4;
}

const TraceabilityViewer: React.FC<TraceabilityViewerProps> = ({ data }) => {
  const getLevelColor = (level: string) => {
    switch (level) {
      case 'N1':
        return 'from-blue-600 to-cyan-600';
      case 'N2':
        return 'from-purple-600 to-indigo-600';
      case 'N3':
        return 'from-pink-600 to-rose-600';
      case 'N4':
        return 'from-green-600 to-emerald-600';
      default:
        return 'from-gray-600 to-gray-700';
    }
  };

  const getLevelTitle = (level: string) => {
    switch (level) {
      case 'N1':
        return 'Raw Data - Datos Crudos';
      case 'N2':
        return 'Preprocessed - Preprocesamiento';
      case 'N3':
        return 'LLM Processing - Modelo IA';
      case 'N4':
        return 'Postprocessed - Salida Final';
      default:
        return level;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 mb-6">
        <GitBranch className="w-6 h-6 text-purple-400" />
        <div>
          <h3 className="text-xl font-bold text-white">Trazabilidad N4</h3>
          <p className="text-sm text-gray-400">
            Seguimiento completo del procesamiento en 4 niveles
          </p>
        </div>
      </div>

      <div className="relative">
        {/* Timeline Line */}
        <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gradient-to-b from-blue-500 via-purple-500 to-green-500" />

        {/* Nodes */}
        <div className="space-y-6">
          {data.nodes.map((node, index) => (
            <div key={node.id} className="relative pl-16">
              {/* Level Badge */}
              <div
                className={`absolute left-0 w-12 h-12 rounded-full bg-gradient-to-br ${getLevelColor(
                  node.level
                )} flex items-center justify-center shadow-lg border-4 border-gray-900`}
              >
                <span className="text-white font-bold text-sm">{node.level}</span>
              </div>

              {/* Content Card */}
              <div className="glass rounded-xl p-5 hover:border-purple-500/50 transition-all">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h4 className="font-bold text-white mb-1">{getLevelTitle(node.level)}</h4>
                    <p className="text-xs text-gray-400">
                      {new Date(node.timestamp).toLocaleString('es-AR')}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Zap className="w-4 h-4 text-yellow-400" />
                    <span className="text-gray-400">{node.metadata.processing_time_ms}ms</span>
                  </div>
                </div>

                {/* Transformations */}
                {node.metadata.transformations.length > 0 && (
                  <div className="mb-3">
                    <h5 className="text-xs font-semibold text-gray-400 mb-2">Transformaciones:</h5>
                    <div className="flex flex-wrap gap-2">
                      {node.metadata.transformations.map((transform, i) => (
                        <span
                          key={i}
                          className="text-xs px-2 py-1 bg-gray-800/50 text-gray-300 rounded-full"
                        >
                          {transform}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Data Preview */}
                <div className="bg-gray-900/50 rounded-lg p-3 border border-gray-800">
                  <pre className="text-xs text-gray-300 overflow-x-auto max-h-32 overflow-y-auto">
                    {JSON.stringify(node.data, null, 2)}
                  </pre>
                </div>
              </div>

              {/* Connector Arrow */}
              {index < data.nodes.length - 1 && (
                <div className="absolute left-6 -bottom-3 flex items-center justify-center">
                  <ChevronRight className="w-4 h-4 text-purple-400 transform rotate-90" />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Summary */}
      <div className="glass rounded-xl p-5 mt-6">
        <div className="flex items-center gap-2 mb-3">
          <CheckCircle className="w-5 h-5 text-green-400" />
          <h4 className="font-semibold text-white">Resumen de Procesamiento</h4>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="text-sm text-gray-400">Tiempo Total</div>
            <div className="text-lg font-bold text-white">
              {data.metadata?.total_processing_time_ms || 0}ms
            </div>
          </div>
          <div>
            <div className="text-sm text-gray-400">Niveles Procesados</div>
            <div className="text-lg font-bold text-white">{data.nodes?.length || 0}/4</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TraceabilityViewer;
