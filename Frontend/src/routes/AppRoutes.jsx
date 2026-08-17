import { Navigate, Route, Routes } from 'react-router-dom';
import AppLayout from '../layouts/DashboardLayout';
import LoginPage from '../pages/Login';
import SignupPage from '../pages/Signup';
import PrivacyPolicyPage from '../pages/PrivacyPolicy';
import TermsConditionsPage from '../pages/TermsConditions';
import DashboardPage from '../pages/Dashboard';
import BusinessOverviewPage from '../pages/BusinessOverview';
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
import ForecastVsActualPage from '../pages/ForecastVsActual';
import NotFoundPage from '../pages/NotFound';
import ProtectedRoute from '../components/common/ProtectedRoute';
import RoleGuard from '../components/common/RoleGuard';

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />
      <Route path="/privacy" element={<PrivacyPolicyPage />} />
      <Route path="/terms" element={<TermsConditionsPage />} />
      <Route
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route
          path="/business-overview"
          element={
            <RoleGuard allowedRoles={['Admin', 'Owner']}>
              <BusinessOverviewPage />
            </RoleGuard>
          }
        />
        <Route path="/create-invoice" element={<CreateInvoicePage />} />
        <Route path="/invoices" element={<InvoiceListPage />} />
        <Route path="/customer-insights" element={<CustomerInsightsPage />} />
        <Route path="/recommendations" element={<RecommendationsPage />} />
        <Route path="/anomalies" element={<AnomalyAlertsPage />} />
        <Route path="/forecasts" element={<ForecastReportsPage />} />
        <Route
          path="/forecast-vs-actual"
          element={
            <RoleGuard allowedRoles={['Owner', 'Store Manager']}>
              <ForecastVsActualPage />
            </RoleGuard>
          }
        />
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