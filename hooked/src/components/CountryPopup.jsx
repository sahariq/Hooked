import { useCurrency } from '../context/CurrencyContext';
import { YarnBallIcon } from './CrochetMotifs';
import './CountryPopup.css';

export default function CountryPopup() {
  const { showPopup, countries, selectCountry, loading } = useCurrency();

  if (!showPopup || loading || countries.length === 0) return null;

  return (
    <div className="country-popup-overlay">
      <div className="country-popup-card">
        <YarnBallIcon size={38} color="var(--cherry)" />
        <h2>Where are you shopping from?</h2>
        <p>We'll show prices and shipping in your local currency.</p>
        <div className="country-grid">
          {countries.map((c) => (
            <button key={c.code} className="country-option" onClick={() => selectCountry(c.code, c.defaultCurrency)}>
              <span className="country-name">{c.name}</span>
              <span className="country-currency">{c.defaultCurrency}</span>
            </button>
          ))}
        </div>
        <button className="country-skip" onClick={() => selectCountry('PK', 'PKR')}>
          Not listed? Continue in PKR (Rs) →
        </button>
      </div>
    </div>
  );
}
