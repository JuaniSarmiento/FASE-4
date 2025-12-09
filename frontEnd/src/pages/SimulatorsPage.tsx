import { useState, useEffect } from 'react';
import { apiClient } from '../services/apiClient';
import { Badge, LoadingState } from '../components/ui';

interface SimulatorInfo {
  id: string;
  name: string;
  icon: string;
  color: string;
  description: string;
  difficulty: 'Básico' | 'Intermedio' | 'Avanzado';
  duration: string;
  skills: string[];
  completionRate?: number;
}

const simulators: SimulatorInfo[] = [
  {
    id: 'product_owner',
    name: 'Product Owner',
    icon: '📋',
    color: 'blue',
    description: 'Practica la definición de backlog, priorización de features y comunicación con stakeholders.',
    difficulty: 'Intermedio',
    duration: '~15 minutos',
    skills: ['Priorización', 'Backlog', 'Stakeholders'],
    completionRate: 0
  },
  {
    id: 'scrum_master',
    name: 'Scrum Master',
    icon: '🎯',
    color: 'green',
    description: 'Aprende a facilitar ceremonias, resolver impedimentos y mejorar la dinámica del equipo.',
    difficulty: 'Intermedio',
    duration: '~12 minutos',
    skills: ['Facilitación', 'Resolución', 'Team Building'],
    completionRate: 0
  },
  {
    id: 'tech_interviewer',
    name: 'Tech Interviewer',
    icon: '💼',
    color: 'purple',
    description: 'Simula entrevistas técnicas, evalúa candidatos y desarrolla habilidades de evaluación.',
    difficulty: 'Avanzado',
    duration: '~20 minutos',
    skills: ['Evaluación técnica', 'Comunicación', 'Análisis'],
    completionRate: 0
  },
  {
    id: 'incident_responder',
    name: 'Incident Responder',
    icon: '🚨',
    color: 'red',
    description: 'Gestiona incidentes de producción, toma decisiones bajo presión y coordina equipos.',
    difficulty: 'Avanzado',
    duration: '~18 minutos',
    skills: ['Troubleshooting', 'Gestión de crisis', 'Liderazgo'],
    completionRate: 0
  },
  {
    id: 'client',
    name: 'Cliente',
    icon: '👤',
    color: 'yellow',
    description: 'Desarrolla empatía con el cliente, entiende necesidades y mejora la comunicación.',
    difficulty: 'Básico',
    duration: '~10 minutos',
    skills: ['Empatía', 'Comunicación', 'Negociación'],
    completionRate: 0
  },
  {
    id: 'devsecops',
    name: 'DevSecOps',
    icon: '🔒',
    color: 'indigo',
    description: 'Implementa prácticas de seguridad, automatización y mejora continua en el ciclo de desarrollo.',
    difficulty: 'Avanzado',
    duration: '~25 minutos',
    skills: ['Seguridad', 'CI/CD', 'Automatización'],
    completionRate: 0
  },
];

