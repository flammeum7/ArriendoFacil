// PRUEBA DE RESISTENCIA (soak) – versión acotada
// Mantiene una carga moderada y constante durante un tiempo prolongado (15 min por defecto)
// para detectar degradación progresiva: tiempos que suben con los minutos,
// memoria del servidor que crece sin parar (fuga) o conexiones que se agotan.
//
// Requisitos: backend con .env.test y DISABLE_RATE_LIMIT=true; datos sembrados con preparar-volumen.js
// Uso: k6 run tests/performance/resistencia/resistencia-navegacion.js
//      k6 run -e DURACION=30m tests/performance/resistencia/resistencia-navegacion.js   (versión más larga)
//
// Mientras corre, registrar la memoria del proceso node del backend (ver instrucciones aparte).

import http from 'k6/http';
import { check, sleep } from 'k6';

const BASE = __ENV.BASE_URL || 'http://127.0.0.1:3001/api';
const ADMIN = { email: 'admin@arriendofacil.com', password: __ENV.ADMIN_PASS || 'Admin2026' };
const DURACION = __ENV.DURACION || '15m';

export const options = {
  scenarios: {
    resistencia: {
      executor: 'constant-vus',
      vus: 15,
      duration: DURACION,
      exec: 'usoNormal',
    },
  },
  thresholds: {
    http_req_duration: ['p(95)<500'],
    http_req_failed: ['rate<0.01'],
  },
  summaryTrendStats: ['avg', 'min', 'med', 'max', 'p(90)', 'p(95)'],
};

export function setup() {
  const res = http.post(`${BASE}/auth/login`, JSON.stringify(ADMIN), {
    headers: { 'Content-Type': 'application/json' },
  });
  if (res.status !== 200) throw new Error(`No se pudo iniciar sesión (HTTP ${res.status})`);
  return { token: res.json('data.accessToken') };
}

// Simula a un arrendador navegando: revisa contratos, pagos y arrendatarios
export function usoNormal(data) {
  const auth = { Authorization: `Bearer ${data.token}` };

  const c = http.get(`${BASE}/contracts`, { headers: auth, tags: { tipo: 'contratos' } });
  check(c, { 'contratos 200': (r) => r.status === 200 });
  sleep(1);

  const p = http.get(`${BASE}/payments?limit=20`, { headers: auth, tags: { tipo: 'pagos' } });
  check(p, { 'pagos 200': (r) => r.status === 200 });
  sleep(1);

  const t = http.get(`${BASE}/tenants`, { headers: auth, tags: { tipo: 'arrendatarios' } });
  check(t, { 'arrendatarios 200': (r) => r.status === 200 });
  sleep(1);
}
