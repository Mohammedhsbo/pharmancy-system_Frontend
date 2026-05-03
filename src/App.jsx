import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/layout/Layout';
import { ProtectedRoute } from './components/layout/ProtectedRoute';
import { ToastContainer } from './components/ui/Toast';
import { useAuthStore } from './store/useAuthStore';
import { isArabic, useLanguageStore } from './store/useLanguageStore';
import { ROLES } from './utils/constants';
import { Loader2 } from 'lucide-react';

// Lazy load pages for performance
const Login = React.lazy(() => import('./pages/auth/Login'));
const Dashboard = React.lazy(() => import('./pages/dashboard/Dashboard'));
const Inventory = React.lazy(() => import('./pages/inventory/Inventory'));
const POS = React.lazy(() => import('./pages/pos/POS'));
const Patients = React.lazy(() => import('./pages/patients/Patients'));
const EditPrescription = React.lazy(() => import('./pages/patients/EditPrescription'));
const Reports = React.lazy(() => import('./pages/reports/Reports'));
const UserManagement = React.lazy(() => import('./pages/users/UserManagement'));

// ─── Loading screen ─────────────────────────────────────────────────────────

function AppLoader() {
  const t = useLanguageStore((state) => state.t);

  return (
    <div className="h-screen flex flex-col items-center justify-center bg-background gap-4">
      <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center">
        <Loader2 size={24} className="text-white animate-spin" />
      </div>
      <p className="text-gray-400 text-sm animate-pulse">{t('appLoading')}</p>
    </div>
  );
}

// ─── Suspense fallback ───────────────────────────────────────────────────────

function PageLoader() {
  return (
    <div className="flex-1 flex items-center justify-center py-20">
      <Loader2 size={28} className="text-primary animate-spin" />
    </div>
  );
}

// ─── App ─────────────────────────────────────────────────────────────────────

function App() {
  const { checkAuth, initializing } = useAuthStore();
  const language = useLanguageStore((state) => state.language);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.dir = isArabic(language) ? 'rtl' : 'ltr';
  }, [language]);

  if (initializing) {
    return <AppLoader />;
  }

  return (
    <>
    <Router>
      <React.Suspense fallback={<PageLoader />}>
        <Routes>
          {/* Public Route */}
          <Route path="/login" element={<Login />} />

          {/* Protected Routes inside Main Layout */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/dashboard" replace />} />

            {/* Dashboard — admin + pharmacist (backend authorize) */}
            <Route
              path="dashboard"
              element={
                <ProtectedRoute allowedRoles={[ROLES.ADMIN, ROLES.PHARMACIST]}>
                  <Dashboard />
                </ProtectedRoute>
              }
            />

            {/* Inventory — admin + pharmacist */}
            <Route
              path="inventory"
              element={
                <ProtectedRoute allowedRoles={[ROLES.ADMIN, ROLES.PHARMACIST]}>
                  <Inventory />
                </ProtectedRoute>
              }
            />

            {/* POS — all roles */}
            <Route path="pos" element={<POS />} />

            {/* Patients & Prescriptions — admin + pharmacist */}
            <Route
              path="patients/prescriptions/:id/edit"
              element={
                <ProtectedRoute allowedRoles={[ROLES.ADMIN, ROLES.PHARMACIST]}>
                  <EditPrescription />
                </ProtectedRoute>
              }
            />

            <Route
              path="patients"
              element={
                <ProtectedRoute allowedRoles={[ROLES.ADMIN, ROLES.PHARMACIST]}>
                  <Patients />
                </ProtectedRoute>
              }
            />

            {/* Reports — admin only */}
            <Route
              path="reports"
              element={
                <ProtectedRoute allowedRoles={[ROLES.ADMIN]}>
                  <Reports />
                </ProtectedRoute>
              }
            />

            {/* User Management — admin only */}
            <Route
              path="users"
              element={
                <ProtectedRoute allowedRoles={[ROLES.ADMIN]}>
                  <UserManagement />
                </ProtectedRoute>
              }
            />
          </Route>

          {/* Catch All */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </React.Suspense>
    </Router>
    <ToastContainer />
    </>
  );
}

export default App;
