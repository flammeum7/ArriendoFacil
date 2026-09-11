import { Routes, Route, Navigate } from 'react-router-dom';
import { ROLES } from './constants';
import ProtectedRoute from './auth/ProtectedRoute';
import AppLayout from './layouts/AppLayout';
import Login from './pages/auth/Login';
import ForgotPassword from './pages/auth/ForgotPassword';
import ResetPassword from './pages/auth/ResetPassword';
import ChangePassword from './pages/auth/ChangePassword';
import DashboardRouter from './pages/dashboard/DashboardRouter';
import TenantsPage from './pages/tenants/TenantsPage';
import PropertiesPage from './pages/properties/PropertiesPage';
import ContractsPage from './pages/contracts/ContractsPage';
import PaymentsPage from './pages/payments/PaymentsPage';
import DocumentsPage from './pages/documents/DocumentsPage';
import ServicesPage from './pages/services/ServicesPage';
import IncidentsPage from './pages/incidents/IncidentsPage';
import NotificationsPage from './pages/notifications/NotificationsPage';
import AuditPage from './pages/audit/AuditPage';

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/change-password" element={<ProtectedRoute><ChangePassword /></ProtectedRoute>} />

      <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
        <Route path="/" element={<DashboardRouter />} />
        <Route path="/tenants" element={<ProtectedRoute roles={[ROLES.LANDLORD]}><TenantsPage /></ProtectedRoute>} />
        <Route path="/properties" element={<ProtectedRoute roles={[ROLES.LANDLORD]}><PropertiesPage /></ProtectedRoute>} />
        <Route path="/contracts" element={<ProtectedRoute roles={[ROLES.LANDLORD]}><ContractsPage /></ProtectedRoute>} />
        <Route path="/payments" element={<PaymentsPage />} />
        <Route path="/documents" element={<DocumentsPage />} />
        <Route path="/services" element={<ServicesPage />} />
        <Route path="/incidents" element={<IncidentsPage />} />
        <Route path="/notifications" element={<NotificationsPage />} />
        <Route path="/audit" element={<ProtectedRoute roles={[ROLES.LANDLORD]}><AuditPage /></ProtectedRoute>} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
