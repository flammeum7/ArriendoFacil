import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../../auth/AuthContext';
import { ROLES } from '../../constants';
import { incidentsApi } from '../../api/incidents';
import { openProtectedFile } from '../../api/files';
import Table from '../../components/Table';
import Badge from '../../components/Badge';
import Button from '../../components/Button';
import Modal from '../../components/Modal';
import Input from '../../components/Input';
import Select from '../../components/Select';
import Pagination from '../../components/Pagination';
import Spinner from '../../components/Spinner';

const TYPE_OPTIONS = [
  { value: 'COMPLAINT', label: 'Queja' },
  { value: 'CLAIM', label: 'Reclamo' },
  { value: 'MAINTENANCE_REQUEST', label: 'Solicitud de mantenimiento' },
];
const TYPE_LABEL = Object.fromEntries(TYPE_OPTIONS.map((o) => [o.value, o.label]));
const PRIORITY_OPTIONS = [
  { value: 'HIGH', label: 'Alta' }, { value: 'MEDIUM', label: 'Media' }, { value: 'LOW', label: 'Baja' },
];
const STATUS_TONE = { OPEN: 'amber', IN_PROGRESS: 'blue', RESOLVED: 'green', CLOSED: 'gray' };
const STATUS_LABEL = { OPEN: 'Abierto', IN_PROGRESS: 'En proceso', RESOLVED: 'Resuelto', CLOSED: 'Cerrado' };
const STATUS_OPTIONS = Object.keys(STATUS_LABEL).map((k) => ({ value: k, label: STATUS_LABEL[k] }));

