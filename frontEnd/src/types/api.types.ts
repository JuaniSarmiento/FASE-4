/**
 * Tipos TypeScript para la API del ecosistema AI-Native
 * Basados en los schemas de Pydantic del backend
 */

// ==================== ENUMS ====================

/**
 * SessionMode - Modos operativos del motor cognitivo
 *
 * Alineado con backend/core/cognitive_engine.py AgentMode
 */
export enum SessionMode {
  TUTOR = 'TUTOR',           // T-IA-Cog - Tutor cognitivo
  EVALUATOR = 'EVALUATOR',   // E-IA-Proc - Evaluador de procesos
  SIMULATOR = 'SIMULATOR',   // S-IA-X - Simuladores profesionales
  RISK_ANALYST = 'RISK_ANALYST', // AR-IA - Analista de riesgos
  GOVERNANCE = 'GOVERNANCE', // GOV-IA - Gobernanza y delegación
}

export enum SessionStatus {
  ACTIVE = 'active',
  COMPLETED = 'completed',
  PAUSED = 'paused',
  ABORTED = 'aborted',
}

export enum CognitiveIntent {
  UNDERSTANDING = 'UNDERSTANDING',
  EXPLORATION = 'EXPLORATION',
  PLANNING = 'PLANNING',
  IMPLEMENTATION = 'IMPLEMENTATION',
  DEBUGGING = 'DEBUGGING',
  VALIDATION = 'VALIDATION',
  REFLECTION = 'REFLECTION',
  UNKNOWN = 'UNKNOWN',
}

export enum CognitiveState {
  // Estados principales (español - lowercase como en backend)
  EXPLORACION = 'exploracion',
  PLANIFICACION = 'planificacion',
  IMPLEMENTACION = 'implementacion',
  DEPURACION = 'depuracion',
  VALIDACION = 'validacion',
  REFLEXION = 'reflexion',
  // Aliases en inglés para compatibilidad
  EXPLORATION = 'exploracion',
  PLANNING = 'planificacion',
  IMPLEMENTATION = 'implementacion',
  DEBUGGING = 'depuracion',
  VALIDATION = 'validacion',
  REFLECTION = 'reflexion',
}

export enum TraceLevel {
  N1_SUPERFICIAL = 'n1_superficial',
  N2_TECNICO = 'n2_tecnico',
  N3_INTERACCIONAL = 'n3_interaccional',
  N4_COGNITIVO = 'n4_cognitivo',
}

export enum RiskLevel {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
  INFO = 'info',
}

/**
 * RiskType - Tipos de riesgo según AR-IA
 *
 * Alineado con backend/models/risk.py RiskType
 */
export enum RiskType {
  // Riesgos Cognitivos (RC)
  COGNITIVE_DELEGATION = 'cognitive_delegation',
  SUPERFICIAL_REASONING = 'superficial_reasoning',
  AI_DEPENDENCY = 'ai_dependency',
  LACK_JUSTIFICATION = 'lack_justification',
  NO_SELF_REGULATION = 'no_self_regulation',
  // Riesgos Éticos (RE)
  ACADEMIC_INTEGRITY = 'academic_integrity',
  UNDISCLOSED_AI_USE = 'undisclosed_ai_use',
  PLAGIARISM = 'plagiarism',
  // Riesgos Epistémicos (REp)
  CONCEPTUAL_ERROR = 'conceptual_error',
  LOGICAL_FALLACY = 'logical_fallacy',
  UNCRITICAL_ACCEPTANCE = 'uncritical_acceptance',
  // Riesgos Técnicos (RT)
  SECURITY_VULNERABILITY = 'security_vulnerability',
  POOR_CODE_QUALITY = 'poor_code_quality',
  ARCHITECTURAL_FLAW = 'architectural_flaw',
  // Riesgos de Gobernanza (RG)
  POLICY_VIOLATION = 'policy_violation',
  UNAUTHORIZED_USE = 'unauthorized_use',
}

/**
 * RiskDimension - Dimensiones de riesgo según ISO/IEC 23894
 *
 * Alineado con backend/models/risk.py RiskDimension
 */
