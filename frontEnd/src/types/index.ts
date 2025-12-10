// ===== API Types =====
export interface APIResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  errors?: string[];
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  meta: {
    total: number;
    page: number;
    page_size: number;
    total_pages: number;
  };
}

// ===== Auth Types =====
export interface User {
  id: string;
  username: string;
  email: string;
  full_name?: string;
  roles: string[];
  is_active: boolean;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface RegisterData {
  username: string;
  email: string;
  password: string;
  full_name?: string;
  role?: string;
}

// ===== Session Types =====
export type SessionMode = 'TUTOR' | 'SIMULATOR' | 'PRACTICE';
export type SessionStatus = 'active' | 'completed' | 'paused' | 'abandoned';

export interface Session {
  id: string;
  student_id: string;
  activity_id: string;
  mode: SessionMode;
  status: SessionStatus;
  simulator_type?: string;
  start_time: string;
  end_time?: string;
  trace_count: number;
  risk_count: number;
  created_at: string;
  updated_at: string;
}

export interface CreateSessionData {
  student_id: string;
  activity_id: string;
  mode: SessionMode;
  simulator_type?: string;
}

// ===== Interaction Types =====
export interface Interaction {
  session_id: string;
  prompt: string;
  context?: Record<string, unknown>;
  cognitive_intent?: string;
}

export interface InteractionResponse {
  interaction_id: string;
  response: string;
  cognitive_state: string;
  help_level: string;
  risks_detected: Risk[];
  trace_id: string;
  processing_time_ms: number;
}

// ===== Simulator Types =====
export type SimulatorType = 
  | 'PRODUCT_OWNER'
  | 'SCRUM_MASTER'
  | 'TECH_INTERVIEWER'
  | 'INCIDENT_RESPONDER'
  | 'CLIENT'
  | 'DEVSECOPS';

export interface Simulator {
  type: SimulatorType;
  name: string;
  description: string;
  competencies: string[];
  status: 'active' | 'development';
  icon?: string;
}

export interface SimulatorInteraction {
  session_id: string;
  simulator_type: SimulatorType;
  prompt: string;
  context?: Record<string, unknown>;
}

export interface SimulatorResponse {
  response: string;
  competency_scores: Record<string, number>;
  feedback: string;
  suggestions: string[];
}

// ===== Exercise Types =====
export interface Exercise {
  id: string;
  title: string;
  description: string;
  difficulty_level: number;
  starter_code?: string;
  hints?: string[];
  max_score: number;
  time_limit_seconds: number;
  category?: string;
  tags?: string[];
}

export interface ExerciseSubmission {
  exercise_id: string;
  code: string;
}

export interface SubmissionResult {
  id: string;
  passed_tests: number;
  total_tests: number;
  is_correct: boolean;
  execution_time_ms: number;
  ai_score?: number;
  ai_feedback?: string;
  code_quality_score?: number;
  readability_score?: number;
  efficiency_score?: number;
  best_practices_score?: number;
  test_results: TestResult[];
}

export interface TestResult {
  name: string;
  passed: boolean;
  input: string;
  expected_output: string;
  actual_output: string;
  error?: string;
}

// ===== Risk Types =====
export type RiskDimension = 
  | 'cognitive'
  | 'ethical'
  | 'technical'
  | 'dependency'
  | 'pedagogical';

export type RiskSeverity = 'low' | 'medium' | 'high' | 'critical';

export interface Risk {
  id: string;
  session_id: string;
  dimension: RiskDimension;
  severity: RiskSeverity;
  description: string;
  recommendation?: string;
  detected_at: string;
  is_resolved: boolean;
}

// ===== Activity Types =====
export interface Activity {
  id: string;
  activity_id: string;
  title: string;
  instructions: string;
  teacher_id: string;
  policies: ActivityPolicies;
  status: 'draft' | 'published' | 'archived';
  created_at: string;
  updated_at: string;
}

export interface ActivityPolicies {
  max_help_level: 'BAJO' | 'MEDIO' | 'ALTO';
  block_complete_solutions: boolean;
  require_justification: boolean;
  allow_code_snippets: boolean;
  risk_thresholds?: Record<string, number>;
}

// ===== Trace Types =====
export interface CognitiveTrace {
  id: string;
  session_id: string;
  interaction_id: string;
  cognitive_state: string;
  cognitive_intent?: string;
  help_level: string;
  reasoning_path?: string;
  created_at: string;
}

// ===== Cognitive Path Types =====
export interface CognitivePath {
  session_id: string;
  student_id: string;
  phases: CognitivePhase[];
  transitions: CognitiveTransition[];
  summary: CognitivePathSummary;
}

export interface CognitivePhase {
  name: string;
  start_time: string;
  end_time?: string;
  interaction_count: number;
  help_requests: number;
  risks_detected: number;
}

export interface CognitiveTransition {
  from_phase: string;
  to_phase: string;
  timestamp: string;
  trigger: string;
}

export interface CognitivePathSummary {
  total_interactions: number;
  total_time_minutes: number;
  ai_dependency_score: number;
  autonomy_score: number;
  progression_quality: string;
}

// ===== Health Types =====
export interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  version: string;
  database: 'connected' | 'disconnected';
  timestamp: string;
  components?: Record<string, ComponentHealth>;
}

