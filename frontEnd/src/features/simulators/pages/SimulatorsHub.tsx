/**
 * Hub de Simuladores Profesionales - 6 roles
 */
import React, { useState } from 'react';
import { SimulatorRole } from '@/types/api.types';
import { httpClient } from '@/core/http/HttpClient';
import { useToast } from '@/shared/components/Toast/Toast';
import './SimulatorsHub.css';

interface SimulatorConfig {
  role: SimulatorRole;
  name: string;
  icon: string;
  description: string;
  color: string;
  evaluationCriteria: string[];
}

const SIMULATORS: SimulatorConfig[] = [
  {
    role: 'po' as SimulatorRole,
    name: 'Product Owner',
    icon: '🎯',
    description: 'Evalúa propuestas técnicas desde perspectiva de negocio y prioriza backlog',
    color: '#3b82f6',
    evaluationCriteria: [
      'ROI y valor para el usuario',
      'Criterios de aceptación claros',
      'Priorización basada en impacto',
      'Viabilidad técnica vs. negocio'
    ]
  },
  {
    role: 'sm' as SimulatorRole,
    name: 'Scrum Master',
    icon: '🔄',
    description: 'Facilita ceremonias ágiles y elimina impedimentos del equipo',
    color: '#10b981',
    evaluationCriteria: [
      'Gestión de tiempo (timeboxing)',
      'Facilitación de ceremonias',
      'Eliminación de impedimentos',
      'Fomento de auto-organización'
    ]
  },
  {
    role: 'cx' as SimulatorRole,
    name: 'CX Designer',
    icon: '🎨',
    description: 'Evalúa diseño desde perspectiva de experiencia de usuario',
    color: '#f59e0b',
    evaluationCriteria: [
      'Usabilidad (Nielsen heuristics)',
      'Accesibilidad (WCAG 2.1)',
      'Performance percibida',
      'Arquitectura de información'
    ]
  },
  {
    role: 'devops' as SimulatorRole,
    name: 'DevOps Engineer',
    icon: '⚙️',
    description: 'Evalúa decisiones de infraestructura y estrategias de deployment',
    color: '#8b5cf6',
    evaluationCriteria: [
      'Escalabilidad (horizontal/vertical)',
      'Fault tolerance (circuit breakers)',
      'Observabilidad (logs, métricas)',
      'Security best practices'
    ]
  },
  {
    role: 'security' as SimulatorRole,
    name: 'Security Engineer',
    icon: '🔒',
    description: 'Detecta vulnerabilidades de seguridad (OWASP Top 10)',
    color: '#ef4444',
    evaluationCriteria: [
      'Injection attacks (SQL, NoSQL)',
      'Broken Authentication',
      'Sensitive Data Exposure',
      'Broken Access Control'
    ]
  },
  {
    role: 'architect' as SimulatorRole,
    name: 'Software Architect',
    icon: '🏗️',
    description: 'Evalúa decisiones arquitectónicas y detecta anti-patterns',
    color: '#06b6d4',
    evaluationCriteria: [
      'SOLID principles',
      'Design patterns apropiados',
      'Escalabilidad arquitectura',
      'Tech debt identificado'
    ]
  }
];

