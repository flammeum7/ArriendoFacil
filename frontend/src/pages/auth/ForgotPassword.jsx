import { useState } from 'react';
import { Link } from 'react-router-dom';
import { authApi } from '../../api/auth';
import Card from '../../components/Card';
import Logo from '../../components/Logo';
import Input from '../../components/Input';
import Button from '../../components/Button';
import './auth.css';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [done, setDone] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await authApi.forgotPassword(email);
    } catch (err) {
      /* respuesta genérica igualmente (anti-enumeración) */
    } finally {
      setSubmitting(false);
      setDone(true);
    }
  };

  return (
    <div className="af-auth">
      <Card className="af-auth__card">
        <div className="af-auth__head">
          <Logo />
          <h1 className="af-auth__title">Recuperar contraseña</h1>
          <p className="af-auth__subtitle">Te enviaremos un enlace de recuperación</p>
        </div>

        {done ? (
          <div className="af-alert af-alert--success">
            Si el correo está registrado, recibirás instrucciones para restablecer tu contraseña.
          </div>
        ) : (
          <form onSubmit={onSubmit}>
            <Input id="email" label="Correo electrónico" type="email" value={email}
              onChange={(e) => setEmail(e.target.value)} required />
            <Button type="submit" full disabled={submitting}>
              {submitting ? 'Enviando...' : 'Enviar enlace'}
            </Button>
          </form>
        )}

        <div className="af-auth__foot">
          <Link to="/login">Volver a iniciar sesión</Link>
        </div>
      </Card>
    </div>
  );
}
