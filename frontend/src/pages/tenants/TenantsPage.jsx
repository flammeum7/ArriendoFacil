import { useEffect, useState, useCallback } from 'react';
import { tenantsApi } from '../../api/tenants';
import Table from '../../components/Table';
import Badge from '../../components/Badge';
import Button from '../../components/Button';
import Modal from '../../components/Modal';
import Input from '../../components/Input';
import Pagination from '../../components/Pagination';
import Spinner from '../../components/Spinner';

const emptyForm = { fullName: '', dni: '', email: '', phone: '' };

export default function TenantsPage() {
  const [items, setItems] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await tenantsApi.list({ search, page, limit: 10 });
      setItems(data.data.items);
      setMeta(data.data.meta);
    } catch (e) { /* noop */ } finally { setLoading(false); }
  }, [search, page]);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => { setEditing(null); setForm(emptyForm); setFormError(''); setModalOpen(true); };
  const openEdit = (t) => {
    setEditing(t);
    setForm({ fullName: t.fullName, dni: t.dni, email: t.email, phone: t.phone || '' });
    setFormError(''); setModalOpen(true);
  };

  const onSave = async () => {
    setFormError(''); setSaving(true);
    try {
      if (editing) await tenantsApi.update(editing.id, form);
      else await tenantsApi.create(form);
      setModalOpen(false);
      load();
    } catch (err) {
      setFormError(err.response?.data?.message || 'No se pudo guardar');
    } finally { setSaving(false); }
  };

  const onDeactivate = async (t) => {
    if (!window.confirm(`¿Desactivar a ${t.fullName}?`)) return;
    try { await tenantsApi.deactivate(t.id); load(); }
    catch (err) { window.alert(err.response?.data?.message || 'No se pudo desactivar'); }
  };

  const columns = [
    { key: 'fullName', header: 'Nombre' },
    { key: 'dni', header: 'DNI' },
    { key: 'email', header: 'Correo' },
    { key: 'phone', header: 'Teléfono', render: (r) => r.phone || '—' },
    { key: 'assignedProperty', header: 'Propiedad', render: (r) => (r.assignedProperty ? r.assignedProperty.address : '—') },
    { key: 'active', header: 'Estado', render: (r) => (r.active ? <Badge tone="green">Activo</Badge> : <Badge tone="gray">Inactivo</Badge>) },
    { key: 'actions', header: '', render: (r) => (
      <div className="af-table__actions">
        <Button variant="ghost" onClick={() => openEdit(r)}>Editar</Button>
        {r.active && <Button variant="ghost" onClick={() => onDeactivate(r)}>Desactivar</Button>}
      </div>
    ) },
  ];

  return (
    <div>
      <h1 className="af-page__title">Arrendatarios</h1>
      <p className="af-page__subtitle">Gestión de arrendatarios</p>

      <div className="af-toolbar">
        <form className="af-toolbar__filters" onSubmit={(e) => { e.preventDefault(); setPage(1); load(); }}>
          <input className="af-input" placeholder="Buscar por nombre, DNI o correo"
            value={search} onChange={(e) => setSearch(e.target.value)} style={{ minWidth: 260 }} />
          <Button variant="ghost" type="submit">Buscar</Button>
        </form>
        <Button onClick={openCreate}>+ Nuevo arrendatario</Button>
      </div>

      {loading ? <Spinner /> : (
        <>
          <Table columns={columns} rows={items} empty="No hay arrendatarios registrados" />
          <Pagination meta={meta} onPage={setPage} />
        </>
      )}

      <Modal
        open={modalOpen}
        title={editing ? 'Editar arrendatario' : 'Nuevo arrendatario'}
        onClose={() => setModalOpen(false)}
        footer={
          <>
            <Button variant="ghost" onClick={() => setModalOpen(false)}>Cancelar</Button>
            <Button onClick={onSave} disabled={saving}>{saving ? 'Guardando...' : 'Guardar'}</Button>
          </>
        }
      >
        {formError && <div className="af-alert af-alert--error">{formError}</div>}
        <Input id="fullName" label="Nombre completo" value={form.fullName}
          onChange={(e) => setForm({ ...form, fullName: e.target.value })} />
        <Input id="dni" label="DNI (8 dígitos)" value={form.dni} maxLength={8}
          onChange={(e) => setForm({ ...form, dni: e.target.value })} />
        <Input id="email" label="Correo electrónico" type="email" value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })} />
        <Input id="phone" label="Teléfono" value={form.phone}
          onChange={(e) => setForm({ ...form, phone: e.target.value })} />
        {!editing && (
          <p style={{ color: 'var(--color-text-faint)', fontSize: 'var(--fs-xs)' }}>
            Se generará una contraseña temporal (válida 72 h) y se enviará al correo del arrendatario.
          </p>
        )}
      </Modal>
    </div>
  );
}
