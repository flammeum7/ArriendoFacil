export default function Table({ columns, rows, rowKey = 'id', empty = 'Sin registros' }) {
  return (
    <div className="af-table-wrap">
      <table className="af-table">
        <thead>
          <tr>{columns.map((c) => <th key={c.key}>{c.header}</th>)}</tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr><td className="af-table__empty" colSpan={columns.length}>{empty}</td></tr>
          ) : (
            rows.map((row) => (
              <tr key={row[rowKey]}>
                {columns.map((c) => (
                  <td key={c.key}>{c.render ? c.render(row) : row[c.key]}</td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
