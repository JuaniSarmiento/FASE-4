import { AxiosRequestConfig } from 'axios';
import { get, post, patch, put, del } from './client';

/**
 * Base API Service - Clase abstracta para todos los servicios
 *
 * Proporciona métodos HTTP comunes (get, post, put, patch, delete) con:
 * - Manejo consistente de endpoints
 * - Type safety con generics
 * - Single point of change para cross-cutting concerns
 *
 * IMPORTANTE: Los métodos helper (get, post, etc.) del cliente ya extraen
 * automáticamente `response.data.data` del wrapper APIResponse del backend.
 * No es necesario hacer parsing adicional en los servicios que extiendan esta clase.
 *
 * @example
 * ```typescript
 * class MyService extends BaseApiService {
 *   constructor() {
 *     super('/my-endpoint');
 *   }
 *
 *   async getItem(id: string): Promise<MyItem> {
 *     return this.get<MyItem>(`/${id}`);
 *   }
 * }
 * ```
 */
export abstract class BaseApiService {
  protected baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  /**
   * GET request - Obtener recursos
   * @param endpoint - Ruta relativa al baseUrl (ej: '/{id}')
   * @param config - Configuración adicional de Axios
   * @returns Promise con los datos tipados (ya extraídos del APIResponse wrapper)
   */
  protected async get<T>(endpoint: string = '', config?: AxiosRequestConfig): Promise<T> {
    return get<T>(`${this.baseUrl}${endpoint}`, config);
  }

  /**
   * POST request - Crear recursos
   * @param endpoint - Ruta relativa al baseUrl
   * @param data - Datos a enviar en el body
   * @param config - Configuración adicional de Axios
   * @returns Promise con los datos tipados (ya extraídos del APIResponse wrapper)
   */
  protected async post<T, D = any>(
    endpoint: string = '',
    data?: D,
    config?: AxiosRequestConfig
  ): Promise<T> {
    return post<T, D>(`${this.baseUrl}${endpoint}`, data, config);
  }

  /**
   * PUT request - Reemplazar recursos completamente
   * @param endpoint - Ruta relativa al baseUrl
   * @param data - Datos a enviar en el body
   * @param config - Configuración adicional de Axios
   * @returns Promise con los datos tipados (ya extraídos del APIResponse wrapper)
   */
  protected async put<T, D = any>(
    endpoint: string = '',
    data?: D,
    config?: AxiosRequestConfig
  ): Promise<T> {
    return put<T, D>(`${this.baseUrl}${endpoint}`, data, config);
  }

  /**
   * PATCH request - Actualizar recursos parcialmente
   * @param endpoint - Ruta relativa al baseUrl
   * @param data - Datos a enviar en el body
   * @param config - Configuración adicional de Axios
   * @returns Promise con los datos tipados (ya extraídos del APIResponse wrapper)
   */
  protected async patch<T, D = any>(
    endpoint: string = '',
    data?: D,
    config?: AxiosRequestConfig
  ): Promise<T> {
    return patch<T, D>(`${this.baseUrl}${endpoint}`, data, config);
  }

  /**
   * DELETE request - Eliminar recursos
   * @param endpoint - Ruta relativa al baseUrl
   * @param config - Configuración adicional de Axios
   * @returns Promise con los datos tipados (ya extraídos del APIResponse wrapper)
   */
  protected async delete<T>(endpoint: string = '', config?: AxiosRequestConfig): Promise<T> {
    return del<T>(`${this.baseUrl}${endpoint}`, config);
  }
}