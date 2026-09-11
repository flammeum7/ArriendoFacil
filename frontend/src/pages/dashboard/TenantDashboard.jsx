import { useEffect, useState } from 'react';
import { dashboardApi } from '../../api/dashboard';
import StatCard from '../../components/StatCard';
import Card from '../../components/Card';
import Spinner from '../../components/Spinner';

export default function TenantDashboard() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    dashboardApi
      .tenant()
      .then((res) => setData(res.data.data))
      .catch(() => setError('No se pudo cargar el resumen'));
  }, []);

  if (error) return <div className="af-alert af-alert--error">{error}</div>;
  if (!data) return <Spinner />;

  const money = (n) =>
    `S/ ${Number(n).toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const date = (d) => (d ? new Date(d).toLocaleDateString('es-PE') : '—');

  return (
    <div>
      <h1 className="af-page__title">Resumen</h1>
      <p className="af-page__subtitle">Tu información de arrendamiento</p>

      <div className="af-stats" style={{ marginBottom: 'var(--sp-5)' }}>
        <StatCard label="Pagos registrados" value={data.paymentsCount} />
        <StatCard label="Documentos" value={data.documentsCount} />
        <StatCard label="Incidencias" value={data.incidentsCount} />
        <StatCard label="Notificaciones sin leer" value={data.unreadNotifications} accent="var(--color-info)" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 'var(--sp-4)' }}>
        <Card>
          <h3>Mi propiedad y contrato</h3>
          {data.assignedProperty ? (
            <>
              <p style={{ color: 'var(--color-text-muted)' }}>{data.assignedProperty.address}</p>
              {data.contract && (
                <p style={{ fontSize: 'var(--fs-sm)' }}>
                  Vigencia: {date(data.contract.startDate)} — {date(data.contract.endDate)}
                  <br />
                  Alquiler: {money(data.contract.rent)}
                </p>
              )}
            </>
          ) : (
            <p style={{ color: 'var(--color-text-faint)' }}>Sin propiedad asignada actualmente.</p>
          )}
        </Card>

        <Card>
          <h3>Próximo pago</h3>
          {data.nextPayment ? (
            <p style={{ fontSize: 'var(--fs-sm)' }}>
              Monto: {money(data.nextPayment.amount)}
              <br />
              Vence: {date(data.nextPayment.dueDate)}
              <br />
              Estado: {data.nextPayment.status}
            </p>
          ) : (
            <p style={{ color: 'var(--color-text-faint)' }}>No tienes pagos pendientes.</p>
          )}
        </Card>
      </div>
    </div>
  );
}
