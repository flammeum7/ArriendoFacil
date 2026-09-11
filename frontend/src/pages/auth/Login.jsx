import { useState } from 'react';
import { useNavigate, useLocation, Link, Navigate } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import Card from '../../components/Card';
import Logo from '../../components/Logo';
import Input from '../../components/Input';
import Button from '../../components/Button';
import './auth.css';

export default function Login() {
  const { user, loading, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!loading && user) return <Navigate to="/" replace />;

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const loggedUser = await login(email, password);
      if (loggedUser.mustChangePassword) {
        navigate('/change-password', { replace: true });
      } else {
        navigate(location.state?.from?.pathname || '/', { replace: true });
      }
    } catch (err) {
      setError(err.response?.data?.message || 'No se pudo iniciar sesión');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="af-auth">
      <Card className="af-auth__card">
        <div className="af-auth__head">
          <Logo />
          <h1 className="af-auth__title">Iniciar sesión</h1>
          <p className="af-auth__subtitle">Sistema de gestión de alquileres</p>
        </div>

        {error && <div className="af-alert af-alert--error">{error}</div>}

        <form onSubmit={onSubmit}>
          <Input
            id="email" label="Correo electrónico" type="email" value={email}
            onChange={(e) => setEmail(e.target.value)} placeholder="tucorreo@ejemplo.com"
            required autoComplete="username"
          />
          <Input
            id="password" label="Contraseña" type="password" value={password}
            onChange={(e) => setPassword(e.target.value)} placeholder="••••••••"
            required autoComplete="current-password"
          />
          <Button type="submit" full disabled={submitting}>
            {submitting ? 'Ingresando...' : 'Ingresar'}
          </Button>
        </form>

        <div className="af-auth__foot">
          <Link to="/forgot-password">¿Olvidaste tu contraseña?</Link>
        </div>
      </Card>
    </div>
  );
}
