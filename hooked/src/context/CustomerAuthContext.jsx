import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { api, getCustomerToken, setCustomerToken, clearCustomerToken } from '../api/client';

const CustomerAuthContext = createContext(null);

export function CustomerAuthProvider({ children }) {
  const [customer, setCustomer] = useState(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (!getCustomerToken()) {
      setChecking(false);
      return;
    }
    api.customerMe()
      .then(setCustomer)
      .catch(() => clearCustomerToken())
      .finally(() => setChecking(false));
  }, []);

  const login = useCallback(async (email, password) => {
    const res = await api.customerLogin({ email, password });
    setCustomerToken(res.token);
    setCustomer(res.customer);
  }, []);

  const signup = useCallback(async (fields) => {
    const res = await api.customerSignup(fields);
    setCustomerToken(res.token);
    setCustomer(res.customer);
  }, []);

  const logout = useCallback(() => {
    clearCustomerToken();
    setCustomer(null);
  }, []);

  return (
    <CustomerAuthContext.Provider value={{ customer, checking, isAuthed: !!customer, login, signup, logout, setCustomer }}>
      {children}
    </CustomerAuthContext.Provider>
  );
}

export function useCustomerAuth() {
  const ctx = useContext(CustomerAuthContext);
  if (!ctx) throw new Error('useCustomerAuth must be used within CustomerAuthProvider');
  return ctx;
}
