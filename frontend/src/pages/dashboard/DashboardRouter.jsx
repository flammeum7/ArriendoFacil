import { useAuth } from '../../auth/AuthContext';
import { ROLES } from '../../constants';
import LandlordDashboard from './LandlordDashboard';
import TenantDashboard from './TenantDashboard';

export default function DashboardRouter() {
  const { user } = useAuth();
  return user.role === ROLES.LANDLORD ? <LandlordDashboard /> : <TenantDashboard />;
}
