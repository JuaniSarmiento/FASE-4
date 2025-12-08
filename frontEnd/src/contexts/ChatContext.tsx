/**
 * Context para gestionar el estado global del chat
 */

import { createContext, useContext, useState, useCallback, ReactNode, useEffect } from 'react';
import {
  SessionResponse,
  SessionMode,
  InteractionRequest,
  InteractionResponse,
  CognitiveIntent,
  APIError,
} from '@/types/api.types';
import { sessionsService, interactionsService } from '@/services/api';
// import { useSessionPersistence } from '@/hooks/useSessionPersistence';
import type { ChatMessage } from '@/types/api.types';

interface ChatContextValue {
  // Session state
  currentSession: SessionResponse | null;
  isSessionActive: boolean;

  // Messages
  messages: ChatMessage[];

  // Loading states
  isLoading: boolean;
  isSendingMessage: boolean;

  // Error
  error: string | null;

  // Actions
  createSession: (studentId: string, activityId: string, mode?: SessionMode) => Promise<void>;
  sendMessage: (prompt: string, context?: Record<string, any>, intent?: CognitiveIntent) => Promise<void>;
  endSession: () => Promise<void>;
  clearMessages: () => void;
  clearError: () => void;
}

const ChatContext = createContext<ChatContextValue | undefined>(undefined);

