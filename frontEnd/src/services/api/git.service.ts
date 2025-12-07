/**
 * Git Service - Integración Git (GIT-IA)
 *
 * Refactored to use BaseApiService for consistent API response handling.
 */
import { BaseApiService } from './base.service';
import { get } from './client';

export interface GitTrace {
  id: string;
  session_id: string;
  student_id: string;
  activity_id: string;
  timestamp: string;
  event_type: 'commit' | 'branch' | 'merge' | 'tag';
  commit_hash?: string;
  commit_message?: string;
  author_name?: string;
  author_email?: string;
  files_changed: GitFileChange[];
  patterns_detected: CodePattern[];
  lines_added: number;
  lines_deleted: number;
  complexity_delta?: number;
}

export interface GitFileChange {
  file_path: string;
  change_type: 'add' | 'modify' | 'delete' | 'rename';
  lines_added: number;
  lines_deleted: number;
  diff?: string;
}

export interface CodePattern {
  pattern_type: string;
  confidence: number;
  description: string;
  evidence: string[];
}

export interface GitEvolution {
  session_id: string;
  student_id: string;
  traces: GitTrace[];
  overall_quality: string;
  consistency_score: number;
  ai_assistance_indicators: string[];
  development_timeline: TimelineEvent[];
}

export interface TimelineEvent {
  timestamp: string;
  event_type: string;
  description: string;
  impact: 'low' | 'medium' | 'high';
}

export interface GitCorrelation {
  git_trace_id: string;
  cognitive_trace_ids: string[];
  correlation_score: number;
  insights: string[];
}

interface SyncCommitsRequest {
  session_id: string;
  repo_path: string;
  since?: string;
  until?: string;
}

interface SyncCommitsResponse {
  session_id: string;
  commits_synced: number;
  git_traces: any[];
}

/**
 * GitService - Uses BaseApiService for consistent response handling
 */
class GitService extends BaseApiService {
  constructor() {
    super('/git');
  }

  /**
   * Get Git traces for session
   * Backend route: GET /api/v1/git/session/{session_id}
   */
  async getSessionGitTraces(sessionId: string): Promise<GitTrace[]> {
    return this.get<GitTrace[]>(`/session/${sessionId}`);
  }

  /**
   * Sync Git commits for a session
   * Backend route: POST /api/v1/git/sync
   */
  async syncCommits(data: SyncCommitsRequest): Promise<SyncCommitsResponse> {
    return this.post<SyncCommitsResponse>('/sync', data);
  }

  /**
   * Get code evolution analysis
   * Backend route: GET /api/v1/git/session/{session_id}/evolution
   */
  async getCodeEvolution(sessionId: string): Promise<GitEvolution> {
    return this.get<GitEvolution>(`/session/${sessionId}/evolution`);
  }

  /**
   * Correlate Git with cognitive traces
   * Backend route: GET /api/v1/git/session/{session_id}/correlate
   */
  async correlateTraces(sessionId: string): Promise<GitCorrelation> {
    return this.get<GitCorrelation>(`/session/${sessionId}/correlate`);
  }

  /**
   * Get student's Git history by querying their sessions
   * Backend doesn't have direct student endpoint, so we query sessions first
   * then aggregate git traces from each session
   */
  async getStudentGitHistory(studentId: string): Promise<GitTrace[]> {
    try {
      // Step 1: Get all sessions for the student using client helper
      const sessionsData = await get<any>(`/sessions?student_id=${studentId}`);
      const sessions = Array.isArray(sessionsData) ? sessionsData : [];

      if (sessions.length === 0) {
        return [];
      }

      // Step 2: Get git traces for each session in parallel
      const tracePromises = sessions.map(async (session: any) => {
        try {
          const traces = await this.get<GitTrace[]>(`/session/${session.id}`);
          return Array.isArray(traces) ? traces : [];
        } catch {
          // Session may not have git traces, return empty
          return [];
        }
      });

      const traceResults = await Promise.all(tracePromises);

      // Step 3: Flatten and map to GitTrace interface
      const allTraces: GitTrace[] = traceResults
        .flat()
        .map((t: any) => ({
          id: t.id,
          session_id: t.session_id,
          student_id: studentId,
          activity_id: t.activity_id || '',
          timestamp: t.timestamp,
          event_type: t.event_type || 'commit',
          commit_hash: t.commit_hash,
          commit_message: t.commit_message,
          author_name: t.author_name,
          author_email: t.author_email,
          files_changed: t.files_changed || [],
          patterns_detected: (t.detected_patterns || []).map((p: string) => ({
            pattern_type: p,
            confidence: 1.0,
            description: p,
            evidence: [],
          })),
          lines_added: t.total_lines_added || 0,
          lines_deleted: t.total_lines_deleted || 0,
          complexity_delta: t.complexity_delta,
        }));

      return allTraces;
    } catch (error) {
      console.error('Error fetching student git history:', error);
      return [];
    }
  }
}

export const gitService = new GitService();