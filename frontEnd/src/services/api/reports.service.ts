/**
 * Reports Service - Generación de reportes
 *
 * Refactored to use BaseApiService for consistent API response handling.
 * Note: Export endpoints return Blobs directly, not wrapped in APIResponse.
 */
import { BaseApiService } from './base.service';
import apiClient from './client';

export interface ActivityReport {
  activity_id: string;
  activity_name: string;
  total_sessions: number;
  completion_rate: number;
  avg_score: number;
  avg_ai_dependency: number;
  student_performance: StudentPerformance[];
  risk_summary: RiskSummary;
  competency_distribution: Record<string, number>;
}

export interface StudentPerformance {
  student_id: string;
  sessions_count: number;
  avg_score: number;
  competency_level: string;
  ai_dependency: number;
  risks_detected: number;
}

export interface RiskSummary {
  total_risks: number;
  critical_count: number;
  high_count: number;
  medium_count: number;
  low_count: number;
}

export interface LearningAnalytics {
  period: string;
  total_students: number;
  total_sessions: number;
  avg_session_duration: number;
  most_used_agents: AgentUsage[];
  competency_trends: CompetencyTrend[];
  risk_trends: RiskTrendData[];
}

export interface AgentUsage {
  agent: string;
  usage_count: number;
  avg_satisfaction: number;
}

export interface CompetencyTrend {
  date: string;
  competency: string;
  avg_score: number;
}

export interface RiskTrendData {
  date: string;
  risk_level: string;
  count: number;
}

/**
 * Cohort Report Request
 */
export interface CohortReportRequest {
  course_id?: string;
  activity_ids?: string[];
  start_date?: string;
  end_date?: string;
  include_individual_details?: boolean;
}

/**
 * Cohort Report Response
 */
export interface CohortReport {
  report_id: string;
  course_id?: string;
  generated_at: string;
  summary: {
    total_students: number;
    total_sessions: number;
    completion_rate: number;
    avg_competency_score: number;
    avg_ai_dependency: number;
  };
  competency_distribution: Record<string, number>;
  risk_summary: RiskSummary;
  activity_breakdown?: ActivityReport[];
}

/**
 * Risk Dashboard Request
 */
export interface RiskDashboardRequest {
  scope: 'activity' | 'course' | 'institution';
  activity_id?: string;
  course_id?: string;
  period?: string;
}

/**
 * Risk Dashboard Response
 */
export interface RiskDashboardReport {
  report_id: string;
  scope: string;
  generated_at: string;
  summary: {
    total_risks: number;
    critical_percentage: number;
    resolution_rate: number;
    avg_time_to_resolve_hours: number;
  };
  risks_by_type: Record<string, number>;
  risks_by_dimension: Record<string, number>;
  trends: RiskTrendData[];
  top_affected_students: { student_id: string; risk_count: number }[];
}

/**
 * Teacher Report Summary
 */
export interface TeacherReport {
  teacher_id: string;
  activities: ActivityReport[];
  total_students: number;
  avg_completion_rate: number;
  generated_at: string;
}

/**
 * Export History Item
 */
export interface ExportHistoryItem {
  export_id: string;
  type: 'session' | 'activity' | 'research';
  format: string;
  created_at: string;
  file_size_bytes: number;
  status: 'completed' | 'pending' | 'failed';
  download_url?: string;
}

/**
 * ReportsService - Uses BaseApiService for consistent response handling
 *
 * Note: Export endpoints (exportSessionData, exportActivityData, exportResearchData)
 * return Blobs directly and use apiClient for responseType: 'blob' support.
 */
class ReportsService extends BaseApiService {
  constructor() {
    super('/reports');
  }

  /**
   * Get activity report
   * Backend route: GET /api/v1/reports/activity/{activity_id}
   */
  async getActivityReport(activityId: string): Promise<ActivityReport> {
    return this.get<ActivityReport>(`/activity/${activityId}`);
  }

