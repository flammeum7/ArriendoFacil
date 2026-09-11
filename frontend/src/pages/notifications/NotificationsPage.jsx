import { useEffect, useState, useCallback } from 'react';
import { notificationsApi } from '../../api/notifications';
import Button from '../../components/Button';
import Card from '../../components/Card';
import Pagination from '../../components/Pagination';
import Spinner from '../../components/Spinner';

export default function NotificationsPage() {
  const [items, setItems] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  const load = useCallback(async () => {
    setLoading(true);
    try { const { data } = await notificationsApi.list({ page, limit: 15 }); setItems(data.data.items); setMeta(data.data.meta); }
    catch (e) { /* noop */ } finally { setLoading(false); }
  }, [page]);

  useEffect(() => { load(); }, [load]);

  const markRead = async (n) => { await notificationsApi.markRead(n.id); load(); };
  const markAll = async () => { await notificationsApi.markAllRead(); load(); };

  const dt = (d) => new Date(d).toLocaleString('es-PE');

  return (
    <div>
      <h1 className="af-page__title">Notificaciones</h1>
      <p className="af-page__subtitle">Avisos del sistema</p>

      <div className="af-toolbar"><div /><Button variant="ghost" onClick={markAll}>Marcar todas como leídas</Button></div>

      {loading ? <Spinner /> : (
        <>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-3)' }}>
            {items.length === 0 && <Card><p style={{ color: 'var(--color-text-faint)' }}>No tienes notificaciones.</p></Card>}
            {items.map((n) => (
              <Card key={n.id}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 'var(--sp-3)', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontWeight: n.read ? 400 : 700 }}>{n.message}</div>
                    <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--color-text-faint)' }}>{dt(n.createdAt)}</div>
                  </div>
                  {!n.read && <Button variant="ghost" onClick={() => markRead(n)}>Marcar leída</Button>}
                </div>
              </Card>
            ))}
          </div>
          <Pagination meta={meta} onPage={setPage} />
        </>
      )}
    </div>
  );
}