export enum RiskDimension {
  COGNITIVE = 'cognitive',   // Riesgos cognitivos (RC)
  ETHICAL = 'ethical',       // Riesgos éticos (RE)
  EPISTEMIC = 'epistemic',   // Riesgos epistémicos (REp)
  TECHNICAL = 'technical',   // Riesgos técnicos (RT)
  GOVERNANCE = 'governance', // Riesgos de gobernanza (RG)
}

/**
 * Helper labels para RiskType en UI
 */
export const RiskTypeLabels: Record<RiskType, string> = {
  [RiskType.COGNITIVE_DELEGATION]: 'Delegación Cognitiva',
  [RiskType.SUPERFICIAL_REASONING]: 'Razonamiento Superficial',
  [RiskType.AI_DEPENDENCY]: 'Dependencia de IA',
  [RiskType.LACK_JUSTIFICATION]: 'Falta de Justificación',
  [RiskType.NO_SELF_REGULATION]: 'Sin Autorregulación',
  [RiskType.ACADEMIC_INTEGRITY]: 'Integridad Académica',
  [RiskType.UNDISCLOSED_AI_USE]: 'Uso No Declarado de IA',
  [RiskType.PLAGIARISM]: 'Plagio',
  [RiskType.CONCEPTUAL_ERROR]: 'Error Conceptual',
  [RiskType.LOGICAL_FALLACY]: 'Falacia Lógica',
  [RiskType.UNCRITICAL_ACCEPTANCE]: 'Aceptación Acrítica',
  [RiskType.SECURITY_VULNERABILITY]: 'Vulnerabilidad de Seguridad',
  [RiskType.POOR_CODE_QUALITY]: 'Baja Calidad de Código',
  [RiskType.ARCHITECTURAL_FLAW]: 'Fallo Arquitectónico',
  [RiskType.POLICY_VIOLATION]: 'Violación de Políticas',
  [RiskType.UNAUTHORIZED_USE]: 'Uso No Autorizado',
};

/**
 * Helper labels para RiskDimension en UI
 */
export const RiskDimensionLabels: Record<RiskDimension, string> = {
  [RiskDimension.COGNITIVE]: 'Cognitivo',
  [RiskDimension.ETHICAL]: 'Ético',
  [RiskDimension.EPISTEMIC]: 'Epistémico',
  [RiskDimension.TECHNICAL]: 'Técnico',
  [RiskDimension.GOVERNANCE]: 'Gobernanza',
};

// ==================== SESSION ====================

export interface SessionCreate {
  student_id: string;
  activity_id: string;
  mode: SessionMode;
  simulator_type?: string;
}

export interface SessionUpdate {
  mode?: SessionMode;
  status?: SessionStatus;
}

export interface SessionResponse {
  id: string;
  student_id: string;
  activity_id: string;
  user_id: string | null;  // ID del usuario autenticado (null para sesiones anónimas/legacy)
  mode: string;
  status: string;
  simulator_type?: string | null;
  start_time: string;
  end_time: string | null;
  trace_count: number;
  risk_count: number;
  created_at: string;
  updated_at: string;
}

export interface SessionDetailResponse extends SessionResponse {
  traces_summary: Record<string, number>;
  risks_summary: Record<string, number>;
  ai_dependency_score: number | null;
}

// ==================== INTERACTION ====================

export interface InteractionRequest {
  session_id: string;
  prompt: string;
  context?: Record<string, any>;
  cognitive_intent?: CognitiveIntent;
}

export interface InteractionResponse {
  interaction_id: string;
  session_id: string;
  response: string;
  agent_used: string;
  cognitive_state_detected: string;
  ai_involvement: number;
  blocked: boolean;
  block_reason: string | null;
  trace_id: string;
  risks_detected: string[];
  timestamp: string;
}

export interface InteractionSummary {
  id: string;
  prompt_preview: string;
  agent_used: string;
  cognitive_state: string;
  ai_involvement: number;
  blocked: boolean;
  timestamp: string;
}

// ==================== TRACES ====================

/**
 * CognitiveTrace - Traza cognitiva N4 completa
 *
 * Alineado con backend/api/routers/traces.py TraceResponse
 * Incluye todos los campos N4 para análisis cognitivo profundo
 */
