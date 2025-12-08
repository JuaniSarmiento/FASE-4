import { useState } from 'react';
import { apiClient } from '../services/apiClient';

export function TutorPage() {
  const [sessionId, setSessionId] = useState('');
  const [messages, setMessages] = useState<Array<{role: string; content: string}>>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [hasSession, setHasSession] = useState(false);

  const handleCreateSession = async () => {
    setLoading(true);
    try {
      const response = await apiClient.createSession({
        student_id: 'student_001',
        activity_id: 'tutor_session_' + Date.now(),
        mode: 'TUTOR'
      });
      setSessionId(response.data.id);
      setHasSession(true);
      setMessages([{ role: 'assistant', content: '¡Hola! Soy tu tutor IA. ¿En qué puedo ayudarte hoy?' }]);
    } catch (error) {
      console.error('Error creating session:', error);
      alert('Error al crear sesión');
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !sessionId) return;

    const userMessage = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const response = await apiClient.processInteraction({
        session_id: sessionId,
        prompt: input,
        context: {}
      });

      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: response.data.response || 'Sin respuesta'
      }]);
    } catch (error: any) {
      console.error('Error sending message:', error);
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: `Error: ${error.response?.data?.detail || 'No se pudo procesar la interacción'}`
      }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Tutor Cognitivo (T-IA-Cog)</h1>
        <p className="text-gray-600 mt-2">Tutoría socrática y andamiaje metacognitivo</p>
      </div>

      {!hasSession ? (
        <div className="bg-white shadow rounded-lg p-8 text-center">
          <h2 className="text-xl font-semibold mb-4">Iniciar Nueva Sesión de Tutoría</h2>
          <p className="text-gray-600 mb-6">Crea una sesión para comenzar a interactuar con el tutor IA</p>
          <button
            onClick={handleCreateSession}
            disabled={loading}
            className="bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {loading ? 'Creando sesión...' : 'Crear Sesión de Tutoría'}
          </button>
        </div>
      ) : (
        <div className="bg-white shadow rounded-lg flex flex-col" style={{ height: '600px' }}>
          {/* Messages */}
          <div className="flex-1 p-6 overflow-y-auto space-y-4">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-xl px-4 py-2 rounded-lg ${
                    msg.role === 'user'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-900'
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-gray-100 text-gray-900 px-4 py-2 rounded-lg">
                  Pensando...
                </div>
              </div>
            )}
          </div>

          {/* Input */}
          <div className="border-t p-4">
            <form onSubmit={handleSendMessage} className="flex space-x-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Escribe tu pregunta..."
                className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={loading}
              />
              <button
                type="submit"
                disabled={loading || !input.trim()}
                className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                Enviar
              </button>
            </form>
            <p className="text-xs text-gray-500 mt-2">Sesión ID: {sessionId}</p>
          </div>
        </div>
      )}
    </div>
  );
}
