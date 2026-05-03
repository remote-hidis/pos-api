/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './services/AuthContext';
import LoginPage from './pages/LoginPage';
import Dashboard from './pages/Dashboard';

function AppRoutes() {
  const { token } = useAuth();

  return (
    <Routes>
      <Route path="/login" element={!token ? <LoginPage /> : <Navigate to="/" />} />
      <Route
        path="/*"
        element={token ? <Dashboard /> : <Navigate to="/login" />}
      />
    </Routes>
  );
}

export default function App() {
  return (
    <Router>
      <AuthProvider>
        <div className="min-h-screen bg-slate-50 font-sans selection:bg-blue-100 selection:text-blue-900">
          <AppRoutes />
        </div>
      </AuthProvider>
    </Router>
  );
}
