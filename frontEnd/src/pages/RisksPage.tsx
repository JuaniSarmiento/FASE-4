/**
 * Risks Page - AR-IA
 * Análisis de riesgos en 5 dimensiones
 */
import React, { useState, useEffect } from 'react';
import { sessionsService, risksService } from '@/services/api';
import { SessionMode, RiskDimension } from '@/types/api.types';
import type { Risk } from '@/types/api.types';
import './RisksPage.css';

const riskDimensionInfo: Record<RiskDimension, { name: string; icon: string; color: string; description: string }> = {
  [RiskDimension.COGNITIVE]: {
    name: 'Cognitivo',
    icon: '🧠',
    color: '#8b5cf6',
    description: 'Sobrecarga cognitiva o confusión persistente',
  },
  [RiskDimension.ETHICAL]: {
    name: 'Ético',
    icon: '⚖️',
    color: '#ef4444',
    description: 'Posible plagio o código sospechoso',
  },
  [RiskDimension.EPISTEMIC]: {
    name: 'Epistémico',
    icon: '📚',
    color: '#f59e0b',
    description: 'Uso de fuentes no confiables',
  },
  [RiskDimension.TECHNICAL]: {
    name: 'Técnico',
    icon: '⚙️',
    color: '#06b6d4',
    description: 'Código inseguro o ineficiente',
  },
  [RiskDimension.GOVERNANCE]: {
    name: 'Gobernanza',
    icon: '🎓',
    color: '#ec4899',
    description: 'Violación de políticas o uso no autorizado',
  },
};

export const RisksPage: React.FC = () => {
  const [risks, setRisks] = useState<Risk[]>([]);
  const [filter, setFilter] = useState<RiskDimension | 'ALL'>('ALL');
  const [loading, setLoading] = useState(true);
  const [sessionId, setSessionId] = useState<string | null>(null);

  useEffect(() => {
    loadRisks();
  }, []);

  const loadRisks = async () => {
    try {
      setLoading(true);
      
      // Crear una sesión de prueba para análisis de riesgos
      const session = await sessionsService.create({
        student_id: `risk_analysis_${Date.now()}`,
        activity_id: 'risk_demo_activity',
        mode: SessionMode.RISK_ANALYST,
      });
      
      setSessionId(session.id);
      
      // Obtener riesgos de la sesión
      const sessionRisks = await risksService.getBySession(session.id);
      setRisks(sessionRisks);
    } catch (error) {
      console.error('Error loading risks:', error);
      // En caso de error, mostrar datos de ejemplo
      setRisks([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredRisks = filter === 'ALL'
    ? risks
    : risks.filter(r => r.dimension === filter);

  const riskStats = {
    total: risks.length,
    active: risks.filter(r => !r.resolved).length,
    critical: risks.filter(r => r.risk_level === 'critical').length,
    high: risks.filter(r => r.risk_level === 'high').length,
  };

  return (
    <div className="risks-page">
      <header className="page-header">
        <div className="header-content">
          <div className="header-title">
            <span className="header-icon">⚠️</span>
            <h1>Análisis de Riesgos (AR-IA)</h1>
          </div>
          <p className="header-subtitle">
            Detección en 5 dimensiones • Monitoreo en tiempo real • Intervenciones automáticas
          </p>
        </div>
      </header>

      <div className="risks-content">
        {/* Stats */}
        <div className="stats-grid">
          <div className="stat-card" style={{ borderColor: '#667eea' }}>
            <span className="stat-icon">📊</span>
            <div className="stat-info">
              <p className="stat-label">Total Riesgos</p>
              <p className="stat-value">{riskStats.total}</p>
            </div>
          </div>
          <div className="stat-card" style={{ borderColor: '#f59e0b' }}>
            <span className="stat-icon">🔔</span>
            <div className="stat-info">
              <p className="stat-label">Activos</p>
              <p className="stat-value">{riskStats.active}</p>
            </div>
          </div>
          <div className="stat-card" style={{ borderColor: '#ef4444' }}>
            <span className="stat-icon">🚨</span>
            <div className="stat-info">
              <p className="stat-label">Críticos</p>
              <p className="stat-value">{riskStats.critical}</p>
            </div>
          </div>
          <div className="stat-card" style={{ borderColor: '#ec4899' }}>
            <span className="stat-icon">⚡</span>
            <div className="stat-info">
              <p className="stat-label">Alta Prioridad</p>
              <p className="stat-value">{riskStats.high}</p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="filters-section">
          <h2 className="section-title">Filtros por Dimensión</h2>
          <div className="risk-filters">
            <button
              className={`filter-btn ${filter === 'ALL' ? 'active' : ''}`}
              onClick={() => setFilter('ALL')}
            >
              Todos ({risks.length})
            </button>
            {Object.entries(riskDimensionInfo).map(([dimension, info]) => (
              <button
                key={dimension}
                className={`filter-btn ${filter === dimension ? 'active' : ''}`}
                style={{
                  '--filter-color': info.color,
                } as React.CSSProperties}
                onClick={() => setFilter(dimension as RiskDimension)}
              >
                <span>{info.icon}</span>
                {info.name}
              </button>
            ))}
          </div>
        </div>

        {/* Risks List */}
        <div className="risks-section">
          <h2 className="section-title">
            Alertas Detectadas ({filteredRisks.length})
          </h2>
          {loading ? (
            <div className="loading-state">
              <div className="spinner">🔄</div>
              <p>Cargando análisis de riesgos...</p>
            </div>
          ) : filteredRisks.length === 0 ? (
            <div className="empty-state">
              <span className="empty-icon">✅</span>
              <h3>No hay riesgos detectados</h3>
              <p>Todo está funcionando correctamente</p>
            </div>
          ) : (
            <div className="risks-list">
              {filteredRisks.map((risk) => {
                const info = riskDimensionInfo[risk.dimension as RiskDimension] || riskDimensionInfo[RiskDimension.TECHNICAL];
                return (
                  <div
                    key={risk.id}
                    className={`risk-card ${risk.resolved ? 'resolved' : ''}`}
                    style={{
                      '--risk-color': info.color,
                    } as React.CSSProperties}
                  >
                    <div className="risk-header">
                      <div className="risk-type">
                        <span className="risk-icon">{info.icon}</span>
                        <span className="risk-name">{info.name}</span>
                      </div>
                      <div className="risk-badges">
                        <span className={`severity-badge ${typeof risk.risk_level === 'string' ? risk.risk_level.toLowerCase() : 'medium'}`}>
                          {risk.risk_level}
                        </span>
                        {risk.resolved && (
                          <span className="resolved-badge">✓ Resuelto</span>
                        )}
                      </div>
                    </div>
                    <p className="risk-description">{risk.description}</p>
                    <div className="risk-footer">
                      <div className="risk-meta">
                        <span>Sesión: {risk.session_id}</span>
                        <span>Estudiante: {risk.student_id}</span>
                      </div>
                      <span className="risk-time">
                        {new Date(risk.created_at).toLocaleString()}
                      </span>
                    </div>
                    {!risk.resolved && (
                      <div className="risk-actions">
                        <button className="action-btn resolve">Marcar Resuelto</button>
                        <button className="action-btn details">Ver Detalles</button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
