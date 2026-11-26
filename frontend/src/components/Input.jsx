import { useId } from 'react';

export default function Input({ label, error, id, ...rest }) {
  // Si no se pasa id, se genera uno para que el <label> quede asociado al <input>
  const autoId = useId();
  const inputId = id || autoId;
  return (
    <div className="af-field">
      {label && <label className="af-label" htmlFor={inputId}>{label}</label>}
      <input id={inputId} className={`af-input ${error ? 'af-input--error' : ''}`} {...rest} />
      {error && <span className="af-error-text">{error}</span>}
    </div>
  );
}
