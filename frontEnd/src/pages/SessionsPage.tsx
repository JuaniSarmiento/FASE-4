import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../services/apiClient';
import { Badge, LoadingState, EmptyState } from '../components/ui';

export function SessionsPage() {
  const navigate = useNavigate();
  const [sessions, setSessions] = useState<any[]>([]);
  const [filteredSessions, setFilteredSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMode, setFilterMode] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [formData, setFormData] = useState({
    student_id: 'student_001',
    activity_id: 'prog2_tp1',
    mode: 'TUTOR'
  });

  useEffect(() => {
    loadSessions();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [sessions, searchQuery, filterMode, filterStatus]);

  const applyFilters = () => {
    let filtered = [...sessions];

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter((session) =>
        session.activity_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        session.id.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Mode filter
    if (filterMode !== 'all') {
      filtered = filtered.filter((session) => session.mode === filterMode);
    }

    // Status filter
    if (filterStatus !== 'all') {
      filtered = filtered.filter((session) => session.status === filterStatus);
    }

    // Sort by date (newest first)
    filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    setFilteredSessions(filtered);
    setCurrentPage(1); // Reset to first page when filters change
  };

  const loadSessions = async () => {
    setLoading(true);
    setError(null);
    try {
      console.log('[SessionsPage] Loading sessions for student_001...');
      const response = await apiClient.getSessions('student_001');
      console.log('[SessionsPage] Response:', response);
      
      // Handle both paginated and direct responses
      const sessionsList = response.data?.items || response.data || [];
      console.log('[SessionsPage] Sessions found:', sessionsList.length);
      
      setSessions(sessionsList);
    } catch (error: any) {
      console.error('[SessionsPage] Error loading sessions:', error);
      setError(error.response?.data?.error?.message || error.message || 'Error desconocido al cargar sesiones');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSession = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    console.log('[SessionsPage] Creating session with data:', formData);
    
    try {
      const response = await apiClient.createSession(formData);
      console.log('[SessionsPage] Session created:', response);
      
      setShowCreateForm(false);
      
      // Reload sessions after creation
      await loadSessions();
      
      // Show success message
      alert(`Sesión creada exitosamente: ${response.data?.id || 'ID desconocido'}`);
    } catch (error: any) {
      console.error('[SessionsPage] Error creating session:', error);
      const errorMessage = error.response?.data?.error?.message 
        || error.response?.data?.detail 
        || error.message 
        || 'Error desconocido al crear sesión';
      setError(errorMessage);
      alert('Error al crear sesión: ' + errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentSessions = filteredSessions.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredSessions.length / itemsPerPage);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Sesiones de Aprendizaje</h1>
          <p className="text-gray-500 mt-1">
            {filteredSessions.length} {filteredSessions.length === 1 ? 'sesión' : 'sesiones'}
            {searchQuery || filterMode !== 'all' || filterStatus !== 'all' ? ' (filtradas)' : ''}
          </p>
        </div>
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
        >
          {showCreateForm ? 'Cancelar' : '+ Nueva Sesión'}
        </button>
      </div>

      {/* Error message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
          <p className="font-medium">Error:</p>
          <p className="text-sm">{error}</p>
        </div>
      )}

      {showCreateForm && (
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Crear Nueva Sesión</h2>
          <form onSubmit={handleCreateSession} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                ID de Actividad
              </label>
              <input
                type="text"
                value={formData.activity_id}
                onChange={(e) => setFormData({ ...formData, activity_id: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="prog2_tp1_colas"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Modo
              </label>
              <select
                value={formData.mode}
                onChange={(e) => setFormData({ ...formData, mode: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="TUTOR">Tutor</option>
                <option value="EVALUATOR">Evaluador</option>
                <option value="SIMULATOR">Simulador</option>
              </select>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creando...' : 'Crear Sesión'}
            </button>
          </form>
        </div>
      )}

      {/* Search and Filters */}
      {!showCreateForm && sessions.length > 0 && (
        <div className="bg-white shadow rounded-lg p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div className="md:col-span-2">
              <input
                type="text"
                placeholder="Buscar por ID o actividad..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            {/* Mode Filter */}
            <div>
              <select
                value={filterMode}
                onChange={(e) => setFilterMode(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">Todos los modos</option>
                <option value="TUTOR">Tutor</option>
                <option value="EVALUATOR">Evaluador</option>
                <option value="SIMULATOR">Simulador</option>
              </select>
            </div>
            
            {/* Status Filter */}
            <div>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">Todos los estados</option>
                <option value="active">Activas</option>
                <option value="completed">Completadas</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Sessions List */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Mis Sesiones</h2>
        {loading ? (
          <LoadingState type="spinner" message="Cargando sesiones..." />
        ) : sessions.length === 0 ? (
          <EmptyState
            icon="📝"
            title="No hay sesiones"
            description="Crea una nueva sesión para comenzar tu aprendizaje"
            action={{
              label: 'Crear primera sesión',
              onClick: () => setShowCreateForm(true)
            }}
          />
        ) : filteredSessions.length === 0 ? (
          <EmptyState
            icon="🔍"
            title="No se encontraron sesiones"
            description="Intenta ajustar los filtros de búsqueda"
            action={{
              label: 'Limpiar filtros',
              onClick: () => {
                setSearchQuery('');
                setFilterMode('all');
                setFilterStatus('all');
              }
            }}
          />
        ) : (
          <>
            <div className="space-y-3">
              {currentSessions.map((session) => (
                <div
                  key={session.id}
                  onClick={() => navigate(`/sessions/${session.id}`)}
                  className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 hover:border-blue-300 transition-all cursor-pointer"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium text-gray-900">{session.activity_id}</h3>
                        <Badge variant={session.mode === 'TUTOR' ? 'info' : session.mode === 'SIMULATOR' ? 'warning' : 'default'} size="sm">
                          {session.mode}
                        </Badge>
                        <Badge variant={session.status === 'active' ? 'success' : 'default'} size="sm">
                          {session.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-500 mt-2 flex items-center gap-4">
                        <span>🔗 {session.trace_count || 0} trazas</span>
                        <span>⚠️ {session.risk_count || 0} riesgos</span>
                        <span className="text-xs text-gray-400">
                          📅 {new Date(session.created_at).toLocaleString()}
                        </span>
                      </p>
                    </div>
                    <div className="text-blue-600 hover:text-blue-700">
                      →
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-2 mt-6">
                <button
                  onClick={() => setCurrentPage(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="px-3 py-1 border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  ← Anterior
                </button>
                
                <div className="flex gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`px-3 py-1 rounded-md ${
                        page === currentPage
                          ? 'bg-blue-600 text-white'
                          : 'border border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                </div>
                
                <button
                  onClick={() => setCurrentPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1 border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Siguiente →
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
