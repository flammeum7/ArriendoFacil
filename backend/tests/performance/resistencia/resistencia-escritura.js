// PRUEBA DE RESISTENCIA 2 – Escritura continua
// Mantiene durante 15 minutos un flujo constante de registros de servicios mezclado con consultas.
// A diferencia de resistencia-navegacion.js (solo lectura), aquí la base de datos CRECE durante
// la prueba: sirve para ver si las escrituras o las consultas se vuelven más lentas con el tiempo.
//
// Requisito: backend con .env.test y DISABLE_RATE_LIMIT=true (base reiniciada con npm test)
// Uso: k6 run tests/performance/resistencia/resistencia-escritura.js
//      k6 run -e DURACION=30m tests/performance/resistencia/resistencia-escritura.js   (versión más larga)
// En paralelo, registrar la memoria del backend:
//      powershell -ExecutionPolicy Bypass -File tests/performance/resistencia/monitor-memoria.ps1 -Salida tests/performance/reportes/resistencia/memoria-escritura.csv

import http from 'k6/http';
import { check, sleep } from 'k6';

const BASE = __ENV.BASE_URL || 'http://127.0.0.1:3001/api';
const ADMIN = { email: 'admin@arriendofacil.com', password: __ENV.ADMIN_PASS || 'Admin2026' };
const DURACION = __ENV.DURACION || '15m';
const TIPOS = ['WATER', 'ELECTRICITY', 'INTERNET'];

export const options = {
  scenarios: {
    resistencia_escritura: {
      executor: 'constant-vus',
      vus: 10,
      duration: DURACION,
      exec: 'registrarYConsultar',
    },
  },
  thresholds: {
    'http_req_duration{tipo:registro}': ['p(95)<500'],
    'http_req_duration{tipo:consulta}': ['p(95)<500'],
    http_req_failed: ['rate<0.01'],
  },
  summaryTrendStats: ['avg', 'min', 'med', 'max', 'p(90)', 'p(95)'],
};

export function setup() {
  const login = http.post(`${BASE}/auth/login`, JSON.stringify(ADMIN), {
    headers: { 'Content-Type': 'application/json' },
  });
  if (login.status !== 200) throw new Error(`No se pudo iniciar sesión (HTTP ${login.status})`);
  const token = login.json('data.accessToken');

  const dni = String(Math.floor(10000000 + Math.random() * 89999999));
  const tenantRes = http.post(
    `${BASE}/tenants`,
    JSON.stringify({ fullName: 'Arrendatario K6 Resistencia', dni, email: `k6.resistencia.${Date.now()}@test.com`, phone: '987654321' }),
    { headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` } }
  );
  if (tenantRes.status !== 201) throw new Error(`No se pudo crear el arrendatario (HTTP ${tenantRes.status})`);

  return { token, tenantId: tenantRes.json('data.tenant.id') };
}

export function registrarYConsultar(data) {
  const auth = { Authorization: `Bearer ${data.token}` };

  const reg = http.post(
    `${BASE}/services`,
    JSON.stringify({ tenantId: data.tenantId, type: TIPOS[__ITER % 3], period: '2026-10', consumption: 25, amount: 45.5 }),
    { headers: { ...auth, 'Content-Type': 'application/json' }, tags: { tipo: 'registro' } }
  );
  check(reg, { 'servicio registrado (201)': (r) => r.status === 201 });
  sleep(1);

  const lista = http.get(`${BASE}/services`, { headers: auth, tags: { tipo: 'consulta' } });
  check(lista, { 'listado de servicios 200': (r) => r.status === 200 });
  sleep(1);

  const pagos = http.get(`${BASE}/payments?limit=20`, { headers: auth, tags: { tipo: 'consulta' } });
  check(pagos, { 'listado de pagos 200': (r) => r.status === 200 });
  sleep(1);
}
