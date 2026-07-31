import { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react';

const AppContext = createContext(null);

// Standardized user roles for the application
export const USER_ROLES = [
  { label: 'Owner', value: 'Owner' },
  { label: 'Store Manager', value: 'Store Manager' },
  { label: 'Sales Executive', value: 'Sales Executive' },
  { label: 'Admin', value: 'Admin' },
];

// Role -> navigation mapping used by the sidebar
export const ROLE_NAV = {
  Owner: [
    { label: 'Dashboard', path: '/dashboard', icon: 'dashboard' },
    { label: 'Business Overview', path: '/business-overview', icon: 'businessOverview' },
    { label: 'Create Invoice', path: '/create-invoice', icon: 'createInvoice' },
    { label: 'Invoice List', path: '/invoices', icon: 'invoiceList' },
    { label: 'Customer Insights', path: '/customer-insights', icon: 'customerInsights' },
    { label: 'Recommendations', path: '/recommendations', icon: 'recommendations' },
    { label: 'Anomaly Alerts', path: '/anomalies', icon: 'anomalyAlerts' },
    { label: 'Forecast Reports', path: '/forecasts', icon: 'forecastReports' },
    { label: 'Upload', path: '/upload', icon: 'upload' },
    { label: 'Inventory', path: '/inventory', icon: 'inventory' },
    { label: 'Reports', path: '/reports', icon: 'reports' },
    { label: 'Settings', path: '/settings', icon: 'settings' },
  ],
  'Store Manager': [
    { label: 'Dashboard', path: '/dashboard', icon: 'dashboard' },
    { label: 'Create Invoice', path: '/create-invoice', icon: 'createInvoice' },
    { label: 'Invoice List', path: '/invoices', icon: 'invoiceList' },
    { label: 'Customer Insights', path: '/customer-insights', icon: 'customerInsights' },
    { label: 'Recommendations', path: '/recommendations', icon: 'recommendations' },
    { label: 'Anomaly Alerts', path: '/anomalies', icon: 'anomalyAlerts' },
    { label: 'Forecast Reports', path: '/forecasts', icon: 'forecastReports' },
    { label: 'Upload', path: '/upload', icon: 'upload' },
    { label: 'Inventory', path: '/inventory', icon: 'inventory' },
  ],
  'Sales Executive': [
    { label: 'Dashboard', path: '/dashboard', icon: 'dashboard' },
    { label: 'Create Invoice', path: '/create-invoice', icon: 'createInvoice' },
    { label: 'Invoice List', path: '/invoices', icon: 'invoiceList' },
    { label: 'Upload', path: '/upload', icon: 'upload' },
  ],
  Admin: [
    { label: 'Dashboard', path: '/dashboard', icon: 'dashboard' },
    { label: 'Business Overview', path: '/business-overview', icon: 'businessOverview' },
    { label: 'Settings', path: '/settings', icon: 'settings' },
    { label: 'User Management', path: '/users', icon: 'users' },
  ],
};

export function AppProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const storedUser = localStorage.getItem('marketmindUser');
      return storedUser ? JSON.parse(storedUser) : null;
    } catch (error) {
      return null;
    }
  });
  const [theme, setTheme] = useState(() => {
    try {
      const storedTheme = localStorage.getItem('marketmindTheme');
      return storedTheme === 'light' ? 'light' : 'dark';
    } catch (error) {
      return 'dark';
    }
  });

  useEffect(() => {
    const handleAuthExpired = () => setUser(null);

    window.addEventListener('marketmind:auth-expired', handleAuthExpired);

    return () => {
      window.removeEventListener('marketmind:auth-expired', handleAuthExpired);
    };
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem('marketmindTheme', theme);
    } catch (error) {
      // ignore storage failures
    }

    const root = document.documentElement;
    root.dataset.theme = theme;
    root.style.colorScheme = theme;
  }, [theme]);

  const login = useCallback(({ email, role }) => {
    const newUser = {
      email,
      role,
      displayName: email ? email.split('@')[0] : role,
    };
    // Debug log to help trace login during development
    // (remove or silence in production)
    // eslint-disable-next-line no-console
    console.debug('[Auth] login:', newUser);
    try {
      localStorage.setItem('marketmindUser', JSON.stringify(newUser));
    } catch (error) {
      // ignore storage failures
    }
    setUser(newUser);
  }, []);

  const logout = useCallback(() => {
    try {
      localStorage.removeItem('marketmindUser');
      localStorage.removeItem('authToken');
    } catch (error) {
      // ignore storage failures
    }
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({
      environment: 'development',
      user,
      isAuthenticated: Boolean(user?.role),
      availableRoles: USER_ROLES,
      theme,
      setTheme,
      // navigation items based on current user role (falls back to Owner if none)
      navItems: ROLE_NAV[user?.role] ?? ROLE_NAV.Owner,
      login,
      logout,
    }),
    [user, login, logout, theme],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useAppContext() {
  const context = useContext(AppContext);

  if (!context) {
    throw new Error('useAppContext must be used within AppProvider');
  }

  return context;
}