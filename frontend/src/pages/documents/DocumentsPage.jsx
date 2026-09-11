import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../../auth/AuthContext';
import { ROLES } from '../../constants';
import { documentsApi } from '../../api/documents';
import { tenantsApi } from '../../api/tenants';
import { openProtectedFile } from '../../api/files';
import Table from '../../components/Table';
import Badge from '../../components/Badge';
import Button from '../../components/Button';
import Modal from '../../components/Modal';
import Select from '../../components/Select';
import Pagination from '../../components/Pagination';
import Spinner from '../../components/Spinner';

const TYPE_LABEL = { CONTRACT: 'Contrato', INVOICE: 'Boleta/Factura', PAYMENT_RECEIPT: 'Comprobante', OTHER: 'Otro' };

export default function DocumentsPage() {
  const { user } = useAuth();
  const isLandlord = user.role === ROLES.LANDLORD;

  const [items, setItems] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  const [open, setOpen] = useState(false);
  const [tenants, setTenants] = useState([]);
  const [form, setForm] = useState({ ownerId: '', type: 'CONTRACT' });
  const [file, setFile] = useState(null);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try { const { data } = await documentsApi.list({ page, limit: 10 }); setItems(data.data.items); setMeta(data.data.meta); }
    catch (e) { /* noop */ } finally { setLoading(false); }
  }, [page]);

  useEffect(() => { load(); }, [load]);

  const openUpload = async () => {
    setForm({ ownerId: '', type: 'CONTRACT' }); setFile(null); setError(''); setOpen(true);
    try { const t = await tenantsApi.list({ status: 'active', limit: 100 }); setTenants(t.data.data.items); }
    catch (e) { /* noop */ }
  };

  const submit = async () => {
    setError('');
    if (!form.ownerId) { setError('Selecciona el arrendatario'); return; }
    if (!file) { setError('Selecciona el archivo'); return; }
    const fd = new FormData();
    fd.append('type', form.type);
    fd.append('ownerId', form.ownerId);
    fd.append('file', file);
    setSaving(true);
    try { await documentsApi.upload(fd); setOpen(false); load(); }
    catch (err) { setError(err.response?.data?.message || 'No se pudo subir'); }
    finally { setSaving(false); }
  };

  const remove = async (d) => {
    if (!window.confirm('¿Eliminar este documento?')) return;
    try { await documentsApi.remove(d.id); load(); }
    catch (err) { window.alert(err.response?.data?.message || 'Error'); }
  };

  const date = (d) => new Date(d).toLocaleDateString('es-PE');

  const columns = [
    { key: 'originalName', header: 'Archivo' },
    { key: 'type', header: 'Tipo', render: (r) => <Badge tone="teal">{TYPE_LABEL[r.type]}</Badge> },
    { key: 'createdAt', header: 'Fecha', render: (r) => date(r.createdAt) },
    { key: 'actions', header: '', render: (r) => (
      <div className="af-table__actions">
        <Button variant="ghost" onClick={() => openProtectedFile(`/documents/${r.id}/download`)}>Ver</Button>
        {isLandlord && <Button variant="ghost" onClick={() => remove(r)}>Eliminar</Button>}
      </div>
    ) },
  ];

  return (
    <div>
      <h1 className="af-page__title">Documentos</h1>
      <p className="af-page__subtitle">{isLandlord ? 'Documentos del sistema' : 'Tus documentos'}</p>

      {isLandlord && (
        <div className="af-toolbar"><div /><Button onClick={openUpload}>+ Subir documento</Button></div>
      )}

      {loading ? <Spinner /> : (
        <>
          <Table columns={columns} rows={items} empty="No hay documentos" />
          <Pagination meta={meta} onPage={setPage} />
        </>
      )}

      <Modal open={open} title="Subir documento" onClose={() => setOpen(false)}
        footer={<>
          <Button variant="ghost" onClick={() => setOpen(false)}>Cancelar</Button>
          <Button onClick={submit} disabled={saving}>{saving ? 'Subiendo...' : 'Subir'}</Button>
        </>}>
        {error && <div className="af-alert af-alert--error">{error}</div>}
        <Select label="Arrendatario" value={form.ownerId} placeholder="Selecciona..."
          options={tenants.map((t) => ({ value: t.id, label: `${t.fullName} (${t.dni})` }))}
          onChange={(e) => setForm({ ...form, ownerId: e.target.value })} />
        <Select label="Tipo" value={form.type}
          options={[{ value: 'CONTRACT', label: 'Contrato' }, { value: 'INVOICE', label: 'Boleta/Factura' }, { value: 'OTHER', label: 'Otro' }]}
          onChange={(e) => setForm({ ...form, type: e.target.value })} />
        <div className="af-field">
          <label className="af-label">Archivo (PDF, JPG o PNG · máx 5 MB)</label>
          <input className="af-input" type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={(e) => setFile(e.target.files[0])} />
        </div>
      </Modal>
    </div>
  );
}
