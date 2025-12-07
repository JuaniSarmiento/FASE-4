/**
 * Tutor Cognitivo Page - T-IA-Cog
 * Tutoría socr ática y andamiaje metacognitivo
 */
import React, { useState, useEffect } from 'react';
import { ChatBox, Message } from '@/components/Chat/ChatBox';
import { sessionsService, interactionsService } from '@/services/api';
import './TutorPage.css';

type TutorMode = 'socratico' | 'explicativo' | 'guiado' | 'metacognitivo';
type HelpLevel = 'minimo' | 'bajo' | 'medio' | 'alto';

export const TutorPage: React.FC = () => {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<TutorMode>('socratico');
  const [helpLevel, setHelpLevel] = useState<HelpLevel>('medio');
  const [activityContext, setActivityContext] = useState('');

  const modes = [
    {
      id: 'socratico' as TutorMode,
      name: 'Socrático',
      icon: '🤔',
      description: 'Preguntas orientadoras para que descubras la solución',
      color: '#667eea',
    },
    {
      id: 'explicativo' as TutorMode,
      name: 'Explicativo',
      icon: '📚',
      description: 'Explicaciones conceptuales y fundamentos teóricos',
      color: '#4ade80',
    },
    {
      id: 'guiado' as TutorMode,
      name: 'Guiado',
      icon: '🗺️',
      description: 'Pistas graduadas paso a paso',
      color: '#f59e0b',
    },
    {
      id: 'metacognitivo' as TutorMode,
      name: 'Metacognitivo',
      icon: '🧠',
      description: 'Reflexión sobre tu proceso de pensamiento',
      color: '#8b5cf6',
    },
  ];

  const helpLevels = [
    { id: 'minimo' as HelpLevel, name: 'Mínimo', description: 'Solo preguntas' },
    { id: 'bajo' as HelpLevel, name: 'Bajo', description: 'Pistas generales' },
    { id: 'medio' as HelpLevel, name: 'Medio', description: 'Pistas detalladas' },
    { id: 'alto' as HelpLevel, name: 'Alto', description: 'Explicaciones completas' },
  ];

  useEffect(() => {
    // Initialize session
    const initSession = async () => {
      try {
        const session = await sessionsService.create({
          student_id: 'demo_student_001',
          activity_id: 'tutor_demo',
          mode: 'TUTOR' as any, // Backend expects uppercase
        });
        setSessionId(session.id);

        // Welcome message
        setMessages([
          {
            id: '0',
            role: 'assistant',
            content: `¡Hola! Soy tu **Tutor Cognitivo** (T-IA-Cog). 

Estoy aquí para ayudarte a **aprender a pensar**, no para darte las respuestas directamente.

**Modo actual:** ${modes.find(m => m.id === mode)?.name}
**Nivel de ayuda:** ${helpLevels.find(l => l.id === helpLevel)?.name}

¿En qué estás trabajando hoy?`,
            timestamp: new Date(),
          },
        ]);
      } catch (error) {
        console.error('Error initializing session:', error);
      }
    };

    initSession();
  }, [mode, helpLevel]);

  const handleSendMessage = async (content: string) => {
    if (!sessionId) return;

    // Validate minimum length
    if (content.trim().length < 10) {
      const warningMessage: Message = {
        id: Date.now().toString(),
        role: 'system',
        content: '⚠️ Tu mensaje debe tener al menos 10 caracteres. Por favor, describe tu duda con más detalle.',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, warningMessage]);
      return;
    }

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMessage]);
    setLoading(true);

    try {
      // Send to API
      const response = await interactionsService.process({
        session_id: sessionId,
        prompt: content,
        context: {
          tutor_mode: mode,
          help_level: helpLevel,
          activity_context: activityContext,
          cognitive_intent: 'learning',
        },
      });

      // Add assistant response
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.response,
        timestamp: new Date(),
        metadata: (response as any).metadata,
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error: any) {
      console.error('Error processing interaction:', error);
      
      // Extract error message from response
      let errorContent = 'Hubo un error al procesar tu mensaje. Por favor, intenta nuevamente.';
      
      if (error.response?.data?.error?.message) {
        errorContent = `⚠️ ${error.response.data.error.message}`;
      } else if (error.message) {
        errorContent = `⚠️ ${error.message}`;
      }
      
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'system',
        content: errorContent,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="tutor-page">
      {/* Header */}
      <div className="tutor-header">
        <div>
          <h1 className="page-title">
            <span className="title-icon">🎓</span>
            Tutor Cognitivo (T-IA-Cog)
          </h1>
          <p className="page-subtitle">
            Andamiaje cognitivo y metacognitivo para potenciar tu aprendizaje
          </p>
        </div>
      </div>

      <div className="tutor-content">
        {/* Configuration Sidebar */}
        <aside className="config-sidebar">
          <div className="config-section">
            <h3 className="config-title">Modo de Tutoría</h3>
            <div className="mode-grid">
              {modes.map((m) => (
                <button
                  key={m.id}
                  className={`mode-card ${mode === m.id ? 'active' : ''}`}
                  onClick={() => setMode(m.id)}
                  style={{
                    '--mode-color': m.color,
                  } as React.CSSProperties}
                >
                  <span className="mode-icon">{m.icon}</span>
                  <span className="mode-name">{m.name}</span>
                  <p className="mode-description">{m.description}</p>
                </button>
              ))}
            </div>
          </div>

          <div className="config-section">
            <h3 className="config-title">Nivel de Ayuda</h3>
            <div className="help-levels">
              {helpLevels.map((level) => (
                <button
                  key={level.id}
                  className={`help-level ${helpLevel === level.id ? 'active' : ''}`}
                  onClick={() => setHelpLevel(level.id)}
                >
                  <span className="help-name">{level.name}</span>
                  <span className="help-desc">{level.description}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="config-section">
            <h3 className="config-title">Contexto de Actividad</h3>
            <textarea
              className="context-input"
              placeholder="Describe en qué estás trabajando (opcional)..."
              value={activityContext}
              onChange={(e) => setActivityContext(e.target.value)}
              rows={4}
            />
          </div>

          <div className="info-box">
            <h4>💡 Principios del Tutor</h4>
            <ul>
              <li>✅ Guía tu razonamiento</li>
              <li>✅ Promueve la reflexión</li>
              <li>❌ No da soluciones directas</li>
              <li>❌ No sustituye tu agencia</li>
            </ul>
          </div>
        </aside>

        {/* Chat Area */}
        <div className="chat-area">
          <ChatBox
            messages={messages}
            onSendMessage={handleSendMessage}
            loading={loading}
            placeholder={`Describe tu duda con detalle (mínimo 10 caracteres)...`}
          />
        </div>
      </div>
    </div>
  );
};
