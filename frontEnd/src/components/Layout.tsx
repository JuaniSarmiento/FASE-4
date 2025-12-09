import { Outlet, Link, useLocation } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { useState } from 'react';
import { Breadcrumb } from './Breadcrumb';
import './Layout.css';

const navigation = [
  { name: 'Inicio', href: '/', icon: '🏠' },
  { name: 'Sesiones', href: '/sessions', icon: '📚' },
  { name: 'Tutor IA', href: '/tutor', icon: '💬' },
  { name: 'Ejercicios de Código', href: '/exercises', icon: '💻' },
  { name: 'Simuladores', href: '/simulators', icon: '👥' },
  { name: 'Análisis de Riesgos', href: '/risks', icon: '⚠️' },
  { name: 'Evaluaciones', href: '/evaluations', icon: '📊' },
  { name: 'Trazabilidad', href: '/traceability', icon: '🗺️' },
  { name: 'Git Analytics', href: '/analytics', icon: '📈' },
  { name: '🧪 Test Suite', href: '/test', icon: '🧪' },
];

export function Layout() {
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();
  const { user, logout } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const getRoleLabel = (role: string) => {
    const labels: Record<string, string> = {
      student: 'Estudiante',
      tutor: 'Tutor',
      admin: 'Administrador'
    };
    return labels[role] || role;
  };

  return (
    <div className="layout-container">
      {/* Mobile Menu Button */}
      <button
        className="mobile-menu-button"
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        aria-label="Toggle menu"
      >
        <span className={`hamburger ${isMobileMenuOpen ? 'open' : ''}`}>
          <span></span>
          <span></span>
          <span></span>
        </span>
      </button>

      {/* Sidebar */}
      <aside className={`sidebar ${isMobileMenuOpen ? 'mobile-open' : ''}`}>
        <div className="sidebar-logo">
          <h1>🎓 AI-Native MVP</h1>
          <p style={{ fontSize: '0.875rem', color: '#64748b', marginTop: '0.5rem' }}>
            Sistema Universitario
          </p>
        </div>
        
        <nav className="sidebar-nav">
          {navigation.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.name}
                to={item.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className={`nav-link ${isActive ? 'active' : ''}`}
              >
                <span className="nav-link-icon">{item.icon}</span>
                {item.name}
              </Link>
            );
          })}
        </nav>

        <div style={{ padding: '0 2rem', fontSize: '0.75rem', color: '#94a3b8', textAlign: 'center' }}>
          <p>© 2025 Universidad</p>
          <p style={{ marginTop: '0.25rem' }}>v1.0.0</p>
        </div>
      </aside>

      {/* Main Content */}
      <div className="main-content">
        <div className="top-bar">
          <div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '0.25rem' }}>
              {navigation.find(n => n.href === location.pathname)?.name || 'Dashboard'}
            </h2>
            <p style={{ color: '#64748b', fontSize: '0.875rem' }}>
              Bienvenido al sistema AI-Native
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <button
              onClick={toggleTheme}
              className="theme-toggle"
              style={{
                padding: '0.5rem',
                borderRadius: '0.5rem',
                border: '1px solid #e2e8f0',
                background: 'white',
                cursor: 'pointer',
                fontSize: '1.25rem',
                transition: 'all 0.2s'
              }}
              title={`Cambiar a modo ${theme === 'light' ? 'oscuro' : 'claro'}`}
            >
              {theme === 'light' ? '🌙' : '☀️'}
            </button>
            <div className="user-info" style={{ position: 'relative' }}>
              <div 
                onClick={() => setShowUserMenu(!showUserMenu)}
                style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.75rem' }}
              >
                <div>
                  <div style={{ fontWeight: '600', fontSize: '0.875rem' }}>
                    {user?.username || 'Usuario'}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                    {user?.roles?.[0] ? getRoleLabel(user.roles[0]) : 'Cargando...'}
                  </div>
                </div>
                <div className="user-avatar">
                  {user?.username?.charAt(0).toUpperCase() || 'U'}
                </div>
              </div>
              
              {showUserMenu && (
                <div 
                  style={{
                    position: 'absolute',
                    right: 0,
                    top: '100%',
                    marginTop: '0.5rem',
                    backgroundColor: 'white',
                    border: '1px solid #e2e8f0',
                    borderRadius: '0.5rem',
                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                    minWidth: '200px',
                    zIndex: 50,
                    overflow: 'hidden'
                  }}
                >
                  <div style={{ padding: '1rem', borderBottom: '1px solid #e2e8f0' }}>
                    <div style={{ fontWeight: '600', marginBottom: '0.25rem' }}>
                      {user?.full_name || user?.username}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                      {user?.email}
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      logout();
                      setShowUserMenu(false);
                    }}
                    style={{
                      width: '100%',
                      padding: '0.75rem 1rem',
                      textAlign: 'left',
                      border: 'none',
                      background: 'transparent',
                      cursor: 'pointer',
                      fontSize: '0.875rem',
                      color: '#dc2626',
                      transition: 'background-color 0.2s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f9fafb'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    🚪 Cerrar Sesión
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="fade-in">
          <Breadcrumb />
          <Outlet />
        </div>
      </div>
    </div>
  );
}
