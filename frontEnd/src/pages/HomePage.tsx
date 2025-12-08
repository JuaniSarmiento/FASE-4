import { Link } from 'react-router-dom';

export function HomePage() {
  return (
    <div className="space-y-6">
      {/* Test Suite Banner */}
      <div style={{
        background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
        borderRadius: '12px',
        padding: '1.5rem',
        color: 'white',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
            🧪 Suite de Pruebas Disponible
          </h2>
          <p style={{ fontSize: '0.875rem', opacity: 0.9 }}>
            Prueba todas las funcionalidades del sistema: Tutor, 6 Simuladores, Riesgos, Evaluaciones, Trazabilidad y Git Analytics
          </p>
        </div>
        <Link 
          to="/test"
          style={{
            backgroundColor: 'white',
            color: '#059669',
            padding: '0.75rem 1.5rem',
            borderRadius: '8px',
            fontWeight: 'bold',
            textDecoration: 'none',
            whiteSpace: 'nowrap'
          }}
        >
          Ejecutar Pruebas →
        </Link>
      </div>

      <div className="bg-white shadow rounded-lg p-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Bienvenido al Sistema AI-Native MVP
        </h1>
        <p className="text-lg text-gray-600 mb-6">
          Sistema de enseñanza-aprendizaje de programación con IA generativa
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-6 border border-blue-200">
            <h3 className="text-xl font-semibold text-gray-900 mb-2">T-IA-Cog</h3>
            <p className="text-gray-700">Tutor inteligente con preguntas socráticas</p>
          </div>

          <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-6 border border-green-200">
            <h3 className="text-xl font-semibold text-gray-900 mb-2">E-IA-Proc</h3>
            <p className="text-gray-700">Evaluación basada en procesos</p>
          </div>

          <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-6 border border-purple-200">
            <h3 className="text-xl font-semibold text-gray-900 mb-2">S-IA-X</h3>
            <p className="text-gray-700">6 simuladores profesionales</p>
          </div>
        </div>
      </div>
    </div>
  );
}