export interface CognitiveTrace {
  id: string;
  session_id: string;
  student_id: string;
  activity_id: string;
  trace_level: TraceLevel | string;
  interaction_type: string;
  cognitive_state: string | null;
  cognitive_intent: string | null;
  content: string;
  ai_involvement: number | null;
  // N4 Cognitive fields
  context: Record<string, any> | null;
  metadata?: Record<string, any>;  // Mapped from trace_metadata in ORM
  decision_justification: string | null;
  alternatives_considered: string[] | null;
  strategy_type: string | null;
  // Relationships
  agent_id: string | null;
  parent_trace_id: string | null;
  // Timestamps
  timestamp: string;
  created_at?: string;
}

/**
 * Punto de evolución de dependencia de IA
 * Alineado con backend/api/schemas/cognitive_path.py AIDependencyPoint
 */
export interface AIDependencyPoint {
  timestamp: string;
  ai_involvement: number;
}

/**
 * Fase cognitiva del camino
 * Alineado con backend/api/schemas/cognitive_path.py CognitivePhase
 */
export interface CognitivePhase {
  phase_name: string;
  start_time: string;
  end_time: string | null;
  duration_minutes: number | null;
  interactions_count: number;
  ai_involvement_avg: number;
  risks_detected: string[];
  key_decisions: string[];
}

/**
 * Transición entre fases cognitivas
 * Alineado con backend/api/schemas/cognitive_path.py CognitiveTransition
 */
export interface CognitiveTransition {
  from_phase: string;
  to_phase: string;
  timestamp: string;
  trigger: string | null;
}

/**
 * Resumen del camino cognitivo
 * Alineado con backend/api/schemas/cognitive_path.py CognitivePathSummary
 */
export interface CognitivePathSummary {
  total_interactions: number;
  total_duration_minutes: number;
  blocked_interactions: number;
  ai_dependency_average: number;
  strategy_changes: number;
  risks_total: number;
  risks_by_level: Record<string, number>;
}

/**
 * Camino cognitivo reconstructivo completo
 * Alineado con backend/api/schemas/cognitive_path.py CognitivePath
 */
export interface CognitivePath {
  session_id: string;
  student_id: string;
  activity_id: string;
  start_time: string;
  end_time: string | null;
  summary: CognitivePathSummary;
  phases: CognitivePhase[];
  transitions: CognitiveTransition[];
  ai_dependency_evolution: AIDependencyPoint[];
  strategy_changes: string[];
}

// ==================== RISKS ====================

/**
 * Risk - Riesgo detectado por AR-IA
 *
 * Alineado con backend/api/routers/risks.py RiskResponse
 * Backend sends created_at, frontend maps to timestamp for compatibility
 */
export interface Risk {
  id: string;
  session_id: string;
  student_id: string;
  activity_id: string;
  risk_type: string;
  risk_level: RiskLevel | string;
  dimension: string;
  description: string;
  evidence: string[];
  recommendations: string[];
  trace_ids: string[];
  resolved: boolean;
  resolution_notes: string | null;
  created_at: string;  // Actual field from backend
  timestamp?: string;  // Alias for created_at (frontend compatibility)
}

// ==================== EVALUATION ====================

/**
 * CompetencyLevel - Niveles de competencia del estudiante
 *
 * Alineado con backend/models/evaluation.py CompetencyLevel
 * Valores en español (lowercase) como usa el backend
 */
export enum CompetencyLevel {
  INICIAL = 'inicial',           // Principiante
  EN_DESARROLLO = 'en_desarrollo', // Desarrollando la competencia
  AUTONOMO = 'autonomo',         // Autónomo
  EXPERTO = 'experto',           // Nivel experto
}

/**
 * Helper para mostrar CompetencyLevel en UI de forma amigable
 */
export const CompetencyLevelLabels: Record<CompetencyLevel, string> = {
  [CompetencyLevel.INICIAL]: 'Inicial',
  [CompetencyLevel.EN_DESARROLLO]: 'En Desarrollo',
  [CompetencyLevel.AUTONOMO]: 'Autónomo',
  [CompetencyLevel.EXPERTO]: 'Experto',
};

export interface EvaluationDimension {
  dimension: string;
  score: number;
  level: CompetencyLevel | string;
  evidence: string[];
  feedback: string;
}