export interface ComponentHealth {
  status: 'healthy' | 'degraded' | 'unhealthy';
  latency_ms?: number;
  message?: string;
}

// ===== Chat Message Types =====
export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  metadata?: {
    cognitiveState?: string;
    helpLevel?: string;
    risks?: Risk[];
    processingTime?: number;
  };
}

// ===== Traceability N4 Types =====
export interface TraceabilityN4 {
  trace_id: string;
  nodes: TraceabilityNode[];
  metadata: {
    total_processing_time_ms: number;
    created_at: string;
  };
}

export interface TraceabilityNode {
  id: string;
  level: 'N1' | 'N2' | 'N3' | 'N4';
  timestamp: string;
  data: Record<string, unknown>;
  metadata: {
    processing_time_ms: number;
    transformations: string[];
  };
}

// ===== Risk Analysis 5D Types =====
export interface RiskAnalysis5D {
  session_id: string;
  overall_score: number;
  risk_level: 'low' | 'medium' | 'high' | 'critical';
  dimensions: {
    cognitive: RiskDimensionScore;
    ethical: RiskDimensionScore;
    epistemic: RiskDimensionScore;
    technical: RiskDimensionScore;
    governance: RiskDimensionScore;
  };
  top_risks: RiskItem[];
  recommendations: string[];
}

export interface RiskDimensionScore {
  score: number;
  level: 'low' | 'medium' | 'high' | 'critical';
  indicators: string[];
}

export interface RiskItem {
  dimension: string;
  description: string;
  severity: string;
  recommendation: string;
}

// ===== Evaluation Types =====
export interface ProcessEvaluation {
  session_id: string;
  student_id: string;
  activity_id: string;
  planning: DimensionScore;
  execution: DimensionScore;
  debugging: DimensionScore;
  reflection: DimensionScore;
  autonomy: DimensionScore;
  autonomy_level: 'low' | 'medium' | 'high';
  metacognition_score: number;
  delegation_ratio: number;
  overall_feedback: string;
  strengths: string[];
  areas_for_improvement: string[];
  next_steps: string[];
}

export interface DimensionScore {
  score: number;
  level: 'novice' | 'competent' | 'proficient' | 'expert';
  evidence: string[];
  recommendations: string[];
}

// ===== User Stats Types =====
export interface UserStats {
  total_sessions: number;
  completed_exercises: number;
  average_score: number;
  total_interactions: number;
  ai_dependency_ratio: number;
  top_competencies: Array<{
    name: string;
    score: number;
  }>;
  recent_activity: Array<{
    date: string;
    count: number;
  }>;
}
