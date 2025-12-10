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

  /**
   * Crear sesión de tutor socrático V2.0
   * @returns SessionResponse con session_id y mensaje de bienvenida
   */
  async createTutor(): Promise<{ session_id: string; welcome_message: string }> {
    return this.post<{ session_id: string; welcome_message: string }>('/create-tutor');
  }

  /**
   * Interactuar con el tutor socrático V2.0
   * @param sessionId - ID de la sesión
   * @param message - Mensaje del estudiante
   * @param studentProfile - Perfil actual del estudiante
   * @returns Respuesta del tutor con metadata V2.0
   */
  async interact(
    sessionId: string,
    message: string,
    studentProfile: {
      avg_ai_involvement: number;
      successful_autonomous_solutions: number;
      error_self_correction_rate: number;
    }
  ): Promise<{
    response: string;
    metadata: {
      intervention_type?: string;
      semaforo?: 'verde' | 'amarillo' | 'rojo';
      help_level?: string;
      requires_student_response?: boolean;
      cognitive_events?: string[];
      rule_violations?: string[];
    };
  }> {
    return this.post<any, any>(`/${sessionId}/interact`, {
      message,
      student_profile: studentProfile,
    });
  }

  /**
   * Obtener analytics N4 de la sesión
   * @param sessionId - ID de la sesión
   * @returns Estadísticas completas de la sesión
   */
  async getAnalyticsN4(sessionId: string): Promise<{
    total_messages: number;
    semaforo_distribution: {
      verde: number;
      amarillo: number;
      rojo: number;
    };
    intervention_types: Record<string, number>;
    cognitive_events: string[];
    student_progression: any;
  }> {
    return this.get<any>(`/${sessionId}/analytics-n4`);
  }
}

// Export singleton instance
export const sessionsService = new SessionsService();