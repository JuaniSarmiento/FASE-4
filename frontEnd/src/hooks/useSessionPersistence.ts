import { useEffect, useCallback } from 'react';
import type { Session, Message } from '@/types/api.types';

const STORAGE_KEYS = {
  SESSION: 'ai-native-current-session',
  MESSAGES: 'ai-native-messages',
  LAST_ACTIVITY: 'ai-native-last-activity',
} as const;

// Session validity: 24 hours
const SESSION_VALIDITY_MS = 24 * 60 * 60 * 1000;

interface PersistedSession {
  session: Session;
  messages: Message[];
  lastActivity: number;
}

/**
 * Hook para persistir y recuperar sesiones del localStorage
 *
 * Maneja automáticamente:
 * - Guardado de sesión y mensajes
 * - Recuperación de sesión válida
 * - Limpieza de sesiones expiradas
 * - Manejo de errores de localStorage (privado, cuota excedida)
 */
export function useSessionPersistence() {
  /**
   * Verifica si una sesión persistida sigue siendo válida
   */
  const isSessionValid = useCallback((lastActivity: number): boolean => {
    const now = Date.now();
    return now - lastActivity < SESSION_VALIDITY_MS;
  }, []);

  /**
   * Guarda sesión y mensajes en localStorage
   */
  const saveSession = useCallback(
    (session: Session | null, messages: Message[]): void => {
      try {
        if (!session) {
          // Limpiar localStorage si no hay sesión
          localStorage.removeItem(STORAGE_KEYS.SESSION);
          localStorage.removeItem(STORAGE_KEYS.MESSAGES);
          localStorage.removeItem(STORAGE_KEYS.LAST_ACTIVITY);
          return;
        }

        const data: PersistedSession = {
          session,
          messages,
          lastActivity: Date.now(),
        };

        localStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(session));
        localStorage.setItem(STORAGE_KEYS.MESSAGES, JSON.stringify(messages));
        localStorage.setItem(STORAGE_KEYS.LAST_ACTIVITY, data.lastActivity.toString());
      } catch (error) {
        // Manejo de errores comunes:
        // - QuotaExceededError: localStorage lleno
        // - SecurityError: localStorage deshabilitado (navegación privada)
        console.error('Error saving session to localStorage:', error);

        // En caso de error, intentar limpiar datos antiguos
        if (error instanceof Error && error.name === 'QuotaExceededError') {
          try {
            localStorage.clear();
            // Reintentar guardar
            localStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(session));
            localStorage.setItem(STORAGE_KEYS.MESSAGES, JSON.stringify(messages));
            localStorage.setItem(STORAGE_KEYS.LAST_ACTIVITY, Date.now().toString());
          } catch (retryError) {
            console.error('Failed to save session after clearing localStorage:', retryError);
          }
        }
      }
    },
    []
  );

  /**
   * Recupera sesión persistida (si existe y es válida)
   */
  const loadSession = useCallback((): PersistedSession | null => {
    try {
      const sessionStr = localStorage.getItem(STORAGE_KEYS.SESSION);
      const messagesStr = localStorage.getItem(STORAGE_KEYS.MESSAGES);
      const lastActivityStr = localStorage.getItem(STORAGE_KEYS.LAST_ACTIVITY);

      if (!sessionStr || !messagesStr || !lastActivityStr) {
        return null;
      }

      const lastActivity = parseInt(lastActivityStr, 10);

      // Verificar validez de la sesión
      if (!isSessionValid(lastActivity)) {
        console.log('Session expired, clearing localStorage');
        clearSession();
        return null;
      }

      const session: Session = JSON.parse(sessionStr);
      const messages: Message[] = JSON.parse(messagesStr);

      // Validar estructura básica
      if (!session.id || !Array.isArray(messages)) {
        console.warn('Invalid session data in localStorage, clearing');
        clearSession();
        return null;
      }

      return {
        session,
        messages,
        lastActivity,
      };
    } catch (error) {
      console.error('Error loading session from localStorage:', error);
      // En caso de error, limpiar datos corruptos
      clearSession();
      return null;
    }
  }, [isSessionValid]);

  /**
   * Limpia todos los datos de sesión del localStorage
   */
  const clearSession = useCallback((): void => {
    try {
      localStorage.removeItem(STORAGE_KEYS.SESSION);
      localStorage.removeItem(STORAGE_KEYS.MESSAGES);
      localStorage.removeItem(STORAGE_KEYS.LAST_ACTIVITY);
    } catch (error) {
      console.error('Error clearing session from localStorage:', error);
    }
  }, []);

  /**
   * Actualiza timestamp de última actividad
   */
  const updateActivity = useCallback((): void => {
    try {
      localStorage.setItem(STORAGE_KEYS.LAST_ACTIVITY, Date.now().toString());
    } catch (error) {
      console.error('Error updating activity timestamp:', error);
    }
  }, []);

  // Limpiar sesiones expiradas al montar
  useEffect(() => {
    const cleanupExpiredSessions = () => {
      try {
        const lastActivityStr = localStorage.getItem(STORAGE_KEYS.LAST_ACTIVITY);
        if (lastActivityStr) {
          const lastActivity = parseInt(lastActivityStr, 10);
          if (!isSessionValid(lastActivity)) {
            clearSession();
          }
        }
      } catch (error) {
        console.error('Error cleaning up expired sessions:', error);
      }
    };

    cleanupExpiredSessions();
  }, [isSessionValid, clearSession]);

  // Listener para manejar cambios en otras tabs
  useEffect(() => {
    const handleStorageChange = (event: StorageEvent) => {
      // Si otra tab limpia la sesión, reflejar el cambio
      if (
        event.key === STORAGE_KEYS.SESSION &&
        event.newValue === null
      ) {
        // Trigger re-render en componentes que usen este hook
        window.dispatchEvent(new CustomEvent('session-cleared'));
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  return {
    saveSession,
    loadSession,
    clearSession,
    updateActivity,
  };
}