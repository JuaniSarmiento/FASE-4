import { Outlet, Link, useLocation } from 'react-router-dom';
import './Layout.css';

const navigation = [
  { name: 'Inicio', href: '/', icon: '🏠' },
  { name: 'Sesiones', href: '/sessions', icon: '📚' },
  { name: 'Tutor IA', href: '/tutor', icon: '💬' },
  { name: 'Simuladores', href: '/simulators', icon: '👥' },
  { name: 'Análisis de Riesgos', href: '/risks', icon: '⚠️' },
  { name: 'Evaluaciones', href: '/evaluations', icon: '📊' },
  { name: 'Trazabilidad', href: '/traceability', icon: '🗺️' },
  { name: 'Git Analytics', href: '/analytics', icon: '📈' },
  { name: '🧪 Test Suite', href: '/test', icon: '🧪' },
];

export function Layout() {
  const location = useLocation();

  return (
    <div className="layout-container">
      {/* Sidebar */}
      <aside className="sidebar">
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
              {navigation.find(n => n.pathname === location.pathname)?.name || 'Dashboard'}
            </h2>
            <p style={{ color: '#64748b', fontSize: '0.875rem' }}>
              Bienvenido al sistema AI-Native
            </p>
          </div>
          <div className="user-info">
            <div>
              <div style={{ fontWeight: '600', fontSize: '0.875rem' }}>student_001</div>
              <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Estudiante</div>
            </div>
            <div className="user-avatar">S</div>
          </div>
        </div>

        <div className="fade-in">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
