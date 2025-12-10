import React, { useState } from 'react';
import { X, Plus } from 'lucide-react';
import api from '../services/api';
import { CreateSessionData, SessionMode } from '../types';

interface CreateSessionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSessionCreated: (sessionId: string) => void;
}

const CreateSessionModal: React.FC<CreateSessionModalProps> = ({ isOpen, onClose, onSessionCreated }) => {
  const [formData, setFormData] = useState<CreateSessionData>({
    student_id: '',
    activity_id: '',
    mode: 'TUTOR' as SessionMode,
    simulator_type: undefined,
  });
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsCreating(true);

    try {
      const response = await api.createSession(formData);
      onSessionCreated(response.data.id);
      onClose();
      // Reset form
      setFormData({
        student_id: '',
        activity_id: '',
        mode: 'TUTOR',
        simulator_type: undefined,
      });
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al crear la sesión');
    } finally {
      setIsCreating(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-2xl border border-gray-800 max-w-md w-full p-6 animate-scaleIn">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Plus className="w-6 h-6 text-purple-400" />
            Nueva Sesión
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Student ID */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              ID del Estudiante
            </label>
            <input
              type="text"
              value={formData.student_id}
              onChange={(e) => setFormData({ ...formData, student_id: e.target.value })}
              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="student_001"
              required
            />
          </div>

          {/* Activity ID */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              ID de la Actividad
            </label>
            <input
              type="text"
              value={formData.activity_id}
              onChange={(e) => setFormData({ ...formData, activity_id: e.target.value })}
              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="prog2_tp1_colas"
              required
            />
          </div>

          {/* Mode */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Modo de Sesión
            </label>
            <select
              value={formData.mode}
              onChange={(e) => setFormData({ ...formData, mode: e.target.value as SessionMode })}
              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="TUTOR">Tutor Socrático</option>
              <option value="SIMULATOR">Simulador</option>
              <option value="PRACTICE">Práctica</option>
            </select>
          </div>

          {/* Simulator Type (conditional) */}
          {formData.mode === 'SIMULATOR' && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Tipo de Simulador
              </label>
              <select
                value={formData.simulator_type || ''}
                onChange={(e) => setFormData({ ...formData, simulator_type: e.target.value })}
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="">Seleccionar...</option>
                <option value="PRODUCT_OWNER">Product Owner</option>
                <option value="SCRUM_MASTER">Scrum Master</option>
                <option value="TECH_INTERVIEWER">Tech Interviewer</option>
                <option value="INCIDENT_RESPONDER">Incident Responder</option>
                <option value="CLIENT">Cliente</option>
                <option value="DEVSECOPS">DevSecOps</option>
              </select>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-red-400 text-sm">
              {error}
            </div>
          )}

          {/* Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 bg-gray-800 text-gray-300 rounded-lg font-medium hover:bg-gray-700 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isCreating}
              className="flex-1 px-4 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-medium hover:shadow-lg hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isCreating ? 'Creando...' : 'Crear Sesión'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateSessionModal;
