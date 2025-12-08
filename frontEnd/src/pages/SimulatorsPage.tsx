import { useState, useEffect } from 'react';
import { apiClient } from '../services/apiClient';

const simulators = [
  { id: 'product_owner', name: 'Product Owner', icon: '📋', color: 'blue' },
  { id: 'scrum_master', name: 'Scrum Master', icon: '🎯', color: 'green' },
  { id: 'tech_interviewer', name: 'Tech Interviewer', icon: '💼', color: 'purple' },
  { id: 'incident_responder', name: 'Incident Responder', icon: '🚨', color: 'red' },
  { id: 'client', name: 'Cliente', icon: '👤', color: 'yellow' },
  { id: 'devsecops', name: 'DevSecOps', icon: '🔒', color: 'indigo' },
];

export function SimulatorsPage() {
  const [selectedSimulator, setSelectedSimulator] = useState<any>(null);
  const [sessionId, setSessionId] = useState('');
  const [messages, setMessages] = useState<Array<{role: string; content: string}>>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSelectSimulator = async (sim: any) => {
    setSelectedSimulator(sim);
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
    if (!input.trim()) return;

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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Simuladores Profesionales (S-IA-X)</h1>
        <p className="text-gray-600 mt-2">Practica con 6 roles profesionales diferentes</p>
      </div>

      {!selectedSimulator ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {simulators.map((sim) => (
            <button
              key={sim.id}
              onClick={() => handleSelectSimulator(sim)}
              className={`bg-white shadow rounded-lg p-6 hover:shadow-lg transition-shadow text-left border-l-4 border-${sim.color}-500`}
            >
              <div className="text-4xl mb-3">{sim.icon}</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">{sim.name}</h3>
              <p className="text-sm text-gray-600">Click para comenzar</p>
            </button>
          ))}
        </div>
      ) : (
        <div className="bg-white shadow rounded-lg">
          <div className="p-4 border-b flex justify-between items-center">
            <div className="flex items-center">
              <span className="text-2xl mr-3">{selectedSimulator.icon}</span>
              <h2 className="text-xl font-semibold">{selectedSimulator.name}</h2>
            </div>
            <button
              onClick={() => { setSelectedSimulator(null); setMessages([]); setSessionId(''); }}
              className="text-gray-600 hover:text-gray-900"
            >
              ← Volver
            </button>
          </div>

          <div className="flex flex-col" style={{ height: '500px' }}>
            <div className="flex-1 p-6 overflow-y-auto space-y-4">
              {messages.map((msg, idx) => (
                <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-xl px-4 py-2 rounded-lg ${
                    msg.role === 'user'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-900'
                  }`}>
                    {msg.content}
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex justify-start">
                  <div className="bg-gray-100 px-4 py-2 rounded-lg">Escribiendo...</div>
                </div>
              )}
            </div>

            <div className="border-t p-4">
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
                  className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  Enviar
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
