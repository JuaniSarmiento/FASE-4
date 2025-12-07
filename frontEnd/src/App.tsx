import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { HomePage } from '@/pages/HomePage';
import { StudentPage } from '@/pages/StudentPage';
import { TeacherPage } from '@/pages/TeacherPage';
import { DashboardPage } from '@/pages/DashboardPage';
import { TutorPage } from '@/pages/TutorPage';
import { AIPlaygroundPage } from '@/pages/AIPlaygroundPage';
import { MainLayout } from '@/components/layout/MainLayout';
import ErrorBoundary from '@/components/ErrorBoundary';
import './App.css';

// Lazy load páginas adicionales
import { lazy, Suspense } from 'react';

const EvaluatorPage = lazy(() => import('@/pages/EvaluatorPage').then(m => ({ default: m.EvaluatorPage })));
const SimulatorsPage = lazy(() => import('@/pages/SimulatorsPage').then(m => ({ default: m.SimulatorsPage })));
const RisksPage = lazy(() => import('@/pages/RisksPage').then(m => ({ default: m.RisksPage })));
const TraceabilityPage = lazy(() => import('@/pages/TraceabilityPage').then(m => ({ default: m.TraceabilityPage })));
const GitAnalyticsPage = lazy(() => import('@/pages/GitAnalyticsPage').then(m => ({ default: m.GitAnalyticsPage })));

const LoadingFallback = () => (
  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#0f172a' }}>
    <div style={{ textAlign: 'center', color: '#e2e8f0' }}>
      <div className="spinner" style={{ fontSize: '48px', marginBottom: '16px' }}>🔄</div>
      <p>Cargando módulo...</p>
    </div>
  </div>
);

function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <Suspense fallback={<LoadingFallback />}>
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<HomePage />} />
            <Route path="/student" element={<StudentPage />} />
            <Route path="/teacher" element={<TeacherPage />} />
            
            {/* Main app routes with layout */}
            <Route
              path="/dashboard"
              element={
                <MainLayout>
                  <DashboardPage />
                </MainLayout>
              }
            />
            <Route
              path="/tutor"
              element={
                <MainLayout>
                  <TutorPage />
                </MainLayout>
              }
            />
            <Route
              path="/evaluator"
              element={
                <MainLayout>
                  <EvaluatorPage />
                </MainLayout>
              }
            />
            <Route
              path="/simulators"
              element={
                <MainLayout>
                  <SimulatorsPage />
                </MainLayout>
              }
            />
            <Route
              path="/risks"
              element={
                <MainLayout>
                  <RisksPage />
                </MainLayout>
              }
            />
            <Route
              path="/traceability"
              element={
                <MainLayout>
                  <TraceabilityPage />
                </MainLayout>
              }
            />
            <Route
              path="/git"
              element={
                <MainLayout>
                  <GitAnalyticsPage />
                </MainLayout>
              }
            />
            <Route
              path="/playground"
              element={
                <MainLayout>
                  <AIPlaygroundPage />
                </MainLayout>
              }
            />
            
            {/* Redirect unknown routes to dashboard */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;