export function SimulatorsPage() {
  const [selectedSimulator, setSelectedSimulator] = useState<SimulatorInfo | null>(null);
  const [sessionId, setSessionId] = useState('');
  const [messages, setMessages] = useState<Array<{role: string; content: string}>>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [interactionCount, setInteractionCount] = useState(0);
  const [simulatorProgress, setSimulatorProgress] = useState<Record<string, number>>({});

  useEffect(() => {
    loadProgress();
  }, []);

  const loadProgress = () => {
    // Load progress from localStorage
    const saved = localStorage.getItem('simulator_progress');
    if (saved) {
      setSimulatorProgress(JSON.parse(saved));
    }
  };

  const updateProgress = (simulatorId: string, interactions: number) => {
    const targetInteractions = 10; // Consider complete after 10 interactions
    const progress = Math.min((interactions / targetInteractions) * 100, 100);
    
    const newProgress = { ...simulatorProgress, [simulatorId]: progress };
    setSimulatorProgress(newProgress);
    localStorage.setItem('simulator_progress', JSON.stringify(newProgress));
  };

  const handleSelectSimulator = async (sim: SimulatorInfo) => {
    setSelectedSimulator(sim);
    setInteractionCount(0);
    setLoading(true);
    try {
      const response = await apiClient.createSession({
        student_id: 'student_001',
        activity_id: 'simulator_' + sim.id,
        mode: 'SIMULATOR',
        simulator_type: sim.id
      });
      setSessionId(response.data.id);
      setMessages([{ role: 'assistant', content: `Hola, soy tu ${sim.name}. ¿En qué puedo ayudarte?` }]);
    } catch (error) {
      console.error('Error:', error);
      alert('Error al iniciar simulador');
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !selectedSimulator) return;

    const userMessage = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const response = await apiClient.interactWithSimulator({
        session_id: sessionId,
        simulator_type: selectedSimulator.id,
        prompt: input,
        context: {}
      });

      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: response.data.response || 'Sin respuesta'
      }]);

      // Update interaction count and progress
      const newCount = interactionCount + 1;
      setInteractionCount(newCount);
      updateProgress(selectedSimulator.id, newCount);
    } catch (error: any) {
      console.error('Error:', error);
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: `Error: ${error.response?.data?.detail || 'No se pudo procesar'}`
      }]);
    } finally {
      setLoading(false);
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Básico': return 'success';
      case 'Intermedio': return 'warning';
      case 'Avanzado': return 'error';
      default: return 'default';
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Simuladores Profesionales (S-IA-X)</h1>
        <p className="text-gray-600 mt-2">Practica con 6 roles profesionales diferentes y desarrolla habilidades clave</p>
      </div>

      {!selectedSimulator ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {simulators.map((sim) => {
            const progress = simulatorProgress[sim.id] || 0;
            const isCompleted = progress >= 100;
            
            return (
              <button
                key={sim.id}
                onClick={() => handleSelectSimulator(sim)}
                className={`bg-white shadow rounded-lg p-6 hover:shadow-xl transition-all text-left border-l-4 border-${sim.color}-500 relative overflow-hidden`}
              >
                {/* Progress indicator background */}
                {progress > 0 && (
                  <div 
                    className="absolute top-0 left-0 h-1 bg-green-500 transition-all"
                    style={{ width: `${progress}%` }}
                  />
                )}
                
                {/* Header */}
                <div className="flex justify-between items-start mb-3">
                  <div className="text-4xl">{sim.icon}</div>
                  <div className="flex flex-col gap-1 items-end">
                    <Badge variant={getDifficultyColor(sim.difficulty) as any} size="sm">
                      {sim.difficulty}
                    </Badge>
                    {isCompleted && (
                      <Badge variant="success" size="sm">✓ Completado</Badge>
                    )}
                  </div>
                </div>

                {/* Title and description */}
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{sim.name}</h3>
                <p className="text-sm text-gray-600 mb-4 min-h-[60px]">{sim.description}</p>

                {/* Skills */}
                <div className="mb-3">
                  <div className="text-xs text-gray-500 mb-2">Habilidades:</div>
                  <div className="flex flex-wrap gap-1">
                    {sim.skills.map((skill) => (
                      <span key={skill} className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Duration */}
                <div className="flex items-center justify-between text-sm text-gray-500 mt-3 pt-3 border-t">
                  <span className="flex items-center gap-1">
                    ⏱️ {sim.duration}
                  </span>
                  {progress > 0 && progress < 100 && (
                    <span className="text-xs text-green-600 font-medium">
                      {Math.round(progress)}% progreso
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      ) : (
        <div className="bg-white shadow rounded-lg">
          <div className="p-4 border-b">
            <div className="flex justify-between items-center mb-3">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{selectedSimulator.icon}</span>
                <div>
                  <h2 className="text-xl font-semibold">{selectedSimulator.name}</h2>
                  <div className="flex gap-2 mt-1">
                    <Badge variant={getDifficultyColor(selectedSimulator.difficulty) as any} size="sm">
                      {selectedSimulator.difficulty}
                    </Badge>
                    <span className="text-xs text-gray-500">{selectedSimulator.duration}</span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => { setSelectedSimulator(null); setMessages([]); setSessionId(''); }}
                className="text-gray-600 hover:text-gray-900 px-3 py-1 rounded hover:bg-gray-100"
              >
                ← Volver
              </button>
            </div>

            {/* Progress bar */}
            <div className="space-y-1">
              <div className="flex justify-between items-center text-xs text-gray-600">
                <span>Progreso de la sesión</span>
                <span>{interactionCount}/10 interacciones</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-green-500 h-2 rounded-full transition-all"
                  style={{ width: `${Math.min((interactionCount / 10) * 100, 100)}%` }}
                />
              </div>
            </div>
          </div>

          <div className="flex flex-col" style={{ height: '500px' }}>
            <div className="flex-1 p-6 overflow-y-auto space-y-4">
              {messages.map((msg, idx) => (
                <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-xl px-4 py-3 rounded-lg ${
                    msg.role === 'user'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-900 border border-gray-200'
                  }`}>
                    <div className="whitespace-pre-wrap">{msg.content}</div>
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex justify-start">
                  <LoadingState type="spinner" message="Escribiendo..." />
                </div>
              )}
            </div>

            <div className="border-t p-4 bg-gray-50">
              <form onSubmit={handleSendMessage} className="flex space-x-2">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Escribe tu mensaje..."
                  className="flex-1 px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={loading}
                />
                <button
                  type="submit"
                  disabled={loading || !input.trim()}
                  className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {loading ? '...' : 'Enviar'}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
