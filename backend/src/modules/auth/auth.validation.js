const { z } = require('zod');

const login = z.object({
  body: z.object({
    email: z.string().email('Email inválido'),
    password: z.string().min(1, 'La contraseña es obligatoria'),
  }),
});

const changePassword = z.object({
  body: z.object({
    currentPassword: z.string().min(1, 'La contraseña actual es obligatoria'),
    newPassword: z
      .string()
      .min(8, 'La nueva contraseña debe tener al menos 8 caracteres'),
  }),
});

const forgotPassword = z.object({
  body: z.object({
    email: z.string().email('Email inválido'),
  }),
});

const resetPassword = z.object({
  body: z.object({
    token: z.string().min(1, 'Token requerido'),
    newPassword: z
      .string()
      .min(8, 'La nueva contraseña debe tener al menos 8 caracteres'),
  }),
});

module.exports = { login, changePassword, forgotPassword, resetPassword };
