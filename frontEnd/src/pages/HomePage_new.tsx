export function HomePage() {
  return (
    <div className="space-y-6">
      <div className="bg-white shadow rounded-lg p-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Bienvenido al Sistema AI-Native MVP
        </h1>
        <p className="text-lg text-gray-600 mb-6">
          Sistema de enseñanza-aprendizaje de programación con IA generativa
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
          {/* Tutor IA Card */}
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-6 border border-blue-200">
            <div className="flex items-center mb-4">
              <div className="bg-blue-600 rounded-full p-3">
                <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
              </div>
              <h3 className="ml-4 text-xl font-semibold text-gray-900">T-IA-Cog</h3>
            </div>
            <p className="text-gray-700">
              Tutor inteligente que guía sin sustituir tu agencia. Preguntas socráticas y feedback cognitivo.
            </p>
          </div>

          {/* Evaluador Card */}
          <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-6 border border-green-200">
            <div className="flex items-center mb-4">
              <div className="bg-green-600 rounded-full p-3">
                <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
              </div>
              <h3 className="ml-4 text-xl font-semibold text-gray-900">E-IA-Proc</h3>
            </div>
            <p className="text-gray-700">
              Evaluación basada en procesos: planificación, ejecución, debugging, reflexión y autonomía.
            </p>
          </div>

          {/* Simuladores Card */}
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-6 border border-purple-200">
            <div className="flex items-center mb-4">
              <div className="bg-purple-600 rounded-full p-3">
                <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className="ml-4 text-xl font-semibold text-gray-900">S-IA-X</h3>
            </div>
            <p className="text-gray-700">
              6 simuladores profesionales: PO, SM, Tech Interviewer, Incident Responder, Cliente, DevSecOps.
            </p>
          </div>

          {/* Análisis de Riesgos Card */}
          <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-lg p-6 border border-red-200">
            <div className="flex items-center mb-4">
              <div className="bg-red-600 rounded-full p-3">
                <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h3 className="ml-4 text-xl font-semibold text-gray-900">AR-IA</h3>
            </div>
            <p className="text-gray-700">
              Detección de riesgos en 5 dimensiones: cognitiva, ética, epistémica, técnica y gobernanza.
            </p>
          </div>

          {/* Trazabilidad Card */}
          <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-lg p-6 border border-yellow-200">
            <div className="flex items-center mb-4">
              <div className="bg-yellow-600 rounded-full p-3">
                <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                </svg>
              </div>
              <h3 className="ml-4 text-xl font-semibold text-gray-900">TC-N4</h3>
            </div>
            <p className="text-gray-700">
              Trazabilidad cognitiva en 4 niveles: Raw, Preprocessed, LLM Processing, Postprocessed.
            </p>
          </div>

          {/* Git Analytics Card */}
          <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-lg p-6 border border-indigo-200">
            <div className="flex items-center mb-4">
              <div className="bg-indigo-600 rounded-full p-3">
                <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="ml-4 text-xl font-semibold text-gray-900">Git N2</h3>
            </div>
            <p className="text-gray-700">
              Análisis de trazas Git: commits, frecuencia, calidad de mensajes y patrones de trabajo.
            </p>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white shadow rounded-lg p-6">
          <div className="text-sm font-medium text-gray-500">Total Sesiones</div>
          <div className="mt-2 text-3xl font-semibold text-gray-900">-</div>
        </div>
        <div className="bg-white shadow rounded-lg p-6">
          <div className="text-sm font-medium text-gray-500">Interacciones</div>
          <div className="mt-2 text-3xl font-semibold text-gray-900">-</div>
        </div>
        <div className="bg-white shadow rounded-lg p-6">
          <div className="text-sm font-medium text-gray-500">Riesgos Detectados</div>
          <div className="mt-2 text-3xl font-semibold text-gray-900">-</div>
        </div>
        <div className="bg-white shadow rounded-lg p-6">
          <div className="text-sm font-medium text-gray-500">Evaluaciones</div>
          <div className="mt-2 text-3xl font-semibold text-gray-900">-</div>
        </div>
      </div>
    </div>
  );
}
