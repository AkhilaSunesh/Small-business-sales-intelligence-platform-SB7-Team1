import { Navigate, Route, Routes } from 'react-router-dom';
import AppLayout from '../layouts/DashboardLayout';
import LoginPage from '../pages/Login';
import LoginDuplicatePage from '../pages/LoginDuplicate';
import DashboardPage from '../pages/Dashboard';
import UploadPage from '../pages/Upload';
import InventoryPage from '../pages/Inventory';
import ReportsPage from '../pages/Reports';
import SettingsPage from '../pages/Settings';
import UsersPage from '../pages/Users';
import NotFoundPage from '../pages/NotFound';
import ProtectedRoute from '../components/common/ProtectedRoute';

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/login-duplicate" element={<LoginDuplicatePage />} />
      <Route
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/upload" element={<UploadPage />} />
        <Route path="/inventory" element={<InventoryPage />} />
        <Route path="/reports" element={<ReportsPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/users" element={<UsersPage />} />
      </Route>
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}

export default AppRoutes;