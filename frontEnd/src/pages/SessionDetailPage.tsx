import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiClient } from '../services/apiClient';
import { LoadingState, EmptyState, Badge } from '../components/ui';

interface SessionDetail {
  id: string;
  student_id: string;
  activity_id: string;
  mode: string;
  status: string;
  created_at: string;
  trace_count?: number;
  risk_count?: number;
}

interface TraceabilityData {
  session_id: string;
  summary: {
    total_events: number;
    total_traces: number;
    total_risks: number;
    total_evaluations: number;
    risks_by_level: { CRITICAL: number; HIGH: number; MEDIUM: number; LOW: number };
    ai_involvement_percentage: number;
  };
  graph: {
    events: any[];
    traces: any[];
    risks: any[];
    evaluations: any[];
  };
}

interface Risk {
  id: string;
  session_id: string;
  level: string;
  category: string;
  description: string;
  recommendation?: string;
  created_at: string;
}

interface Evaluation {
  id: string;
  session_id: string;
  planning_score: number;
  execution_score: number;
  debugging_score: number;
  reflection_score: number;
  autonomy_score: number;
  created_at: string;
}

export function SessionDetailPage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'overview' | 'traces' | 'risks' | 'evaluation'>('overview');
  const [session, setSession] = useState<SessionDetail | null>(null);
  const [traceability, setTraceability] = useState<TraceabilityData | null>(null);
  const [risks, setRisks] = useState<Risk[]>([]);
  const [evaluation, setEvaluation] = useState<Evaluation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (sessionId) {
      loadSessionData();
    }
  }, [sessionId]);

  const loadSessionData = async () => {
    setLoading(true);
    setError(null);
    try {
      // Load session basic info
      const sessionsResponse = await apiClient.getSessions('student_001');
      const sessionsList = sessionsResponse.data?.items || sessionsResponse.data || [];
      const sessionData = sessionsList.find((s: any) => s.id === sessionId);
      
      if (sessionData) {
        setSession(sessionData);
      }

      // Load traceability data
      try {
        const traceResponse = await apiClient.getSessionTraceability(sessionId!);
        setTraceability(traceResponse.data);
      } catch (err) {
        console.error('Error loading traceability:', err);
      }

      // Load risks
      try {
        const risksResponse = await apiClient.getRisks({ session_id: sessionId });
        setRisks(risksResponse.data?.items || risksResponse.data || []);
      } catch (err) {
        console.error('Error loading risks:', err);
      }

      // Load evaluation
      try {
        const evalResponse = await apiClient.getEvaluations({ session_id: sessionId });
        const evaluations = evalResponse.data?.items || evalResponse.data || [];
        if (evaluations.length > 0) {
          setEvaluation(evaluations[0]);
        }
      } catch (err) {
        console.error('Error loading evaluation:', err);
      }
    } catch (err: any) {
      setError(err.message || 'Error loading session data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingState type="spinner" message="Cargando detalles de la sesión..." />;
  }

  if (error || !session) {
    return (
      <EmptyState
        icon="⚠️"
        title="Error al cargar la sesión"
        description={error || 'No se encontró la sesión'}
        action={{ label: 'Volver a sesiones', onClick: () => navigate('/sessions') }}
      />
    );
  }

  const tabs = [
    { id: 'overview' as const, label: 'Resumen', icon: '📊' },
    { id: 'traces' as const, label: 'Trazabilidad', icon: '🔍', count: traceability?.summary.total_traces || 0 },
    { id: 'risks' as const, label: 'Riesgos', icon: '⚠️', count: risks.length },
    { id: 'evaluation' as const, label: 'Evaluación', icon: '📈', disabled: !evaluation }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <button
          onClick={() => navigate('/sessions')}
          className="text-blue-600 hover:text-blue-700 mb-4 flex items-center gap-2"
        >
          ← Volver a sesiones
        </button>
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{session.activity_id}</h1>
            <p className="text-gray-500 mt-1">Sesión #{session.id.slice(0, 8)}</p>
            <p className="text-sm text-gray-400 mt-1">
              Creada: {new Date(session.created_at).toLocaleString()}
            </p>
          </div>
          <div className="flex gap-2">
            <Badge variant={session.status === 'active' ? 'success' : 'default'}>
              {session.status}
            </Badge>
            <Badge variant="info">{session.mode}</Badge>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <div className="flex gap-4">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => !tab.disabled && setActiveTab(tab.id)}
              disabled={tab.disabled}
              className={`pb-3 px-2 border-b-2 transition-colors flex items-center gap-2 ${
                activeTab === tab.id
                  ? 'border-blue-600 text-blue-600'
                  : tab.disabled
                  ? 'border-transparent text-gray-300 cursor-not-allowed'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <span>{tab.icon}</span>
              <span className="font-medium">{tab.label}</span>
              {tab.count !== undefined && (
                <span className="bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded-full">
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="bg-white shadow rounded-lg p-6">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold mb-4">Información General</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="text-3xl font-bold text-blue-600">
                    {traceability?.summary.total_traces || session.trace_count || 0}
                  </div>
                  <div className="text-sm text-gray-600 mt-1">Trazas</div>
                </div>
                <div className="bg-orange-50 p-4 rounded-lg">
                  <div className="text-3xl font-bold text-orange-600">
                    {risks.length || session.risk_count || 0}
                  </div>
                  <div className="text-sm text-gray-600 mt-1">Riesgos</div>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg">
                  <div className="text-3xl font-bold text-purple-600">
                    {traceability?.summary.total_events || 0}
                  </div>
                  <div className="text-sm text-gray-600 mt-1">Eventos</div>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="text-3xl font-bold text-green-600">
                    {traceability?.summary?.ai_involvement_percentage?.toFixed(0) || 0}%
                  </div>
                  <div className="text-sm text-gray-600 mt-1">IA Activa</div>
                </div>
              </div>
            </div>

            {/* Risks Summary */}
            {risks.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-3">Distribución de Riesgos</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].map((level) => {
                    const count = risks.filter((r) => r.level === level).length;
                    const colors = {
                      CRITICAL: 'bg-red-100 text-red-800',
                      HIGH: 'bg-orange-100 text-orange-800',
                      MEDIUM: 'bg-yellow-100 text-yellow-800',
                      LOW: 'bg-green-100 text-green-800'
                    };
                    return (
                      <div key={level} className={`p-3 rounded-lg ${colors[level as keyof typeof colors]}`}>
                        <div className="text-2xl font-bold">{count}</div>
                        <div className="text-xs">{level}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Evaluation Summary */}
            {evaluation && (
              <div>
                <h3 className="text-lg font-semibold mb-3">Puntuaciones</h3>
                <div className="space-y-2">
                  {[
                    { label: 'Planificación', score: evaluation.planning_score },
                    { label: 'Ejecución', score: evaluation.execution_score },
                    { label: 'Debugging', score: evaluation.debugging_score },
                    { label: 'Reflexión', score: evaluation.reflection_score },
                    { label: 'Autonomía', score: evaluation.autonomy_score }
                  ].map((item) => (
                    <div key={item.label} className="flex items-center gap-3">
                      <div className="w-32 text-sm text-gray-600">{item.label}</div>
                      <div className="flex-1 bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${
                            item.score >= 7 ? 'bg-green-500' : item.score >= 5 ? 'bg-yellow-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${(item.score / 10) * 100}%` }}
                        />
                      </div>
                      <div className="w-12 text-right font-medium">{item.score.toFixed(1)}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'traces' && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Trazabilidad Completa</h2>
            {traceability ? (
              <div className="space-y-6">
                {/* Events */}
                <div>
                  <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
                    <span className="text-2xl">📅</span>
                    Eventos ({traceability.summary.total_events})
                  </h3>
                  <div className="space-y-2">
                    {traceability.graph.events.map((event, idx) => (
                      <div key={idx} className="bg-gray-50 p-3 rounded border-l-4 border-blue-500">
                        <div className="font-medium">{event.event_type}</div>
                        <div className="text-sm text-gray-600">{event.description || 'Sin descripción'}</div>
                        <div className="text-xs text-gray-400 mt-1">
                          {new Date(event.timestamp).toLocaleString()}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Traces */}
                <div>
                  <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
                    <span className="text-2xl">🔗</span>
                    Trazas ({traceability.summary.total_traces})
                  </h3>
                  <div className="space-y-2">
                    {traceability.graph.traces.slice(0, 5).map((trace, idx) => (
                      <div key={idx} className="bg-gray-50 p-3 rounded border-l-4 border-purple-500">
                        <div className="font-medium">{trace.interaction_type}</div>
                        <div className="text-sm text-gray-600">{trace.content?.substring(0, 100)}...</div>
                      </div>
                    ))}
                    {traceability.graph.traces.length > 5 && (
                      <div className="text-sm text-gray-500 text-center">
                        + {traceability.graph.traces.length - 5} trazas más
                      </div>
                    )}
                  </div>
                </div>

                {/* Risks */}
                {traceability.graph.risks.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
                      <span className="text-2xl">⚠️</span>
                      Riesgos Detectados ({traceability.summary.total_risks})
                    </h3>
                    <div className="space-y-2">
                      {traceability.graph.risks.map((risk, idx) => (
                        <div key={idx} className="bg-gray-50 p-3 rounded border-l-4 border-orange-500">
                          <Badge variant={risk.level === 'CRITICAL' ? 'error' : 'warning'} size="sm">
                            {risk.level}
                          </Badge>
                          <div className="font-medium mt-1">{risk.category}</div>
                          <div className="text-sm text-gray-600">{risk.description}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <EmptyState
                icon="📭"
                title="No hay datos de trazabilidad"
                description="Aún no se han generado trazas para esta sesión"
              />
            )}
          </div>
        )}

        {activeTab === 'risks' && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Análisis de Riesgos</h2>
            {risks.length > 0 ? (
              <div className="space-y-3">
                {risks.map((risk) => {
                  const levelColors = {
                    CRITICAL: 'border-red-500 bg-red-50',
                    HIGH: 'border-orange-500 bg-orange-50',
                    MEDIUM: 'border-yellow-500 bg-yellow-50',
                    LOW: 'border-green-500 bg-green-50'
                  };
                  return (
                    <div
                      key={risk.id}
                      className={`p-4 rounded-lg border-l-4 ${levelColors[risk.level as keyof typeof levelColors] || 'border-gray-500 bg-gray-50'}`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <Badge variant={risk.level === 'CRITICAL' ? 'error' : 'warning'}>
                          {risk.level}
                        </Badge>
                        <span className="text-xs text-gray-500">
                          {new Date(risk.created_at).toLocaleString()}
                        </span>
                      </div>
                      <h3 className="font-semibold text-gray-900">{risk.category}</h3>
                      <p className="text-sm text-gray-700 mt-1">{risk.description}</p>
                      {risk.recommendation && (
                        <div className="mt-3 bg-white p-3 rounded border border-gray-200">
                          <div className="text-xs font-medium text-gray-500 mb-1">Recomendación:</div>
                          <p className="text-sm text-gray-700">{risk.recommendation}</p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <EmptyState
                icon="✅"
                title="No se detectaron riesgos"
                description="Esta sesión no presenta riesgos cognitivos identificados"
              />
            )}
          </div>
        )}

        {activeTab === 'evaluation' && evaluation && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold">Evaluación Cognitiva</h2>
            
            {/* Scores Chart */}
            <div className="space-y-4">
              {[
                { label: 'Planificación', score: evaluation.planning_score, icon: '🎯' },
                { label: 'Ejecución', score: evaluation.execution_score, icon: '⚡' },
                { label: 'Debugging', score: evaluation.debugging_score, icon: '🐛' },
                { label: 'Reflexión', score: evaluation.reflection_score, icon: '💭' },
                { label: 'Autonomía', score: evaluation.autonomy_score, icon: '🎓' }
              ].map((item) => (
                <div key={item.label}>
                  <div className="flex justify-between items-center mb-2">
                    <div className="flex items-center gap-2">
                      <span>{item.icon}</span>
                      <span className="font-medium text-gray-700">{item.label}</span>
                    </div>
                    <span className="text-2xl font-bold text-gray-900">{item.score.toFixed(1)}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className={`h-3 rounded-full transition-all ${
                        item.score >= 7 ? 'bg-green-500' : item.score >= 5 ? 'bg-yellow-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${(item.score / 10) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Average Score */}
            <div className="bg-blue-50 p-6 rounded-lg text-center">
              <div className="text-sm text-gray-600 mb-2">Puntuación Promedio</div>
              <div className="text-5xl font-bold text-blue-600">
                {(
                  (evaluation.planning_score +
                    evaluation.execution_score +
                    evaluation.debugging_score +
                    evaluation.reflection_score +
                    evaluation.autonomy_score) /
                  5
                ).toFixed(1)}
              </div>
              <div className="text-sm text-gray-500 mt-2">/ 10</div>
            </div>

            <div className="text-xs text-gray-400 text-center">
              Evaluación generada: {new Date(evaluation.created_at).toLocaleString()}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
