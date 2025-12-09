/**
 * Dashboard Page - Vista principal con métricas y acceso rápido
 */
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { apiClient } from '../services/apiClient';
import { StatCard, LoadingState, EmptyState } from '../components/ui';
import './DashboardPage.css';

interface DashboardMetrics {
  totalSessions: number;
  activeSessions: number;
  totalRisks: number;
  totalTraces: number;
}

export const DashboardPage: React.FC = () => {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [recentSessions, setRecentSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Cargar sesiones recientes
      const sessionsResponse = await apiClient.getSessions();
      const sessions = sessionsResponse.data?.items || sessionsResponse.data || [];
      
      // Calcular métricas
      const dashboardMetrics: DashboardMetrics = {
        totalSessions: sessions.length,
        activeSessions: sessions.filter((s: any) => s.status === 'active').length,
        totalRisks: sessions.reduce((acc: number, s: any) => acc + (s.risk_count || 0), 0),
        totalTraces: sessions.reduce((acc: number, s: any) => acc + (s.trace_count || 0), 0),
      };

      setMetrics(dashboardMetrics);
      setRecentSessions(sessions.slice(0, 5)); // Últimas 5 sesiones
      
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingState type="skeleton" message="Cargando dashboard..." />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-2">Resumen de tu actividad de aprendizaje</p>
      </div>

      {/* Métricas Principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          label="Sesiones Totales"
          value={metrics?.totalSessions || 0}
          icon="📊"
          color="blue"
        />
        <StatCard
          label="Sesiones Activas"
          value={metrics?.activeSessions || 0}
          icon="🟢"
          color="green"
        />
        <StatCard
          label="Riesgos Detectados"
          value={metrics?.totalRisks || 0}
          icon="⚠️"
          color="orange"
        />
        <StatCard
          label="Trazas Cognitivas"
          value={metrics?.totalTraces || 0}
          icon="🧠"
          color="purple"
        />
      </div>

      {/* Acciones Rápidas */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Acciones Rápidas</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            to="/tutor"
            className="flex items-center p-4 border-2 border-blue-200 rounded-lg hover:bg-blue-50 transition-colors group"
          >
            <div className="flex-shrink-0 w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
              💬
            </div>
            <div className="ml-4">
              <h3 className="font-semibold text-gray-900">Nueva Sesión Tutor</h3>
              <p className="text-sm text-gray-600">Aprende con el tutor IA</p>
            </div>
          </Link>

          <Link
            to="/simulators"
            className="flex items-center p-4 border-2 border-green-200 rounded-lg hover:bg-green-50 transition-colors group"
          >
            <div className="flex-shrink-0 w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
              🎯
            </div>
            <div className="ml-4">
              <h3 className="font-semibold text-gray-900">Continuar Simulador</h3>
              <p className="text-sm text-gray-600">Practica con profesionales</p>
            </div>
          </Link>

          <Link
            to="/test"
            className="flex items-center p-4 border-2 border-purple-200 rounded-lg hover:bg-purple-50 transition-colors group"
          >
            <div className="flex-shrink-0 w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
              🧪
            </div>
            <div className="ml-4">
              <h3 className="font-semibold text-gray-900">Ejecutar Pruebas</h3>
              <p className="text-sm text-gray-600">Valida el sistema completo</p>
            </div>
          </Link>
        </div>
      </div>

      {/* Actividad Reciente */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">Actividad Reciente</h2>
            <Link to="/sessions" className="text-blue-600 hover:text-blue-700 text-sm font-medium">
              Ver todas →
            </Link>
          </div>
        </div>
        
        <div className="p-6">
          {recentSessions.length === 0 ? (
            <EmptyState
              icon="📋"
              title="No hay sesiones todavía"
              description="Crea tu primera sesión para comenzar a aprender"
              action={
                <Link
                  to="/sessions"
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Crear Sesión
                </Link>
              }
            />
          ) : (
            <div className="space-y-3">
              {recentSessions.map((session: any) => (
                <div
                  key={session.id}
                  className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center space-x-4">
                    <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center text-xl">
                      {session.mode === 'TUTOR' ? '💬' : '🎯'}
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">
                        {session.activity_id}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {new Date(session.created_at).toLocaleDateString('es-ES', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <div className="text-sm text-gray-600">
                        {session.trace_count || 0} trazas
                      </div>
                      {session.risk_count > 0 && (
                        <div className="text-sm text-orange-600">
                          {session.risk_count} riesgos
                        </div>
                      )}
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      session.status === 'active' 
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {session.status === 'active' ? 'Activa' : 'Completada'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Test Suite Banner */}
      <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-lg shadow-lg p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold mb-2">🧪 Suite de Pruebas Completa</h2>
            <p className="text-green-100">
              Valida todas las funcionalidades: Tutor, 6 Simuladores, Riesgos, Evaluaciones y más
            </p>
          </div>
          <Link
            to="/test"
            className="bg-white text-green-600 px-6 py-3 rounded-lg font-semibold hover:bg-green-50 transition-colors whitespace-nowrap"
          >
            Ejecutar Pruebas →
          </Link>
        </div>
      </div>
    </div>
  );
};
