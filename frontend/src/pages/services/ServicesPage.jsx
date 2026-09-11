import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../../auth/AuthContext';
import { ROLES } from '../../constants';
import { servicesApi } from '../../api/services';
import { tenantsApi } from '../../api/tenants';
import Table from '../../components/Table';
import Badge from '../../components/Badge';
import Button from '../../components/Button';
import Modal from '../../components/Modal';
import Input from '../../components/Input';
import Select from '../../components/Select';
import Pagination from '../../components/Pagination';
import Spinner from '../../components/Spinner';

const TYPE_OPTIONS = [
  { value: 'WATER', label: 'Agua' },
  { value: 'ELECTRICITY', label: 'Luz' },
  { value: 'INTERNET', label: 'Internet' },
];
const TYPE_LABEL = { WATER: 'Agua', ELECTRICITY: 'Luz', INTERNET: 'Internet' };
const empty = { tenantId: '', type: 'WATER', period: '', consumption: '', amount: '', observations: '' };

export default function ServicesPage() {
  const { user } = useAuth();
  const isLandlord = user.role === ROLES.LANDLORD;

  const [items, setItems] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  const [open, setOpen] = useState(false);
  const [tenants, setTenants] = useState([]);
  const [form, setForm] = useState(empty);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try { const { data } = await servicesApi.list({ page, limit: 10 }); setItems(data.data.items); setMeta(data.data.meta); }
    catch (e) { /* noop */ } finally { setLoading(false); }
  }, [page]);

  useEffect(() => { load(); }, [load]);

  const openCreate = async () => {
    setForm(empty); setError(''); setOpen(true);
    try { const t = await tenantsApi.list({ status: 'active', limit: 100 }); setTenants(t.data.data.items); }
    catch (e) { /* noop */ }
  };

  const submit = async () => {
    setError('');
    if (!form.tenantId) { setError('Selecciona el arrendatario'); return; }
    setSaving(true);
    try {
      await servicesApi.create({
        tenantId: Number(form.tenantId),
        type: form.type,
        period: form.period,
        consumption: form.consumption ? Number(form.consumption) : undefined,
        amount: Number(form.amount),
        observations: form.observations || undefined,
      });
      setOpen(false); load();
    } catch (err) { setError(err.response?.data?.message || 'No se pudo registrar'); }
    finally { setSaving(false); }
  };

  const money = (n) => `S/ ${Number(n).toLocaleString('es-PE', { minimumFractionDigits: 2 })}`;

  const columns = [
    { key: 'type', header: 'Servicio', render: (r) => <Badge tone="teal">{TYPE_LABEL[r.type]}</Badge> },
    { key: 'period', header: 'Periodo' },
    { key: 'consumption', header: 'Consumo', render: (r) => (r.consumption != null ? `${r.consumption} ${r.unit || ''}` : '—') },
    { key: 'amount', header: 'Monto', render: (r) => money(r.amount) },
    ...(isLandlord ? [{ key: 'tenant', header: 'Arrendatario', render: (r) => r.tenant?.fullName }] : []),
    { key: 'observations', header: 'Obs.', render: (r) => r.observations || '—' },
  ];

  return (
    <div>
      <h1 className="af-page__title">Servicios</h1>
      <p className="af-page__subtitle">{isLandlord ? 'Registro de servicios (agua, luz, internet)' : 'Tus consumos de servicios'}</p>

      {isLandlord && (
        <div className="af-toolbar"><div /><Button onClick={openCreate}>+ Registrar servicio</Button></div>
      )}

      {loading ? <Spinner /> : (
        <>
          <Table columns={columns} rows={items} empty="No hay servicios registrados" />
          <Pagination meta={meta} onPage={setPage} />
        </>
      )}

      <Modal open={open} title="Registrar servicio" onClose={() => setOpen(false)}
        footer={<>
          <Button variant="ghost" onClick={() => setOpen(false)}>Cancelar</Button>
          <Button onClick={submit} disabled={saving}>{saving ? 'Guardando...' : 'Registrar'}</Button>
        </>}>
        {error && <div className="af-alert af-alert--error">{error}</div>}
        <Select label="Arrendatario" value={form.tenantId} placeholder="Selecciona..."
          options={tenants.map((t) => ({ value: t.id, label: `${t.fullName} (${t.dni})` }))}
          onChange={(e) => setForm({ ...form, tenantId: e.target.value })} />
        <Select label="Tipo" value={form.type} options={TYPE_OPTIONS} onChange={(e) => setForm({ ...form, type: e.target.value })} />
        <Input label="Periodo (YYYY-MM)" placeholder="2026-09" value={form.period} onChange={(e) => setForm({ ...form, period: e.target.value })} />
        <Input label="Consumo (opcional)" type="number" step="0.01" value={form.consumption} onChange={(e) => setForm({ ...form, consumption: e.target.value })} />
        <Input label="Monto (S/)" type="number" step="0.01" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
        <Input label="Observaciones" value={form.observations} onChange={(e) => setForm({ ...form, observations: e.target.value })} />
      </Modal>
    </div>
  );
}
