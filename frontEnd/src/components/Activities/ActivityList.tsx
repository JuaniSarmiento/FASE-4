import { useState, useEffect } from 'react';
import { activitiesService } from '@/services/api';
import type { ActivityResponse } from '@/types/api.types';
import './ActivityList.css';

interface ActivityListProps {
  teacherId: string;
  onEdit?: (activity: ActivityResponse) => void;
  onView?: (activity: ActivityResponse) => void;
}

export function ActivityList({ teacherId, onEdit, onView }: ActivityListProps) {
  const [activities, setActivities] = useState<ActivityResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<'all' | 'draft' | 'active' | 'archived'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Load activities
  useEffect(() => {
    loadActivities();
  }, [teacherId, filterStatus]);

  const loadActivities = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const params: any = { teacher_id: teacherId };
      if (filterStatus !== 'all') {
        params.status = filterStatus;
      }

      const response = await activitiesService.list(params);
      setActivities(response.data);
    } catch (err: any) {
      const errorMessage = err.response?.data?.error?.message || err.message || 'Error al cargar actividades';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePublish = async (activityId: string) => {
    if (!confirm('¿Publicar esta actividad? Los estudiantes podrán verla y usarla.')) {
      return;
    }

    try {
      await activitiesService.publish(activityId);
      loadActivities(); // Reload
    } catch (err: any) {
      alert('Error al publicar: ' + (err.response?.data?.error?.message || err.message));
    }
  };

  const handleArchive = async (activityId: string) => {
    if (!confirm('¿Archivar esta actividad? Ya no estará disponible para estudiantes.')) {
      return;
    }

    try {
      await activitiesService.archive(activityId);
      loadActivities(); // Reload
    } catch (err: any) {
      alert('Error al archivar: ' + (err.response?.data?.error?.message || err.message));
    }
  };

  const handleDelete = async (activityId: string) => {
    if (!confirm('¿Eliminar esta actividad? Esta acción la archivará.')) {
      return;
    }

    try {
      await activitiesService.remove(activityId);
      loadActivities(); // Reload
    } catch (err: any) {
      alert('Error al eliminar: ' + (err.response?.data?.error?.message || err.message));
    }
  };

  const handleClone = async (activity: ActivityResponse) => {
    const newId = prompt(`Clonar actividad "${activity.title}". Ingrese el nuevo ID:`);
    if (!newId) return;

    try {
      await activitiesService.clone(activity.activity_id, newId, teacherId);
      loadActivities(); // Reload
      alert('Actividad clonada exitosamente!');
    } catch (err: any) {
      alert('Error al clonar: ' + (err.response?.data?.error?.message || err.message));
    }
  };

  // Filter activities by search term
  const filteredActivities = activities.filter((activity) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    return (
      activity.title.toLowerCase().includes(term) ||
      activity.activity_id.toLowerCase().includes(term) ||
      (activity.description && activity.description.toLowerCase().includes(term)) ||
      (activity.subject && activity.subject.toLowerCase().includes(term)) ||
      activity.tags.some((tag) => tag.toLowerCase().includes(term))
    );
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'draft':
        return <span className="badge badge-draft">Borrador</span>;
      case 'active':
        return <span className="badge badge-active">Activa</span>;
      case 'archived':
        return <span className="badge badge-archived">Archivada</span>;
      default:
        return <span className="badge">{status}</span>;
    }
  };

  const getDifficultyBadge = (difficulty: string | null) => {
    if (!difficulty) return null;
    switch (difficulty) {
      case 'INICIAL':
        return <span className="badge-difficulty badge-easy">Inicial</span>;
      case 'INTERMEDIO':
        return <span className="badge-difficulty badge-medium">Intermedio</span>;
      case 'AVANZADO':
        return <span className="badge-difficulty badge-hard">Avanzado</span>;
      default:
        return <span className="badge-difficulty">{difficulty}</span>;
    }
  };

  if (isLoading) {
    return (
      <div className="activity-list">
        <div className="loading">
          <div className="spinner"></div>
          <p>Cargando actividades...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="activity-list">
        <div className="error-container">
          <p className="error-message">❌ {error}</p>
          <button onClick={loadActivities} className="btn-retry">
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="activity-list">
      <div className="activity-list-header">
        <h2>📚 Mis Actividades</h2>
        <p className="subtitle">Gestiona las actividades que has creado</p>
      </div>

      {/* Filters and Search */}
      <div className="activity-filters">
        <div className="search-box">
          <input
            type="text"
            placeholder="Buscar por título, ID, materia, etiquetas..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="status-filters">
          <button
            className={`filter-btn ${filterStatus === 'all' ? 'active' : ''}`}
            onClick={() => setFilterStatus('all')}
          >
            Todas
          </button>
          <button
            className={`filter-btn ${filterStatus === 'draft' ? 'active' : ''}`}
            onClick={() => setFilterStatus('draft')}
          >
            Borradores
          </button>
          <button
            className={`filter-btn ${filterStatus === 'active' ? 'active' : ''}`}
            onClick={() => setFilterStatus('active')}
          >
            Activas
          </button>
          <button
            className={`filter-btn ${filterStatus === 'archived' ? 'active' : ''}`}
            onClick={() => setFilterStatus('archived')}
          >
            Archivadas
          </button>
        </div>
      </div>

      {/* Activities Count */}
      <div className="activities-count">
        {filteredActivities.length} {filteredActivities.length === 1 ? 'actividad' : 'actividades'}
        {searchTerm && ` (filtradas de ${activities.length})`}
      </div>

      {/* Activities List */}
      {filteredActivities.length === 0 ? (
        <div className="empty-state">
          <p>📭 No se encontraron actividades</p>
          {searchTerm && <small>Intenta ajustar los filtros de búsqueda</small>}
        </div>
      ) : (
        <div className="activities-grid">
          {filteredActivities.map((activity) => (
            <div key={activity.id} className="activity-card">
              <div className="activity-card-header">
                <div className="activity-status">
                  {getStatusBadge(activity.status)}
                  {getDifficultyBadge(activity.difficulty)}
                </div>
              </div>

              <div className="activity-card-body">
                <h3 className="activity-title">{activity.title}</h3>
                <p className="activity-id">ID: {activity.activity_id}</p>

                {activity.description && (
                  <p className="activity-description">{activity.description}</p>
                )}

                <div className="activity-meta">
                  {activity.subject && (
                    <span className="meta-item">
                      <strong>Materia:</strong> {activity.subject}
                    </span>
                  )}
                  {activity.estimated_duration_minutes && (
                    <span className="meta-item">
                      <strong>Duración:</strong> {activity.estimated_duration_minutes} min
                    </span>
                  )}
                  <span className="meta-item">
                    <strong>Criterios:</strong> {activity.evaluation_criteria.length}
                  </span>
                </div>

                {activity.tags.length > 0 && (
                  <div className="activity-tags">
                    {activity.tags.map((tag, index) => (
                      <span key={index} className="tag-sm">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                <div className="activity-dates">
                  <small>Creada: {formatDate(activity.created_at)}</small>
                  {activity.published_at && (
                    <small>Publicada: {formatDate(activity.published_at)}</small>
                  )}
                </div>
              </div>

              <div className="activity-card-actions">
                {onView && (
                  <button
                    onClick={() => onView(activity)}
                    className="btn-action btn-view"
                    title="Ver detalles"
                  >
                    👁️ Ver
                  </button>
                )}

                {onEdit && (
                  <button
                    onClick={() => onEdit(activity)}
                    className="btn-action btn-edit"
                    title="Editar"
                  >
                    ✏️ Editar
                  </button>
                )}

                {activity.status === 'draft' && (
                  <button
                    onClick={() => handlePublish(activity.activity_id)}
                    className="btn-action btn-publish"
                    title="Publicar"
                  >
                    📢 Publicar
                  </button>
                )}

                {activity.status === 'active' && (
                  <button
                    onClick={() => handleArchive(activity.activity_id)}
                    className="btn-action btn-archive"
                    title="Archivar"
                  >
                    📦 Archivar
                  </button>
                )}

                <button
                  onClick={() => handleClone(activity)}
                  className="btn-action btn-clone"
                  title="Clonar"
                >
                  📋 Clonar
                </button>

                <button
                  onClick={() => handleDelete(activity.activity_id)}
                  className="btn-action btn-delete"
                  title="Eliminar"
                >
                  🗑️ Eliminar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}