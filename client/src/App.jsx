import { useContext } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { AuthContext, AuthProvider } from './context/AuthContext.jsx';
import LandingPage from './pages/LandingPage.jsx';
import AuthPage from './pages/AuthPage.jsx';
import DashboardPage from './pages/DashboardPage.jsx';
import NewCasePage from './pages/NewCasePage.jsx';
import GeneratingPage from './pages/GeneratingPage.jsx';
import InvestigationPage from './pages/InvestigationPage.jsx';
import ResultPage from './pages/ResultPage.jsx';

function ProtectedRoute({ children }) {
  const { user, loading } = useContext(AuthContext);

  if (loading) return <div className="p-8 text-center text-slate-200">Loading…</div>;
  if (!user) return <Navigate to="/login" replace />;

  return children;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<AuthPage mode="login" />} />
      <Route path="/register" element={<AuthPage mode="register" />} />
      <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
      <Route path="/new" element={<ProtectedRoute><NewCasePage /></ProtectedRoute>} />
      <Route path="/cases/:id/generating" element={<ProtectedRoute><GeneratingPage /></ProtectedRoute>} />
      <Route path="/cases/:id" element={<ProtectedRoute><InvestigationPage /></ProtectedRoute>} />
      <Route path="/cases/:id/result" element={<ProtectedRoute><ResultPage /></ProtectedRoute>} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}
