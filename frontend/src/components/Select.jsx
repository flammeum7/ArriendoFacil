export default function Select({ label, id, options, error, placeholder, ...rest }) {
  return (
    <div className="af-field">
      {label && <label className="af-label" htmlFor={id}>{label}</label>}
      <select id={id} className="af-select" {...rest}>
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      {error && <span className="af-error-text">{error}</span>}
    </div>
  );
}
