export default function Card({ children, className = '' }) {
  return <div className={`af-card ${className}`}>{children}</div>;
}
