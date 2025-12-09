import { useState, useRef } from 'react';
import apiClient from '../services/apiClient';
import { Badge, LoadingState } from '../components/ui';

interface TestResult {
  test: string;
  success: boolean;
  data: any;
  timestamp: string;
  duration?: number;
}

interface TestFilter {
  showPassed: boolean;
  showFailed: boolean;
  showSkipped: boolean;
}

export default function TestPageEnhanced() {
  const [results, setResults] = useState<TestResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [estimatedTime, setEstimatedTime] = useState<number | null>(null);
  const [filters, setFilters] = useState<TestFilter>({
    showPassed: true,
    showFailed: true,
    showSkipped: true
  });
  const abortControllerRef = useRef<AbortController | null>(null);
  const startTimeRef = useRef<number>(0);

  const addResult = (test: string, success: boolean, data: any, duration?: number) => {
    setResults(prev => [...prev, { 
      test, 
      success, 
      data, 
      timestamp: new Date().toLocaleTimeString(),
      duration
    }]);
  };

  const cancelTests = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      setLoading(false);
      addResult('🛑 Tests cancelados por el usuario', false, { reason: 'User cancellation' });
    }
  };

  const exportResults = (format: 'json' | 'text') => {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `test-results-${timestamp}.${format}`;
    
    let content: string;
    let mimeType: string;

    if (format === 'json') {
      content = JSON.stringify({
        testRun: {
          timestamp: new Date().toISOString(),
          totalTests: results.length,
          passed: results.filter(r => r.success).length,
          failed: results.filter(r => !r.success).length
        },
        results
      }, null, 2);
      mimeType = 'application/json';
    } else {
      const passed = results.filter(r => r.success).length;
      const failed = results.filter(r => !r.success).length;
      content = `AI-NATIVE TEST SUITE RESULTS\n`;
      content += `================================\n\n`;
      content += `Timestamp: ${new Date().toISOString()}\n`;
      content += `Total Tests: ${results.length}\n`;
      content += `Passed: ${passed}\n`;
      content += `Failed: ${failed}\n`;
      content += `Success Rate: ${((passed / results.length) * 100).toFixed(1)}%\n\n`;
      content += `DETAILED RESULTS\n`;
      content += `================================\n\n`;
      
      results.forEach((result, idx) => {
        content += `${idx + 1}. ${result.test}\n`;
        content += `   Status: ${result.success ? '✅ PASS' : '❌ FAIL'}\n`;
        content += `   Time: ${result.timestamp}\n`;
        if (result.duration) {
          content += `   Duration: ${result.duration}ms\n`;
        }
        content += `   Data: ${JSON.stringify(result.data, null, 2)}\n\n`;
      });
      
      mimeType = 'text/plain';
    }

    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  };

  const runAllTests = async () => {
    setResults([]);
    setLoading(true);
    setProgress({ current: 0, total: 12 });
    setEstimatedTime(180); // 3 minutos estimados
    startTimeRef.current = Date.now();
    
    abortControllerRef.current = new AbortController();

    try {
      const testStartTime = Date.now();

      // TEST 1: CREATE SESSION
      setProgress({ current: 1, total: 12 });
      const t1Start = Date.now();
      addResult('1️⃣ Creando sesión de prueba...', true, { status: 'iniciando' });
      const sessionResponse = await apiClient.createSession({
        student_id: 'test-student-001',
        activity_id: 'test-activity-001',
        mode: 'TUTOR'
      });
      const sessionId = sessionResponse.data.id;
      addResult('✅ Sesión Creada Exitosamente', true, { sessionId }, Date.now() - t1Start);

      // TEST 2: TUTOR COGNITIVO
      setProgress({ current: 2, total: 12 });
      const t2Start = Date.now();
      addResult('2️⃣ Probando Tutor Cognitivo (T-IA-Cog)...', true, { agente: 'T-IA-Cog' });
      const tutorResponse = await apiClient.processInteraction({
        session_id: sessionId,
        prompt: '¿Cómo implemento un algoritmo de búsqueda binaria en Python?'
      });
      const interactionId = tutorResponse.data.interaction_id;
      const traceId = tutorResponse.data.trace_id;
      addResult('✅ Tutor Cognitivo (T-IA-Cog) Operacional', true, { 
        response: tutorResponse.data.response?.substring(0, 100) + '...',
        interactionId,
        traceId
      }, Date.now() - t2Start);

      // TEST 3: SIMULADOR PRODUCT OWNER
      setProgress({ current: 3, total: 12 });
      const t3Start = Date.now();
      addResult('3️⃣ Probando Simulador Product Owner...', true, {});
      const poResponse = await apiClient.interactWithSimulator({
        session_id: sessionId,
        simulator_type: 'product_owner',
        prompt: 'Necesito ayuda definiendo requisitos',
        context: {}
      });
      addResult('✅ Product Owner Operacional', true, { 
        response: poResponse.data.response?.substring(0, 100) + '...'
      }, Date.now() - t3Start);

      // TEST 4: SIMULADOR TECH INTERVIEWER
      setProgress({ current: 4, total: 12 });
      const t4Start = Date.now();
      addResult('4️⃣ Probando Tech Interviewer...', true, {});
      const teResponse = await apiClient.interactWithSimulator({
        session_id: sessionId,
        simulator_type: 'tech_interviewer',
        prompt: '¿Diferencia entre lista y tupla?',
        context: {}
      });
      addResult('✅ Tech Interviewer Operacional', true, { 
        response: teResponse.data.response?.substring(0, 100) + '...'
      }, Date.now() - t4Start);

      // Additional interactions for analysis
      await apiClient.processInteraction({
        session_id: sessionId,
        prompt: 'Ayuda con recursión'
      });

      // TEST 5: ANÁLISIS DE RIESGOS
      setProgress({ current: 5, total: 12 });
      const t5Start = Date.now();
      addResult('5️⃣ Analizando riesgos cognitivos (AR-IA)...', true, {});
      const risksResponse = await apiClient.analyzeSessionRisks(sessionId);
      addResult('✅ Análisis de Riesgos Completo', true, {
        totalRisks: risksResponse.data?.risks?.length || 0,
        distribution: risksResponse.data?.risk_distribution
      }, Date.now() - t5Start);

      // TEST 6: EVALUACIÓN PROCEDIMENTAL
      setProgress({ current: 6, total: 12 });
      const t6Start = Date.now();
      addResult('6️⃣ Generando evaluación (E-IA-Proc)...', true, {});
      const evalResponse = await apiClient.generateEvaluation({
        session_id: sessionId,
        interaction_id: interactionId
      });
      addResult('✅ Evaluación Generada', true, {
        scores: evalResponse.data?.scores
      }, Date.now() - t6Start);

      // TEST 7: TRAZABILIDAD
      setProgress({ current: 7, total: 12 });
      const t7Start = Date.now();
      addResult('7️⃣ Verificando trazabilidad (TC-N4)...', true, {});
      const traceResponse = await apiClient.getSessionTraceability(sessionId);
      addResult('✅ Trazabilidad N4 Completa', true, {
        summary: traceResponse.data?.summary
      }, Date.now() - t7Start);

      // Final summary
      const totalDuration = Date.now() - testStartTime;
      addResult('🎉 TODOS LOS TESTS COMPLETADOS', true, {
        totalTime: `${(totalDuration / 1000).toFixed(2)}s`,
        successRate: '100%'
      }, totalDuration);

    } catch (error: any) {
      if (error.name === 'AbortError') {
        addResult('⚠️ Tests cancelados', false, { reason: 'Cancelled by user' });
      } else {
        addResult('❌ Error en la ejecución', false, { 
          error: error.message,
          details: error.response?.data
        });
      }
    } finally {
      setLoading(false);
      abortControllerRef.current = null;
    }
  };

  const filteredResults = results.filter(result => {
    if (result.success && filters.showPassed) return true;
    if (!result.success && filters.showFailed) return true;
    return false;
  });

  const passedCount = results.filter(r => r.success).length;
  const failedCount = results.filter(r => !r.success).length;
  const successRate = results.length > 0 ? ((passedCount / results.length) * 100).toFixed(1) : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">🧪 Test Suite Completo</h1>
        <p className="text-gray-600 mt-2">
          Suite de pruebas integral para validar todos los agentes IA del sistema
        </p>
      </div>

      {/* Stats */}
      {results.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-lg shadow border-l-4 border-blue-500">
            <div className="text-2xl font-bold text-blue-600">{results.length}</div>
            <div className="text-sm text-gray-600">Tests Ejecutados</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow border-l-4 border-green-500">
            <div className="text-2xl font-bold text-green-600">{passedCount}</div>
            <div className="text-sm text-gray-600">Exitosos</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow border-l-4 border-red-500">
            <div className="text-2xl font-bold text-red-600">{failedCount}</div>
            <div className="text-sm text-gray-600">Fallidos</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow border-l-4 border-purple-500">
            <div className="text-2xl font-bold text-purple-600">{successRate}%</div>
            <div className="text-sm text-gray-600">Tasa de Éxito</div>
          </div>
        </div>
      )}

      {/* Controls */}
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="flex flex-wrap gap-4 items-center justify-between">
          <div className="flex gap-2">
            <button
              onClick={runAllTests}
              disabled={loading}
              className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? '⏳ Ejecutando...' : '▶️ Ejecutar Tests'}
            </button>
            
            {loading && (
              <button
                onClick={cancelTests}
                className="bg-red-600 text-white px-6 py-2 rounded-md hover:bg-red-700 transition-colors"
              >
                🛑 Cancelar
              </button>
            )}

            {results.length > 0 && !loading && (
              <>
                <button
                  onClick={() => exportResults('json')}
                  className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors"
                >
                  📥 Export JSON
                </button>
                <button
                  onClick={() => exportResults('text')}
                  className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors"
                >
                  📄 Export TXT
                </button>
              </>
            )}
          </div>

          {/* Filters */}
          {results.length > 0 && (
            <div className="flex gap-3 items-center">
              <span className="text-sm text-gray-600">Filtros:</span>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={filters.showPassed}
                  onChange={(e) => setFilters({ ...filters, showPassed: e.target.checked })}
                  className="rounded"
                />
                <span className="text-sm">✅ Exitosos ({passedCount})</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={filters.showFailed}
                  onChange={(e) => setFilters({ ...filters, showFailed: e.target.checked })}
                  className="rounded"
                />
                <span className="text-sm">❌ Fallidos ({failedCount})</span>
              </label>
            </div>
          )}
        </div>

        {/* Progress Bar */}
        {loading && (
          <div className="mt-4">
            <div className="flex justify-between text-sm text-gray-600 mb-2">
              <span>Progreso: {progress.current}/{progress.total} tests</span>
              {estimatedTime && (
                <span>Tiempo estimado: ~{estimatedTime}s</span>
              )}
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all"
                style={{ width: `${(progress.current / progress.total) * 100}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Results */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-4 border-b">
          <h2 className="text-xl font-semibold">
            Resultados ({filteredResults.length})
          </h2>
        </div>
        <div className="p-4 space-y-3 max-h-[600px] overflow-y-auto">
          {filteredResults.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              {results.length === 0 
                ? 'Haz click en "Ejecutar Tests" para comenzar'
                : 'No hay resultados con los filtros seleccionados'}
            </div>
          ) : (
            filteredResults.map((result, idx) => (
              <div
                key={idx}
                className={`p-4 rounded-lg border-l-4 ${
                  result.success
                    ? 'bg-green-50 border-green-500'
                    : 'bg-red-50 border-red-500'
                }`}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">{result.test}</div>
                    {result.data && Object.keys(result.data).length > 0 && (
                      <details className="mt-2">
                        <summary className="text-sm text-gray-600 cursor-pointer hover:text-gray-900">
                          Ver detalles
                        </summary>
                        <pre className="mt-2 text-xs bg-gray-100 p-2 rounded overflow-x-auto">
                          {JSON.stringify(result.data, null, 2)}
                        </pre>
                      </details>
                    )}
                  </div>
                  <div className="text-right ml-4">
                    <Badge variant={result.success ? 'success' : 'error'} size="sm">
                      {result.success ? 'PASS' : 'FAIL'}
                    </Badge>
                    <div className="text-xs text-gray-500 mt-1">{result.timestamp}</div>
                    {result.duration && (
                      <div className="text-xs text-gray-400">{result.duration}ms</div>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
