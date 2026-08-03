import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { api, getAdminToken, setAdminToken, clearAdminToken } from '../api/client';

const AdminAuthContext = createContext(null);

export function AdminAuthProvider({ children }) {
  const [email, setEmail] = useState(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (!getAdminToken()) {
      setChecking(false);
      return;
    }
    api.adminMe()
      .then((me) => setEmail(me.email))
      .catch(() => clearAdminToken())
      .finally(() => setChecking(false));
  }, []);

  const login = useCallback(async (emailInput, password) => {
    const res = await api.adminLogin(emailInput, password);
    setAdminToken(res.token);
    setEmail(res.email);
  }, []);

  const logout = useCallback(() => {
    clearAdminToken();
    setEmail(null);
  }, []);

  return (
    <AdminAuthContext.Provider value={{ email, checking, isAuthed: !!email, login, logout }}>
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth() {
  const ctx = useContext(AdminAuthContext);
  if (!ctx) throw new Error('useAdminAuth must be used within AdminAuthProvider');
  return ctx;
}
