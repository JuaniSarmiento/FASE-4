/**
 * Configuración centralizada de rutas y endpoints
 */

export const ROUTES = {
  HOME: '/',
  DASHBOARD: '/dashboard',
  AGENTS: {
    TUTOR: '/tutor',
    EVALUATOR: '/evaluator',
    SIMULATOR: '/simulator',
    RISK_ANALYST: '/risks',
    TRACEABILITY: '/traceability',
    GIT_ANALYTICS: '/git'
  },
  TEACHER: '/teacher',
  ADMIN: '/admin',
  PLAYGROUND: '/playground'
} as const;

export const API_ENDPOINTS = {
  BASE: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1',
  SESSIONS: '/sessions',
  INTERACTIONS: '/interactions',
  EVALUATIONS: '/evaluations',
  RISKS: '/risks',
  TRACES: '/traces',
  GIT: '/git',
  SIMULATORS: '/simulators',
  COGNITIVE_PATH: '/cognitive-path',
  METRICS: '/metrics',
  HEALTH: '/health'
} as const;

export type RouteKey = keyof typeof ROUTES;
export type APIEndpoint = keyof typeof API_ENDPOINTS;