export function ChatProvider({ children }: { children: ReactNode }) {
  const [currentSession, setCurrentSession] = useState<SessionResponse | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isSessionActive = currentSession?.status === 'ACTIVE';

  // Persistence hook - temporalmente deshabilitado
  // const { saveSession, loadSession, clearSession, updateActivity } = useSessionPersistence();
  const saveSession = () => {};
  const loadSession = () => null;
  const clearSession = () => {};
  const updateActivity = () => {};

  // Load persisted session on mount
  useEffect(() => {
    // Temporalmente deshabilitado
    // const persisted = loadSession();
    // if (persisted) {
    //   setCurrentSession(persisted.session);
    //   setMessages(persisted.messages);
    //   console.log('[Session Restored from localStorage]', persisted.session.id);
    // }
  }, []);

  // Persist session and messages when they change
  useEffect(() => {
    // Temporalmente deshabilitado
    // if (currentSession) {
    //   saveSession(currentSession, messages);
    // }
  }, [currentSession, messages]);

  // Crear nueva sesión
  const createSession = useCallback(async (
    studentId: string,
    activityId: string,
    mode: SessionMode = SessionMode.TUTOR
  ) => {
    setIsLoading(true);
    setError(null);

    try {
      const session = await sessionsService.create({
        student_id: studentId,
        activity_id: activityId,
        mode,
      });

      setCurrentSession(session);
      setMessages([{
        id: 'welcome',
        role: 'system',
        content: `Sesión iniciada en modo ${mode}. ¡Hola! Soy tu tutor AI-Native. Estoy aquí para ayudarte a aprender programación de manera efectiva. Recuerda que mi objetivo es guiar tu razonamiento, no sustituirlo. ¿En qué puedo ayudarte hoy?`,
        timestamp: new Date(),
      }]);

      console.log('[Session Created]', session);
    } catch (err) {
      const apiError = err as APIError;
      setError(apiError.error?.message || 'Error al crear la sesión');
      console.error('[Session Creation Error]', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Enviar mensaje con retry logic y exponential backoff
  const sendMessage = useCallback(async (
    prompt: string,
    context?: Record<string, any>,
    intent?: CognitiveIntent
  ) => {
    if (!currentSession) {
      setError('No hay sesión activa');
      return;
    }

    if (!prompt.trim()) {
      setError('El mensaje no puede estar vacío');
      return;
    }

    setIsSendingMessage(true);
    setError(null);

    // Update activity timestamp
    updateActivity();

    // Agregar mensaje del usuario con estado 'pending'
    const messageId = crypto.randomUUID();
    const userMessage: ChatMessage = {
      id: messageId,
      role: 'user',
      content: prompt,
      timestamp: new Date(),
      status: 'pending',  // ✅ Estado inicial
      retry_count: 0,
    };

    setMessages(prev => [...prev, userMessage]);

    // Configuración de reintentos
    const maxRetries = 3;
    const baseDelay = 1000; // 1 segundo
    let retryCount = 0;

    // Función para intentar el envío con reintentos
    const attemptSend = async (): Promise<boolean> => {
      try {
        const request: InteractionRequest = {
          session_id: currentSession.id,
          prompt,
          context,
          cognitive_intent: intent,
        };

        const response: InteractionResponse = await interactionsService.process(request);

        // ✅ Actualizar a 'sent'
        setMessages(prev => prev.map(msg =>
          msg.id === messageId ? { ...msg, status: 'sent' } : msg
        ));

        // Agregar respuesta del asistente
        const assistantMessage: ChatMessage = {
          id: response.interaction_id,
          role: 'assistant',
          content: response.response,
          timestamp: new Date(response.timestamp),
          metadata: {
            agent_used: response.agent_used,
            cognitive_state: response.cognitive_state_detected,
            ai_involvement: response.ai_involvement,
            blocked: response.blocked,
            block_reason: response.block_reason || undefined,
            risks_detected: response.risks_detected,
          },
        };

        setMessages(prev => [...prev, assistantMessage]);

        // Si hubo bloqueo, mostrar advertencia
        if (response.blocked) {
          const warningMessage: ChatMessage = {
            id: crypto.randomUUID(),
            role: 'system',
            content: `⚠️ Tu solicitud fue bloqueada por el sistema de gobernanza: ${response.block_reason}`,
            timestamp: new Date(),
          };
          setMessages(prev => [...prev, warningMessage]);
        }

        // Si hay riesgos detectados, mostrar notificación
        if (response.risks_detected.length > 0) {
          const riskMessage: ChatMessage = {
            id: crypto.randomUUID(),
            role: 'system',
            content: `⚠️ Se detectaron ${response.risks_detected.length} riesgo(s) en esta interacción. Revisa tu proceso de razonamiento.`,
            timestamp: new Date(),
          };
          setMessages(prev => [...prev, riskMessage]);
        }

        console.log('[Interaction Processed]', response);
        return true;

      } catch (err) {
        retryCount++;

        // Si aún quedan reintentos, reintentar con exponential backoff
        if (retryCount < maxRetries) {
          const delay = baseDelay * Math.pow(2, retryCount - 1); // Exponential backoff

          // ✅ Actualizar a 'retrying'
          setMessages(prev => prev.map(msg =>
            msg.id === messageId
              ? { ...msg, status: 'retrying', retry_count: retryCount }
              : msg
          ));

          console.log(`[Retry ${retryCount}/${maxRetries}] Waiting ${delay}ms before retry...`);
          await new Promise(resolve => setTimeout(resolve, delay));

          return attemptSend(); // Recursivo
        }

        // Falló después de todos los reintentos
        const apiError = err as APIError;
        setError(apiError.error?.message || 'Error al procesar el mensaje');

        // ✅ Actualizar a 'failed'
        setMessages(prev => prev.map(msg =>
          msg.id === messageId ? { ...msg, status: 'failed' } : msg
        ));

        // Agregar mensaje de error
        const errorMessage: ChatMessage = {
          id: crypto.randomUUID(),
          role: 'system',
          content: `❌ Error después de ${maxRetries} intentos: ${apiError.error?.message || 'No se pudo procesar tu mensaje'}. Por favor, intenta de nuevo más tarde.`,
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, errorMessage]);

        console.error('[Interaction Error After Retries]', err);
        return false;
      }
    };

    // Iniciar el intento
    await attemptSend();

    setIsSendingMessage(false);
  }, [currentSession, updateActivity]);

  // Finalizar sesión
  const endSession = useCallback(async () => {
    if (!currentSession) return;

    setIsLoading(true);
    setError(null);

    try {
      await sessionsService.end(currentSession.id);

      const endMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'system',
        content: '✅ Sesión finalizada. Puedes revisar tu evaluación de proceso cognitivo.',
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, endMessage]);
      setCurrentSession(prev => prev ? { ...prev, status: 'COMPLETED' } : null);

      // Clear localStorage when session ends
      clearSession();

      console.log('[Session Ended]', currentSession.id);
    } catch (err) {
      const apiError = err as APIError;
      setError(apiError.error?.message || 'Error al finalizar la sesión');
      console.error('[Session End Error]', err);
    } finally {
      setIsLoading(false);
    }
  }, [currentSession, clearSession]);

  // Limpiar mensajes
  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  // Limpiar error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const value: ChatContextValue = {
    currentSession,
    isSessionActive,
    messages,
    isLoading,
    isSendingMessage,
    error,
    createSession,
    sendMessage,
    endSession,
    clearMessages,
    clearError,
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}

export function useChat() {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
}