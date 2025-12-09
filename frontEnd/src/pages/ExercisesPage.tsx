import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface Exercise {
  id: number;
  title: string;
  description: string;
  difficulty_level: number;
  max_score: number;
  time_limit_seconds: number;
}

interface UserStats {
  total_submissions: number;
  completed_exercises: number;
  average_score: number;
  total_exercises: number;
}

const ExercisesPage: React.FC = () => {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [filter, setFilter] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { token } = useAuth();

  useEffect(() => {
    loadExercises();
    loadStats();
  }, [filter]);

  const loadExercises = async () => {
    try {
      const params = filter ? `?difficulty=${filter}` : '';
      const response = await fetch(`http://localhost:8000/api/v1/exercises${params}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      setExercises(data);
    } catch (error) {
      console.error('Error loading exercises:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/v1/exercises/stats', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const getDifficultyColor = (level: number) => {
    if (level <= 3) return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
    if (level <= 6) return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
    return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
  };

  const getDifficultyLabel = (level: number) => {
    if (level <= 3) return 'Fácil';
    if (level <= 6) return 'Medio';
    return 'Difícil';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
            <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Ejercicios</h3>
            <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
              {stats.total_exercises}
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
            <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">Completados</h3>
            <p className="text-3xl font-bold text-green-600 dark:text-green-400 mt-2">
              {stats.completed_exercises}
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
            <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">Envíos Totales</h3>
            <p className="text-3xl font-bold text-blue-600 dark:text-blue-400 mt-2">
              {stats.total_submissions}
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
            <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">Puntuación Promedio</h3>
            <p className="text-3xl font-bold text-indigo-600 dark:text-indigo-400 mt-2">
              {(stats.average_score || 0).toFixed(1)}%
            </p>
          </div>
        </div>
      )}

      {/* Filter */}
      <div className="flex gap-2">
        <button
          onClick={() => setFilter(null)}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            filter === null
              ? 'bg-indigo-600 text-white'
              : 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
          }`}
        >
          Todos
        </button>
        <button
          onClick={() => setFilter(3)}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            filter === 3
              ? 'bg-green-600 text-white'
              : 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
          }`}
        >
          Fácil
        </button>
        <button
          onClick={() => setFilter(6)}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            filter === 6
              ? 'bg-yellow-600 text-white'
              : 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
          }`}
        >
          Medio
        </button>
        <button
          onClick={() => setFilter(10)}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            filter === 10
              ? 'bg-red-600 text-white'
              : 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
          }`}
        >
          Difícil
        </button>
      </div>

      {/* Exercises Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {exercises.map((exercise) => (
          <Link
            key={exercise.id}
            to={`/exercises/${exercise.id}`}
            className="block bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-lg transition-shadow p-6"
          >
            <div className="flex items-start justify-between mb-3">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {exercise.title}
              </h3>
              <span className={`px-2 py-1 rounded text-xs font-medium ${getDifficultyColor(exercise.difficulty_level)}`}>
                {getDifficultyLabel(exercise.difficulty_level)}
              </span>
            </div>
            <p className="text-gray-600 dark:text-gray-400 text-sm mb-4 line-clamp-3">
              {exercise.description}
            </p>
            <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
              <div className="flex items-center gap-1">
                ⏱️ {exercise.time_limit_seconds}s
              </div>
              <div className="flex items-center gap-1">
                🎯 {exercise.max_score} pts
              </div>
              <div className="flex items-center gap-1">
                📊 Nivel {exercise.difficulty_level}
              </div>
            </div>
          </Link>
        ))}
      </div>

      {exercises.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500 dark:text-gray-400">
            No hay ejercicios disponibles con este filtro.
          </p>
        </div>
      )}
    </div>
  );
};

export default ExercisesPage;
