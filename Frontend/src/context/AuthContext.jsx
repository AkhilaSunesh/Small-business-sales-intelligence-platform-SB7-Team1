import React from 'react';
import { AppProvider, useAppContext } from './AppContext';

// AuthContext is a thin wrapper around AppContext to expose auth-focused API
// It provides an `AuthProvider` to wrap the app and a `useAuth` hook for convenience.

export function AuthProvider({ children }) {
  return <AppProvider>{children}</AppProvider>;
}

export function useAuth() {
  return useAppContext();
}

export default AuthProvider;
