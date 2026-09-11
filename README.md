# ArriendoFácil

Sistema web privado para la gestión de propiedades en alquiler: arrendatarios, contratos, pagos, comprobantes, documentos, servicios, incidencias, notificaciones y auditoría. Cuenta con **un único arrendador/administrador** y **múltiples arrendatarios**, cada uno con acceso restringido a su propia información.

## Tecnologías

**Frontend:** React + Vite + JavaScript + CSS puro (sin librerías de UI) · React Router · Axios
**Backend:** Node.js + Express · Prisma ORM · JWT · Zod · Multer · node-cron · bcryptjs
**Base de datos:** MySQL
**Zona horaria:** America/Lima

## Arquitectura

Arquitectura de tres capas con comunicación por API REST:

- **Presentación (frontend):** interfaz, formularios, validaciones de UX, consumo de la API y manejo de sesión.
- **Lógica de negocio (backend):** autenticación, autorización, reglas de negocio, archivos, notificaciones, auditoría y tareas programadas. Organizado en capas: rutas → controladores → servicios → Prisma.
- **Datos:** Prisma + MySQL (persistencia, relaciones, integridad, migraciones).

## Requisitos previos

- Node.js 18 o superior
- MySQL 8 (o compatible) en ejecución

## Instalación y configuración

### 1. Base de datos (MySQL)

Crea la base de datos (o deja que Prisma la cree en el paso de migración):

```sql
CREATE DATABASE arriendofacil CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 2. Backend

```bash
cd backend
npm install
cp .env.example .env      # en Windows: copy .env.example .env
```

Edita `backend/.env` con tus datos reales (ver "Variables de entorno"). Luego:

```bash
npx prisma migrate dev --name init
npm run seed
npm run dev        # http://localhost:3000
```

### 3. Frontend

```bash
cd frontend
npm install
cp .env.example .env      # en Windows: copy .env.example .env
npm run dev        # http://localhost:5173
```

Abre `http://localhost:5173` e inicia sesión con las credenciales del administrador definidas en `backend/.env`.

## Variables de entorno

### backend/.env

| Variable | Descripción |
|---|---|
| `NODE_ENV` | `development` o `production` |
| `PORT` | Puerto del backend (por defecto 3000) |
| `DATABASE_URL` | `mysql://usuario:clave@localhost:3306/arriendofacil` |
| `JWT_ACCESS_SECRET` | Secreto para el access token (largo y aleatorio) |
| `JWT_REFRESH_SECRET` | Secreto para el refresh token (distinto del anterior) |
| `SMTP_HOST` / `SMTP_PORT` / `SMTP_USER` / `SMTP_PASSWORD` | Config. SMTP (opcional; preparado para fase posterior) |
| `FRONTEND_URL` | Origen del frontend para CORS (`http://localhost:5173`) |
| `BACKEND_URL` | URL pública del backend |
| `TZ` | Zona horaria (`America/Lima`) |
| `SEED_LANDLORD_EMAIL` / `SEED_LANDLORD_PASSWORD` / `SEED_LANDLORD_NAME` | Datos del arrendador que crea el seed |

### frontend/.env

| Variable | Descripción |
|---|---|
| `VITE_API_URL` | URL base de la API (`http://localhost:3000/api`) |

## Prisma, migraciones y seed

```bash
cd backend
npx prisma migrate dev --name <nombre>   # crea/aplica una migración
npx prisma generate                      # regenera el cliente Prisma
npm run seed                             # crea el arrendador (idempotente)
npx prisma studio                        # explorador visual de la base de datos
```

## Autenticación

- JWT con access token (1 h) en el cuerpo y refresh token (7 d) en cookie httpOnly/secure/sameSite.
- Renovación transparente del access token vía `POST /api/auth/refresh`.
- Contraseñas hasheadas con bcrypt.
- Contraseña temporal del arrendatario válida 72 h, con cambio obligatorio en el primer acceso.
- Recuperación de contraseña con token de 1 h y respuesta genérica (anti-enumeración).

## Roles

