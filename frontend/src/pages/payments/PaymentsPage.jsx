import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../../auth/AuthContext';
import { ROLES } from '../../constants';
import { paymentsApi } from '../../api/payments';
import { openProtectedFile } from '../../api/files';
import Table from '../../components/Table';
import Badge from '../../components/Badge';
import Button from '../../components/Button';
import Modal from '../../components/Modal';
import Select from '../../components/Select';
import Pagination from '../../components/Pagination';
import Spinner from '../../components/Spinner';

const TONE = { PENDING: 'amber', UNDER_REVIEW: 'blue', PAID: 'green', OVERDUE: 'red', REJECTED: 'red' };
const LABEL = { PENDING: 'Pendiente', UNDER_REVIEW: 'Por validar', PAID: 'Pagado', OVERDUE: 'Vencido', REJECTED: 'Rechazado' };
const METHOD_OPTIONS = [
  { value: 'BANK_TRANSFER', label: 'Transferencia' },
  { value: 'YAPE', label: 'Yape' },
  { value: 'PLIN', label: 'Plin' },
  { value: 'DEPOSIT', label: 'Depósito' },
  { value: 'CASH', label: 'Efectivo' },
];

export default function PaymentsPage() {
  const { user } = useAuth();
  const isLandlord = user.role === ROLES.LANDLORD;

  const [items, setItems] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [busy, setBusy] = useState(false);

  const [uploadTarget, setUploadTarget] = useState(null);
  const [file, setFile] = useState(null);
  const [method, setMethod] = useState('');
  const [rejectTarget, setRejectTarget] = useState(null);
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 10 };
      if (statusFilter) params.status = statusFilter;
      const { data } = await paymentsApi.list(params);
      setItems(data.data.items);
      setMeta(data.data.meta);
    } catch (e) { /* noop */ } finally { setLoading(false); }
  }, [statusFilter, page]);

  useEffect(() => { load(); }, [load]);

  const runGenerate = async () => { setBusy(true); try { await paymentsApi.generate(); load(); } finally { setBusy(false); } };
  const runOverdue = async () => { setBusy(true); try { await paymentsApi.markOverdue(); load(); } finally { setBusy(false); } };

  const doApprove = async (p) => {
    if (!window.confirm(`¿Aprobar el pago #${p.id}?`)) return;
    try { await paymentsApi.approve(p.id); load(); }
    catch (err) { window.alert(err.response?.data?.message || 'Error'); }
  };

  const submitReject = async () => {
    setError('');
    if (reason.trim().length < 3) { setError('Indica el motivo del rechazo'); return; }
    try { await paymentsApi.reject(rejectTarget.id, reason); setRejectTarget(null); setReason(''); load(); }
    catch (err) { setError(err.response?.data?.message || 'Error'); }
  };

  const submitUpload = async () => {
    setError('');
    if (!file) { setError('Selecciona un archivo'); return; }
    const fd = new FormData();
    fd.append('receipt', file);
    if (method) fd.append('method', method);
    try {
      await paymentsApi.uploadReceipt(uploadTarget.id, fd);
      setUploadTarget(null); setFile(null); setMethod(''); load();
    } catch (err) { setError(err.response?.data?.message || 'No se pudo subir'); }
  };

  const date = (d) => (d ? new Date(d).toLocaleDateString('es-PE') : '—');
  const money = (n) => `S/ ${Number(n).toLocaleString('es-PE', { minimumFractionDigits: 2 })}`;

  const columns = [
    { key: 'id', header: '#', render: (r) => `#${r.id}` },
    { key: 'period', header: 'Periodo', render: (r) => `${date(r.periodStart)} — ${date(r.periodEnd)}` },
    { key: 'amount', header: 'Monto', render: (r) => money(r.amount) },
    { key: 'dueDate', header: 'Vence', render: (r) => date(r.dueDate) },
    { key: 'status', header: 'Estado', render: (r) => <Badge tone={TONE[r.status]}>{LABEL[r.status]}</Badge> },
    { key: 'receipt', header: 'Comprobante', render: (r) => (
      r.documents && r.documents.length > 0
        ? <Button variant="ghost" onClick={() => openProtectedFile(`/documents/${r.documents[r.documents.length - 1].id}/download`)}>Ver</Button>
        : '—'
    ) },
    { key: 'actions', header: '', render: (r) => {
      if (isLandlord) {
        return r.status === 'UNDER_REVIEW' ? (
          <div className="af-table__actions">
            <Button variant="ghost" onClick={() => doApprove(r)}>Aprobar</Button>
            <Button variant="ghost" onClick={() => { setRejectTarget(r); setReason(''); setError(''); }}>Rechazar</Button>
          </div>
        ) : null;
      }
      return ['PENDING', 'OVERDUE', 'REJECTED'].includes(r.status) ? (
        <Button variant="ghost" onClick={() => { setUploadTarget(r); setFile(null); setMethod(''); setError(''); }}>Subir comprobante</Button>
      ) : null;
    } },
  ];

  return (
    <div>
      <h1 className="af-page__title">Pagos</h1>
      <p className="af-page__subtitle">{isLandlord ? 'Gestión de pagos y comprobantes' : 'Tus pagos de alquiler'}</p>

      <div className="af-toolbar">
        <div className="af-toolbar__filters">
          <select className="af-select" value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}>
            <option value="">Todos los estados</option>
            {Object.keys(LABEL).map((k) => <option key={k} value={k}>{LABEL[k]}</option>)}
          </select>
        </div>
        {isLandlord && (
          <div className="af-table__actions">
            <Button variant="ghost" onClick={runGenerate} disabled={busy}>Generar pagos</Button>
            <Button variant="ghost" onClick={runOverdue} disabled={busy}>Marcar vencidos</Button>
          </div>
        )}
      </div>

      {loading ? <Spinner /> : (
        <>
          <Table columns={columns} rows={items} empty="No hay pagos registrados" />
          <Pagination meta={meta} onPage={setPage} />
        </>
      )}

      <Modal open={!!uploadTarget} title={`Subir comprobante · Pago #${uploadTarget?.id || ''}`} onClose={() => setUploadTarget(null)}
        footer={<>
          <Button variant="ghost" onClick={() => setUploadTarget(null)}>Cancelar</Button>
          <Button onClick={submitUpload}>Subir</Button>
        </>}>
        {error && <div className="af-alert af-alert--error">{error}</div>}
        <div className="af-field">
          <label className="af-label">Archivo (PDF, JPG o PNG · máx 5 MB)</label>
          <input className="af-input" type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={(e) => setFile(e.target.files[0])} />
        </div>
        <Select label="Método de pago" value={method} placeholder="Selecciona (opcional)"
          options={METHOD_OPTIONS} onChange={(e) => setMethod(e.target.value)} />
      </Modal>

      <Modal open={!!rejectTarget} title={`Rechazar comprobante · Pago #${rejectTarget?.id || ''}`} onClose={() => setRejectTarget(null)}
        footer={<>
          <Button variant="ghost" onClick={() => setRejectTarget(null)}>Cancelar</Button>
          <Button variant="danger" onClick={submitReject}>Rechazar</Button>
        </>}>
        {error && <div className="af-alert af-alert--error">{error}</div>}
        <div className="af-field">
          <label className="af-label">Motivo del rechazo</label>
          <textarea className="af-input" rows={3} value={reason} onChange={(e) => setReason(e.target.value)} />
        </div>
      </Modal>
    </div>
  );
}
