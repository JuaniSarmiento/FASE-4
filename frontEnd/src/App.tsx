import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { HomePage } from './pages/HomePage';
import { SessionsPage } from './pages/SessionsPage';
import { TutorPage } from './pages/TutorPage';
import { SimulatorsPage } from './pages/SimulatorsPage';
import { RisksPage } from './pages/RisksPage';
import { EvaluationsPage } from './pages/EvaluationsPage';
import { TraceabilityPage } from './pages/TraceabilityPage';
import { GitAnalyticsPage } from './pages/GitAnalyticsPage';
import TestPage from './pages/TestPage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<HomePage />} />
          <Route path="sessions" element={<SessionsPage />} />
          <Route path="tutor" element={<TutorPage />} />
          <Route path="simulators" element={<SimulatorsPage />} />
          <Route path="risks" element={<RisksPage />} />
          <Route path="evaluations" element={<EvaluationsPage />} />
          <Route path="traceability" element={<TraceabilityPage />} />
          <Route path="analytics" element={<GitAnalyticsPage />} />
          <Route path="test" element={<TestPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
