const TONE = {
  gray: 'af-badge--gray', green: 'af-badge--green', amber: 'af-badge--amber',
  red: 'af-badge--red', blue: 'af-badge--blue', teal: 'af-badge--teal',
};

export default function Badge({ tone = 'gray', children }) {
  return <span className={`af-badge ${TONE[tone] || TONE.gray}`}>{children}</span>;
}
