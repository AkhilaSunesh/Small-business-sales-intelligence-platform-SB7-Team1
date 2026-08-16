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
    { label: 'Forecast vs Actual', path: '/forecast-vs-actual', icon: 'forecastVsActual' },
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
    { label: 'Forecast vs Actual', path: '/forecast-vs-actual', icon: 'forecastVsActual' },
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
      const storedUser = localStorage.getItem('marketmindUser') || sessionStorage.getItem('marketmindUser');
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

  const login = useCallback(({ id, email, role, name, staySignedIn }) => {
    const newUser = {
      id,
      email,
      role,
      // Prefer the real name from the API; fall back to email prefix
      displayName: name || (email ? email.split('@')[0] : role),
    };

    // Determine whether to use local or session storage
    let useLocal = false;
    if (staySignedIn === true) {
      useLocal = true;
    } else if (staySignedIn === false) {
      useLocal = false;
    } else {
      useLocal = !!localStorage.getItem('marketmindUser');
    }

    try {
      if (useLocal) {
        localStorage.setItem('marketmindUser', JSON.stringify(newUser));
        sessionStorage.removeItem('marketmindUser');
      } else {
        sessionStorage.setItem('marketmindUser', JSON.stringify(newUser));
        localStorage.removeItem('marketmindUser');
      }
    } catch (error) {
      // ignore storage failures
    }
    setUser(newUser);
  }, []);

  const logout = useCallback(() => {
    try {
      localStorage.removeItem('marketmindUser');
      sessionStorage.removeItem('marketmindUser');
      localStorage.removeItem('authToken');
      sessionStorage.removeItem('authToken');
      localStorage.removeItem('refreshToken');
      sessionStorage.removeItem('refreshToken');
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