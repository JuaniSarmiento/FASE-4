/**
 * Servicio de evaluaciones cognitivas
 */
import { BaseService } from './BaseService';
import { API_ENDPOINTS } from '@/core/config/routes.config';
import { evaluationsCache } from '@/core/cache/CacheManager';
import { ProcessEvaluation } from '@/types/api.types';

class EvaluationService extends BaseService<ProcessEvaluation> {
  constructor() {
    super('/evaluations');
    this.cache = evaluationsCache as any;
  }

  async generate(sessionId: string): Promise<ProcessEvaluation> {
    try {
      return await this.post(`${this.endpoint}/${sessionId}/generate`, {});
    } catch (error) {
      return this.handleError(error, `Failed to generate evaluation for session ${sessionId}`);
    }
  }

  async getBySession(sessionId: string, useCache = true): Promise<ProcessEvaluation> {
    try {
      const url = `${this.endpoint}/${sessionId}`;
      return await this.get(url, useCache);
    } catch (error) {
      return this.handleError(error, `Failed to get evaluation for session ${sessionId}`);
    }
  }

  async regenerate(sessionId: string): Promise<ProcessEvaluation> {
    try {
      // Force regeneration (no cache)
      const result = await this.post(`${this.endpoint}/${sessionId}/regenerate`, {});
      
      // Invalidate cached evaluation
      this.invalidateCache(sessionId);
      
      return result;
    } catch (error) {
      return this.handleError(error, `Failed to regenerate evaluation for session ${sessionId}`);
    }
  }

  async exportPDF(sessionId: string): Promise<Blob> {
    try {
      const response = await fetch(
        `${API_ENDPOINTS.BASE}/export/evaluation/${sessionId}`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('access_token')}`
          }
        }
      );

      if (!response.ok) {
        throw new Error(`Export failed: ${response.statusText}`);
      }

      const blob = await response.blob();
      
      // Download file
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `evaluation-${sessionId}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      return blob;
    } catch (error: any) {
      throw new Error(`Failed to export PDF: ${error.message}`);
    }
  }

  async exportJSON(sessionId: string): Promise<ProcessEvaluation> {
    try {
      return await this.get(`${API_ENDPOINTS.BASE}/export/evaluation/${sessionId}/json`);
    } catch (error) {
      return this.handleError(error, `Failed to export JSON for session ${sessionId}`);
    }
  }

  async compare(sessionIds: string[]): Promise<any> {
    try {
      if (sessionIds.length < 2) {
        throw new Error('At least 2 sessions required for comparison');
      }

      return await this.post(`${this.endpoint}/compare`, { session_ids: sessionIds });
    } catch (error) {
      return this.handleError(error, 'Failed to compare evaluations');
    }
  }
}

export const evaluationService = new EvaluationService();
