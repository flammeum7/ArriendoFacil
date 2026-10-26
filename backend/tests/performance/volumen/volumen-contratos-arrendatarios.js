// PRUEBA DE VOLUMEN 2 – Contratos y arrendatarios
// ¿Los listados de contratos y de arrendatarios mantienen sus tiempos cuando hay muchos registros?
// Se ejecuta la MISMA carga dos veces, sobre pocos y muchos datos, y se comparan los tiempos.
// Complementa a volumen-pagos.js.
//
// Procedimiento (desde la carpeta backend):
//   1) Volumen BAJO (50 contratos, 5 arrendatarios):
//      npm test
//      npx dotenv -e .env.test -v CONTRATOS=50 -v PAGOS=1 -v ARRENDATARIOS=5 -- node tests/performance/datos/preparar-volumen.js
//      k6 run -e VOLUMEN=bajo tests/performance/volumen/volumen-contratos-arrendatarios.js
//   2) Volumen ALTO (1 000 contratos, 200 arrendatarios):
//      npm test
//      npx dotenv -e .env.test -v CONTRATOS=1000 -v PAGOS=1 -v ARRENDATARIOS=200 -- node tests/performance/datos/preparar-volumen.js
//      k6 run -e VOLUMEN=alto tests/performance/volumen/volumen-contratos-arrendatarios.js
//
// Requisito: backend con .env.test y DISABLE_RATE_LIMIT=true

import http from 'k6/http';
import { check, sleep } from 'k6';

const BASE = __ENV.BASE_URL || 'http://127.0.0.1:3001/api';
const ADMIN = { email: 'admin@arriendofacil.com', password: __ENV.ADMIN_PASS || 'Admin2026' };
const VOLUMEN = __ENV.VOLUMEN || 'sin-etiqueta';

export const options = {
  scenarios: {
    volumen: {
      executor: 'constant-vus',
      vus: 10,
      duration: '30s',
      exec: 'consultarListados',
    },
  },
  thresholds: {
    'http_req_duration{tipo:contratos}': ['p(95)<500'],
    'http_req_duration{tipo:arrendatarios}': ['p(95)<500'],
    http_req_failed: ['rate<0.01'],
  },
  tags: { volumen: VOLUMEN },
  summaryTrendStats: ['avg', 'min', 'med', 'max', 'p(90)', 'p(95)'],
};

export function setup() {
  const res = http.post(`${BASE}/auth/login`, JSON.stringify(ADMIN), {
    headers: { 'Content-Type': 'application/json' },
  });
  if (res.status !== 200) throw new Error(`No se pudo iniciar sesión (HTTP ${res.status})`);
  return { token: res.json('data.accessToken') };
}

export function consultarListados(data) {
  const auth = { Authorization: `Bearer ${data.token}` };

  const c = http.get(`${BASE}/contracts`, { headers: auth, tags: { tipo: 'contratos' } });
  check(c, { 'contratos 200': (r) => r.status === 200 });

  const t = http.get(`${BASE}/tenants`, { headers: auth, tags: { tipo: 'arrendatarios' } });
  check(t, { 'arrendatarios 200': (r) => r.status === 200 });

  sleep(1);
}
