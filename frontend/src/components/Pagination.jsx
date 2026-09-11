import Button from './Button';

export default function Pagination({ meta, onPage }) {
  if (!meta) return null;
  const { page, totalPages, total } = meta;
  return (
    <div className="af-pagination">
      <Button variant="ghost" disabled={page <= 1} onClick={() => onPage(page - 1)}>Anterior</Button>
      <span className="af-pagination__info">Página {page} de {totalPages} · {total} registros</span>
      <Button variant="ghost" disabled={page >= totalPages} onClick={() => onPage(page + 1)}>Siguiente</Button>
    </div>
  );
}
