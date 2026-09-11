import { useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { authApi } from '../../api/auth';
import Card from '../../components/Card';
import Logo from '../../components/Logo';
import Input from '../../components/Input';
import Button from '../../components/Button';
import './auth.css';

export default function ResetPassword() {
  const [params] = useSearchParams();
  const token = params.get('token') || '';
  const navigate = useNavigate();
  const [pwd, setPwd] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (pwd.length < 8) return setError('La contraseña debe tener al menos 8 caracteres');
    if (pwd !== confirm) return setError('Las contraseñas no coinciden');
    setSubmitting(true);
    try {
      await authApi.resetPassword(token, pwd);
      navigate('/login', { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || 'No se pudo restablecer la contraseña');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="af-auth">
      <Card className="af-auth__card">
        <div className="af-auth__head">
          <Logo />
          <h1 className="af-auth__title">Nueva contraseña</h1>
          <p className="af-auth__subtitle">Ingresa tu nueva contraseña</p>
        </div>

        {!token && <div className="af-alert af-alert--error">Enlace inválido o incompleto.</div>}
        {error && <div className="af-alert af-alert--error">{error}</div>}

        <form onSubmit={onSubmit}>
          <Input id="pwd" label="Nueva contraseña" type="password" value={pwd}
            onChange={(e) => setPwd(e.target.value)} required />
          <Input id="confirm" label="Confirmar contraseña" type="password" value={confirm}
            onChange={(e) => setConfirm(e.target.value)} required />
          <Button type="submit" full disabled={submitting || !token}>
            {submitting ? 'Guardando...' : 'Restablecer contraseña'}
          </Button>
        </form>

        <div className="af-auth__foot">
          <Link to="/login">Volver a iniciar sesión</Link>
        </div>
      </Card>
    </div>
  );
}
