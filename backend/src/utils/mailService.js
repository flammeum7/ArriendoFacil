const env = require('../config/env');

async function sendMail({ to, subject, text }) {
  const smtpReady = env.smtp.host && env.smtp.user && env.smtp.password;

  if (!smtpReady) {
    console.log('----- [MAIL SIMULADO] -----');
    console.log(`Para: ${to}`);
    console.log(`Asunto: ${subject}`);
    console.log(text);
    console.log('---------------------------');
    return { simulated: true };
  }

  // TODO (fase posterior): integrar nodemailer usando env.smtp
  console.log(`[MAIL] (SMTP configurado) Enviar a ${to}: ${subject}`);
  return { simulated: false };
}

async function sendTempPasswordEmail(to, tempPassword) {
  return sendMail({
    to,
    subject: 'ArriendoFácil - Tu acceso temporal',
    text:
      'Se ha creado tu cuenta en ArriendoFácil.\n\n' +
      `Contraseña temporal: ${tempPassword}\n` +
      'Válida por 72 horas. Deberás cambiarla en tu primer inicio de sesión.',
  });
}

async function sendPasswordResetEmail(to, resetToken) {
  const link = `${env.frontendUrl}/reset-password?token=${resetToken}`;
  return sendMail({
    to,
    subject: 'ArriendoFácil - Recuperación de contraseña',
    text:
      'Recibimos una solicitud para restablecer tu contraseña.\n\n' +
      `Enlace (válido por 1 hora): ${link}\n\n` +
      'Si no solicitaste esto, ignora este mensaje.',
  });
}

module.exports = { sendMail, sendTempPasswordEmail, sendPasswordResetEmail };