export default function IncidentsPage() {
  const { user } = useAuth();
  const isLandlord = user.role === ROLES.LANDLORD;

  const [items, setItems] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState({ type: 'MAINTENANCE_REQUEST', title: '', description: '', priority: 'MEDIUM' });
  const [createFiles, setCreateFiles] = useState(null);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const [detail, setDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [replyMsg, setReplyMsg] = useState('');
  const [replyStatus, setReplyStatus] = useState('');
  const [replyFiles, setReplyFiles] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try { const { data } = await incidentsApi.list({ page, limit: 10 }); setItems(data.data.items); setMeta(data.data.meta); }
    catch (e) { /* noop */ } finally { setLoading(false); }
  }, [page]);

  useEffect(() => { load(); }, [load]);

  const submitCreate = async () => {
    setError('');
    const fd = new FormData();
    fd.append('type', form.type); fd.append('title', form.title);
    fd.append('description', form.description); fd.append('priority', form.priority);
    if (createFiles) Array.from(createFiles).slice(0, 3).forEach((f) => fd.append('attachments', f));
    setSaving(true);
    try {
      await incidentsApi.create(fd);
      setCreateOpen(false);
      setForm({ type: 'MAINTENANCE_REQUEST', title: '', description: '', priority: 'MEDIUM' });
      setCreateFiles(null); load();
    } catch (err) { setError(err.response?.data?.message || 'No se pudo registrar'); }
    finally { setSaving(false); }
  };

  const openDetail = async (row) => {
    setDetailLoading(true); setDetail({ id: row.id }); setReplyMsg(''); setReplyStatus(''); setReplyFiles(null); setError('');
    try { const { data } = await incidentsApi.get(row.id); setDetail(data.data.incident); }
    catch (e) { /* noop */ } finally { setDetailLoading(false); }
  };

  const submitReply = async () => {
    setError('');
    if (!replyMsg.trim()) { setError('Escribe un mensaje'); return; }
    const fd = new FormData();
    fd.append('message', replyMsg);
    if (isLandlord && replyStatus) fd.append('status', replyStatus);
    if (replyFiles) Array.from(replyFiles).slice(0, 3).forEach((f) => fd.append('attachments', f));
    try {
      await incidentsApi.respond(detail.id, fd);
      const { data } = await incidentsApi.get(detail.id);
      setDetail(data.data.incident);
      setReplyMsg(''); setReplyStatus(''); setReplyFiles(null);
      load();
    } catch (err) { setError(err.response?.data?.message || 'No se pudo enviar'); }
  };

  const dt = (d) => new Date(d).toLocaleString('es-PE');

  const columns = [
    { key: 'id', header: '#', render: (r) => `#${r.id}` },
    { key: 'title', header: 'Título' },
    { key: 'type', header: 'Tipo', render: (r) => TYPE_LABEL[r.type] },
    { key: 'priority', header: 'Prioridad' },
    { key: 'status', header: 'Estado', render: (r) => <Badge tone={STATUS_TONE[r.status]}>{STATUS_LABEL[r.status]}</Badge> },
    ...(isLandlord ? [{ key: 'tenant', header: 'Arrendatario', render: (r) => r.tenant?.fullName }] : []),
    { key: 'actions', header: '', render: (r) => <Button variant="ghost" onClick={() => openDetail(r)}>Ver hilo</Button> },
  ];

  return (
    <div>
      <h1 className="af-page__title">Incidencias</h1>
      <p className="af-page__subtitle">{isLandlord ? 'Quejas, reclamos y solicitudes' : 'Tus incidencias'}</p>

      {!isLandlord && (
        <div className="af-toolbar"><div /><Button onClick={() => { setCreateOpen(true); setError(''); }}>+ Nueva incidencia</Button></div>
      )}

      {loading ? <Spinner /> : (
        <>
          <Table columns={columns} rows={items} empty="No hay incidencias" />
          <Pagination meta={meta} onPage={setPage} />
        </>
      )}

      <Modal open={createOpen} title="Nueva incidencia" onClose={() => setCreateOpen(false)}
        footer={<>
          <Button variant="ghost" onClick={() => setCreateOpen(false)}>Cancelar</Button>
          <Button onClick={submitCreate} disabled={saving}>{saving ? 'Enviando...' : 'Registrar'}</Button>
        </>}>
        {error && <div className="af-alert af-alert--error">{error}</div>}
        <Select label="Tipo" value={form.type} options={TYPE_OPTIONS} onChange={(e) => setForm({ ...form, type: e.target.value })} />
        <Input label="Título" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
        <div className="af-field">
          <label className="af-label">Descripción</label>
          <textarea className="af-input" rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        </div>
        <Select label="Prioridad" value={form.priority} options={PRIORITY_OPTIONS} onChange={(e) => setForm({ ...form, priority: e.target.value })} />
        <div className="af-field">
          <label className="af-label">Imágenes (hasta 3, JPG/PNG · máx 3 MB c/u)</label>
          <input className="af-input" type="file" accept=".jpg,.jpeg,.png" multiple onChange={(e) => setCreateFiles(e.target.files)} />
        </div>
      </Modal>

      <Modal open={!!detail} title={detail?.title ? `Incidencia: ${detail.title}` : 'Incidencia'} onClose={() => setDetail(null)}>
        {detailLoading || !detail?.status ? <Spinner /> : (
          <>
            <div style={{ marginBottom: 'var(--sp-4)' }}>
              <Badge tone={STATUS_TONE[detail.status]}>{STATUS_LABEL[detail.status]}</Badge>{' '}
              <span style={{ color: 'var(--color-text-muted)', fontSize: 'var(--fs-sm)' }}>{TYPE_LABEL[detail.type]} · {detail.priority}</span>
              <p style={{ marginTop: 'var(--sp-2)' }}>{detail.description}</p>
              {detail.attachments?.length > 0 && (
                <div className="af-table__actions">
                  {detail.attachments.map((a) => (
                    <Button key={a.id} variant="ghost" onClick={() => openProtectedFile(`/incidents/attachments/${a.id}/download`)}>Imagen</Button>
                  ))}
                </div>
              )}
            </div>

            <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: 'var(--sp-3)', display: 'flex', flexDirection: 'column', gap: 'var(--sp-3)' }}>
              {detail.responses?.length ? detail.responses.map((r) => (
                <div key={r.id} style={{ background: 'var(--color-bg-elevated)', padding: 'var(--sp-3)', borderRadius: 'var(--radius-sm)' }}>
                  <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--color-text-faint)' }}>
                    {r.author?.role === 'LANDLORD' ? 'Administrador' : r.author?.fullName} · {dt(r.createdAt)}
                  </div>
                  <div style={{ fontSize: 'var(--fs-sm)' }}>{r.message}</div>
                  {r.attachments?.length > 0 && (
                    <div className="af-table__actions">
                      {r.attachments.map((a) => (
                        <Button key={a.id} variant="ghost" onClick={() => openProtectedFile(`/incidents/attachments/${a.id}/download`)}>Imagen</Button>
                      ))}
                    </div>
                  )}
                </div>
              )) : <p style={{ color: 'var(--color-text-faint)', fontSize: 'var(--fs-sm)' }}>Sin respuestas todavía.</p>}
            </div>

            {detail.status !== 'CLOSED' && (
              <div style={{ marginTop: 'var(--sp-4)' }}>
                {error && <div className="af-alert af-alert--error">{error}</div>}
                <div className="af-field">
                  <label className="af-label">Responder</label>
                  <textarea className="af-input" rows={2} value={replyMsg} onChange={(e) => setReplyMsg(e.target.value)} />
                </div>
                {isLandlord && (
                  <Select label="Cambiar estado (opcional)" value={replyStatus} placeholder="Sin cambio"
                    options={STATUS_OPTIONS} onChange={(e) => setReplyStatus(e.target.value)} />
                )}
                <div className="af-field">
                  <label className="af-label">Imágenes (hasta 3)</label>
                  <input className="af-input" type="file" accept=".jpg,.jpeg,.png" multiple onChange={(e) => setReplyFiles(e.target.files)} />
                </div>
                <Button onClick={submitReply}>Enviar respuesta</Button>
              </div>
            )}
          </>
        )}
      </Modal>
    </div>
  );
}
