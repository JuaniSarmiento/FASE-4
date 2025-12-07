/**
 * Servicio para procesamiento de interacciones estudiante-IA
 */

import { BaseApiService } from './base.service';
import type { InteractionRequest, InteractionResponse, InteractionSummary } from '@/types/api.types';

/**
 * InteractionsService - Procesamiento de interacciones usando base class
 * Note: BaseApiService already extracts response.data.data from APIResponse wrapper
 */
class InteractionsService extends BaseApiService {
  constructor() {
    super('/interactions');
  }

  /**
   * Procesar una interacción (enviar mensaje al chatbot)
   * Este es el endpoint principal que orquesta todo el flujo AI-Native
   * Backend route: POST /api/v1/interactions
   */
  async process(data: InteractionRequest): Promise<InteractionResponse> {
    // BaseApiService.post already extracts data from APIResponse wrapper
    return this.post<InteractionResponse, InteractionRequest>('', data);
  }

  /**
   * Obtener historial de interacciones de una sesión
   * Backend route: GET /api/v1/interactions/{session_id}/history
   */
  async getHistory(sessionId: string): Promise<InteractionSummary[]> {
    return this.get<InteractionSummary[]>(`/${sessionId}/history`);
  }
}

// Export singleton instance
export const interactionsService = new InteractionsService();