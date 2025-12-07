/**
 * Dashboard Page - Vista principal con métricas y acceso rápido
 */
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './DashboardPage.css';

export const DashboardPage: React.FC = () => {
  const [stats, setStats] = useState({
    totalSessions: 0,
    activeSessions: 0,
    avgScore: 0,
    riskAlerts: 0,
  });

  useEffect(() => {
    // TODO: Load real stats from API
    setStats({
      totalSessions: 24,
      activeSessions: 3,
      avgScore: 82.5,
      riskAlerts: 2,
    });
  }, []);

  const modules = [
    {
      title: 'Tutor Cognitivo',
      description: 'Tutoría socr ática y andamiaje metacognitivo',
      icon: '🎓',
      path: '/tutor',
      color: '#4ade80',
      features: ['Preguntas socráticas', 'Explicaciones conceptuales', 'Pistas graduadas'],
    },
    {
      title: 'Evaluador de Procesos',
      description: 'Análisis de razonamiento y procesos cognitivos',
      icon: '📊',
      path: '/evaluator',
      color: '#f59e0b',
      features: ['Análisis cognitivo', 'Evolución Git', 'Reportes detallados'],
    },
    {
      title: 'Simuladores Profesionales',
      description: '6 simuladores de roles de la industria',
      icon: '👥',
      path: '/simulators',
      color: '#8b5cf6',
      features: ['Product Owner', 'Scrum Master', 'Tech Interviewer'],
    },
    {
      title: 'Análisis de Riesgo',
      description: 'Monitoreo de riesgos cognitivos y éticos',
      icon: '⚠️',
      path: '/risks',
      color: '#ef4444',
      features: ['5 dimensiones', 'Alertas en tiempo real', 'Intervenciones'],
    },
    {
      title: 'Trazabilidad N4',
      description: 'Reconstrucción de caminos cognitivos',
      icon: '🔍',
      path: '/traceability',
      color: '#06b6d4',
      features: ['4 niveles', 'Visualización', 'Secuencias'],
    },
    {
      title: 'Git Integration',
      description: 'Análisis de evolución de código',
      icon: '📦',
      path: '/git',
      color: '#ec4899',
      features: ['Commits', 'Patrones', 'Correlación'],
    },
  ];

  return (
    <div className="dashboard-page">
      {/* Header */}
      <header className="dashboard-header">
        <div>
          <h1 className="dashboard-title">AI-Native Learning Platform</h1>
          <p className="dashboard-subtitle">
            Sistema completo de enseñanza-aprendizaje con IA generativa
          </p>
        </div>
      </header>

      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card" style={{ borderColor: '#667eea' }}>
          <div className="stat-icon" style={{ background: 'rgba(102, 126, 234, 0.1)' }}>
            📚
          </div>
          <div className="stat-content">
            <p className="stat-label">Total Sesiones</p>
            <p className="stat-value">{stats.totalSessions}</p>
          </div>
        </div>

        <div className="stat-card" style={{ borderColor: '#4ade80' }}>
          <div className="stat-icon" style={{ background: 'rgba(74, 222, 128, 0.1)' }}>
            ⚡
          </div>
          <div className="stat-content">
            <p className="stat-label">Sesiones Activas</p>
            <p className="stat-value">{stats.activeSessions}</p>
          </div>
        </div>

        <div className="stat-card" style={{ borderColor: '#f59e0b' }}>
          <div className="stat-icon" style={{ background: 'rgba(245, 158, 11, 0.1)' }}>
            📈
          </div>
          <div className="stat-content">
            <p className="stat-label">Puntaje Promedio</p>
            <p className="stat-value">{stats.avgScore.toFixed(1)}%</p>
          </div>
        </div>

        <div className="stat-card" style={{ borderColor: '#ef4444' }}>
          <div className="stat-icon" style={{ background: 'rgba(239, 68, 68, 0.1)' }}>
            ⚠️
          </div>
          <div className="stat-content">
            <p className="stat-label">Alertas de Riesgo</p>
            <p className="stat-value">{stats.riskAlerts}</p>
          </div>
        </div>
      </div>

      {/* Modules Grid */}
      <section className="modules-section">
        <h2 className="section-title">Módulos del Sistema</h2>
        <div className="modules-grid">
          {modules.map((module) => (
            <Link
              key={module.path}
              to={module.path}
              className="module-card"
              style={{
                '--module-color': module.color,
              } as React.CSSProperties}
            >
              <div className="module-header">
                <span className="module-icon">{module.icon}</span>
                <h3 className="module-title">{module.title}</h3>
              </div>
              <p className="module-description">{module.description}</p>
              <ul className="module-features">
                {module.features.map((feature, idx) => (
                  <li key={idx}>• {feature}</li>
                ))}
              </ul>
              <div className="module-footer">
                <span className="module-action">Explorar →</span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Quick Actions */}
      <section className="quick-actions">
        <h2 className="section-title">Acciones Rápidas</h2>
        <div className="actions-grid">
          <button className="action-btn" style={{ background: 'linear-gradient(135deg, #4ade80 0%, #22c55e 100%)' }}>
            <span className="action-icon">➕</span>
            <span>Nueva Sesión</span>
          </button>
          <button className="action-btn" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
            <span className="action-icon">📖</span>
            <span>Ver Historial</span>
          </button>
          <button className="action-btn" style={{ background: 'linear-gradient(135deg, #f59e0b 0%, #ea580c 100%)' }}>
            <span className="action-icon">📊</span>
            <span>Generar Reporte</span>
          </button>
          <button className="action-btn" style={{ background: 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)' }}>
            <span className="action-icon">⚙️</span>
            <span>Configuración</span>
          </button>
        </div>
      </section>
    </div>
  );
};
