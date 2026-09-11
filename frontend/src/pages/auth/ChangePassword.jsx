import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import { authApi } from '../../api/auth';
import Card from '../../components/Card';
import Logo from '../../components/Logo';
import Input from '../../components/Input';
import Button from '../../components/Button';
import './auth.css';

export default function ChangePassword() {
  const { user, setUser } = useAuth();
  const navigate = useNavigate();
  const [current, setCurrent] = useState('');
  const [pwd, setPwd] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const forced = user?.mustChangePassword;

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (pwd.length < 8) return setError('La nueva contraseña debe tener al menos 8 caracteres');
    if (pwd !== confirm) return setError('Las contraseñas no coinciden');
    setSubmitting(true);
    try {
      await authApi.changePassword(current, pwd);
      const me = await authApi.me();
      setUser(me.data.data.user);
      navigate('/', { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || 'No se pudo cambiar la contraseña');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="af-auth">
      <Card className="af-auth__card">
        <div className="af-auth__head">
          <Logo />
          <h1 className="af-auth__title">Cambiar contraseña</h1>
          <p className="af-auth__subtitle">
            {forced
              ? 'Debes cambiar tu contraseña temporal para continuar'
              : 'Actualiza tu contraseña'}
          </p>
        </div>

        {error && <div className="af-alert af-alert--error">{error}</div>}

        <form onSubmit={onSubmit}>
          <Input id="current" label={forced ? 'Contraseña temporal' : 'Contraseña actual'}
            type="password" value={current} onChange={(e) => setCurrent(e.target.value)} required />
          <Input id="pwd" label="Nueva contraseña" type="password" value={pwd}
            onChange={(e) => setPwd(e.target.value)} required />
          <Input id="confirm" label="Confirmar nueva contraseña" type="password" value={confirm}
            onChange={(e) => setConfirm(e.target.value)} required />
          <Button type="submit" full disabled={submitting}>
            {submitting ? 'Guardando...' : 'Cambiar contraseña'}
          </Button>
        </form>
      </Card>
    </div>
  );
}
