/**
 * Análisis de Riesgos 5D - 5 dimensiones de riesgo en uso de IA
 */
import React, { useState, useEffect } from 'react';
import { sessionService } from '@/core/services/SessionService';
import { httpClient } from '@/core/http/HttpClient';
import { SessionMode, RiskLevel } from '@/types/api.types';
import { useToast } from '@/shared/components/Toast/Toast';
import './RiskAnalyzer.css';

interface RiskDimension {
  score: number;
  level: RiskLevel;
  indicators: string[];
}

interface RiskAnalysis {
  session_id: string;
  overall_score: number;
  risk_level: RiskLevel;
  dimensions: {
    cognitive: RiskDimension;
    ethical: RiskDimension;
    epistemic: RiskDimension;
    technical: RiskDimension;
    governance: RiskDimension;
  };
  top_risks: Array<{
    dimension: string;
    description: string;
    severity: RiskLevel;
    mitigation: string;
  }>;
  recommendations: string[];
}

const DIMENSION_CONFIG = {
  cognitive: {
    name: 'Cognitiva',
    icon: '🧠',
    color: '#3b82f6',
    description: 'Pérdida de habilidades de pensamiento crítico'
  },
  ethical: {
    name: 'Ética',
    icon: '⚖️',
    color: '#8b5cf6',
    description: 'Plagio, falta de atribución, sesgos algorítmicos'
  },
  epistemic: {
    name: 'Epistémica',
    icon: '📚',
    color: '#10b981',
    description: 'Erosión de fundamentos teóricos, conocimiento superficial'
  },
  technical: {
    name: 'Técnica',
    icon: '⚙️',
    color: '#f59e0b',
    description: 'Dependencia de herramientas, falta de debugging manual'
  },
  governance: {
    name: 'Gobernanza',
    icon: '🏛️',
    color: '#ef4444',
    description: 'Falta de policies, ausencia de auditoría'
  }
};

