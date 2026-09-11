export default function Input({ label, error, id, ...rest }) {
  return (
    <div className="af-field">
      {label && <label className="af-label" htmlFor={id}>{label}</label>}
      <input id={id} className={`af-input ${error ? 'af-input--error' : ''}`} {...rest} />
      {error && <span className="af-error-text">{error}</span>}
    </div>
  );
}
