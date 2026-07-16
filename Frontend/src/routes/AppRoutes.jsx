import { Navigate, Route, Routes } from 'react-router-dom';
import AppLayout from '../layouts/DashboardLayout';
import LoginPage from '../pages/Login';
import LoginDuplicatePage from '../pages/LoginDuplicate';
import SignupPage from '../pages/Signup';
import DashboardPage from '../pages/Dashboard';
import UploadPage from '../pages/Upload';
import InventoryPage from '../pages/Inventory';
import ReportsPage from '../pages/Reports';
import SettingsPage from '../pages/Settings';
import UsersPage from '../pages/Users';
import CreateInvoicePage from '../pages/CreateInvoice';
import InvoiceListPage from '../pages/InvoiceList';
import CustomerInsightsPage from '../pages/CustomerInsights';
import RecommendationsPage from '../pages/Recommendations';
import AnomalyAlertsPage from '../pages/AnomalyAlerts';
import ForecastReportsPage from '../pages/ForecastReports';
import NotFoundPage from '../pages/NotFound';
import ProtectedRoute from '../components/common/ProtectedRoute';

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />
      <Route path="/login-duplicate" element={<LoginDuplicatePage />} />
      <Route
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/create-invoice" element={<CreateInvoicePage />} />
        <Route path="/invoices" element={<InvoiceListPage />} />
        <Route path="/customer-insights" element={<CustomerInsightsPage />} />
        <Route path="/recommendations" element={<RecommendationsPage />} />
        <Route path="/anomalies" element={<AnomalyAlertsPage />} />
        <Route path="/forecasts" element={<ForecastReportsPage />} />
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