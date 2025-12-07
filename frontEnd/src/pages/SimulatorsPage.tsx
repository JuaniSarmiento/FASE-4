/**
 * Simulators Page - S-IA-X
 * 6 simuladores de roles profesionales
 */
import React, { useState } from 'react';
import { ChatBox, Message } from '@/components/Chat/ChatBox';
import { sessionsService, interactionsService } from '@/services/api';
import { SessionMode } from '@/types/api.types';
import './SimulatorsPage.css';

type SimulatorType = 'PO' | 'SM' | 'IT' | 'IR' | 'CX' | 'DSO';

interface Simulator {
  id: SimulatorType;
  name: string;
  fullName: string;
  icon: string;
  color: string;
  description: string;
  skills: string[];
  welcomeMessage: string;
}

export const SimulatorsPage: React.FC = () => {
  const [activeSimulator, setActiveSimulator] = useState<SimulatorType | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [sessionId, setSessionId] = useState<string | null>(null);

  const simulators: Simulator[] = [
    {
      id: 'PO',
      name: 'Product Owner',
      fullName: 'PO-IA: Product Owner Virtual',
      icon: '📋',
      color: '#4ade80',
      description: 'Gestión de producto y priorización de backlog',
      skills: ['User Stories', 'Sprint Planning', 'Stakeholder Management'],
      welcomeMessage: '¡Hola! Soy el Product Owner del equipo. ¿Qué funcionalidad necesitas implementar?',
    },
    {
      id: 'SM',
      name: 'Scrum Master',
      fullName: 'SM-IA: Scrum Master Virtual',
      icon: '🎯',
      color: '#f59e0b',
      description: 'Facilitación ágil y resolución de impedimentos',
      skills: ['Sprint Ceremonies', 'Team Dynamics', 'Agile Coaching'],
      welcomeMessage: '¡Bienvenido al sprint! Como Scrum Master, estoy aquí para ayudar al equipo.',
    },
    {
      id: 'IT',
      name: 'Tech Interviewer',
      fullName: 'IT-IA: Entrevistador Técnico',
      icon: '💼',
      color: '#8b5cf6',
      description: 'Entrevistas técnicas y evaluación de código',
      skills: ['Coding Challenges', 'System Design', 'Behavioral Questions'],
      welcomeMessage: 'Gracias por venir a la entrevista. Empecemos con algunas preguntas técnicas.',
    },
    {
      id: 'IR',
      name: 'Integration Reviewer',
      fullName: 'IR-IA: Revisor de Integración',
      icon: '🔍',
      color: '#06b6d4',
      description: 'Code review y análisis de pull requests',
      skills: ['Code Quality', 'Best Practices', 'Architecture Review'],
      welcomeMessage: 'Estoy revisando tu pull request. Veamos la calidad del código.',
    },
    {
      id: 'CX',
      name: 'Customer Experience',
      fullName: 'CX-IA: Especialista en Experiencia',
      icon: '😊',
      color: '#ec4899',
      description: 'UX/UI y experiencia del usuario',
      skills: ['User Research', 'Usability Testing', 'Design Thinking'],
      welcomeMessage: 'Como especialista en UX, quiero entender las necesidades de los usuarios.',
    },
    {
      id: 'DSO',
      name: 'DevSecOps',
      fullName: 'DSO-IA: Ingeniero DevSecOps',
      icon: '🔐',
      color: '#ef4444',
      description: 'Seguridad, CI/CD y operaciones',
      skills: ['Security Audits', 'Pipeline Optimization', 'Infrastructure as Code'],
      welcomeMessage: 'Hablemos sobre la seguridad y el deployment de tu aplicación.',
    },
  ];

  const handleSelectSimulator = async (simulator: Simulator) => {
    setActiveSimulator(simulator.id);
    setMessages([
      {
        id: '0',
        role: 'assistant',
        content: `${simulator.welcomeMessage}

**Rol:** ${simulator.fullName}

**Habilidades clave:**
${simulator.skills.map(s => `• ${s}`).join('\n')}

¿En qué puedo ayudarte hoy?`,
        timestamp: new Date(),
      },
    ]);

    try {
      // Crear sesión con el simulador seleccionado
      const session = await sessionsService.create({
        student_id: `student_${Date.now()}`,
        activity_id: `simulator_${simulator.id}`,
        mode: SessionMode.SIMULATOR,
        simulator_type: simulator.id,
      });
      setSessionId(session.id);
    } catch (error) {
      console.error('Error creating simulator session:', error);
    }
  };

  const handleSendMessage = async (content: string) => {
    if (!sessionId) {
      console.error('No session active');
      return;
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);

    try {
      // Enviar al backend con el contexto del simulador
      const response = await interactionsService.process({
        session_id: sessionId,
        prompt: content,
        context: {
          simulator_role: activeSimulator,
          cognitive_intent: 'professional_simulation',
        },
      });

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.response,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error processing message:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `⚠️ Error al procesar el mensaje. Por favor, intenta nuevamente.`,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    }
  };

  return (
    <div className="simulators-page">
      <header className="page-header">
        <div className="header-content">
          <div className="header-title">
            <span className="header-icon">👥</span>
            <h1>Simuladores Profesionales (S-IA-X)</h1>
          </div>
          <p className="header-subtitle">
            6 roles de la industria del software • Aprende interactuando con profesionales virtuales
          </p>
        </div>
      </header>

      <div className="simulators-content">
        {!activeSimulator ? (
          <div className="simulators-grid">
            {simulators.map((simulator) => (
              <div
                key={simulator.id}
                className="simulator-card"
                style={{ '--simulator-color': simulator.color } as React.CSSProperties}
                onClick={() => handleSelectSimulator(simulator)}
              >
                <div className="simulator-header">
                  <span className="simulator-icon">{simulator.icon}</span>
                  <h3 className="simulator-name">{simulator.name}</h3>
                </div>
                <p className="simulator-description">{simulator.description}</p>
                <div className="simulator-skills">
                  {simulator.skills.map((skill, idx) => (
                    <span key={idx} className="skill-tag">{skill}</span>
                  ))}
                </div>
                <button className="simulator-action">
                  Iniciar Simulación →
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="simulator-session">
            <div className="session-header">
              <div className="active-simulator">
                <span className="simulator-icon">
                  {simulators.find(s => s.id === activeSimulator)?.icon}
                </span>
                <div className="simulator-info">
                  <h2>{simulators.find(s => s.id === activeSimulator)?.fullName}</h2>
                  <p>{simulators.find(s => s.id === activeSimulator)?.description}</p>
                </div>
              </div>
              <button
                className="back-btn"
                onClick={() => {
                  setActiveSimulator(null);
                  setMessages([]);
                }}
              >
                ← Cambiar Simulador
              </button>
            </div>
            <div className="chat-container">
              <ChatBox
                messages={messages}
                onSendMessage={handleSendMessage}
                placeholder={`Escribe tu mensaje para el ${simulators.find(s => s.id === activeSimulator)?.name}...`}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