  /**
   * Get learning analytics
   * Backend route: GET /api/v1/reports/analytics
   */
  async getLearningAnalytics(period?: string): Promise<LearningAnalytics> {
    const params = period ? `?period=${period}` : '';
    return this.get<LearningAnalytics>(`/analytics${params}`);
  }

  /**
   * Export session data
   * Backend route: GET /api/v1/export/session/{session_id}
   * Returns Blob directly (not wrapped in APIResponse)
   */
  async exportSessionData(sessionId: string, format: 'json' | 'csv' = 'json'): Promise<Blob> {
    const response = await apiClient.get(`/export/session/${sessionId}`, {
      params: { format },
      responseType: 'blob',
    });
    return response.data;
  }

  /**
   * Export activity data
   * Backend route: GET /api/v1/export/activity/{activity_id}
   * Returns Blob directly (not wrapped in APIResponse)
   */
  async exportActivityData(activityId: string, format: 'json' | 'csv' = 'json'): Promise<Blob> {
    const response = await apiClient.get(`/export/activity/${activityId}`, {
      params: { format },
      responseType: 'blob',
    });
    return response.data;
  }

  /**
   * Export anonymized research data
   * Backend route: POST /api/v1/export/research-data
   * Returns Blob directly (not wrapped in APIResponse)
   */
  async exportResearchData(params: {
    start_date?: string;
    end_date?: string;
    anonymize?: boolean;
  }): Promise<Blob> {
    const response = await apiClient.post('/export/research-data', params, {
      responseType: 'blob',
    });
    return response.data;
  }

  // ===========================================================================
  // COHORT & INSTITUTIONAL REPORTS (Previously unused endpoints)
  // ===========================================================================

  /**
   * Generate cohort summary report
   * Backend route: POST /api/v1/reports/cohort
   */
  async generateCohortReport(request: CohortReportRequest): Promise<CohortReport> {
    return this.post<CohortReport>('/cohort', request);
  }

  /**
   * Generate risk dashboard report
   * Backend route: POST /api/v1/reports/risk-dashboard
   */
  async generateRiskDashboard(request: RiskDashboardRequest): Promise<RiskDashboardReport> {
    return this.post<RiskDashboardReport>('/risk-dashboard', request);
  }

  /**
   * Get reports by teacher
   * Backend route: GET /api/v1/reports/teacher/{teacher_id}
   */
  async getTeacherReports(teacherId: string): Promise<TeacherReport> {
    return this.get<TeacherReport>(`/teacher/${teacherId}`);
  }

  /**
   * Get specific report by ID
   * Backend route: GET /api/v1/reports/{report_id}
   */
  async getReportById(reportId: string): Promise<CohortReport | RiskDashboardReport> {
    return this.get<CohortReport | RiskDashboardReport>(`/${reportId}`);
  }

  /**
   * Download report file
   * Backend route: GET /api/v1/reports/{report_id}/download
   * Returns Blob directly
   */
  async downloadReport(reportId: string): Promise<Blob> {
    const response = await apiClient.get(`/reports/${reportId}/download`, {
      responseType: 'blob',
    });
    return response.data;
  }

  // ===========================================================================
  // EXPORT HISTORY (Previously unused endpoints)
  // ===========================================================================

  /**
   * Get export history (admin only)
   * Backend route: GET /api/v1/export/history
   */
  async getExportHistory(): Promise<ExportHistoryItem[]> {
    const response = await apiClient.get('/export/history');
    return response.data?.data || response.data || [];
  }

  /**
   * Download specific export by ID
   * Backend route: GET /api/v1/export/{export_id}
   * Returns Blob directly
   */
  async downloadExport(exportId: string): Promise<Blob> {
    const response = await apiClient.get(`/export/${exportId}`, {
      responseType: 'blob',
    });
    return response.data;
  }
}

export const reportsService = new ReportsService();