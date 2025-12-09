import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Editor from '@monaco-editor/react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';

interface Exercise {
  id: number;
  title: string;
  description: string;
  difficulty_level: number;
  starter_code: string;
  test_cases: any[];
  hints: string[];
  max_score: number;
  time_limit_seconds: number;
}

interface Submission {
  id: number;
  submitted_code: string;
  passed_tests: number;
  total_tests: number;
  ai_score: number;
  ai_feedback: string;
  code_quality_score: number;
  readability_score: number;
  efficiency_score: number;
  best_practices_score: number;
  created_at: string;
}

const ExerciseDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { token } = useAuth();
  const { theme } = useTheme();
  const [exercise, setExercise] = useState<Exercise | null>(null);
  const [code, setCode] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submission, setSubmission] = useState<Submission | null>(null);
  const [showHints, setShowHints] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadExercise();
  }, [id]);

  const loadExercise = async () => {
    try {
      const response = await fetch(`http://localhost:8000/api/v1/exercises/${id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      setExercise(data);
      setCode(data.starter_code);
    } catch (error) {
      console.error('Error loading exercise:', error);
      setError('Error al cargar el ejercicio');
    }
  };

  const handleSubmit = async () => {
    if (!exercise) return;

    setIsSubmitting(true);
    setError('');
    setSubmission(null);

    try {
      const response = await fetch('http://localhost:8000/api/v1/exercises/submit', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          exercise_id: exercise.id,
          code: code
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Error al enviar el código');
      }

      const data = await response.json();
      setSubmission(data);
    } catch (err: any) {
      setError(err.message || 'Error al enviar el código');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!exercise) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <button
            onClick={() => navigate('/exercises')}
            className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline mb-2"
          >
            ← Volver a ejercicios
          </button>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            {exercise.title}
          </h1>
          <div className="flex gap-3 mt-2 text-sm text-gray-600 dark:text-gray-400">
            <span>⏱️ Tiempo límite: {exercise.time_limit_seconds}s</span>
            <span>🎯 Puntuación máxima: {exercise.max_score}</span>
            <span>📊 Nivel: {exercise.difficulty_level}/10</span>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowHints(!showHints)}
            className="px-4 py-2 bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400 rounded-md hover:bg-yellow-200 dark:hover:bg-yellow-900/50 transition-colors"
          >
            💡 {showHints ? 'Ocultar' : 'Ver'} Pistas
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isSubmitting ? 'Evaluando...' : '▶️ Ejecutar y Evaluar'}
          </button>
        </div>
      </div>

      {/* Description */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
          📝 Descripción
        </h2>
        <p className="text-gray-700 dark:text-gray-300 whitespace-pre-line">
          {exercise.description}
        </p>
      </div>

      {/* Hints */}
      {showHints && exercise.hints.length > 0 && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 p-6 rounded-lg border border-yellow-200 dark:border-yellow-800">
          <h2 className="text-lg font-semibold text-yellow-900 dark:text-yellow-400 mb-3">
            💡 Pistas
          </h2>
          <ul className="space-y-2">
            {exercise.hints.map((hint, index) => (
              <li key={index} className="text-yellow-800 dark:text-yellow-300">
                {index + 1}. {hint}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg border border-red-200 dark:border-red-800">
          <p className="text-red-800 dark:text-red-400">{error}</p>
        </div>
      )}

      {/* Code Editor */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
          💻 Editor de Código
        </h2>
        <div className="border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden">
          <Editor
            height="400px"
            defaultLanguage="python"
            theme={theme === 'dark' ? 'vs-dark' : 'light'}
            value={code}
            onChange={(value) => setCode(value || '')}
            options={{
              minimap: { enabled: false },
              fontSize: 14,
              lineNumbers: 'on',
              scrollBeyondLastLine: false,
              automaticLayout: true,
              tabSize: 4,
            }}
          />
        </div>
      </div>

      {/* Submission Results */}
      {submission && (
        <div className="space-y-4">
          {/* Test Results */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              ✅ Resultados de Pruebas
            </h2>
            <div className="flex items-center gap-4">
              <div className="text-3xl font-bold">
                {submission.passed_tests === submission.total_tests ? (
                  <span className="text-green-600 dark:text-green-400">
                    ✓ {submission.passed_tests}/{submission.total_tests}
                  </span>
                ) : (
                  <span className="text-yellow-600 dark:text-yellow-400">
                    {submission.passed_tests}/{submission.total_tests}
                  </span>
                )}
              </div>
              <div className="flex-1">
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                  <div
                    className={`h-3 rounded-full transition-all ${
                      submission.passed_tests === submission.total_tests
                        ? 'bg-green-600'
                        : 'bg-yellow-600'
                    }`}
                    style={{
                      width: `${(submission.passed_tests / submission.total_tests) * 100}%`
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* AI Evaluation */}
          <div className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 p-6 rounded-lg shadow border border-indigo-200 dark:border-indigo-800">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              🤖 Evaluación de IA
              <span className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                {submission.ai_score.toFixed(1)}%
              </span>
            </h2>

            {/* Score Breakdown */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Calidad</div>
                <div className="text-xl font-bold text-gray-900 dark:text-white">
                  {submission.code_quality_score.toFixed(1)}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Legibilidad</div>
                <div className="text-xl font-bold text-gray-900 dark:text-white">
                  {submission.readability_score.toFixed(1)}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Eficiencia</div>
                <div className="text-xl font-bold text-gray-900 dark:text-white">
                  {submission.efficiency_score.toFixed(1)}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Buenas Prácticas</div>
                <div className="text-xl font-bold text-gray-900 dark:text-white">
                  {submission.best_practices_score.toFixed(1)}
                </div>
              </div>
            </div>

            {/* Feedback */}
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                💬 Retroalimentación
              </h3>
              <p className="text-gray-700 dark:text-gray-300 whitespace-pre-line">
                {submission.ai_feedback}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExerciseDetailPage;
