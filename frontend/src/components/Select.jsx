import { useId } from 'react';

export default function Select({ label, id, options, error, placeholder, ...rest }) {
  // Si no se pasa id, se genera uno para que el <label> quede asociado al <select>
  const autoId = useId();
  const selectId = id || autoId;
  return (
    <div className="af-field">
      {label && <label className="af-label" htmlFor={selectId}>{label}</label>}
      <select id={selectId} className="af-select" {...rest}>
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      {error && <span className="af-error-text">{error}</span>}
    </div>
  );
}
