import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { HomePage } from '@/pages/HomePage';
import { StudentPage } from '@/pages/StudentPage';
import { TeacherPage } from '@/pages/TeacherPage';
import { DashboardPage } from '@/pages/DashboardPage';
import { TutorPage } from '@/pages/TutorPage';
import { MainLayout } from '@/components/layout/MainLayout';
import ErrorBoundary from '@/components/ErrorBoundary';
import './App.css';

function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
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
          
          {/* Redirect unknown routes to dashboard */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;