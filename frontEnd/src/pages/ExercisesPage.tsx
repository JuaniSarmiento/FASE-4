import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { Exercise } from '../types';
import {
  Code,
  Search,
  Filter,
  Clock,
  Star,
  ArrowRight,
  Loader2,
  BookOpen,
  Zap,
  Trophy
} from 'lucide-react';

const difficultyLabels: Record<number, { label: string; color: string }> = {
  1: { label: 'Muy Fácil', color: 'text-green-400 bg-green-500/10' },
  2: { label: 'Fácil', color: 'text-green-400 bg-green-500/10' },
  3: { label: 'Fácil', color: 'text-green-400 bg-green-500/10' },
  4: { label: 'Medio', color: 'text-yellow-400 bg-yellow-500/10' },
  5: { label: 'Medio', color: 'text-yellow-400 bg-yellow-500/10' },
  6: { label: 'Medio', color: 'text-yellow-400 bg-yellow-500/10' },
  7: { label: 'Difícil', color: 'text-orange-400 bg-orange-500/10' },
  8: { label: 'Difícil', color: 'text-orange-400 bg-orange-500/10' },
  9: { label: 'Muy Difícil', color: 'text-red-400 bg-red-500/10' },
  10: { label: 'Experto', color: 'text-purple-400 bg-purple-500/10' }
};

