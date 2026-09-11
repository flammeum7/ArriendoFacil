export default function Spinner({ full }) {
  return (
    <div className={full ? 'af-spinner-full' : 'af-spinner-wrap'}>
      <div className="af-spinner" />
    </div>
  );
}
