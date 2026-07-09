import { createContext, useContext, useMemo, useState, useCallback } from 'react';

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
    { label: 'Upload', path: '/upload', icon: 'upload' },
    { label: 'Inventory', path: '/inventory', icon: 'inventory' },
    { label: 'Reports', path: '/reports', icon: 'reports' },
    { label: 'Settings', path: '/settings', icon: 'settings' },
  ],
  'Store Manager': [
    { label: 'Dashboard', path: '/dashboard', icon: 'dashboard' },
    { label: 'Upload', path: '/upload', icon: 'upload' },
    { label: 'Inventory', path: '/inventory', icon: 'inventory' },
  ],
  'Sales Executive': [
    { label: 'Dashboard', path: '/dashboard', icon: 'dashboard' },
    { label: 'Upload', path: '/upload', icon: 'upload' },
  ],
  Admin: [
    { label: 'Dashboard', path: '/dashboard', icon: 'dashboard' },
    { label: 'Settings', path: '/settings', icon: 'settings' },
    { label: 'User Management', path: '/users', icon: 'users' },
  ],
};

export function AppProvider({ children }) {
  const [user, setUser] = useState(null);

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
    setUser(newUser);
  }, []);

  const logout = useCallback(() => setUser(null), []);

  const value = useMemo(
    () => ({
      appName: 'MarketMind AI',
      environment: 'development',
      user,
      isAuthenticated: Boolean(user?.role),
      availableRoles: USER_ROLES,
      // navigation items based on current user role (falls back to Owner if none)
      navItems: ROLE_NAV[user?.role] ?? ROLE_NAV.Owner,
      login,
      logout,
    }),
    [user, login, logout],
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