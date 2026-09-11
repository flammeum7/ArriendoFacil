import { useEffect, useState } from 'react';
import { dashboardApi } from '../../api/dashboard';
import StatCard from '../../components/StatCard';
import Spinner from '../../components/Spinner';

export default function LandlordDashboard() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    dashboardApi
      .landlord()
      .then((res) => setData(res.data.data))
      .catch(() => setError('No se pudo cargar el resumen'));
  }, []);

  if (error) return <div className="af-alert af-alert--error">{error}</div>;
  if (!data) return <Spinner />;

  const money = (n) =>
    `S/ ${Number(n).toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return (
    <div>
      <h1 className="af-page__title">Resumen</h1>
      <p className="af-page__subtitle">Vista general del sistema</p>

      <div className="af-stats">
        <StatCard label="Arrendatarios" value={data.totalTenants} />
        <StatCard label="Propiedades" value={data.totalProperties} />
        <StatCard label="Recaudación del mes" value={money(data.monthlyRevenue)} accent="var(--color-success)" />
        <StatCard label="Pagos pendientes" value={data.pendingPayments} accent="var(--color-warning)" />
        <StatCard label="Pagos vencidos" value={data.overduePayments} accent="var(--color-danger)" />
        <StatCard label="Contratos por vencer" value={data.contractsExpiring} accent="var(--color-info)" />
        <StatCard label="Incidencias abiertas" value={data.openIncidents} />
      </div>
    </div>
  );
}
