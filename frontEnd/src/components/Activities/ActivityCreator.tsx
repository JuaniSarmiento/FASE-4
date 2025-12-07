import { useState, FormEvent } from 'react';
import { activitiesService } from '@/services/api';
import {
  ActivityCreate,
  HelpLevel,
  ActivityDifficulty,
  PolicyConfig,
  ActivityResponse,
} from '@/types/api.types';
import './ActivityCreator.css';

interface ActivityCreatorProps {
  teacherId: string;
  onSuccess?: (activity: ActivityResponse) => void;
  onCancel?: () => void;
}

export function ActivityCreator({ teacherId, onSuccess, onCancel }: ActivityCreatorProps) {
  // Basic Information
  const [activityId, setActivityId] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [instructions, setInstructions] = useState('');
  const [subject, setSubject] = useState('');
  const [difficulty, setDifficulty] = useState<ActivityDifficulty | ''>('');
  const [estimatedDuration, setEstimatedDuration] = useState<number | ''>('');

  // Evaluation Criteria
  const [criteriaInput, setCriteriaInput] = useState('');
  const [evaluationCriteria, setEvaluationCriteria] = useState<string[]>([]);

  // Tags
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);

  // Pedagogical Policies
  const [maxHelpLevel, setMaxHelpLevel] = useState<HelpLevel>(HelpLevel.MEDIO);
  const [blockCompleteSolutions, setBlockCompleteSolutions] = useState(true);
  const [requireJustification, setRequireJustification] = useState(true);
  const [allowCodeSnippets, setAllowCodeSnippets] = useState(false);
  const [aiDependencyThreshold, setAiDependencyThreshold] = useState(0.6);
  const [justificationThreshold, setJustificationThreshold] = useState(0.3);

  // UI State
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Handlers for dynamic lists
  const addCriteria = () => {
    if (criteriaInput.trim()) {
      setEvaluationCriteria([...evaluationCriteria, criteriaInput.trim()]);
      setCriteriaInput('');
    }
  };

  const removeCriteria = (index: number) => {
    setEvaluationCriteria(evaluationCriteria.filter((_, i) => i !== index));
  };

  const addTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput('');
    }
  };

  const removeTag = (index: number) => {
    setTags(tags.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    // Validation
    if (!activityId.trim() || !title.trim() || !instructions.trim()) {
      setError('Los campos Activity ID, Título e Instrucciones son obligatorios');
      return;
    }

    // Build policies object
    const policies: PolicyConfig = {
      max_help_level: maxHelpLevel,
      block_complete_solutions: blockCompleteSolutions,
      require_justification: requireJustification,
      allow_code_snippets: allowCodeSnippets,
      risk_thresholds: {
        ai_dependency: aiDependencyThreshold,
        lack_justification: justificationThreshold,
      },
    };

    // Build activity data
    const activityData: ActivityCreate = {
      activity_id: activityId.trim(),
      title: title.trim(),
      instructions: instructions.trim(),
      teacher_id: teacherId,
      policies,
      description: description.trim() || undefined,
      evaluation_criteria: evaluationCriteria.length > 0 ? evaluationCriteria : undefined,
      subject: subject.trim() || undefined,
      difficulty: difficulty || undefined,
      estimated_duration_minutes: estimatedDuration ? Number(estimatedDuration) : undefined,
      tags: tags.length > 0 ? tags : undefined,
    };

    setIsLoading(true);

    try {
      const result = await activitiesService.create(activityData);
      setSuccess(true);

      // Reset form after 2 seconds
      setTimeout(() => {
        resetForm();
        if (onSuccess) {
          onSuccess(result);
        }
      }, 2000);
    } catch (err: any) {
      const errorMessage = err.response?.data?.error?.message || err.message || 'Error al crear la actividad';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setActivityId('');
    setTitle('');
    setDescription('');
    setInstructions('');
    setSubject('');
    setDifficulty('');
    setEstimatedDuration('');
    setEvaluationCriteria([]);
    setTags([]);
    setMaxHelpLevel(HelpLevel.MEDIO);
    setBlockCompleteSolutions(true);
    setRequireJustification(true);
    setAllowCodeSnippets(false);
    setAiDependencyThreshold(0.6);
    setJustificationThreshold(0.3);
    setError(null);
    setSuccess(false);
  };

  return (
    <div className="activity-creator">
      <div className="activity-creator-header">
        <h2>📝 Crear Nueva Actividad AI-Native</h2>
        <p className="subtitle">Configure una actividad con políticas pedagógicas personalizadas</p>
      </div>

      <form onSubmit={handleSubmit} className="activity-form">
        {/* Basic Information Section */}
        <section className="form-section">
          <h3>📋 Información Básica</h3>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="activityId">
                ID de Actividad <span className="required">*</span>
              </label>
              <input
                id="activityId"
                type="text"
                value={activityId}
                onChange={(e) => setActivityId(e.target.value)}
                placeholder="prog2_tp1_colas"
                required
                pattern="[a-z0-9_]+"
                title="Solo letras minúsculas, números y guiones bajos"
              />
              <small>Identificador único (ej: prog2_tp1_colas)</small>
            </div>

            <div className="form-group">
              <label htmlFor="title">
                Título <span className="required">*</span>
              </label>
              <input
                id="title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Implementación de Cola Circular"
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="description">Descripción Breve</label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Trabajo práctico sobre estructuras de datos tipo cola..."
              rows={3}
            />
          </div>

          <div className="form-group">
            <label htmlFor="instructions">
              Consigna Detallada <span className="required">*</span>
            </label>
            <textarea
              id="instructions"
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              placeholder="Implementar una cola circular que cumpla con los siguientes requisitos..."
              rows={6}
              required
            />
            <small>Instrucciones completas para el estudiante</small>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="subject">Materia</label>
              <input
                id="subject"
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Programación II"
              />
            </div>

            <div className="form-group">
              <label htmlFor="difficulty">Nivel de Dificultad</label>
              <select
                id="difficulty"
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value as ActivityDifficulty)}
              >
                <option value="">Seleccionar...</option>
                <option value={ActivityDifficulty.INICIAL}>Inicial</option>
                <option value={ActivityDifficulty.INTERMEDIO}>Intermedio</option>
                <option value={ActivityDifficulty.AVANZADO}>Avanzado</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="duration">Duración Estimada (minutos)</label>
              <input
                id="duration"
                type="number"
                min="1"
                value={estimatedDuration}
                onChange={(e) => setEstimatedDuration(e.target.value ? Number(e.target.value) : '')}
                placeholder="120"
              />
            </div>
          </div>
        </section>

        {/* Evaluation Criteria Section */}
        <section className="form-section">
          <h3>🎯 Criterios de Evaluación</h3>

          <div className="dynamic-list-input">
            <input
              type="text"
              value={criteriaInput}
              onChange={(e) => setCriteriaInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addCriteria())}
              placeholder="Agregar criterio..."
            />
            <button type="button" onClick={addCriteria} className="btn-add">
              + Agregar
            </button>
          </div>

          {evaluationCriteria.length > 0 && (
            <ul className="criteria-list">
              {evaluationCriteria.map((criteria, index) => (
                <li key={index}>
                  <span>{criteria}</span>
                  <button
                    type="button"
                    onClick={() => removeCriteria(index)}
                    className="btn-remove"
                  >
                    ✕
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Pedagogical Policies Section */}
        <section className="form-section policies-section">
          <h3>⚙️ Políticas Pedagógicas</h3>
          <p className="section-description">
            Configure el nivel de ayuda y restricciones para el uso de IA
          </p>

          <div className="form-group">
            <label htmlFor="helpLevel">Nivel Máximo de Ayuda</label>
            <select
              id="helpLevel"
              value={maxHelpLevel}
              onChange={(e) => setMaxHelpLevel(e.target.value as HelpLevel)}
            >
              <option value={HelpLevel.MINIMO}>Mínimo (solo pistas)</option>
              <option value={HelpLevel.BAJO}>Bajo (guía conceptual)</option>
              <option value={HelpLevel.MEDIO}>Medio (ayuda moderada)</option>
              <option value={HelpLevel.ALTO}>Alto (ayuda detallada)</option>
            </select>
          </div>

          <div className="checkbox-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={blockCompleteSolutions}
                onChange={(e) => setBlockCompleteSolutions(e.target.checked)}
              />
              <span>Bloquear soluciones completas sin mediación</span>
            </label>

            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={requireJustification}
                onChange={(e) => setRequireJustification(e.target.checked)}
              />
              <span>Requerir justificación explícita de decisiones</span>
            </label>

            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={allowCodeSnippets}
                onChange={(e) => setAllowCodeSnippets(e.target.checked)}
              />
              <span>Permitir fragmentos de código como ayuda</span>
            </label>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="aiThreshold">
                Umbral de Dependencia de IA (0.0 - 1.0)
              </label>
              <input
                id="aiThreshold"
                type="number"
                min="0"
                max="1"
                step="0.1"
                value={aiDependencyThreshold}
                onChange={(e) => setAiDependencyThreshold(Number(e.target.value))}
              />
              <small>Detectar riesgo si supera este valor</small>
            </div>

            <div className="form-group">
              <label htmlFor="justificationThreshold">
                Umbral de Falta de Justificación (0.0 - 1.0)
              </label>
              <input
                id="justificationThreshold"
                type="number"
                min="0"
                max="1"
                step="0.1"
                value={justificationThreshold}
                onChange={(e) => setJustificationThreshold(Number(e.target.value))}
              />
              <small>Detectar riesgo si supera este valor</small>
            </div>
          </div>
        </section>

        {/* Tags Section */}
        <section className="form-section">
          <h3>🏷️ Etiquetas</h3>

          <div className="dynamic-list-input">
            <input
              type="text"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
              placeholder="Agregar etiqueta..."
            />
            <button type="button" onClick={addTag} className="btn-add">
              + Agregar
            </button>
          </div>

          {tags.length > 0 && (
            <div className="tags-container">
              {tags.map((tag, index) => (
                <span key={index} className="tag">
                  {tag}
                  <button
                    type="button"
                    onClick={() => removeTag(index)}
                    className="tag-remove"
                  >
                    ✕
                  </button>
                </span>
              ))}
            </div>
          )}
        </section>

        {/* Messages */}
        {error && (
          <div className="error-message">
            ❌ {error}
          </div>
        )}

        {success && (
          <div className="success-message">
            ✅ Actividad creada exitosamente!
          </div>
        )}

        {/* Form Actions */}
        <div className="form-actions">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="btn-secondary"
              disabled={isLoading}
            >
              Cancelar
            </button>
          )}
          <button
            type="button"
            onClick={resetForm}
            className="btn-secondary"
            disabled={isLoading}
          >
            Limpiar Formulario
          </button>
          <button
            type="submit"
            className="btn-primary"
            disabled={isLoading}
          >
            {isLoading ? 'Creando...' : 'Crear Actividad'}
          </button>
        </div>
      </form>
    </div>
  );
}