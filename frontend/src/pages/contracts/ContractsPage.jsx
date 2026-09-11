import { useEffect, useState, useCallback } from 'react';
import { contractsApi } from '../../api/contracts';
import { tenantsApi } from '../../api/tenants';
import { propertiesApi } from '../../api/properties';
import Table from '../../components/Table';
import Badge from '../../components/Badge';
import Button from '../../components/Button';
import Modal from '../../components/Modal';
import Input from '../../components/Input';
import Select from '../../components/Select';
import Pagination from '../../components/Pagination';
import Spinner from '../../components/Spinner';

const STATUS_TONE = { ACTIVE: 'green', EXPIRED: 'gray', CANCELLED: 'red', RENEWED: 'blue' };
const STATUS_LABEL = { ACTIVE: 'Vigente', EXPIRED: 'Vencido', CANCELLED: 'Cancelado', RENEWED: 'Renovado' };

const emptyForm = { tenantId: '', propertyId: '', startDate: '', endDate: '', rent: '', deposit: '', dueDayOffset: 5 };
const emptyRenew = { startDate: '', endDate: '', rent: '' };

export default function ContractsPage() {
  const [items, setItems] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);

  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [tenants, setTenants] = useState([]);
  const [properties, setProperties] = useState([]);
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  const [renewOpen, setRenewOpen] = useState(false);
  const [renewTarget, setRenewTarget] = useState(null);
  const [renewForm, setRenewForm] = useState(emptyRenew);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 10 };
      if (statusFilter) params.status = statusFilter;
      const { data } = await contractsApi.list(params);
      setItems(data.data.items);
      setMeta(data.data.meta);
    } catch (e) { /* noop */ } finally { setLoading(false); }
  }, [statusFilter, page]);

  useEffect(() => { load(); }, [load]);

  const openCreate = async () => {
    setForm(emptyForm); setFormError(''); setCreateOpen(true);
    try {
      const [t, p] = await Promise.all([
        tenantsApi.list({ status: 'active', limit: 100 }),
        propertiesApi.list({ status: 'AVAILABLE', limit: 100 }),
      ]);
      setTenants(t.data.data.items);
      setProperties(p.data.data.items);
    } catch (e) { /* noop */ }
  };

  const onCreate = async () => {
    setFormError(''); setSaving(true);
    try {
      await contractsApi.create({
        tenantId: Number(form.tenantId),
        propertyId: Number(form.propertyId),
        startDate: form.startDate,
        endDate: form.endDate,
        rent: Number(form.rent),
        deposit: Number(form.deposit),
        dueDayOffset: Number(form.dueDayOffset),
      });
      setCreateOpen(false); load();
    } catch (err) {
      setFormError(err.response?.data?.message || 'No se pudo crear el contrato');
    } finally { setSaving(false); }
  };

  const openRenew = (c) => { setRenewTarget(c); setRenewForm(emptyRenew); setFormError(''); setRenewOpen(true); };

  const onRenew = async () => {
    setFormError(''); setSaving(true);
    try {
      const payload = { startDate: renewForm.startDate, endDate: renewForm.endDate };
      if (renewForm.rent) payload.rent = Number(renewForm.rent);
      await contractsApi.renew(renewTarget.id, payload);
      setRenewOpen(false); load();
    } catch (err) {
      setFormError(err.response?.data?.message || 'No se pudo renovar');
    } finally { setSaving(false); }
  };

  const onCancel = async (c) => {
    if (!window.confirm('¿Cancelar este contrato? La propiedad quedará disponible.')) return;
    try { await contractsApi.cancel(c.id); load(); }
    catch (err) { window.alert(err.response?.data?.message || 'No se pudo cancelar'); }
  };

  const date = (d) => new Date(d).toLocaleDateString('es-PE');
  const money = (n) => `S/ ${Number(n).toLocaleString('es-PE', { minimumFractionDigits: 2 })}`;

  const columns = [
    { key: 'id', header: '#', render: (r) => `#${r.id}` },
    { key: 'tenant', header: 'Arrendatario', render: (r) => r.tenant?.fullName },
    { key: 'property', header: 'Propiedad', render: (r) => r.property?.address },
    { key: 'startDate', header: 'Inicio', render: (r) => date(r.startDate) },
    { key: 'endDate', header: 'Vencimiento', render: (r) => date(r.endDate) },
    { key: 'rent', header: 'Alquiler', render: (r) => money(r.rent) },
    { key: 'status', header: 'Estado', render: (r) => <Badge tone={STATUS_TONE[r.status]}>{STATUS_LABEL[r.status]}</Badge> },
    { key: 'actions', header: '', render: (r) => (
      r.status === 'ACTIVE' ? (
        <div className="af-table__actions">
          <Button variant="ghost" onClick={() => openRenew(r)}>Renovar</Button>
          <Button variant="ghost" onClick={() => onCancel(r)}>Cancelar</Button>
        </div>
      ) : null
    ) },
  ];

  return (
    <div>
      <h1 className="af-page__title">Contratos</h1>
      <p className="af-page__subtitle">Gestión de contratos de alquiler</p>

      <div className="af-toolbar">
        <div className="af-toolbar__filters">
          <select className="af-select" value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}>
            <option value="">Todos los estados</option>
            <option value="ACTIVE">Vigente</option>
            <option value="RENEWED">Renovado</option>
            <option value="CANCELLED">Cancelado</option>
            <option value="EXPIRED">Vencido</option>
          </select>
        </div>
        <Button onClick={openCreate}>+ Nuevo contrato</Button>
      </div>

      {loading ? <Spinner /> : (
        <>
          <Table columns={columns} rows={items} empty="No hay contratos registrados" />
          <Pagination meta={meta} onPage={setPage} />
        </>
      )}

      <Modal open={createOpen} title="Nuevo contrato" onClose={() => setCreateOpen(false)}
        footer={<>
          <Button variant="ghost" onClick={() => setCreateOpen(false)}>Cancelar</Button>
          <Button onClick={onCreate} disabled={saving}>{saving ? 'Guardando...' : 'Crear contrato'}</Button>
        </>}>
        {formError && <div className="af-alert af-alert--error">{formError}</div>}
        <Select id="tenantId" label="Arrendatario" value={form.tenantId} placeholder="Selecciona..."
          options={tenants.map((t) => ({ value: t.id, label: `${t.fullName} (${t.dni})` }))}
          onChange={(e) => setForm({ ...form, tenantId: e.target.value })} />
        <Select id="propertyId" label="Propiedad (disponibles)" value={form.propertyId} placeholder="Selecciona..."
          options={properties.map((p) => ({ value: p.id, label: p.address }))}
          onChange={(e) => setForm({ ...form, propertyId: e.target.value })} />
        <Input id="startDate" label="Fecha de inicio" type="date" value={form.startDate}
          onChange={(e) => setForm({ ...form, startDate: e.target.value })} />
        <Input id="endDate" label="Fecha de vencimiento" type="date" value={form.endDate}
          onChange={(e) => setForm({ ...form, endDate: e.target.value })} />
        <Input id="rent" label="Alquiler mensual (S/)" type="number" min="0" step="0.01" value={form.rent}
          onChange={(e) => setForm({ ...form, rent: e.target.value })} />
        <Input id="deposit" label="Depósito (S/)" type="number" min="0" step="0.01" value={form.deposit}
          onChange={(e) => setForm({ ...form, deposit: e.target.value })} />
        <Input id="dueDayOffset" label="Días para el vencimiento del pago" type="number" min="0" max="28"
          value={form.dueDayOffset} onChange={(e) => setForm({ ...form, dueDayOffset: e.target.value })} />
      </Modal>

      <Modal open={renewOpen} title={`Renovar contrato #${renewTarget?.id || ''}`} onClose={() => setRenewOpen(false)}
        footer={<>
          <Button variant="ghost" onClick={() => setRenewOpen(false)}>Cancelar</Button>
          <Button onClick={onRenew} disabled={saving}>{saving ? 'Guardando...' : 'Renovar'}</Button>
        </>}>
        {formError && <div className="af-alert af-alert--error">{formError}</div>}
        <p style={{ color: 'var(--color-text-muted)', fontSize: 'var(--fs-sm)' }}>
          Se copian alquiler, depósito y condiciones del contrato anterior si no los modificas.
        </p>
        <Input id="rStart" label="Nueva fecha de inicio" type="date" value={renewForm.startDate}
          onChange={(e) => setRenewForm({ ...renewForm, startDate: e.target.value })} />
        <Input id="rEnd" label="Nueva fecha de vencimiento" type="date" value={renewForm.endDate}
          onChange={(e) => setRenewForm({ ...renewForm, endDate: e.target.value })} />
        <Input id="rRent" label="Nuevo alquiler (opcional)" type="number" min="0" step="0.01" value={renewForm.rent}
          onChange={(e) => setRenewForm({ ...renewForm, rent: e.target.value })} />
      </Modal>
    </div>
  );
}
