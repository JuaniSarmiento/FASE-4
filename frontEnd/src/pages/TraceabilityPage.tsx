/**
 * Traceability Page - TC-N4
 * Trazabilidad cognitiva de 4 niveles
 */
import React, { useState, useEffect } from 'react';
import { sessionsService, tracesService } from '@/services/api';
import { SessionMode, TraceLevel } from '@/types/api.types';
import type { CognitiveTrace } from '@/types/api.types';
import './TraceabilityPage.css';

const levelInfo: Record<TraceLevel, { name: string; icon: string; color: string; description: string }> = {
  [TraceLevel.N1_SUPERFICIAL]: {
    name: 'Nivel 1: Superficial',
    icon: '📝',
    color: '#4ade80',
    description: 'Registro básico de interacciones',
  },
  [TraceLevel.N2_TECNICO]: {
    name: 'Nivel 2: Técnico',
    icon: '🔍',
    color: '#f59e0b',
    description: 'Análisis de código y patrones',
  },
  [TraceLevel.N3_INTERACCIONAL]: {
    name: 'Nivel 3: Interaccional',
    icon: '🤖',
    color: '#8b5cf6',
    description: 'Flujo de diálogo estudiante-IA',
  },
  [TraceLevel.N4_COGNITIVO]: {
    name: 'Nivel 4: Cognitivo',
    icon: '📊',
    color: '#06b6d4',
    description: 'Estados mentales y estrategias',
  },
};

export const TraceabilityPage: React.FC = () => {
  const [sessionId, setSessionId] = useState('');
  const [traces, setTraces] = useState<CognitiveTrace[]>([]);
  const [selectedLevel, setSelectedLevel] = useState<TraceLevel | 'ALL'>('ALL');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadDemoSession();
  }, []);

  const loadDemoSession = async () => {
    try {
      // Crear sesión de demostración
      const session = await sessionsService.create({
        student_id: `traceability_demo_${Date.now()}`,
        activity_id: 'traceability_demo',
        mode: SessionMode.TUTOR,
      });
      
      setSessionId(session.id);
    } catch (error) {
      console.error('Error creating demo session:', error);
    }
  };

  const loadTraces = async () => {
    if (!sessionId.trim()) return;

    setLoading(true);
    try {
      // Obtener trazas de la sesión
      const sessionTraces = await tracesService.getBySession(sessionId);
      setTraces(sessionTraces);
    } catch (error) {
      console.error('Error loading traces:', error);
      setTraces([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredTraces = selectedLevel === 'ALL'
    ? traces
    : traces.filter(t => t.trace_level === selectedLevel);

  return (
    <div className="traceability-page">
      <header className="page-header">
        <div className="header-content">
          <div className="header-title">
            <span className="header-icon">🔍</span>
            <h1>Trazabilidad Cognitiva N4 (TC-N4)</h1>
          </div>
          <p className="header-subtitle">
            4 niveles de detalle • Reconstrucción de caminos cognitivos • Trazabilidad completa
          </p>
        </div>
      </header>

      <div className="traceability-content">
        {/* Search Section */}
        <div className="search-section">
          <h2 className="section-title">Buscar Trazas de Sesión</h2>
          <div className="search-box">
            <input
              type="text"
              className="session-input"
              placeholder="Ingresa el ID de la sesión..."
              value={sessionId}
              onChange={(e) => setSessionId(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && loadTraces()}
            />
            <button
              className="search-btn"
              onClick={loadTraces}
              disabled={!sessionId.trim()}
            >
              🔍 Buscar Trazas
            </button>
          </div>
        </div>

        {/* Levels Info */}
        <div className="levels-section">
          <h2 className="section-title">Niveles de Trazabilidad</h2>
          <div className="levels-grid">
            {Object.entries(levelInfo).map(([level, info]) => (
              <div
                key={level}
                className="level-card"
                style={{
                  '--level-color': info.color,
                } as React.CSSProperties}
              >
                <div className="level-header">
                  <span className="level-icon">{info.icon}</span>
                  <h3 className="level-name">{info.name}</h3>
                </div>
                <p className="level-description">{info.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Traces Results */}
        {traces.length > 0 && (
          <div className="traces-section">
            <div className="traces-header">
              <h2 className="section-title">
                Trazas Encontradas ({filteredTraces.length})
              </h2>
              <div className="level-filters">
                <button
                  className={`level-filter ${selectedLevel === 'ALL' ? 'active' : ''}`}
                  onClick={() => setSelectedLevel('ALL')}
                >
                  Todos
                </button>
                {Object.keys(levelInfo).map((level) => (
                  <button
                    key={level}
                    className={`level-filter ${selectedLevel === level ? 'active' : ''}`}
                    style={{
                      '--filter-color': levelInfo[level as TraceLevel].color,
                    } as React.CSSProperties}
                    onClick={() => setSelectedLevel(level as TraceLevel)}
                  >
                    {level}
                  </button>
                ))}
              </div>
            </div>

            <div className="traces-timeline">
              {filteredTraces.map((trace, index) => {
                const info = levelInfo[trace.trace_level as TraceLevel] || levelInfo[TraceLevel.N1_SUPERFICIAL];
                return (
                  <div
                    key={trace.id}
                    className="trace-item"
                    style={{
                      '--trace-color': info.color,
                    } as React.CSSProperties}
                  >
                    <div className="trace-marker">
                      <span className="trace-number">{index + 1}</span>
                      <div className="trace-line" />
                    </div>
                    <div className="trace-content">
                      <div className="trace-header">
                        <div className="trace-title">
                          <span className="trace-icon">{info.icon}</span>
                          <span className="trace-level">{trace.trace_level}</span>
                          <span className="trace-type">{trace.interaction_type}</span>
                        </div>
                        <span className="trace-time">
                          {new Date(trace.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                      <div className="trace-details">
                        <div className="detail-row">
                          <span className="detail-label">Agente:</span>
                          <span className="detail-value">{trace.agent_id || 'N/A'}</span>
                        </div>
                        <div className="detail-row">
                          <span className="detail-label">Intención:</span>
                          <span className="detail-value">{trace.cognitive_intent || 'N/A'}</span>
                        </div>
                        <div className="detail-row">
                          <span className="detail-label">Contenido:</span>
                          <pre className="detail-code">
                            {trace.content}
                          </pre>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {loading && (
          <div className="loading-state">
            <div className="spinner">🔄</div>
            <p>Cargando trazas cognitivas...</p>
          </div>
        )}
      </div>
    </div>
  );
};
