import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { Layout } from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ExercisesPage from './pages/ExercisesPage';
import ExerciseDetailPage from './pages/ExerciseDetailPage';
import { DashboardPage } from './pages/DashboardPage';
import { SessionsPage } from './pages/SessionsPage';
import { SessionDetailPage } from './pages/SessionDetailPage';
import { TutorPage } from './pages/TutorPage';
import { SimulatorsPage } from './pages/SimulatorsPage';
import { RisksPage } from './pages/RisksPage';
import { EvaluationsPage } from './pages/EvaluationsPage';
import { TraceabilityPage } from './pages/TraceabilityPage';
import { GitAnalyticsPage } from './pages/GitAnalyticsPage';
import TestPageEnhanced from './pages/TestPageEnhanced';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Protected routes */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route index element={<DashboardPage />} />
            <Route path="sessions" element={<SessionsPage />} />
            <Route path="sessions/:sessionId" element={<SessionDetailPage />} />
            <Route path="tutor" element={<TutorPage />} />
            <Route path="exercises" element={<ExercisesPage />} />
            <Route path="exercises/:id" element={<ExerciseDetailPage />} />
            <Route path="simulators" element={<SimulatorsPage />} />
            <Route path="risks" element={<RisksPage />} />
            <Route path="evaluations" element={<EvaluationsPage />} />
            <Route path="traceability" element={<TraceabilityPage />} />
            <Route path="analytics" element={<GitAnalyticsPage />} />
            <Route path="test" element={<TestPageEnhanced />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