export const SimulatorsHub: React.FC = () => {
  const [selectedSimulator, setSelectedSimulator] = useState<SimulatorConfig | null>(null);
  const [prompt, setPrompt] = useState('');
  const [conversation, setConversation] = useState<Array<{
    role: 'user' | 'simulator';
    content: string;
    evaluation?: any;
  }>>([]);
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();

  const handleSelectSimulator = (simulator: SimulatorConfig) => {
    setSelectedSimulator(simulator);
    setConversation([]);
    setPrompt('');
    
    // Welcome message
    setConversation([{
      role: 'simulator',
      content: `Hola, soy tu simulador de **${simulator.name}** (${simulator.icon}).

**Mi rol:** ${simulator.description}

**Evaluaré:**
${simulator.evaluationCriteria.map((c, i) => `${i + 1}. ${c}`).join('\n')}

¿Qué propuesta o decisión quieres discutir conmigo?`
    }]);
  };

  const handleSend = async () => {
    if (!prompt.trim() || !selectedSimulator || loading) return;

    const userMessage = {
      role: 'user' as const,
      content: prompt
    };

    setConversation(prev => [...prev, userMessage]);
    setPrompt('');
    setLoading(true);

    try {
      const response = await httpClient.post('/simulators/interact', {
        role: selectedSimulator.role,
        prompt: prompt,
        context: {
          previous_messages: conversation.map(m => ({
            role: m.role,
            content: m.content
          }))
        }
      });

      const simulatorMessage = {
        role: 'simulator' as const,
        content: (response as any).response,
        evaluation: (response as any).evaluation
      };

      setConversation(prev => [...prev, simulatorMessage]);

      // Show evaluation toast if available
      if ((response as any).evaluation) {
        showToast(
          `Evaluación: ${(response as any).evaluation.score}/100`,
          (response as any).evaluation.score >= 70 ? 'success' : 'warning'
        );
      }

    } catch (error: any) {
      showToast(`Error: ${error.message}`, 'error');
      console.error('Simulator error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="simulators-hub">
      <div className="hub-header">
        <h1>🎭 Simuladores Profesionales</h1>
        <p>Practica con 6 roles diferentes del mundo tech</p>
      </div>

      {!selectedSimulator ? (
        <div className="simulators-grid">
          {SIMULATORS.map((simulator) => (
            <div
              key={simulator.role}
              className="simulator-card"
              onClick={() => handleSelectSimulator(simulator)}
              style={{ borderColor: simulator.color }}
            >
              <div className="simulator-icon" style={{ backgroundColor: `${simulator.color}20` }}>
                <span style={{ color: simulator.color }}>{simulator.icon}</span>
              </div>
              <h3>{simulator.name}</h3>
              <p>{simulator.description}</p>
              <div className="criteria-preview">
                <strong>Evaluará:</strong>
                <ul>
                  {simulator.evaluationCriteria.slice(0, 2).map((criterion, idx) => (
                    <li key={idx}>{criterion}</li>
                  ))}
                  <li>+ {simulator.evaluationCriteria.length - 2} más...</li>
                </ul>
              </div>
              <button
                className="select-btn"
                style={{ backgroundColor: simulator.color }}
              >
                Iniciar Simulación
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="simulator-chat">
          <div className="chat-header">
            <button
              className="back-btn"
              onClick={() => setSelectedSimulator(null)}
            >
              ← Volver
            </button>
            <div className="simulator-info">
              <span className="simulator-icon-small">
                {selectedSimulator.icon}
              </span>
              <div>
                <h2>{selectedSimulator.name}</h2>
                <span className="role-badge" style={{ backgroundColor: selectedSimulator.color }}>
                  {selectedSimulator.role.toUpperCase()}
                </span>
              </div>
            </div>
          </div>

          <div className="chat-messages">
            {conversation.map((msg, idx) => (
              <div key={idx} className={`chat-message ${msg.role}`}>
                <div className="message-bubble">
                  {msg.content.split('\n').map((line, i) => (
                    <p key={i}>{line}</p>
                  ))}
                </div>

                {msg.evaluation && (
                  <div className="evaluation-card">
                    <div className="eval-score">
                      <strong>Score:</strong> {msg.evaluation.score}/100
                    </div>
                    {msg.evaluation.feedback && (
                      <div className="eval-feedback">
                        <strong>Feedback:</strong>
                        <ul>
                          {msg.evaluation.feedback.map((item: string, i: number) => (
                            <li key={i}>{item}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {msg.evaluation.suggestions && (
                      <div className="eval-suggestions">
                        <strong>Sugerencias:</strong>
                        <ul>
                          {msg.evaluation.suggestions.map((item: string, i: number) => (
                            <li key={i}>{item}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}

            {loading && (
              <div className="chat-message simulator">
                <div className="typing-indicator">
                  <span></span><span></span><span></span>
                </div>
              </div>
            )}
          </div>

          <div className="chat-input">
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Describe tu propuesta, decisión o pregunta..."
              rows={3}
              disabled={loading}
            />
            <button
              onClick={handleSend}
              disabled={loading || !prompt.trim()}
              style={{ backgroundColor: selectedSimulator.color }}
            >
              {loading ? '⏳' : '📤'} Enviar
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
