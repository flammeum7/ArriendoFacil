import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { ROLES } from '../constants';
import { notificationsApi } from '../api/notifications';

export default function Header({ onToggleSidebar }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const { data } = await notificationsApi.unreadCount();
        if (active) setUnread(data.data.unread);
      } catch (e) { /* ignorar */ }
    };
    load();
    const timer = setInterval(load, 30000);
    return () => { active = false; clearInterval(timer); };
  }, []);

  const initials = (user?.fullName || user?.email || '?').trim().charAt(0).toUpperCase();

  const onLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  return (
    <header className="af-header">
      <button className="af-hamburger" onClick={onToggleSidebar} aria-label="Menú">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <path d="M3 12h18M3 6h18M3 18h18" />
        </svg>
      </button>

      <div className="af-header__right">
        <button className="af-bell" onClick={() => navigate('/notifications')} aria-label="Notificaciones">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
          </svg>
          {unread > 0 && <span className="af-bell__badge">{unread > 99 ? '99+' : unread}</span>}
        </button>

        <div className="af-user">
          <div className="af-user__meta">
            <div className="af-user__name">{user?.fullName || user?.email}</div>
            <div className="af-user__role">{user?.role === ROLES.LANDLORD ? 'Arrendador' : 'Arrendatario'}</div>
          </div>
          <div className="af-avatar">{initials}</div>
        </div>

        <button className="af-btn af-btn--ghost" onClick={onLogout}>Salir</button>
      </div>
    </header>
  );
}
