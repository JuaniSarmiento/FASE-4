/**
 * Servicio para consulta de riesgos detectados por AR-IA
 *
 * Detecta riesgos en 5 dimensiones:
 * - Cognitiva: Dependencia excesiva de IA, falta de comprensión
 * - Ética: Plagio, uso inapropiado de código generado
 * - Técnica: Errores conceptuales, malas prácticas
 * - Metacognitiva: Falta de reflexión, estrategias ineficientes
 * - Social: Aislamiento, falta de colaboración
 *
 * Niveles de riesgo: info, low, medium, high, critical
 *
 * NOTA: Para evaluaciones de proceso, usar evaluationsService
 */

import { BaseApiService } from './base.service';
import type { Risk } from '@/types/api.types';

/**
 * RisksService - Consulta de riesgos usando base class
 *
 * Para evaluaciones de proceso, usar evaluationsService:
 * - evaluationsService.getSessionEvaluation(sessionId)
 * - evaluationsService.getStudentEvaluations(studentId)
 *
 * @example
 * ```typescript
 * // Obtener riesgos no resueltos
 * const risks = await risksService.getBySession(sessionId, false);
 *
 * // Obtener solo riesgos críticos
 * const critical = await risksService.getCritical(sessionId);
 *
 * // Obtener riesgos por estudiante
 * const studentRisks = await risksService.getByStudent(studentId);
 *
 * // Obtener estadísticas de riesgos
 * const stats = await risksService.getStatistics(studentId);
 * ```
 */
class RisksService extends BaseApiService {
  constructor() {
    super('/risks');
  }

  /**
   * Obtener riesgos de una sesión
   * @param sessionId - ID de la sesión
   * @param resolved - Filtrar por estado de resolución (true/false/undefined para todos)
   * @returns Lista de riesgos detectados
   */
  async getBySession(sessionId: string, resolved?: boolean): Promise<Risk[]> {
    const params = resolved !== undefined ? `?resolved=${resolved}` : '';
    return this.get<Risk[]>(`/session/${sessionId}${params}`);
  }

  /**
   * Obtener riesgos de un estudiante (todas las sesiones)
   * @param studentId - ID del estudiante
   * @param resolved - Filtrar por estado de resolución
   * @returns Lista de riesgos del estudiante
   */
  async getByStudent(studentId: string, resolved?: boolean): Promise<Risk[]> {
    const params = resolved !== undefined ? `?resolved=${resolved}` : '';
    return this.get<Risk[]>(`/student/${studentId}${params}`);
  }

  /**
   * Obtener riesgos críticos (nivel critical o high)
   * @param studentId - ID del estudiante (opcional)
   * @returns Lista de riesgos críticos no resueltos
   */
  async getCritical(studentId?: string): Promise<Risk[]> {
    const params = studentId ? `?student_id=${studentId}` : '';
    return this.get<Risk[]>(`/critical${params}`);
  }

  /**
   * Obtener estadísticas de riesgos de un estudiante
   * @param studentId - ID del estudiante
   * @returns Estadísticas agregadas de riesgos
   */
  async getStatistics(studentId: string): Promise<{
    total_risks: number;
    by_level: Record<string, number>;
    by_dimension: Record<string, number>;
    by_type: Record<string, number>;
    resolution_rate: number;
  }> {
    return this.get(`/student/${studentId}/statistics`);
  }
}

// Export singleton instance
export const risksService = new RisksService();