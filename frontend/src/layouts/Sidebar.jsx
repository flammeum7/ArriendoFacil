import { NavLink } from 'react-router-dom';
import { ROLES } from '../constants';
import Logo from '../components/Logo';

const LANDLORD_NAV = [
  { to: '/', label: 'Resumen', end: true },
  { to: '/tenants', label: 'Arrendatarios' },
  { to: '/properties', label: 'Propiedades' },
  { to: '/contracts', label: 'Contratos' },
  { to: '/payments', label: 'Pagos' },
  { to: '/documents', label: 'Documentos' },
  { to: '/services', label: 'Servicios' },
  { to: '/incidents', label: 'Incidencias' },
  { to: '/notifications', label: 'Notificaciones' },
  { to: '/audit', label: 'Auditoría' },
];

const TENANT_NAV = [
  { to: '/', label: 'Resumen', end: true },
  { to: '/payments', label: 'Mis pagos' },
  { to: '/documents', label: 'Mis documentos' },
  { to: '/services', label: 'Mis servicios' },
  { to: '/incidents', label: 'Incidencias' },
  { to: '/notifications', label: 'Notificaciones' },
];

export default function Sidebar({ role, open, onNavigate }) {
  const items = role === ROLES.LANDLORD ? LANDLORD_NAV : TENANT_NAV;
  return (
    <aside className={`af-sidebar ${open ? 'is-open' : ''}`}>
      <div className="af-sidebar__brand"><Logo /></div>
      <nav className="af-nav">
        {items.map((it) => (
          <NavLink
            key={it.to}
            to={it.to}
            end={it.end}
            onClick={onNavigate}
            className={({ isActive }) => `af-nav__item ${isActive ? 'is-active' : ''}`}
          >
            {it.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
