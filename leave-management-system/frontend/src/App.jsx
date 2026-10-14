import React, { useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import AdminRoute from './components/AdminRoute';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import EmployeeDashboard from './pages/EmployeeDashboard';
import ApplyLeave from './pages/ApplyLeave';
import MyRequests from './pages/MyRequests';
import EditLeave from './pages/EditLeave';
import LeaveDetail from './pages/LeaveDetail';
import AdminDashboard from './pages/AdminDashboard';
import AdminRequests from './pages/AdminRequests';
import AdminLeaveDetail from './pages/AdminLeaveDetail';
import AdminEmployees from './pages/AdminEmployees';
import Profile from './pages/Profile';
import NotFound from './pages/NotFound';
import { ROUTES } from './utils/constants';
import { useNotification } from './context/NotificationContext';

function App() {
  const navigate = useNavigate();
  const { showWarning } = useNotification();

  useEffect(() => {
    const handleSessionExpired = (e) => {
      const msg = e.detail?.message || 'Your session has expired. Please login again.';
      showWarning(msg);
      navigate(ROUTES.LOGIN, { replace: true });
    };

    window.addEventListener('auth:expired', handleSessionExpired);
    return () => {
      window.removeEventListener('auth:expired', handleSessionExpired);
    };
  }, [navigate, showWarning]);

  return (
    <Layout>
      <Routes>
        {/* Public Routes */}
        <Route path={ROUTES.HOME} element={<Home />} />
        <Route path={ROUTES.LOGIN} element={<Login />} />
        <Route path={ROUTES.REGISTER} element={<Register />} />

        {/* Authenticated Routes: Profile (Available to both Employee & Admin) */}
        <Route
          path={ROUTES.PROFILE}
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />

        {/* Authenticated Routes: Employee */}
        <Route
          path={ROUTES.EMPLOYEE_DASHBOARD}
          element={
            <ProtectedRoute>
              <EmployeeDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path={ROUTES.APPLY_LEAVE}
          element={
            <ProtectedRoute>
              <ApplyLeave />
            </ProtectedRoute>
          }
        />
        <Route
          path={ROUTES.MY_REQUESTS}
          element={
            <ProtectedRoute>
              <MyRequests />
            </ProtectedRoute>
          }
        />
        <Route
          path={ROUTES.MY_REQUESTS_EDIT}
          element={
            <ProtectedRoute>
              <EditLeave />
            </ProtectedRoute>
          }
        />
        <Route
          path={ROUTES.MY_REQUESTS_DETAIL}
          element={
            <ProtectedRoute>
              <LeaveDetail />
            </ProtectedRoute>
          }
        />

        {/* Admin-Only Protected Routes */}
        <Route
          path={ROUTES.ADMIN_DASHBOARD}
          element={
            <AdminRoute>
              <AdminDashboard />
            </AdminRoute>
          }
        />
        <Route
          path={ROUTES.ADMIN_REQUESTS}
          element={
            <AdminRoute>
              <AdminRequests />
            </AdminRoute>
          }
        />
        <Route
          path={ROUTES.ADMIN_REQUESTS_DETAIL}
          element={
            <AdminRoute>
              <AdminLeaveDetail />
            </AdminRoute>
          }
        />
        <Route
          path={ROUTES.ADMIN_EMPLOYEES}
          element={
            <AdminRoute>
              <AdminEmployees />
            </AdminRoute>
          }
        />

        {/* Convenience alias redirects */}
        <Route path="/dashboard" element={<Navigate to={ROUTES.EMPLOYEE_DASHBOARD} replace />} />
        <Route path="/admin" element={<Navigate to={ROUTES.ADMIN_DASHBOARD} replace />} />

        {/* 404 Catch-all */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Layout>
  );
}

export default App;