export interface ConceptualError {
  error_type: string;
  description: string;
  location: string;
  severity: 'low' | 'medium' | 'high';
  recommendation: string;
}

export interface ReasoningAnalysis {
  phases_identified: string[];
  phase_transitions: string[];
  reasoning_quality: string;
  conceptual_errors: ConceptualError[];
  metacognitive_evidence: string[];
  problem_solving_strategy: string;
  completeness_score: number;
}

export interface GitAnalysis {
  commits_analyzed: number;
  code_evolution_quality: string;
  consistency_score: number;
  patterns_detected: string[];
  ai_generated_code_percentage: number;
  copy_paste_detected: boolean;
}

export interface EvaluationReport {
  id: string;
  session_id: string;
  student_id: string;
  activity_id: string;
  overall_competency_level: string;
  overall_score: number;
  dimensions: EvaluationDimension[];
  key_strengths: string[];
  improvement_areas: string[];
  reasoning_analysis: ReasoningAnalysis | null;
  git_analysis: GitAnalysis | null;
  ai_dependency_score: number;  // Score de dependencia de IA (0-1)
  ai_dependency_metrics: Record<string, any>;  // Métricas detalladas
  timestamp: string;  // Alias for created_at (frontend compatibility)
  created_at?: string;
}

// ==================== API RESPONSE WRAPPERS ====================

export interface APIResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  timestamp?: string;
}

export interface APIError {
  success: false;
  error: {
    error_code: string;
    message: string;
    field: string | null;
    extra?: Record<string, any>;
  };
  timestamp: string;
}

export interface PaginationParams {
  page: number;
  page_size: number;
}

export interface PaginationMeta {
  page: number;
  page_size: number;
  total_items: number;
  total_pages: number;
  has_next: boolean;
  has_prev: boolean;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: PaginationMeta;
  message?: string;
}

// ==================== HEALTH ====================

export interface HealthResponse {
  status: string;
  version: string;
  database: string;
  agents: Record<string, string>;
  timestamp: string;
}

// ==================== MESSAGE (for Chat UI) ====================

/**
 * Estados posibles de un mensaje durante el envío
 */
export type MessageStatus = 'pending' | 'sent' | 'retrying' | 'failed';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  status?: MessageStatus;  // Estado del mensaje (solo para user messages)
  retry_count?: number;    // Contador de reintentos
  metadata?: {
    agent_used?: string;
    cognitive_state?: string;
    ai_involvement?: number;
    blocked?: boolean;
    block_reason?: string;
    risks_detected?: string[];
  };
}

// ==================== ACTIVITIES ====================

export enum ActivityDifficulty {
  INICIAL = 'INICIAL',
  INTERMEDIO = 'INTERMEDIO',
  AVANZADO = 'AVANZADO',
}

export enum ActivityStatus {
  DRAFT = 'draft',
  ACTIVE = 'active',
  ARCHIVED = 'archived',
}

export enum HelpLevel {
  MINIMO = 'minimo',
  BAJO = 'bajo',
  MEDIO = 'medio',
  ALTO = 'alto',
}

export interface PolicyConfig {
  max_help_level: HelpLevel;
  block_complete_solutions: boolean;
  require_justification: boolean;
  allow_code_snippets: boolean;
  risk_thresholds: Record<string, number>;
}

export interface ActivityCreate {
  activity_id: string;
  title: string;
  instructions: string;
  teacher_id: string;
  policies: PolicyConfig;
  description?: string;
  evaluation_criteria?: string[];
  subject?: string;
  difficulty?: ActivityDifficulty;
  estimated_duration_minutes?: number;
  tags?: string[];
}

export interface ActivityUpdate {
  title?: string;
  description?: string;
  instructions?: string;
  policies?: PolicyConfig;
  evaluation_criteria?: string[];
  subject?: string;
  difficulty?: ActivityDifficulty;
  estimated_duration_minutes?: number;
  tags?: string[];
}

export interface ActivityResponse {
  id: string;
  activity_id: string;
  title: string;
  description: string | null;
  instructions: string;
  evaluation_criteria: string[];
  teacher_id: string;
  policies: PolicyConfig;
  subject: string | null;
  difficulty: string | null;
  estimated_duration_minutes: number | null;
  tags: string[];
  status: string;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}