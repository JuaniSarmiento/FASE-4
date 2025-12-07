/**
 * Página de inicio - Redirige al dashboard
 */
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export function HomePage() {
  const navigate = useNavigate();

  useEffect(() => {
    // Redirigir automáticamente al dashboard
    navigate('/dashboard');
  }, [navigate]);

  return (
    <div style={{ 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center', 
      height: '100vh',
      background: '#0f172a',
      color: '#e2e8f0'
    }}>
      <div style={{ textAlign: 'center' }}>
        <h1>🎓 AI-Native MVP</h1>
        <p>Redirigiendo al dashboard...</p>
      </div>
    </div>
  );
}
