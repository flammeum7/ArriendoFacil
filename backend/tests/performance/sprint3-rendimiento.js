import http from 'k6/http';
import { check, sleep } from 'k6';

const BASE = 'http://127.0.0.1:3001/api';
const ADMIN = {
  email: 'admin@arriendofacil.com',
  password: __ENV.ADMIN_PASS || 'Admin2026',
};
const MB = 1024 * 1024;

// Genera un PDF de prueba del tamaño indicado (cabecera PDF + relleno)
function crearPdf(bytes) {
  const buf = new Uint8Array(bytes);
  const cabecera = '%PDF-1.4\n';
  for (let i = 0; i < cabecera.length; i++) buf[i] = cabecera.charCodeAt(i);
  return buf.buffer;
}
const PDF_1MB = crearPdf(1 * MB);
const PDF_4MB = crearPdf(4 * MB);

export const options = {
  setupTimeout: '60s',
  scenarios: {
    subida: {
      executor: 'shared-iterations',
      vus: 5,
      iterations: 50,
      maxDuration: '2m',
      exec: 'subirDocumento',
    },
    consulta: {
      executor: 'constant-vus',
      vus: 20,
      duration: '30s',
      exec: 'consultarDocumentos',
    },
  },
  thresholds: {
    'http_req_duration{scenario:subida}': ['p(95)<3000'],
    'http_req_duration{tipo:listado}': ['p(95)<500'],
    'http_req_duration{tipo:descarga}': ['p(95)<1000'],
    'http_req_failed{scenario:subida}': ['rate<0.01'],
    'http_req_failed{scenario:consulta}': ['rate<0.01'],
  },
};

function auth(token) {
  return { Authorization: `Bearer ${token}` };
}

// Se ejecuta una sola vez: sesión, arrendatario dueño y un documento para descargar
export function setup() {
  const login = http.post(`${BASE}/auth/login`, JSON.stringify(ADMIN), {
    headers: { 'Content-Type': 'application/json' },
  });
  if (login.status !== 200) {
    throw new Error(`No se pudo iniciar sesión (HTTP ${login.status})`);
  }
  const token = login.json('data.accessToken');

  const dni = String(Math.floor(10000000 + Math.random() * 89999999));
  const tenantRes = http.post(
    `${BASE}/tenants`,
    JSON.stringify({
      fullName: 'Arrendatario K6 Documentos',
      dni,
      email: `k6.docs.${Date.now()}@test.com`,
      phone: '987654321',
    }),
    { headers: { 'Content-Type': 'application/json', ...auth(token) } }
  );
  if (tenantRes.status !== 201) {
    throw new Error(`No se pudo crear el arrendatario (HTTP ${tenantRes.status})`);
  }
  const tenantId = tenantRes.json('data.tenant.id');

  const docRes = http.post(
    `${BASE}/documents`,
    {
      type: 'CONTRACT',
      ownerId: String(tenantId),
      file: http.file(PDF_1MB, 'k6-base.pdf', 'application/pdf'),
    },
    { headers: auth(token) }
  );
  if (docRes.status !== 201) {
    throw new Error(`No se pudo subir el documento base (HTTP ${docRes.status})`);
  }

  return { token, tenantId, docId: docRes.json('data.document.id') };
}

// Escenario 1: 5 usuarios subiendo 50 documentos (alternando 1 MB y 4 MB)
export function subirDocumento(data) {
  const grande = __ITER % 2 === 1;
  const res = http.post(
    `${BASE}/documents`,
    {
      type: 'CONTRACT',
      ownerId: String(data.tenantId),
      file: http.file(
        grande ? PDF_4MB : PDF_1MB,
        grande ? 'k6-4mb.pdf' : 'k6-1mb.pdf',
        'application/pdf'
      ),
    },
    {
      headers: auth(data.token),
      tags: { tipo: grande ? 'subida_4mb' : 'subida_1mb' },
    }
  );
  check(res, { 'documento subido (201)': (r) => r.status === 201 });
  sleep(1);
}

// Escenario 2: 20 usuarios listando y descargando documentos
export function consultarDocumentos(data) {
  const lista = http.get(`${BASE}/documents`, {
    headers: auth(data.token),
    tags: { tipo: 'listado' },
  });
  check(lista, { 'listado responde 200': (r) => r.status === 200 });

  const descarga = http.get(`${BASE}/documents/${data.docId}/download`, {
    headers: auth(data.token),
    tags: { tipo: 'descarga' },
  });
  check(descarga, { 'descarga responde 200': (r) => r.status === 200 });
  sleep(1);
}