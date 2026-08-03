import { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import { api } from '../api/client';

const CurrencyContext = createContext(null);
const STORAGE_KEY = 'hooked_country_currency';

export function CurrencyProvider({ children }) {
  const [countries, setCountries] = useState([]);
  const [rates, setRates] = useState([]);
  const [countryCode, setCountryCode] = useState(null);
  const [currencyCode, setCurrencyCode] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showPopup, setShowPopup] = useState(false);

  useEffect(() => {
    Promise.all([api.getCountries(), api.getRates()])
      .then(([c, r]) => {
        setCountries(c);
        setRates(r);
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          const { country, currency } = JSON.parse(saved);
          setCountryCode(country);
          setCurrencyCode(currency);
        } else {
          setShowPopup(true);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const selectCountry = useCallback((country, currency) => {
    setCountryCode(country);
    setCurrencyCode(currency);
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ country, currency }));
    setShowPopup(false);
  }, []);

  const country = useMemo(() => countries.find((c) => c.code === countryCode) || null, [countries, countryCode]);
  const currency = useMemo(() => rates.find((r) => r.code === currencyCode) || rates.find((r) => r.code === 'PKR'), [rates, currencyCode]);

  // convert a PKR amount into the selected display currency
  const convert = useCallback((pkrAmount) => {
    if (!currency || currency.code === 'PKR') return pkrAmount;
    return pkrAmount / currency.rateToPkr;
  }, [currency]);

  // format a PKR amount as a nicely displayed price string in the selected currency
  const formatPrice = useCallback((pkrAmount) => {
    const converted = convert(pkrAmount);
    const symbol = currency?.symbol || 'Rs';
    return `${symbol} ${converted.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }, [convert, currency]);

  const value = {
    countries, rates, loading, showPopup,
    countryCode, currencyCode, country, currency,
    selectCountry, convert, formatPrice,
    reopenPopup: () => setShowPopup(true),
  };

  return <CurrencyContext.Provider value={value}>{children}</CurrencyContext.Provider>;
}

export function useCurrency() {
  const ctx = useContext(CurrencyContext);
  if (!ctx) throw new Error('useCurrency must be used within CurrencyProvider');
  return ctx;
}
