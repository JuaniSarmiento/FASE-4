/**
 * Cliente HTTP configurado con Axios
 * Incluye interceptores para manejo de errores y logging
 */

import axios, { AxiosError, AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import type { APIResponse, APIError } from '@/types/api.types';

// En desarrollo usa el proxy de Vite (/api), en producción usa la URL completa
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 
  (import.meta.env.DEV ? '/api/v1' : 'http://localhost:8000/api/v1');

// Crear instancia de axios
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // 30 segundos
  headers: {
    'Content-Type': 'application/json',
  },
});

// ==================== REQUEST INTERCEPTOR ====================

apiClient.interceptors.request.use(
  (config) => {
    // Log de request (solo en desarrollo)
    if (import.meta.env.DEV) {
      console.log(`[API Request] ${config.method?.toUpperCase()} ${config.url}`, config.data);
    }

    // Agregar token de autenticación si existe
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    console.error('[API Request Error]', error);
    return Promise.reject(error);
  }
);

// ==================== RESPONSE INTERCEPTOR ====================

apiClient.interceptors.response.use(
  (response: AxiosResponse<APIResponse<any>>) => {
    // Log de response (solo en desarrollo)
    if (import.meta.env.DEV) {
      console.log(`[API Response] ${response.config.url}`, response.data);
    }

    return response;
  },
  (error: AxiosError<APIError>) => {
    // Log de error
    console.error('[API Response Error]', error.response?.data || error.message);

    // Manejo de errores específicos
    if (error.response) {
      // El servidor respondió con un código de error
      const { status, data } = error.response;

      switch (status) {
        case 400:
          console.error('[Validation Error]', data.error?.message);
          break;
        case 401:
          console.error('[Unauthorized]', data.error?.message);
          // Redirigir a login si fuera necesario
          // window.location.href = '/login';
          break;
        case 403:
          console.error('[Forbidden - Governance Block]', data.error?.message);
          break;
        case 404:
          console.error('[Not Found]', data.error?.message);
          break;
        case 500:
          console.error('[Server Error]', data.error?.message);
          break;
        case 503:
          console.error('[Service Unavailable]', data.error?.message);
          break;
        default:
          console.error('[Unknown Error]', data.error?.message);
      }

      return Promise.reject(data);
    } else if (error.request) {
      // La request fue hecha pero no hubo respuesta
      console.error('[Network Error] No response received from server');
      return Promise.reject({
        success: false,
        error: {
          error_code: 'NETWORK_ERROR',
          message: 'No se pudo conectar con el servidor. Verifica tu conexión.',
          field: null,
        },
      } as APIError);
    } else {
      // Error al configurar la request
      console.error('[Request Setup Error]', error.message);
      return Promise.reject({
        success: false,
        error: {
          error_code: 'REQUEST_ERROR',
          message: error.message,
          field: null,
        },
      } as APIError);
    }
  }
);

// ==================== UTILITY FUNCTIONS ====================

/**
 * Wrapper para hacer requests GET
 */
export async function get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
  const response = await apiClient.get<APIResponse<T>>(url, config);
  return response.data.data;
}

/**
 * Wrapper para hacer requests POST
 */
export async function post<T, D = any>(
  url: string,
  data?: D,
  config?: AxiosRequestConfig
): Promise<T> {
  const response = await apiClient.post<APIResponse<T>>(url, data, config);
  return response.data.data;
}

/**
 * Wrapper para hacer requests PUT
 */
export async function put<T, D = any>(
  url: string,
  data?: D,
  config?: AxiosRequestConfig
): Promise<T> {
  const response = await apiClient.put<APIResponse<T>>(url, data, config);
  return response.data.data;
}

/**
 * Wrapper para hacer requests PATCH
 */
export async function patch<T, D = any>(
  url: string,
  data?: D,
  config?: AxiosRequestConfig
): Promise<T> {
  const response = await apiClient.patch<APIResponse<T>>(url, data, config);
  return response.data.data;
}

/**
 * Wrapper para hacer requests DELETE
 */
export async function del<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
  const response = await apiClient.delete<APIResponse<T>>(url, config);
  return response.data.data;
}

export default apiClient;