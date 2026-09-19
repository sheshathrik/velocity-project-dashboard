import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext.js';
import { Navbar } from './components/Navbar.js';
import { Login } from './pages/Login.js';
import { AdminDashboard } from './pages/AdminDashboard.js';
import { PMDashboard } from './pages/PMDashboard.js';
import { DeveloperDashboard } from './pages/DeveloperDashboard.js';
import { ProjectDetails } from './pages/ProjectDetails.js';
import { Loader2 } from 'lucide-react';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400">
        <div className="flex flex-col items-center space-y-3">
          <Loader2 className="w-8 h-8 animate-spin text-cyan-400" />
          <p className="text-xs font-medium tracking-wide">Authenticating Velocity session...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

const DashboardRouter: React.FC = () => {
  const { user } = useAuth();

  switch (user?.role) {
    case 'ADMIN':
      return <AdminDashboard />;
    case 'PROJECT_MANAGER':
      return <PMDashboard />;
    case 'DEVELOPER':
      return <DeveloperDashboard />;
    default:
      return <Navigate to="/login" replace />;
  }
};

export const App: React.FC = () => {
  const { isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {isAuthenticated && <Navbar />}
      <main className="flex-1">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <DashboardRouter />
              </ProtectedRoute>
            }
          />
          <Route
            path="/projects/:id"
            element={
              <ProtectedRoute>
                <ProjectDetails />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
};

export default App;
