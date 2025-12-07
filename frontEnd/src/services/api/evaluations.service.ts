/**
 * Evaluations Service - Evaluador de Procesos (E-IA-Proc)
 *
 * Refactored to use BaseApiService for consistent API response handling.
 * BaseApiService automatically extracts response.data.data from APIResponse wrapper.
 *
 * Types are imported from the central api.types.ts file to avoid duplication.
 */
import { BaseApiService } from './base.service';
import { get, post } from './client';
import {
  CompetencyLevel,
} from '@/types/api.types';
import type {
  EvaluationReport,
  EvaluationDimension,
  ReasoningAnalysis,
  GitAnalysis,
  ConceptualError,
} from '@/types/api.types';

// Re-export types for convenience
export type {
  EvaluationReport,
  EvaluationDimension,
  ReasoningAnalysis,
  GitAnalysis,
  ConceptualError,
};
export { CompetencyLevel };

export interface StudentComparison {
  students: StudentEvaluationSummary[];
  comparison_metrics: ComparisonMetric[];
  insights: string[];
}

export interface StudentEvaluationSummary {
  student_id: string;
  overall_score: number;
  overall_level: string;
  ai_dependency: number;
  strengths: string[];
  weaknesses: string[];
}

export interface ComparisonMetric {
  metric: string;
  values: Record<string, number>;
  average: number;
}

/**
 * TeacherAlertsResponse - Structure returned by /teacher/alerts endpoint
 */
export interface TeacherAlertsResponse {
  total_alerts: number;
  by_severity: {
    critical: number;
    high: number;
    medium: number;
  };
  alerts: TeacherAlert[];
}

export interface TeacherAlert {
  alert_id: string;
  student_id: string;
  session_id: string;
  activity_id: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  reasons: string[];
  suggestions: string[];
  metrics: {
    critical_risks: number;
    high_risks: number;
    medium_risks: number;
    ai_dependency: number;
    duration_hours: number;
    total_interactions: number;
  };
  timestamp: string;
}

/**
 * EvaluationsService - Uses BaseApiService for consistent response handling
 *
 * Note: Evaluations are accessed via /risks/evaluation/* endpoints in backend.
 * Teacher tools are accessed via /teacher/* endpoints.
 */
class EvaluationsService extends BaseApiService {
  constructor() {
    // Using /risks as base since evaluations are under /risks/evaluation/*
    super('/risks');
  }

  /**
   * Get evaluation report by ID
   * Note: Backend doesn't have this endpoint - evaluation is retrieved via session
   */
  async getReport(reportId: string): Promise<EvaluationReport> {
    // Backend doesn't have direct report lookup by ID
    // The reportId might be the session_id in practice
    console.warn('getReport: Using session-based lookup as fallback');
    return this.get<EvaluationReport>(`/evaluation/session/${reportId}`);
  }

  /**
   * Get evaluation for session
   * Backend route: GET /api/v1/risks/evaluation/session/{session_id}
   */
  async getSessionEvaluation(sessionId: string): Promise<EvaluationReport> {
    return this.get<EvaluationReport>(`/evaluation/session/${sessionId}`);
  }

  /**
   * Trigger evaluation for a session
   * Note: Backend generates evaluation automatically during interactions
   * This method fetches the current evaluation state
   */
  async evaluateSession(sessionId: string): Promise<EvaluationReport> {
    // Backend doesn't have explicit trigger - evaluation is computed on-demand
    return this.get<EvaluationReport>(`/evaluation/session/${sessionId}`);
  }

  /**
   * Get student's evaluation history
   * Backend route: GET /api/v1/risks/evaluation/student/{student_id}
   */
  async getStudentEvaluations(studentId: string): Promise<EvaluationReport[]> {
    return this.get<EvaluationReport[]>(`/evaluation/student/${studentId}`);
  }

  /**
   * Compare students (for teachers)
   * Backend route: GET /api/v1/teacher/students/compare
   * Note: This uses /teacher prefix, not /risks, so we use absolute path via get helper
   */
  async compareStudents(studentIds: string[], activityId: string): Promise<StudentComparison> {
    const params = new URLSearchParams();
    params.append('activity_id', activityId);
    studentIds.forEach(id => params.append('student_ids', id));

    // Use static import - endpoint is under /teacher, not /risks
    return get<StudentComparison>(`/teacher/students/compare?${params.toString()}`);
  }

  /**
   * Get real-time alerts for teacher
   * Backend route: GET /api/v1/teacher/alerts
   * Note: This uses /teacher prefix, not /risks
   */
  async getTeacherAlerts(severity?: string): Promise<TeacherAlertsResponse> {
    const params = severity ? `?severity=${severity}` : '';
    // Use static import - endpoint is under /teacher, not /risks
    return get<TeacherAlertsResponse>(`/teacher/alerts${params}`);
  }

  /**
   * Acknowledge a teacher alert
   * Backend route: POST /api/v1/teacher/alerts/{alert_id}/acknowledge
   * Note: This uses /teacher prefix, not /risks
   */
  async acknowledgeAlert(alertId: string, notes?: string): Promise<{
    alert_id: string;
    acknowledged_at: string;
    notes: string;
  }> {
    const params = notes ? `?notes=${encodeURIComponent(notes)}` : '';
    // Use POST method as defined in backend
    return post<any>(`/teacher/alerts/${alertId}/acknowledge${params}`);
  }
}

export const evaluationsService = new EvaluationsService();