/**
 * Servicio para gestión de sesiones de aprendizaje
 *
 * Las sesiones representan el contexto de interacción entre un estudiante
 * y el sistema AI-Native para una actividad específica.
 *
 * Modos de sesión:
 * - TUTOR: Interacción con T-IA-Cog (Tutor Cognitivo)
 * - EVALUATOR: Interacción con E-IA-Proc (Evaluador de Procesos)
 * - SIMULATOR: Interacción con S-IA-X (Simuladores Profesionales)
 * - RISK_ANALYST: Interacción con AR-IA (Analista de Riesgos)
 */

import { BaseApiService } from './base.service';
import type {
  SessionCreate,
  SessionUpdate,
  SessionResponse,
  SessionDetailResponse,
  PaginatedResponse,
  PaginationParams,
} from '@/types/api.types';

/**
 * SessionsService - Gestión de sesiones usando base class
 *
 * @example
 * ```typescript
 * // Crear sesión de tutor
 * const session = await sessionsService.create({
 *   student_id: 'student_001',
 *   activity_id: 'prog2_tp1',
 *   mode: SessionMode.TUTOR,
 * });
 *
 * // Crear sesión de simulador
 * const simSession = await sessionsService.create({
 *   student_id: 'student_001',
 *   activity_id: 'prog2_tp1',
 *   mode: SessionMode.SIMULATOR,
 *   simulator_type: 'product_owner',
 * });
 * ```
 */
class SessionsService extends BaseApiService {
  constructor() {
    super('/sessions');
  }

  /**
   * Crear una nueva sesión de aprendizaje
   * @param data - Datos de la sesión (student_id, activity_id, mode, simulator_type?)
   * @returns SessionResponse con el ID de la nueva sesión
   */
  async create(data: SessionCreate): Promise<SessionResponse> {
    return this.post<SessionResponse, SessionCreate>('', data);
  }

  /**
   * Obtener sesión por ID con detalles completos
   * @param sessionId - ID de la sesión
   * @returns SessionDetailResponse con resumen de trazas, riesgos y score de dependencia IA
   */
  async getById(sessionId: string): Promise<SessionDetailResponse> {
    return this.get<SessionDetailResponse>(`/${sessionId}`);
  }

  /**
   * Listar sesiones del estudiante con paginación
   * @param studentId - ID del estudiante
   * @param pagination - Parámetros de paginación opcionales
   * @returns Lista paginada de sesiones
   */
  async list(
    studentId: string,
    pagination?: PaginationParams
  ): Promise<PaginatedResponse<SessionResponse>> {
    const params = new URLSearchParams({
      student_id: studentId,
      ...(pagination && {
        page: pagination.page.toString(),
        page_size: pagination.page_size.toString(),
      }),
    });

    return this.get<PaginatedResponse<SessionResponse>>(`?${params.toString()}`);
  }

  /**
   * Actualizar sesión (cambiar modo o estado)
   * @param sessionId - ID de la sesión
   * @param data - Datos a actualizar (mode?, status?)
   * @returns SessionResponse actualizada
   */
  async update(sessionId: string, data: SessionUpdate): Promise<SessionResponse> {
    return this.patch<SessionResponse, SessionUpdate>(`/${sessionId}`, data);
  }

  /**
   * Finalizar sesión (marcar como completada)
   * @param sessionId - ID de la sesión
   * @returns SessionResponse con status='completed'
   */
  async end(sessionId: string): Promise<SessionResponse> {
    return this.post<SessionResponse>(`/${sessionId}/end`);
  }

  /**
   * Eliminar sesión (soft delete)
   * @param sessionId - ID de la sesión
   */
  async remove(sessionId: string): Promise<void> {
    return this.delete<void>(`/${sessionId}`);
  }
}

// Export singleton instance
export const sessionsService = new SessionsService();