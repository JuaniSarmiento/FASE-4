import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import { ChatMessage, Session, TraceabilityN4, RiskAnalysis5D } from '../types';
import ReactMarkdown from 'react-markdown';
import CreateSessionModal from '../components/CreateSessionModal';
import TraceabilityViewer from '../components/TraceabilityViewer';
import RiskAnalysisViewer from '../components/RiskAnalysisViewer';
import {
  Send,
  Loader2,
  Brain,
  Sparkles,
  AlertCircle,
  Info,
  RefreshCw,
  Plus,
  Clock,
  MessageSquare,
  GitBranch,
  Shield,
  BarChart3
} from 'lucide-react';

export default function TutorPage() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [session, setSession] = useState<Session | null>(null);
  const [isCreatingSession, setIsCreatingSession] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showTraceability, setShowTraceability] = useState(false);
  const [showRiskAnalysis, setShowRiskAnalysis] = useState(false);
  const [traceabilityData, setTraceabilityData] = useState<TraceabilityN4 | null>(null);
  const [riskAnalysisData, setRiskAnalysisData] = useState<RiskAnalysis5D | null>(null);
  const [lastTraceId, setLastTraceId] = useState<string | null>(null);
  const [isLoadingTraceability, setIsLoadingTraceability] = useState(false);
  const [isLoadingRisks, setIsLoadingRisks] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (!session) {
      initializeSession();
    }
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const initializeSession = async () => {
    setIsCreatingSession(true);
    try {
      const newSession = await api.createSession({
        student_id: user?.id || 'guest',
        activity_id: 'general_learning',
        mode: 'TUTOR'
      });
      setSession(newSession);
      
      // Welcome message
      setMessages([{
        id: 'welcome',
        role: 'assistant',
        content: `¡Hola ${user?.full_name || user?.username || 'estudiante'}! 👋

Soy tu tutor de IA, diseñado para ayudarte a aprender programación de manera efectiva.

**¿Cómo funciono?**
- Te guío con preguntas para que descubras las soluciones por ti mismo
- No te doy respuestas directas, sino pistas y orientación
- Analizo tu proceso de pensamiento para ayudarte mejor

**¿Qué puedo hacer por ti hoy?**
- Explicar conceptos de programación
- Ayudarte con ejercicios
- Revisar tu código
- Resolver dudas técnicas

¿En qué te puedo ayudar?`,
        timestamp: new Date()
      }]);
    } catch (error) {
      console.error('Error creating session:', error);
    } finally {
      setIsCreatingSession(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading || !session) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // Construir contexto de conversación (últimos 10 mensajes)
      const conversationHistory = messages.slice(-10).map(msg => ({
        role: msg.role,
        content: msg.content
      }));

      const interactionResult = await api.processInteraction({
        session_id: session.id,
        prompt: userMessage.content,
        context: {
          conversation_history: conversationHistory,
          message_count: messages.length
        }
      });

      // Store trace_id for traceability analysis
      if (interactionResult.trace_id) {
        setLastTraceId(interactionResult.trace_id);
      }

      const aiMessage: ChatMessage = {
        id: interactionResult.interaction_id,
        role: 'assistant',
        content: interactionResult.response,
        timestamp: new Date(),
        metadata: {
          cognitiveState: interactionResult.cognitive_state,
          helpLevel: interactionResult.help_level,
          risks: interactionResult.risks_detected,
          processingTime: interactionResult.processing_time_ms
        }
      };

      setMessages(prev => [...prev, aiMessage]);
    } catch (error: any) {
      const errorMessage: ChatMessage = {
        id: 'error-' + Date.now(),
        role: 'assistant',
        content: `Lo siento, ocurrió un error al procesar tu mensaje. Por favor, intenta de nuevo.

*Error: ${error.response?.data?.message || error.message}*`,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleNewSession = (sessionId: string) => {
    // Reload session data
    initializeSession();
    setShowCreateModal(false);
  };

  const handleAnalyzeTraceability = async () => {
    if (!lastTraceId) {
      alert('No hay trace_id disponible. Envía un mensaje primero.');
      return;
    }

    setIsLoadingTraceability(true);
    try {
      const data = await api.getTraceabilityN4(lastTraceId);
      setTraceabilityData(data);
      setShowTraceability(true);
    } catch (error: any) {
      console.error('Error fetching traceability:', error);
      const errorMsg = error.response?.data?.message || error.message || 'Error desconocido';
      alert(`Error al obtener trazabilidad: ${errorMsg}\n\nAsegúrate de que el backend esté corriendo en http://localhost:8000`);
    } finally {
      setIsLoadingTraceability(false);
    }
  };

  const handleAnalyzeRisks = async () => {
    if (!session) {
      alert('No hay sesión activa. Inicia una conversación primero.');
      return;
    }

    setIsLoadingRisks(true);
    try {
      const data = await api.analyzeRisks5D(session.id);
      setRiskAnalysisData(data);
      setShowRiskAnalysis(true);
    } catch (error: any) {
      console.error('Error analyzing risks:', error);
      const errorMsg = error.response?.data?.message || error.message || 'Error desconocido';
      
      if (error.code === 'ECONNABORTED') {
        alert('El análisis está tomando demasiado tiempo. Asegúrate de que Ollama esté corriendo y responda correctamente.');
      } else if (error.message === 'Network Error') {
        alert('Error de conexión. Verifica que:\n1. El backend esté corriendo (http://localhost:8000)\n2. Ollama esté activo (http://localhost:11434)\n3. Tengas interacciones en la sesión actual');
      } else {
        alert(`Error al analizar riesgos: ${errorMsg}`);
      }
    } finally {
      setIsLoadingRisks(false);
    }
  };

  const startNewSession = () => {
    setMessages([]);
    setSession(null);
    initializeSession();
  };

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col animate-fadeIn">
      {/* Modals */}
      <CreateSessionModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSessionCreated={handleNewSession}
      />

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
            <Brain className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[var(--text-primary)]">Tutor IA</h1>
            <p className="text-sm text-[var(--text-secondary)]">
              Aprende con guía cognitiva personalizada
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={handleAnalyzeTraceability}
            disabled={!lastTraceId || isLoadingTraceability}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--bg-tertiary)] border border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--accent-primary)] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            title="Ver trazabilidad N4 de la última interacción"
          >
            {isLoadingTraceability ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <GitBranch className="w-4 h-4" />
            )}
            <span className="hidden sm:inline">
              {isLoadingTraceability ? 'Cargando...' : 'Trazabilidad'}
            </span>
          </button>
          <button
            onClick={handleAnalyzeRisks}
            disabled={!session || isLoadingRisks}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--bg-tertiary)] border border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--accent-primary)] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            title="Analizar riesgos 5D de la sesión"
          >
            {isLoadingRisks ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Shield className="w-4 h-4" />
            )}
            <span className="hidden sm:inline">
              {isLoadingRisks ? 'Analizando...' : 'Riesgos 5D'}
            </span>
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--bg-tertiary)] border border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--accent-primary)] transition-all"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Nueva Sesión</span>
          </button>
        </div>
      </div>

      {/* Traceability Modal */}
      {showTraceability && traceabilityData && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4" style={{ zIndex: 9999 }}>
          <div className="bg-[var(--bg-primary)] rounded-2xl border border-gray-700 max-w-4xl w-full max-h-[90vh] overflow-y-auto p-6 shadow-2xl">
            <TraceabilityViewer data={traceabilityData} />
            <button
              onClick={() => setShowTraceability(false)}
              className="mt-6 w-full px-4 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-medium hover:shadow-lg hover:scale-105 transition-all"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}

      {/* Risk Analysis Modal */}
      {showRiskAnalysis && riskAnalysisData && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4" style={{ zIndex: 9999 }}>
          <div className="bg-[var(--bg-primary)] rounded-2xl border border-gray-700 max-w-4xl w-full max-h-[90vh] overflow-y-auto p-6 shadow-2xl">
            <RiskAnalysisViewer data={riskAnalysisData} />
            <button
              onClick={() => setShowRiskAnalysis(false)}
              className="mt-6 w-full px-4 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-medium hover:shadow-lg hover:scale-105 transition-all"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}

      {/* Chat Container */}
      <div className="flex-1 bg-[var(--bg-card)] rounded-2xl border border-[var(--border-color)] flex flex-col overflow-hidden">
        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 chat-scroll">
          {isCreatingSession ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <Loader2 className="w-8 h-8 text-[var(--accent-primary)] animate-spin mx-auto mb-4" />
                <p className="text-[var(--text-secondary)]">Iniciando sesión...</p>
              </div>
            </div>
          ) : (
            <>
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] ${
                      message.role === 'user'
                        ? 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white rounded-2xl rounded-br-md'
                        : 'bg-[var(--bg-tertiary)] text-[var(--text-primary)] rounded-2xl rounded-bl-md'
                    } px-5 py-4 animate-slideIn`}
                  >
                    {message.role === 'assistant' && (
                      <div className="flex items-center gap-2 mb-3 pb-2 border-b border-[var(--border-color)]">
                        <Sparkles className="w-4 h-4 text-[var(--accent-primary)]" />
                        <span className="text-sm font-medium text-[var(--accent-primary)]">Tutor IA</span>
                        {message.metadata?.cognitiveState && (
                          <span className="ml-auto text-xs px-2 py-0.5 rounded-full bg-[var(--accent-primary)]/10 text-[var(--accent-primary)]">
                            {message.metadata.cognitiveState}
                          </span>
                        )}
                      </div>
                    )}
                    
                    <div className={`markdown-content ${message.role === 'user' ? 'text-white' : ''}`}>
                      <ReactMarkdown>{message.content}</ReactMarkdown>
                    </div>

                    {message.metadata?.risks && message.metadata.risks.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-[var(--border-color)]">
                        <div className="flex items-center gap-2 text-xs text-[var(--warning)]">
                          <AlertCircle className="w-3 h-3" />
                          <span>Riesgos detectados: {message.metadata.risks.length}</span>
                        </div>
                      </div>
                    )}

                    <div className={`mt-2 text-xs ${message.role === 'user' ? 'text-white/60' : 'text-[var(--text-muted)]'}`}>
                      {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      {message.metadata?.processingTime && (
                        <span className="ml-2">• {message.metadata.processingTime}ms</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}

              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-[var(--bg-tertiary)] rounded-2xl rounded-bl-md px-5 py-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Sparkles className="w-4 h-4 text-[var(--accent-primary)]" />
                      <span className="text-sm font-medium text-[var(--accent-primary)]">Tutor IA</span>
                    </div>
                    <div className="typing-indicator">
                      <span></span>
                      <span></span>
                      <span></span>
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        {/* Input Area */}
        <div className="p-4 border-t border-[var(--border-color)] bg-[var(--bg-secondary)]">
          <form onSubmit={handleSubmit} className="flex items-end gap-4">
            <div className="flex-1 relative">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Escribe tu pregunta o comparte tu código..."
                rows={1}
                className="w-full px-4 py-3 pr-12 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-color)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--accent-primary)] focus:outline-none resize-none transition-all"
                style={{ minHeight: '48px', maxHeight: '200px' }}
                disabled={!session || isLoading}
              />
            </div>
            <button
              type="submit"
              disabled={!input.trim() || isLoading || !session}
              className="h-12 w-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </button>
          </form>

          {/* Quick Tips */}
          <div className="flex items-center gap-4 mt-3 text-xs text-[var(--text-muted)]">
            <div className="flex items-center gap-1">
              <Info className="w-3 h-3" />
              <span>Enter para enviar, Shift+Enter para nueva línea</span>
            </div>
            {session && (
              <div className="flex items-center gap-1 ml-auto">
                <Clock className="w-3 h-3" />
                <span>Sesión: {session.id.slice(0, 8)}...</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Suggested Questions */}
      {messages.length <= 1 && (
        <div className="mt-4">
          <p className="text-sm text-[var(--text-muted)] mb-3">Preguntas sugeridas:</p>
          <div className="flex flex-wrap gap-2">
            {[
              '¿Cómo implemento una cola circular?',
              'Explícame el patrón Observer',
              '¿Cuál es la diferencia entre stack y heap?',
              'Ayúdame con recursión'
            ].map((question, i) => (
              <button
                key={i}
                onClick={() => setInput(question)}
                className="px-4 py-2 rounded-lg bg-[var(--bg-tertiary)] border border-[var(--border-color)] text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--accent-primary)] transition-all"
              >
                {question}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