- **Arrendador (LANDLORD):** único administrador. Gestiona todo y consulta la auditoría.
- **Arrendatario (TENANT):** consulta solo su información, sube comprobantes, registra incidencias y cambia su contraseña.

La autorización se impone siempre en el backend (middlewares `authenticate` y `authorize`), verificando además la propiedad del recurso.

## Manejo de archivos

- Almacenamiento local en `backend/storage/uploads/`, fuera de carpetas públicas.
- Descarga mediante endpoints protegidos que verifican sesión, rol y relación con el archivo.
- Validación de tipo MIME y tamaño: documentos/comprobantes PDF/JPG/PNG ≤ 5 MB; imágenes de incidencias JPG/PNG ≤ 3 MB (máx. 3).
- Eliminación de documentos lógica (se conserva para auditoría).

## Automatizaciones (cron)

Tareas programadas (node-cron, zona America/Lima): generación diaria de pagos, marcado de vencidos, recordatorios a 3 días y alertas de contratos por vencer. También ejecutables manualmente vía `POST /api/jobs/...` (rol arrendador).

## Reglas de negocio clave

- Solo un contrato vigente por propiedad (transacción + restricción única en la base de datos).
- Ciclos de pago desde la fecha de inicio del contrato, sin prorrateo; vencimiento configurable (`dueDayOffset`).
- El arrendatario no aprueba pagos: solo el arrendador valida comprobantes.
- Arrendatarios con desactivación lógica (se conserva el historial).
- La renovación crea un nuevo contrato enlazado al anterior (que pasa a `RENEWED`).

## API REST (resumen)

Base: `/api` · Respuestas con formato `{ success, message, data | errors }`.

| Recurso | Endpoints principales |
|---|---|
| Auth | `POST /auth/login`, `/refresh`, `/logout`, `/change-password`, `/forgot-password`, `/reset-password`, `GET /auth/me` |
| Arrendatarios | `GET/POST /tenants`, `GET/PUT /tenants/:id`, `PATCH /tenants/:id/deactivate` |
| Propiedades | `GET/POST /properties`, `GET/PUT /properties/:id`, `PATCH /properties/:id/status` |
| Contratos | `GET/POST /contracts`, `GET /contracts/:id`, `POST /contracts/:id/renew`, `PATCH /contracts/:id/cancel` |
| Pagos | `GET /payments`, `GET /payments/:id`, `POST /payments/:id/receipt`, `/approve`, `/reject` |
| Documentos | `GET/POST /documents`, `GET /documents/:id/download`, `DELETE /documents/:id` |
| Incidencias | `GET/POST /incidents`, `GET /incidents/:id`, `POST /incidents/:id/responses`, `PATCH /incidents/:id/status` |
| Servicios | `GET/POST /services`, `GET/PUT /services/:id` |
| Notificaciones | `GET /notifications`, `/unread-count`, `PATCH /:id/read`, `/read-all` |
| Auditoría | `GET /audit` (solo arrendador) |
| Dashboard | `GET /dashboard/landlord`, `/dashboard/tenant` |
| Jobs | `POST /jobs/generate-payments`, `/mark-overdue`, `/payment-reminders`, `/contract-alerts` |

## Credenciales iniciales de desarrollo

El arrendador se crea con `SEED_LANDLORD_EMAIL` y `SEED_LANDLORD_PASSWORD` de tu `.env`. Los arrendatarios se crean desde el panel del arrendador; su contraseña temporal se muestra en la consola del backend (correo simulado) mientras SMTP no esté configurado.

## Estructura del proyecto

```text
ArriendoFacil/
├── backend/    # API Node.js + Express + Prisma
│   ├── prisma/          # schema.prisma + seed.js
│   ├── src/
│   │   ├── config/ middlewares/ modules/ jobs/ utils/
│   │   ├── app.js  server.js  routes/
│   └── storage/uploads/ # archivos privados
├── frontend/   # React + Vite
│   └── src/  (api/ auth/ components/ layouts/ pages/ styles/)
├── README.md
└── .gitignore
```

## Metodología

Proyecto desarrollado con Scrum (5 sprints), gestión en Jira y control de versiones en Git/GitHub.
