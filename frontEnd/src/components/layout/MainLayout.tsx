/**
 * Main Layout - Sidebar navigation + content area
 */
import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import './MainLayout.css';

export interface MainLayoutProps {
  children: React.ReactNode;
}

export const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const location = useLocation();

  const menuItems = [
    { icon: '🏠', label: 'Dashboard', path: '/dashboard', color: '#667eea' },
    { icon: '🎓', label: 'Tutor Cognitivo', path: '/tutor', color: '#4ade80' },
    { icon: '📊', label: 'Evaluador', path: '/evaluator', color: '#f59e0b' },
    { icon: '👥', label: 'Simuladores', path: '/simulators', color: '#8b5cf6' },
    { icon: '⚠️', label: 'Análisis de Riesgo', path: '/risks', color: '#ef4444' },
    { icon: '🔍', label: 'Trazabilidad N4', path: '/traceability', color: '#06b6d4' },
    { icon: '📦', label: 'Git Integration', path: '/git', color: '#ec4899' },
    { icon: '⚙️', label: 'Administración', path: '/admin', color: '#64748b' },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="main-layout">
      {/* Sidebar */}
      <aside className={`sidebar ${sidebarCollapsed ? 'collapsed' : ''}`}>
        <div className="sidebar-header">
          <h1 className="logo">
            {sidebarCollapsed ? 'AI' : 'AI-Native MVP'}
          </h1>
          <button
            className="collapse-btn"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          >
            {sidebarCollapsed ? '→' : '←'}
          </button>
        </div>

        <nav className="sidebar-nav">
          {menuItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`nav-item ${isActive(item.path) ? 'active' : ''}`}
              style={{
                '--item-color': item.color,
              } as React.CSSProperties}
            >
              <span className="nav-icon">{item.icon}</span>
              {!sidebarCollapsed && <span className="nav-label">{item.label}</span>}
            </Link>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="user-info">
            <span className="user-avatar">👤</span>
            {!sidebarCollapsed && (
              <div className="user-details">
                <p className="user-name">Estudiante Demo</p>
                <p className="user-role">Student</p>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="main-content">
        <div className="content-wrapper">
          {children}
        </div>
      </div>
    </div>
  );
};