export default function ExercisesPage() {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [filteredExercises, setFilteredExercises] = useState<Exercise[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] = useState<number | null>(null);

  useEffect(() => {
    const fetchExercises = async () => {
      try {
        const response = await api.getExercises();
        const exerciseList = response.data || [];
        setExercises(exerciseList);
        setFilteredExercises(exerciseList);
      } catch (error) {
        console.error('Error fetching exercises:', error);
        // Mock data for demo
        const mockExercises: Exercise[] = [
          {
            id: '1',
            title: 'Suma de dos números',
            description: 'Escribe una función que reciba dos números y retorne su suma.',
            difficulty_level: 1,
            max_score: 100,
            time_limit_seconds: 300,
            hints: ['Usa el operador +', 'Retorna el resultado']
          },
          {
            id: '2',
            title: 'Palíndromo',
            description: 'Verifica si una cadena es un palíndromo (se lee igual de izquierda a derecha).',
            difficulty_level: 3,
            max_score: 100,
            time_limit_seconds: 600,
            hints: ['Compara caracteres', 'Ignora mayúsculas/minúsculas']
          },
          {
            id: '3',
            title: 'FizzBuzz',
            description: 'Implementa el clásico problema FizzBuzz para números del 1 al 100.',
            difficulty_level: 2,
            max_score: 100,
            time_limit_seconds: 600,
            hints: ['Usa módulo %', 'Verifica divisibilidad']
          },
          {
            id: '4',
            title: 'Fibonacci',
            description: 'Calcula el n-ésimo número de la secuencia de Fibonacci.',
            difficulty_level: 4,
            max_score: 100,
            time_limit_seconds: 900,
            hints: ['Puede ser iterativo o recursivo', 'Cuidado con la eficiencia']
          },
          {
            id: '5',
            title: 'Árbol Binario de Búsqueda',
            description: 'Implementa un árbol binario de búsqueda con inserción y búsqueda.',
            difficulty_level: 7,
            max_score: 100,
            time_limit_seconds: 1800,
            hints: ['Usa clases', 'Implementa recursivamente']
          },
          {
            id: '6',
            title: 'Ordenamiento Quicksort',
            description: 'Implementa el algoritmo de ordenamiento Quicksort.',
            difficulty_level: 6,
            max_score: 100,
            time_limit_seconds: 1200,
            hints: ['Divide y vencerás', 'Elige un pivote']
          }
        ];
        setExercises(mockExercises);
        setFilteredExercises(mockExercises);
      } finally {
        setIsLoading(false);
      }
    };

    fetchExercises();
  }, []);

  useEffect(() => {
    let filtered = exercises;

    if (searchQuery) {
      filtered = filtered.filter(e =>
        e.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        e.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (selectedDifficulty !== null) {
      filtered = filtered.filter(e => e.difficulty_level === selectedDifficulty);
    }

    setFilteredExercises(filtered);
  }, [searchQuery, selectedDifficulty, exercises]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-[var(--accent-primary)] animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[var(--text-primary)] mb-2">
            Ejercicios de Código
          </h1>
          <p className="text-[var(--text-secondary)]">
            Practica programación con ejercicios evaluados por IA
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--bg-tertiary)]">
            <Trophy className="w-5 h-5 text-yellow-400" />
            <span className="text-[var(--text-primary)] font-medium">0 puntos</span>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-[var(--bg-card)] rounded-xl border border-[var(--border-color)] p-4 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center">
            <BookOpen className="w-6 h-6 text-blue-400" />
          </div>
          <div>
            <p className="text-2xl font-bold text-[var(--text-primary)]">{exercises.length}</p>
            <p className="text-sm text-[var(--text-secondary)]">Ejercicios totales</p>
          </div>
        </div>
        <div className="bg-[var(--bg-card)] rounded-xl border border-[var(--border-color)] p-4 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center">
            <Zap className="w-6 h-6 text-green-400" />
          </div>
          <div>
            <p className="text-2xl font-bold text-[var(--text-primary)]">0</p>
            <p className="text-sm text-[var(--text-secondary)]">Completados</p>
          </div>
        </div>
        <div className="bg-[var(--bg-card)] rounded-xl border border-[var(--border-color)] p-4 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center">
            <Star className="w-6 h-6 text-purple-400" />
          </div>
          <div>
            <p className="text-2xl font-bold text-[var(--text-primary)]">0%</p>
            <p className="text-sm text-[var(--text-secondary)]">Puntuación media</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-muted)]" />
          <input
            type="text"
            placeholder="Buscar ejercicios..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-color)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--accent-primary)] focus:outline-none transition-colors"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-5 h-5 text-[var(--text-muted)]" />
          <select
            value={selectedDifficulty ?? ''}
            onChange={(e) => setSelectedDifficulty(e.target.value ? Number(e.target.value) : null)}
            className="px-4 py-3 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-color)] text-[var(--text-primary)] focus:border-[var(--accent-primary)] focus:outline-none transition-colors"
          >
            <option value="">Todas las dificultades</option>
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(level => (
              <option key={level} value={level}>
                Nivel {level} - {difficultyLabels[level].label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Exercises Grid */}
      {filteredExercises.length === 0 ? (
        <div className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border-color)] p-12 text-center">
          <Code className="w-12 h-12 text-[var(--text-muted)] mx-auto mb-4" />
          <h3 className="text-lg font-medium text-[var(--text-primary)] mb-2">
            No se encontraron ejercicios
          </h3>
          <p className="text-[var(--text-secondary)]">
            Intenta con otros criterios de búsqueda
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredExercises.map((exercise) => (
            <Link
              key={exercise.id}
              to={`/exercises/${exercise.id}`}
              className="group bg-[var(--bg-card)] rounded-2xl border border-[var(--border-color)] p-6 hover:border-[var(--accent-primary)]/50 transition-all duration-300 hover:shadow-lg hover:shadow-[var(--accent-primary)]/10"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Code className="w-6 h-6 text-white" />
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${difficultyLabels[exercise.difficulty_level].color}`}>
                  {difficultyLabels[exercise.difficulty_level].label}
                </span>
              </div>

              <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-2 group-hover:text-[var(--accent-primary)] transition-colors">
                {exercise.title}
              </h3>
              <p className="text-sm text-[var(--text-secondary)] mb-4 line-clamp-2">
                {exercise.description}
              </p>

              <div className="flex items-center justify-between pt-4 border-t border-[var(--border-color)]">
                <div className="flex items-center gap-4 text-sm text-[var(--text-muted)]">
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    <span>{Math.floor(exercise.time_limit_seconds / 60)} min</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4" />
                    <span>{exercise.max_score} pts</span>
                  </div>
                </div>
                <ArrowRight className="w-5 h-5 text-[var(--accent-primary)] group-hover:translate-x-2 transition-transform" />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