export const RiskAnalyzer: React.FC = () => {
  const [sessions, setSessions] = useState<any[]>([]);
  const [selectedSession, setSelectedSession] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<RiskAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = async () => {
    try {
      const data = await sessionService.listAll();
      setSessions(data);
    } catch (error: any) {
      showToast(`Error cargando sesiones: ${error.message}`, 'error');
    }
  };

  const analyzeRisks = async (sessionId: string) => {
    setLoading(true);
    setSelectedSession(sessionId);

    try {
      const response = await httpClient.get<RiskAnalysis>(`/risks/${sessionId}`);
      setAnalysis(response);

      // Alert if critical risks
      if (response.risk_level === RiskLevel.CRITICAL) {
        showToast('⚠️ Riesgos críticos detectados', 'error', 10000);
      }
    } catch (error: any) {
      showToast(`Error analizando riesgos: ${error.message}`, 'error');
      setAnalysis(null);
    } finally {
      setLoading(false);
    }
  };

  const getRiskLevelColor = (level: string): string => {
    const colors: any = {
      low: '#10b981',
      medium: '#f59e0b',
      high: '#ef4444',
      critical: '#991b1b',
      info: '#6b7280'
    };
    return colors[level] || '#6b7280';
  };

  const getRiskLevelLabel = (level: RiskLevel): string => {
    const labels: Record<string, string> = {
      [RiskLevel.LOW]: 'Bajo',
      [RiskLevel.MEDIUM]: 'Medio',
      [RiskLevel.HIGH]: 'Alto',
      [RiskLevel.CRITICAL]: 'Crítico',
      [RiskLevel.INFO]: 'Info'
    };
    return labels[level] || 'Desconocido';
  };

  return (
    <div className="risk-analyzer">
      <div className="analyzer-header">
        <div>
          <h1>⚠️ Análisis de Riesgos 5D</h1>
          <p>Evaluación multidimensional de riesgos en el uso de IA educativa</p>
        </div>
      </div>

      <div className="analyzer-content">
        <aside className="sessions-sidebar">
          <h3>Sesiones Disponibles</h3>
          {sessions.length === 0 ? (
            <div className="empty-state">
              <p>📭 No hay sesiones para analizar</p>
            </div>
          ) : (
            <ul className="sessions-list">
              {sessions.map((session) => (
                <li
                  key={session.id}
                  className={`session-item ${selectedSession === session.id ? 'active' : ''}`}
                  onClick={() => analyzeRisks(session.id)}
                >
                  <div className="session-title">
                    <strong>{session.activity_id}</strong>
                  </div>
                  <div className="session-meta">
                    <span>👤 {session.student_id}</span>
                    <span>📅 {new Date(session.created_at).toLocaleDateString()}</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </aside>

        <main className="analysis-panel">
          {loading && (
            <div className="loading-state">
              <div className="spinner"></div>
              <p>Analizando riesgos en 5 dimensiones...</p>
            </div>
          )}

          {!loading && !analysis && (
            <div className="empty-state-large">
              <div className="empty-icon">⚠️</div>
              <p>👈 Selecciona una sesión para analizar riesgos</p>
              <small>El análisis examina 5 dimensiones de riesgo</small>
            </div>
          )}

          {!loading && analysis && (
            <div className="analysis-results">
              {/* Overall Risk */}
              <div className="overall-risk">
                <div
                  className="risk-badge"
                  style={{
                    backgroundColor: getRiskLevelColor(analysis.risk_level),
                    color: 'white'
                  }}
                >
                  <div className="risk-score">{analysis.overall_score}/50</div>
                  <div className="risk-level">
                    RIESGO {getRiskLevelLabel(analysis.risk_level).toUpperCase()}
                  </div>
                </div>
              </div>

              {/* 5 Dimensions */}
              <div className="dimensions-section">
                <h2>📊 5 Dimensiones de Riesgo</h2>
                <div className="dimensions-grid">
                  {Object.entries(analysis.dimensions).map(([key, dimension]) => {
                    const config = DIMENSION_CONFIG[key as keyof typeof DIMENSION_CONFIG];
                    return (
                      <DimensionCard
                        key={key}
                        name={config.name}
                        icon={config.icon}
                        color={config.color}
                        description={config.description}
                        dimension={dimension}
                      />
                    );
                  })}
                </div>
              </div>

              {/* Top Risks */}
              <div className="top-risks-section">
                <h2>🔴 Principales Riesgos Detectados</h2>
                <div className="risks-list">
                  {analysis.top_risks.map((risk, idx) => (
                    <div
                      key={idx}
                      className="risk-item"
                      style={{
                        borderLeftColor: getRiskLevelColor(risk.severity)
                      }}
                    >
                      <div className="risk-header">
                        <span className="risk-dimension">
                          {DIMENSION_CONFIG[risk.dimension as keyof typeof DIMENSION_CONFIG]?.icon}{' '}
                          {risk.dimension}
                        </span>
                        <span
                          className="risk-severity"
                          style={{
                            backgroundColor: getRiskLevelColor(risk.severity),
                            color: 'white'
                          }}
                        >
                          {getRiskLevelLabel(risk.severity)}
                        </span>
                      </div>
                      <div className="risk-description">{risk.description}</div>
                      <div className="risk-mitigation">
                        <strong>💡 Mitigación:</strong> {risk.mitigation}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recommendations */}
              <div className="recommendations-section">
                <h2>💡 Recomendaciones de Mitigación</h2>
                <ol className="recommendations-list">
                  {analysis.recommendations.map((rec, idx) => (
                    <li key={idx}>{rec}</li>
                  ))}
                </ol>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

const DimensionCard: React.FC<{
  name: string;
  icon: string;
  color: string;
  description: string;
  dimension: RiskDimension;
}> = ({ name, icon, color, description, dimension }) => {
  const getRiskLevelColor = (level: RiskLevel): string => {
    const colors: Record<string, string> = {
      low: '#10b981',
      medium: '#f59e0b',
      high: '#ef4444',
      critical: '#991b1b',
      info: '#6b7280'
    };
    return colors[level] || '#6b7280';
  };

  return (
    <div className="dimension-card" style={{ borderColor: color }}>
      <div className="dimension-header">
        <div className="dimension-icon" style={{ backgroundColor: `${color}20`, color }}>
          {icon}
        </div>
        <div>
          <h3>{name}</h3>
          <p className="dimension-desc">{description}</p>
        </div>
      </div>

      <div className="dimension-score">
        <div className="score-label">Score de Riesgo</div>
        <div className="score-value" style={{ color }}>
          {dimension.score}/10
        </div>
        <div className="score-bar">
          <div
            className="score-fill"
            style={{
              width: `${(dimension.score / 10) * 100}%`,
              backgroundColor: getRiskLevelColor(dimension.level)
            }}
          />
        </div>
      </div>

      <div className="dimension-indicators">
        <strong>Indicadores:</strong>
        <ul>
          {dimension.indicators.map((indicator, idx) => (
            <li key={idx}>{indicator}</li>
          ))}
        </ul>
      </div>
    </div>
  );
};
