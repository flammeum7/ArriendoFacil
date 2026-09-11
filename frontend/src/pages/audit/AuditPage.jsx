import { useEffect, useState, useCallback } from 'react';
import { auditApi } from '../../api/audit';
import Table from '../../components/Table';
import Pagination from '../../components/Pagination';
import Spinner from '../../components/Spinner';

export default function AuditPage() {
  const [items, setItems] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [entity, setEntity] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 15 };
      if (entity) params.entity = entity;
      const { data } = await auditApi.list(params);
      setItems(data.data.items); setMeta(data.data.meta);
    } catch (e) { /* noop */ } finally { setLoading(false); }
  }, [page, entity]);

  useEffect(() => { load(); }, [load]);

  const dt = (d) => new Date(d).toLocaleString('es-PE');

  const columns = [
    { key: 'createdAt', header: 'Fecha', render: (r) => dt(r.createdAt) },
    { key: 'actor', header: 'Actor', render: (r) => r.actor?.fullName || '—' },
    { key: 'action', header: 'Acción' },
    { key: 'entity', header: 'Entidad' },
    { key: 'entityId', header: 'ID', render: (r) => r.entityId ?? '—' },
  ];

  return (
    <div>
      <h1 className="af-page__title">Auditoría</h1>
      <p className="af-page__subtitle">Historial de acciones del sistema</p>

      <div className="af-toolbar">
        <div className="af-toolbar__filters">
          <select className="af-select" value={entity} onChange={(e) => { setEntity(e.target.value); setPage(1); }}>
            <option value="">Todas las entidades</option>
            <option value="Contract">Contratos</option>
            <option value="Payment">Pagos</option>
            <option value="User">Arrendatarios</option>
            <option value="Property">Propiedades</option>
            <option value="Document">Documentos</option>
            <option value="Incident">Incidencias</option>
            <option value="Service">Servicios</option>
          </select>
        </div>
      </div>

      {loading ? <Spinner /> : (
        <>
          <Table columns={columns} rows={items} empty="Sin registros de auditoría" />
          <Pagination meta={meta} onPage={setPage} />
        </>
      )}
    </div>
  );
}
