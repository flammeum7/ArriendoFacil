import Card from './Card';

export default function StatCard({ label, value, accent }) {
  return (
    <Card>
      <div style={{ fontSize: 'var(--fs-sm)', color: 'var(--color-text-muted)' }}>{label}</div>
      <div
        style={{
          fontSize: 'var(--fs-2xl)',
          fontWeight: 700,
          color: accent || 'var(--color-text)',
          marginTop: 'var(--sp-2)',
        }}
      >
        {value}
      </div>
    </Card>
  );
}
