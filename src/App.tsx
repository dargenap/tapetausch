import type { ReactNode } from 'react';
import { Navigate, Route, Routes } from 'react-router';
import { useAuth } from './hooks/useAuth';
import ChangelogPage from './pages/ChangelogPage';
import CollectionPage from './pages/CollectionPage';
import FeedbackPage from './pages/FeedbackPage';
import FeedPage from './pages/FeedPage';
import LoginPage from './pages/LoginPage';
import NewPickPage from './pages/NewPickPage';
import PickPage from './pages/PickPage';

// Zeigt geschützte Seiten nur Mitgliedern, alle anderen gehen zum Login.
function RequireMember({ children }: { children: ReactNode }) {
  const { loading, profile } = useAuth();

  if (loading) return <main><p className="muted">Lädt …</p></main>;
  if (!profile) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/" element={<RequireMember><FeedPage /></RequireMember>} />
      <Route path="/sammlung" element={<RequireMember><CollectionPage /></RequireMember>} />
      <Route path="/new"element={<RequireMember><NewPickPage /></RequireMember>} />
      <Route path="/pick/:id" element={<RequireMember><PickPage /></RequireMember>} />
      <Route path="/feedback" element={<RequireMember><FeedbackPage /></RequireMember>} />
      <Route path="/changelog" element={<RequireMember><ChangelogPage /></RequireMember>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
