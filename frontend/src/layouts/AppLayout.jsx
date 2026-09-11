import { useState } from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import Sidebar from './Sidebar';
import Header from './Header';
import './layout.css';

export default function AppLayout() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);

  if (user?.mustChangePassword) return <Navigate to="/change-password" replace />;

  return (
    <div className="af-layout">
      <div className={`af-overlay ${open ? 'is-open' : ''}`} onClick={() => setOpen(false)} />
      <Sidebar role={user.role} open={open} onNavigate={() => setOpen(false)} />
      <div className="af-main">
        <Header onToggleSidebar={() => setOpen((v) => !v)} />
        <main className="af-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
