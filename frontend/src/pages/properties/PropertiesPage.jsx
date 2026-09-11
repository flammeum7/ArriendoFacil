import { useEffect, useState, useCallback } from 'react';
import { propertiesApi } from '../../api/properties';
import Table from '../../components/Table';
import Badge from '../../components/Badge';
import Button from '../../components/Button';
import Modal from '../../components/Modal';
import Input from '../../components/Input';
import Select from '../../components/Select';
import Pagination from '../../components/Pagination';
import Spinner from '../../components/Spinner';

const TYPE_OPTIONS = [
  { value: 'APARTMENT', label: 'Departamento' },
  { value: 'HOUSE', label: 'Casa' },
  { value: 'ROOM', label: 'Habitación' },
  { value: 'COMMERCIAL', label: 'Local comercial' },
];
const TYPE_LABEL = Object.fromEntries(TYPE_OPTIONS.map((o) => [o.value, o.label]));

const STATUS_OPTIONS = [
  { value: 'AVAILABLE', label: 'Disponible' },
  { value: 'OCCUPIED', label: 'Ocupada' },
  { value: 'MAINTENANCE', label: 'En mantenimiento' },
];
const STATUS_LABEL = Object.fromEntries(STATUS_OPTIONS.map((o) => [o.value, o.label]));
const STATUS_TONE = { AVAILABLE: 'green', OCCUPIED: 'blue', MAINTENANCE: 'amber' };

const emptyForm = { address: '', type: 'APARTMENT', unitNumber: '', description: '', rooms: 1, referenceRent: '' };

export default function PropertiesPage() {
  const [items, setItems] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 10 };
      if (statusFilter) params.status = statusFilter;
      const { data } = await propertiesApi.list(params);
      setItems(data.data.items);
      setMeta(data.data.meta);
    } catch (e) { /* noop */ } finally { setLoading(false); }
  }, [statusFilter, page]);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => { setEditing(null); setForm(emptyForm); setFormError(''); setModalOpen(true); };
  const openEdit = (p) => {
    setEditing(p);
    setForm({
      address: p.address, type: p.type, unitNumber: p.unitNumber || '',
      description: p.description || '', rooms: p.rooms, referenceRent: p.referenceRent,
    });
    setFormError(''); setModalOpen(true);
  };

  const onSave = async () => {
    setFormError(''); setSaving(true);
    try {
      const payload = {
        address: form.address, type: form.type,
        unitNumber: form.unitNumber || undefined,
        description: form.description || undefined,
        rooms: Number(form.rooms), referenceRent: Number(form.referenceRent),
      };
      if (editing) await propertiesApi.update(editing.id, payload);
      else await propertiesApi.create(payload);
      setModalOpen(false); load();
    } catch (err) {
      setFormError(err.response?.data?.message || 'No se pudo guardar');
    } finally { setSaving(false); }
  };

  const onChangeStatus = async (p, status) => {
    try { await propertiesApi.changeStatus(p.id, status); load(); }
    catch (err) { window.alert(err.response?.data?.message || 'No se pudo cambiar el estado'); }
  };

  const money = (n) => `S/ ${Number(n).toLocaleString('es-PE', { minimumFractionDigits: 2 })}`;

  const columns = [
    { key: 'address', header: 'Dirección' },
    { key: 'type', header: 'Tipo', render: (r) => TYPE_LABEL[r.type] },
    { key: 'rooms', header: 'Hab.' },
    { key: 'referenceRent', header: 'Alquiler ref.', render: (r) => money(r.referenceRent) },
    { key: 'status', header: 'Estado', render: (r) => <Badge tone={STATUS_TONE[r.status]}>{STATUS_LABEL[r.status]}</Badge> },
    { key: 'actions', header: '', render: (r) => (
      <div className="af-table__actions">
        <Button variant="ghost" onClick={() => openEdit(r)}>Editar</Button>
        {r.status === 'AVAILABLE' && (
          <Button variant="ghost" onClick={() => onChangeStatus(r, 'MAINTENANCE')}>Mantenimiento</Button>
        )}
        {r.status === 'MAINTENANCE' && (
          <Button variant="ghost" onClick={() => onChangeStatus(r, 'AVAILABLE')}>Marcar disponible</Button>
        )}
      </div>
    ) },
  ];

  return (
    <div>
      <h1 className="af-page__title">Propiedades</h1>
      <p className="af-page__subtitle">Gestión de propiedades en alquiler</p>

      <div className="af-toolbar">
        <div className="af-toolbar__filters">
          <select className="af-select" value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}>
            <option value="">Todos los estados</option>
            {STATUS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
        <Button onClick={openCreate}>+ Nueva propiedad</Button>
      </div>

      {loading ? <Spinner /> : (
        <>
          <Table columns={columns} rows={items} empty="No hay propiedades registradas" />
          <Pagination meta={meta} onPage={setPage} />
        </>
      )}

      <Modal open={modalOpen} title={editing ? 'Editar propiedad' : 'Nueva propiedad'}
        onClose={() => setModalOpen(false)}
        footer={<>
          <Button variant="ghost" onClick={() => setModalOpen(false)}>Cancelar</Button>
          <Button onClick={onSave} disabled={saving}>{saving ? 'Guardando...' : 'Guardar'}</Button>
        </>}>
        {formError && <div className="af-alert af-alert--error">{formError}</div>}
        <Input id="address" label="Dirección" value={form.address}
          onChange={(e) => setForm({ ...form, address: e.target.value })} />
        <Select id="type" label="Tipo" value={form.type} options={TYPE_OPTIONS}
          onChange={(e) => setForm({ ...form, type: e.target.value })} />
        <Input id="unitNumber" label="N° piso / departamento" value={form.unitNumber}
          onChange={(e) => setForm({ ...form, unitNumber: e.target.value })} />
        <Input id="rooms" label="Habitaciones" type="number" min="0" value={form.rooms}
          onChange={(e) => setForm({ ...form, rooms: e.target.value })} />
        <Input id="referenceRent" label="Alquiler de referencia (S/)" type="number" min="0" step="0.01"
          value={form.referenceRent} onChange={(e) => setForm({ ...form, referenceRent: e.target.value })} />
        <Input id="description" label="Descripción" value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })} />
      </Modal>
    </div>
  );
}
