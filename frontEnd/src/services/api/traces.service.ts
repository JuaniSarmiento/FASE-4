/**
 * Servicio para consulta de trazabilidad cognitiva N4
 *
 * Sistema de Trazabilidad Cognitiva con 4 niveles:
 * - N1 Superficial: Registro básico de interacciones
 * - N2 Técnico: Análisis de código y patrones
 * - N3 Interaccional: Flujo de diálogo estudiante-IA
 * - N4 Cognitivo: Estados mentales y estrategias de resolución
 *
 * Las trazas capturan el proceso de razonamiento del estudiante,
 * permitiendo evaluación basada en proceso (no solo producto).
 */

import { BaseApiService } from './base.service';
import { cognitivePathService } from './cognitivePath.service';
import type { CognitiveTrace, CognitivePath, TraceLevel } from '@/types/api.types';

/**
 * TracesService - Consulta de trazabilidad usando base class
 *
 * @example
 * ```typescript
 * // Obtener todas las trazas N4 de una sesión
 * const traces = await tracesService.getBySession(sessionId, TraceLevel.N4_COGNITIVO);
 *
 * // Obtener el camino cognitivo completo
 * const path = await tracesService.getCognitivePath(sessionId);
 * console.log(path.states_sequence); // ['exploracion', 'planificacion', 'implementacion', ...]
 * ```
 */
class TracesService extends BaseApiService {
  constructor() {
    super('/traces');
  }

  /**
   * Obtener trazas de una sesión
   * @param sessionId - ID de la sesión
   * @param traceLevel - Nivel de traza opcional (N1-N4)
   * @returns Lista de trazas cognitivas
   */
  async getBySession(
    sessionId: string,
    traceLevel?: TraceLevel
  ): Promise<CognitiveTrace[]> {
    const params = traceLevel ? `?trace_level=${traceLevel}` : '';
    return this.get<CognitiveTrace[]>(`/${sessionId}${params}`);
  }

  /**
   * Obtener camino cognitivo completo de una sesión
   * Incluye: secuencia de estados, transiciones, evolución de dependencia IA
   * @param sessionId - ID de la sesión
   * @returns CognitivePath con análisis completo del proceso cognitivo
   * @deprecated Use cognitivePathService.getCognitivePath() instead for the canonical endpoint
   */
  async getCognitivePath(sessionId: string): Promise<CognitivePath> {
    // Delegate to cognitivePathService which uses the canonical /cognitive-path endpoint
    return cognitivePathService.getCognitivePath(sessionId);
  }

  /**
   * Obtener trazas por estudiante (todas las sesiones)
   * @param studentId - ID del estudiante
   * @returns Lista de trazas cognitivas del estudiante
   */
  async getByStudent(studentId: string): Promise<CognitiveTrace[]> {
    return this.get<CognitiveTrace[]>(`/student/${studentId}`);
  }
}

// Export singleton instance
export const tracesService = new TracesService();