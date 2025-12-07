/**
 * Git Analytics Page
 * Análisis de evolución de código con Git
 */
import React, { useState, useEffect } from 'react';
import { sessionsService, gitService } from '@/services/api';
import { SessionMode } from '@/types/api.types';
import type { GitTrace, GitEvolution } from '@/services/api/git.service';
import './GitAnalyticsPage.css';

export const GitAnalyticsPage: React.FC = () => {
  const [sessionId, setSessionId] = useState('');
  const [repoPath, setRepoPath] = useState('');
  const [traces, setTraces] = useState<GitTrace[]>([]);
  const [evolution, setEvolution] = useState<GitEvolution | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    createDemoSession();
  }, []);

  const createDemoSession = async () => {
    try {
      const session = await sessionsService.create({
        student_id: `git_demo_${Date.now()}`,
        activity_id: 'git_analysis_demo',
        mode: SessionMode.TUTOR,
      });
      setSessionId(session.id);
    } catch (error) {
      console.error('Error creating session:', error);
    }
  };

  const analyzeRepository = async () => {
    if (!repoPath.trim() || !sessionId) return;

    setLoading(true);
    try {
      // Obtener trazas de Git para la sesión
      const gitTraces = await gitService.getSessionGitTraces(sessionId);
      setTraces(gitTraces);

      // Obtener análisis de evolución del código
      const codeEvolution = await gitService.getCodeEvolution(sessionId);
      setEvolution(codeEvolution);
    } catch (error) {
      console.error('Error analyzing repository:', error);
      setTraces([]);
      setEvolution(null);
    } finally {
      setLoading(false);
    }
  };

  const stats = evolution ? {
    total_commits: evolution.traces.length,
    total_files: evolution.traces.reduce((acc, t) => acc + t.files_changed.length, 0),
    total_insertions: evolution.traces.reduce((acc, t) => acc + t.lines_added, 0),
    total_deletions: evolution.traces.reduce((acc, t) => acc + t.lines_deleted, 0),
    quality: evolution.overall_quality,
    consistency: evolution.consistency_score,
  } : null;

  return (
    <div className="git-analytics-page">
      <header className="page-header">
        <div className="header-content">
          <div className="header-title">
            <span className="header-icon">📦</span>
            <h1>Git Analytics (N2)</h1>
          </div>
          <p className="header-subtitle">
            Análisis de evolución de código • Correlación con aprendizaje • Patrones de desarrollo
          </p>
        </div>
      </header>

      <div className="git-content">
        {/* Input Section */}
        <div className="input-section">
          <h2 className="section-title">Conectar Repositorio</h2>
          <div className="input-group">
            <div className="input-field">
              <label>Session ID</label>
              <input
                type="text"
                placeholder="ID de sesión..."
                value={sessionId}
                readOnly
              />
            </div>
            <div className="input-field">
              <label>Ruta del Repositorio Git</label>
              <input
                type="text"
                placeholder="/ruta/al/repositorio..."
                value={repoPath}
                onChange={(e) => setRepoPath(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && analyzeRepository()}
              />
            </div>
            <button
              className="analyze-btn"
              onClick={analyzeRepository}
              disabled={!repoPath.trim() || !sessionId}
            >
              🔍 Analizar Repositorio
            </button>
          </div>
        </div>

        {loading && (
          <div className="loading-state">
            <div className="spinner">🔄</div>
            <p>Analizando commits y patrones de desarrollo...</p>
          </div>
        )}

        {stats && !loading && (
          <>
            {/* Stats */}
            <div className="stats-section">
              <h2 className="section-title">Estadísticas del Repositorio</h2>
              <div className="stats-grid">
                <div className="stat-card" style={{ borderColor: '#4ade80' }}>
                  <span className="stat-icon">📊</span>
                  <div className="stat-info">
                    <p className="stat-label">Total Commits</p>
                    <p className="stat-value">{stats.total_commits}</p>
                  </div>
                </div>
                <div className="stat-card" style={{ borderColor: '#f59e0b' }}>
                  <span className="stat-icon">📁</span>
                  <div className="stat-info">
                    <p className="stat-label">Archivos Modificados</p>
                    <p className="stat-value">{stats.total_files}</p>
                  </div>
                </div>
                <div className="stat-card" style={{ borderColor: '#4ade80' }}>
                  <span className="stat-icon">➕</span>
                  <div className="stat-info">
                    <p className="stat-label">Líneas Agregadas</p>
                    <p className="stat-value">{stats.total_insertions}</p>
                  </div>
                </div>
                <div className="stat-card" style={{ borderColor: '#ef4444' }}>
                  <span className="stat-icon">➖</span>
                  <div className="stat-info">
                    <p className="stat-label">Líneas Eliminadas</p>
                    <p className="stat-value">{stats.total_deletions}</p>
                  </div>
                </div>
                <div className="stat-card" style={{ borderColor: '#8b5cf6' }}>
                  <span className="stat-icon">⭐</span>
                  <div className="stat-info">
                    <p className="stat-label">Calidad</p>
                    <p className="stat-value">{stats.quality}</p>
                  </div>
                </div>
                <div className="stat-card" style={{ borderColor: '#06b6d4' }}>
                  <span className="stat-icon">📊</span>
                  <div className="stat-info">
                    <p className="stat-label">Consistencia</p>
                    <p className="stat-value">{(stats.consistency * 100).toFixed(1)}%</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Insights from evolution analysis */}
            {evolution && evolution.ai_assistance_indicators.length > 0 && (
            <div className="insights-section">
              <h2 className="section-title">Insights de Aprendizaje</h2>
              <div className="insights-grid">
                {evolution.ai_assistance_indicators.map((indicator, idx) => (
                  <div className="insight-card" key={idx}>
                    <div className="insight-header">
                      <span className="insight-icon">📈</span>
                      <h3>Indicador de Asistencia IA</h3>
                    </div>
                    <p className="insight-text">{indicator}</p>
                  </div>
                ))}
              </div>
            </div>
            )}

            {/* Git Traces History */}
            <div className="commits-section">
              <h2 className="section-title">
                Historial de Git Traces ({traces.length})
              </h2>
              <div className="commits-list">
                {traces.map((trace) => (
                  <div key={trace.id} className="commit-card">
                    <div className="commit-header">
                      <div className="commit-info">
                        <span className="commit-hash">#{trace.commit_hash || 'N/A'}</span>
                        <span className="commit-message">{trace.commit_message || 'Sin mensaje'}</span>
                      </div>
                      <span className="commit-date">
                        {new Date(trace.timestamp).toLocaleString()}
                      </span>
                    </div>
                    <div className="commit-stats">
                      <span className="commit-author">👤 {trace.author_name || 'Unknown'}</span>
                      <div className="commit-changes">
                        <span className="change-files">
                          📁 {trace.files_changed.length} archivos
                        </span>
                        <span className="change-insertions">
                          +{trace.lines_added}
                        </span>
                        <span className="change-deletions">
                          -{trace.lines_deleted}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Correlation with cognitive traces */}
            {evolution && evolution.development_timeline.length > 0 && (
              <div className="correlation-section">
                <h2 className="section-title">Timeline de Desarrollo</h2>
                <div className="correlation-card">
                  <div className="correlation-icon">🔗</div>
                  <div className="correlation-content">
                    <h3>Análisis Temporal</h3>
                    <p>
                      Timeline de eventos de desarrollo detectados.
                    </p>
                    <div className="correlation-insights">
                      {evolution.development_timeline.slice(0, 5).map((event, idx) => (
                        <div className="correlation-item" key={idx}>
                          <span className="correlation-label">{new Date(event.timestamp).toLocaleString()}:</span>
                          <span className="correlation-value">{event.description} ({event.impact})</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};
