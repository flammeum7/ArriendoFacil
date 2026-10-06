import http from 'k6/http';
import { check, sleep } from 'k6';
import exec from 'k6/execution';

const BASE = 'http://127.0.0.1:3001/api';
const ADMIN = { email: 'admin@arriendofacil.com', password: __ENV.ADMIN_PASS || 'Admin2026' };
const TENANT = { email: 'k6.pagos@test.com', password: 'Tenant2026' };
const TOTAL_PAGOS = 50;
const JSON_H = { 'Content-Type': 'application/json' };

// Comprobante PDF de prueba de 200 KB
function crearPdf(bytes) {
  const buf = new Uint8Array(bytes);
  const cabecera = '%PDF-1.4\n';
  for (let i = 0; i < cabecera.length; i++) buf[i] = cabecera.charCodeAt(i);
  return buf.buffer;
}
const COMPROBANTE = crearPdf(200 * 1024);

export const options = {
  setupTimeout: '60s',
  scenarios: {
    pagos: {
      executor: 'shared-iterations',
      vus: 10,
      iterations: TOTAL_PAGOS,
      maxDuration: '1m',
      exec: 'flujoPago',
    },
    servicios: {
      executor: 'shared-iterations',
      vus: 5,
      iterations: 50,
      maxDuration: '1m',
      exec: 'registrarServicio',
    },
    consulta: {
      executor: 'constant-vus',
      vus: 20,
      duration: '30s',
      exec: 'consultar',
    },
  },
  thresholds: {
    'http_req_duration{tipo:comprobante}': ['p(95)<1500'],
    'http_req_duration{tipo:aprobacion}': ['p(95)<500'],
    'http_req_duration{tipo:servicio}': ['p(95)<500'],
    'http_req_duration{tipo:listado}': ['p(95)<500'],
    http_req_failed: ['rate<0.01'],
  },
};

function iniciarSesion(cred) {
  const res = http.post(`${BASE}/auth/login`, JSON.stringify(cred), { headers: JSON_H });
  if (res.status !== 200) throw new Error(`No se pudo iniciar sesión con ${cred.email} (HTTP ${res.status})`);
  return { token: res.json('data.accessToken'), id: res.json('data.user.id') };
}

export function setup() {
  const admin = iniciarSesion(ADMIN);
  const tenant = iniciarSesion(TENANT);

  const res = http.get(`${BASE}/payments?limit=100`, {
    headers: { Authorization: `Bearer ${tenant.token}` },
  });
  const pagos = res.json('data.items')
    .filter((p) => ['PENDING', 'OVERDUE', 'REJECTED'].includes(p.status))
    .map((p) => p.id);

  if (pagos.length < TOTAL_PAGOS) {
    throw new Error(`Solo hay ${pagos.length} pagos disponibles. Ejecuta primero preparar-sprint4.js`);
  }
  return { adminToken: admin.token, tenantToken: tenant.token, tenantId: tenant.id, pagos };
}

// Escenario 1: arrendatario sube comprobante y arrendador lo aprueba
export function flujoPago(data) {
  const pagoId = data.pagos[exec.scenario.iterationInTest];

  const subida = http.post(
    `${BASE}/payments/${pagoId}/receipt`,
    { receipt: http.file(COMPROBANTE, 'comprobante-k6.pdf', 'application/pdf'), method: 'YAPE' },
    { headers: { Authorization: `Bearer ${data.tenantToken}` }, tags: { tipo: 'comprobante' } }
  );
  check(subida, { 'comprobante subido (200)': (r) => r.status === 200 });

  const aprobacion = http.post(`${BASE}/payments/${pagoId}/approve`, null, {
    headers: { Authorization: `Bearer ${data.adminToken}` },
    tags: { tipo: 'aprobacion' },
  });
  check(aprobacion, { 'pago aprobado (200)': (r) => r.status === 200 });
  sleep(0.5);
}

// Escenario 2: registro de consumo de servicios
export function registrarServicio(data) {
  const tipos = ['WATER', 'ELECTRICITY', 'INTERNET'];
  const res = http.post(
    `${BASE}/services`,
    JSON.stringify({
      tenantId: data.tenantId,
      type: tipos[__ITER % 3],
      period: '2026-10',
      consumption: 25,
      amount: 45.5,
    }),
    { headers: { ...JSON_H, Authorization: `Bearer ${data.adminToken}` }, tags: { tipo: 'servicio' } }
  );
  check(res, { 'servicio registrado (201)': (r) => r.status === 201 });
  sleep(0.5);
}

// Escenario 3: arrendatario consulta sus pagos y servicios
export function consultar(data) {
  const h = { headers: { Authorization: `Bearer ${data.tenantToken}` }, tags: { tipo: 'listado' } };
  const pagos = http.get(`${BASE}/payments`, h);
  check(pagos, { 'listado de pagos 200': (r) => r.status === 200 });
  const servicios = http.get(`${BASE}/services`, h);
  check(servicios, { 'listado de servicios 200': (r) => r.status === 200 });
  sleep(1);
}