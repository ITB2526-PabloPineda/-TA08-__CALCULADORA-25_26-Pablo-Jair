/* ══════════════════════════════════════════════════════
   ITB — Calculadora de Ahorro Energético
   js/app.js  —  Lógica principal
   ══════════════════════════════════════════════════════ */

'use strict';

// ═══════════════════════════════════════════════════════
// 1. BASE DE DATOS (data.json inline — fuente: dataclean)
// ═══════════════════════════════════════════════════════
const DATA = {
  meta: {
    centro: 'Institut Tecnològic de Barcelona (ITB)',
    ciudad: 'Barcelona',
    año_base: 2024,
    dataclean: '2025-04-21'
  },

  // ── Electricidad ──────────────────────────────────────
  // Estimación basada en benchmarks FP ~3.000 m² / 400 alumnos
  // + facturas de mantenimiento reales
  electricidad: {
    kwh_mensual: [18500, 17800, 15200, 13500, 12800, 14200,
                   8500,  3200, 12000, 15800, 18200, 19500],
    coste_kwh:    0.18,
    tendencia_anual: 0.02,          // +2% sin medidas
    factor_estacional: {            // multiplicador sobre base
      calefaccion: [1.15, 1.10, 0.95, 0.84, 0.80, 0.89,
                    0.53,  0.20, 0.75, 0.99, 1.14, 1.22]
    },
    mantenimiento_extraordinario_eur: 3909.48   // suma facturas reales
  },

  // ── Agua ──────────────────────────────────────────────
  // Fuente: gráficos consumo horario feb-2024 + estimación mensual
  agua: {
    m3_mensual: [145, 150, 155, 148, 162, 175, 90, 35, 140, 158, 152, 130],
    coste_m3:   2.85,
    tendencia_anual: 0.02,
    patron_horario_lectivo: [
      175, 190, 185, 193, 152, 162, 160, 178,
      303, 295, 440, 503, 207, 235, 255, 305,
      200, 190, 177, 176, 177, 182, 185, 247
    ],
    horas_label: [
      '12AM','1AM','2AM','3AM','4AM','5AM','6AM','7AM',
      '8AM','9AM','10AM','11AM','12PM','1PM','2PM','3PM',
      '4PM','5PM','6PM','7PM','8PM','9PM','10PM','11PM'
    ]
  },

  // ── Material de oficina ───────────────────────────────
  // Fuente: facturas Lyreco (abr–nov 2024) + estimación meses sin datos
  oficina: {
    eur_mensual: [85, 75, 90, 229.03, 215.90, 28.40, 0, 0, 95, 109.40, 54.70, 80],
    tendencia_anual: 0.03,
    categorias: {
      papel_a4:    403.80,
      marcadores:  563.15,
      borradores:   95.48
    },
    facturas_reales: [
      { fecha: '30/04/2024', concepto: 'Papel A4 Navigator 500H 80g',          qty: 15, pu: 5.34,  total: 80.10  },
      { fecha: '30/04/2024', concepto: 'Marcadores Pilot Begreen (4 colores)', qty: 115, pu: 0.89, total: 102.35 },
      { fecha: '30/04/2024', concepto: 'Borradores Faibo + recambios',         qty: 7,  pu: null,  total: 46.58  },
      { fecha: '31/05/2024', concepto: 'Papel A4 Navigator 500H 80g',          qty: 30, pu: 5.34,  total: 160.20 },
      { fecha: '31/05/2024', concepto: 'Recambios marcadores Verde + Azul',    qty: 70, pu: 0.81,  total: 55.70  },
      { fecha: '30/06/2024', concepto: 'Recambios marcadores Negro',           qty: 40, pu: 0.71,  total: 28.40  },
      { fecha: '31/10/2024', concepto: 'Papel A4 Navigator 500H 80g',          qty: 30, pu: 5.47,  total: 164.10 }
    ]
  },

  // ── Limpieza ──────────────────────────────────────────
  // Fuente: facturas ITB Leaks (may–jun 2024) + estimación
  limpieza: {
    eur_mensual: [320, 300, 340, 375.80, 454.72, 750.26, 280, 150, 380, 350, 360, 310],
    tendencia_anual: 0.03,
    consumibles_año: {
      papel_secamanos_fardos: 30,
      papel_wc_fardos:        24,
      jabon_manos_garrafas:   18,
      bolsas_basura:         720,
      sacos_industriales:     80
    }
  },

  // ── Móviles en aula ───────────────────────────────────
  mobiles: [
    { f:'15/11/24', g:'ASIXc1A', m:3,    a:20, p:15.00 },
    { f:'21/11/24', g:'ASIXc1A', m:7,    a:19, p:36.84 },
    { f:'22/11/24', g:'ASIXc1A', m:5,    a:21, p:23.81 },
    { f:'28/11/24', g:'ASIXc1A', m:6,    a:19, p:31.58 },
    { f:'29/11/24', g:'ASIXc1A', m:5,    a:22, p:22.73 },
    { f:'12/12/24', g:'ASIXc1A', m:3.5,  a:19, p:18.42 },
    { f:'13/12/24', g:'ASIXc1A', m:11,   a:19, p:57.89 },
    { f:'19/12/24', g:'ASIXc1A', m:9.5,  a:18, p:52.78 },
    { f:'09/01/25', g:'ASIXc1A', m:9,    a:20, p:45.00 },
    { f:'16/01/25', g:'ASIXc1A', m:8,    a:18, p:44.44 },
    { f:'17/01/25', g:'ASIXc1A', m:7,    a:19, p:36.84 },
    { f:'16/11/24', g:'ASIXc1B', m:6,    a:21, p:28.57 },
    { f:'22/11/24', g:'ASIXc1B', m:3,    a:20, p:15.00 },
    { f:'26/11/24', g:'ASIXc1B', m:2.5,  a:20, p:12.50 },
    { f:'29/11/24', g:'ASIXc1B', m:4,    a:21, p:19.05 },
    { f:'03/12/24', g:'ASIXc1B', m:1,    a:21, p:4.76  },
    { f:'10/12/24', g:'ASIXc1B', m:3,    a:17, p:17.65 },
    { f:'13/12/24', g:'ASIXc1B', m:6.5,  a:19, p:34.21 },
    { f:'17/12/24', g:'ASIXc1B', m:4,    a:17, p:23.53 },
    { f:'14/01/25', g:'ASIXc1B', m:3,    a:18, p:16.67 },
    { f:'17/01/25', g:'ASIXc1B', m:4,    a:17, p:23.53 },
    { f:'18/11/24', g:'ASIXc1C', m:11,   a:18, p:61.11 },
    { f:'19/11/24', g:'ASIXc1C', m:6,    a:19, p:31.58 },
    { f:'25/11/24', g:'ASIXc1C', m:3.5,  a:18, p:19.44 },
    { f:'26/11/24', g:'ASIXc1C', m:14.5, a:18, p:80.56 },
    { f:'02/12/24', g:'ASIXc1C', m:8,    a:18, p:44.44 },
    { f:'03/12/24', g:'ASIXc1C', m:6,    a:16, p:37.50 },
    { f:'09/12/24', g:'ASIXc1C', m:3.5,  a:15, p:23.33 },
    { f:'10/12/24', g:'ASIXc1C', m:6,    a:17, p:35.29 },
    { f:'16/12/24', g:'ASIXc1C', m:2,    a:17, p:11.76 },
    { f:'17/12/24', g:'ASIXc1C', m:5,    a:15, p:33.33 },
    { f:'13/01/25', g:'ASIXc1C', m:5,    a:13, p:38.46 },
    { f:'14/01/25', g:'ASIXc1C', m:11,   a:18, p:61.11 },
    { f:'20/01/25', g:'ASIXc1C', m:11,   a:16, p:68.75 }
  ],

  // ── Plan reducción ────────────────────────────────────
  plan: { reduccion: 0.30 }
};

// ═══════════════════════════════════════════════════════
// 2. CONSTANTES Y ESTADO GLOBAL
// ═══════════════════════════════════════════════════════
const MESES      = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
const MESES_FULL = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio',
                    'Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

const PALETTE = {
  verdes:  ['#1a5c2a','#2e8b57','#4caf50','#66bb6a','#81c784','#a5d6a7','#c8e6c9'],
  marrones:['#5d3a1a','#8b5e3c','#c4956a','#e8c9a0'],
  azul:    '#4a90d9',
  naranja: '#e67e22',
  rojo:    '#e74c3c'
};

let mejoras = false;           // estado del botón de mejoras
const charts = {};             // registro de instancias Chart.js

// ═══════════════════════════════════════════════════════
// 3. UTILIDADES
// ═══════════════════════════════════════════════════════

/** Formatea número con separadores de miles */
function fmt(n, decimals = 0) {
  return Number(n).toLocaleString('es-ES', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  });
}

/** Aplica la reducción del plan si está activada */
function applyMejora(v) {
  return mejoras ? v * (1 - DATA.plan.reduccion) : v;
}

/** Suma elementos de array entre índices i1 e i2 (inclusive) */
function sumRange(arr, i1, i2) {
  const a = Math.min(i1, i2), b = Math.max(i1, i2);
  return arr.slice(a, b + 1).reduce((s, v) => s + v, 0);
}

/** Proyección lineal simple: base * (1 + tasa)^años */
function proyectar(base, tasa, años = 1) {
  return base * Math.pow(1 + tasa, años);
}

/** Destruye y crea un chart Chart.js */
function mkChart(id, cfg) {
  if (charts[id]) charts[id].destroy();
  const canvas = document.getElementById(id);
  if (!canvas) return null;
  charts[id] = new Chart(canvas, cfg);
  return charts[id];
}

/** Crea una fila <tr> con los valores dados */
function mkRow(cells, tag = 'td') {
  const tr = document.createElement('tr');
  cells.forEach(c => {
    const el = document.createElement(tag);
    el.innerHTML = c;
    tr.appendChild(el);
  });
  return tr;
}

/** Devuelve un <span> tag de estado */
function statusTag(value, thresholdOk, thresholdWarn) {
  if (value <= thresholdOk)   return `<span class="tag tag-verde">✅ Bajo</span>`;
  if (value <= thresholdWarn) return `<span class="tag tag-naranja">⚠️ Medio</span>`;
  return `<span class="tag tag-rojo">❌ Alto</span>`;
}

// ═══════════════════════════════════════════════════════
// 4. NAVEGACIÓN
// ═══════════════════════════════════════════════════════
const SECTION_INIT = {
  dashboard:     initDashboard,
  electricidad:  initElectricidad,
  agua:          initAgua,
  oficina:       initOficina,
  limpieza:      initLimpieza,
  plan:          initPlan,
  consejos:      initConsejos,
  mobiles:       initMobiles
};

function showSection(id) {
  document.querySelectorAll('.section').forEach(s => {
    s.classList.remove('active');
    s.classList.add('hidden');
  });
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));

  const sec = document.getElementById(id);
  if (sec) { sec.classList.remove('hidden'); sec.classList.add('active'); }

  const btn = document.querySelector(`.nav-btn[data-section="${id}"]`);
  if (btn) btn.classList.add('active');

  if (SECTION_INIT[id]) SECTION_INIT[id]();
}

// ═══════════════════════════════════════════════════════
// 5. BOTÓN "APLICAR MEJORAS DEL PLAN"
// ═══════════════════════════════════════════════════════
function toggleMejoras() {
  mejoras = !mejoras;
  const btn    = document.getElementById('btnMejoras');
  const banner = document.getElementById('ahorrobanner');

  btn.classList.toggle('activo', mejoras);
  btn.textContent = mejoras
    ? '✅ Mejoras Aplicadas (−30%)'
    : '🔄 Aplicar Mejoras del Plan (−30%)';

  banner.classList.toggle('hidden', !mejoras);

  if (mejoras) {
    const totElec = DATA.electricidad.kwh_mensual.reduce((a, b) => a + b, 0);
    const totAgua = DATA.agua.m3_mensual.reduce((a, b) => a + b, 0);
    const totOfic = DATA.oficina.eur_mensual.reduce((a, b) => a + b, 0);
    const totLimp = DATA.limpieza.eur_mensual.reduce((a, b) => a + b, 0);
    const r = DATA.plan.reduccion;

    document.getElementById('ah_elec').textContent = fmt(totElec * r) + ' kWh';
    document.getElementById('ah_agua').textContent = fmt(totAgua * r) + ' m³';
    document.getElementById('ah_ofic').textContent = fmt(totOfic * r, 0) + ' €';
    document.getElementById('ah_limp').textContent = fmt(totLimp * r, 0) + ' €';
  }

  // Refrescar la sección activa
  const activeId = document.querySelector('.section.active')?.id;
  if (activeId && SECTION_INIT[activeId]) SECTION_INIT[activeId]();
  // Siempre refrescar dashboard KPI
  updateDashboardKPI();
}

// ═══════════════════════════════════════════════════════
// 6. DASHBOARD
// ═══════════════════════════════════════════════════════
function updateDashboardKPI() {
  const ek = DATA.electricidad.kwh_mensual.map(applyMejora);
  const am = DATA.agua.m3_mensual.map(applyMejora);
  const oe = DATA.oficina.eur_mensual.map(applyMejora);
  const le = DATA.limpieza.eur_mensual.map(applyMejora);

  const tE = ek.reduce((a, b) => a + b, 0);
  const tA = am.reduce((a, b) => a + b, 0);
  const tO = oe.reduce((a, b) => a + b, 0);
  const tL = le.reduce((a, b) => a + b, 0);

  document.getElementById('kpi-elec').textContent     = fmt(tE) + ' kWh';
  document.getElementById('kpi-elec-eur').textContent = '≈ ' + fmt(tE * DATA.electricidad.coste_kwh, 0) + ' €/año';
  document.getElementById('kpi-agua').textContent     = fmt(tA) + ' m³';
  document.getElementById('kpi-agua-eur').textContent = '≈ ' + fmt(tA * DATA.agua.coste_m3, 0) + ' €/año';
  document.getElementById('kpi-ofic').textContent     = fmt(tO, 0) + ' €';
  document.getElementById('kpi-limp').textContent     = fmt(tL, 0) + ' €';
}

function initDashboard() {
  updateDashboardKPI();

  const ek = DATA.electricidad.kwh_mensual.map(applyMejora);
  const am = DATA.agua.m3_mensual.map(applyMejora);
  const oe = DATA.oficina.eur_mensual.map(applyMejora);
  const le = DATA.limpieza.eur_mensual.map(applyMejora);

  const tE = ek.reduce((a, b) => a + b, 0);
  const tA = am.reduce((a, b) => a + b, 0);
  const tO = oe.reduce((a, b) => a + b, 0);
  const tL = le.reduce((a, b) => a + b, 0);

  // — Barras elec
  mkChart('chartElecDash', {
    type: 'bar',
    data: {
      labels: MESES,
      datasets: [{ label: 'kWh', data: ek, backgroundColor: PALETTE.verdes[2], borderRadius: 5 }]
    },
    options: { plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true } } }
  });

  // — Línea agua
  mkChart('chartAguaDash', {
    type: 'line',
    data: {
      labels: MESES,
      datasets: [{
        label: 'm³', data: am, fill: true,
        backgroundColor: 'rgba(74,144,217,.18)',
        borderColor: PALETTE.azul, tension: 0.4, pointRadius: 4
      }]
    },
    options: { plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true } } }
  });

  // — Doughnut costes
  mkChart('chartPie', {
    type: 'doughnut',
    data: {
      labels: ['Electricidad', 'Agua', 'Mat. Oficina', 'Limpieza'],
      datasets: [{
        data: [
          tE * DATA.electricidad.coste_kwh,
          tA * DATA.agua.coste_m3,
          tO, tL
        ],
        backgroundColor: [PALETTE.verdes[0], PALETTE.azul, PALETTE.marrones[1], PALETTE.naranja],
        borderWidth: 2
      }]
    },
    options: { plugins: { legend: { position: 'bottom' } } }
  });

  // — Grouped bars oficina + limpieza
  mkChart('chartCombDash', {
    type: 'bar',
    data: {
      labels: MESES,
      datasets: [
        { label: 'Oficina (€)', data: oe, backgroundColor: PALETTE.marrones[1], borderRadius: 4 },
        { label: 'Limpieza (€)', data: le, backgroundColor: PALETTE.verdes[1], borderRadius: 4 }
      ]
    },
    options: { plugins: { legend: { position: 'top' } }, scales: { y: { beginAtZero: true } } }
  });
}

// ═══════════════════════════════════════════════════════
// 7. ELECTRICIDAD  (Cálculos 1 y 2)
// ═══════════════════════════════════════════════════════
function initElectricidad() {
  calcElectricidad();
  document.getElementById('elec-calcular')
    .addEventListener('click', calcElectricidad);
}

function calcElectricidad() {
  const m1     = parseInt(document.getElementById('elec-m1').value);
  const m2     = parseInt(document.getElementById('elec-m2').value);
  const precio = parseFloat(document.getElementById('elec-precio').value) || DATA.electricidad.coste_kwh;

  const base = DATA.electricidad.kwh_mensual;
  const ek   = base.map(applyMejora);

  // Cálculo 1 — consumo anual proyectado
  const totalAnual  = ek.reduce((a, b) => a + b, 0);
  const proyAnual   = proyectar(totalAnual, DATA.electricidad.tendencia_anual);

  // Cálculo 2 — consumo en período específico
  const totPeriodo = sumRange(ek, m1, m2);
  const mLabel     = `${MESES[Math.min(m1,m2)]}–${MESES[Math.max(m1,m2)]}`;

  // Actualizar KPIs
  document.getElementById('e-anual').textContent     = fmt(totalAnual) + ' kWh';
  document.getElementById('e-anual-eur').textContent = fmt(totalAnual * precio, 0) + ' €';
  document.getElementById('e-periodo').textContent   = fmt(totPeriodo) + ' kWh';
  document.getElementById('e-periodo-eur').textContent = fmt(totPeriodo * precio, 0) + ' € (' + mLabel + ')';
  document.getElementById('e-proyec').textContent    = fmt(proyAnual) + ' kWh';

  // — Chart base vs actual
  mkChart('chartElec', {
    type: 'bar',
    data: {
      labels: MESES,
      datasets: [
        { label: 'Base kWh', data: base, backgroundColor: 'rgba(46,139,87,.25)', borderColor: PALETTE.verdes[1], borderWidth: 2, borderRadius: 4 },
        { label: 'Actual kWh', data: ek, backgroundColor: PALETTE.verdes[2], borderRadius: 4 }
      ]
    },
    options: { plugins: { legend: { position: 'top' } }, scales: { y: { beginAtZero: true } } }
  });

  // — Chart costes mensuales
  mkChart('chartElecCost', {
    type: 'line',
    data: {
      labels: MESES,
      datasets: [{
        label: 'Coste €',
        data: ek.map(v => +(v * precio).toFixed(2)),
        fill: true,
        backgroundColor: 'rgba(76,175,80,.12)',
        borderColor: PALETTE.verdes[2],
        tension: 0.4, pointRadius: 5,
        pointBackgroundColor: PALETTE.verdes[0]
      }]
    },
    options: {
      plugins: { legend: { display: false } },
      scales: { y: { beginAtZero: true, ticks: { callback: v => v + ' €' } } }
    }
  });

  // — Tabla detalle
  buildTablaElec(ek, precio);
}

function buildTablaElec(ek, precio) {
  const tb = document.getElementById('tablaElec');
  tb.innerHTML = '';
  const thead = document.createElement('thead');
  thead.appendChild(mkRow(['Mes', 'kWh', 'Coste (€)', 'Nivel'], 'th'));
  tb.appendChild(thead);

  const tbody = document.createElement('tbody');
  ek.forEach((v, i) => {
    tbody.appendChild(mkRow([
      MESES_FULL[i],
      fmt(v) + ' kWh',
      fmt(v * precio, 2) + ' €',
      statusTag(v, 10000, 15000)
    ]));
  });
  const tot = ek.reduce((a, b) => a + b, 0);
  const trTot = mkRow([
    '<strong>TOTAL</strong>',
    `<strong>${fmt(tot)} kWh</strong>`,
    `<strong>${fmt(tot * precio, 2)} €</strong>`,
    '—'
  ]);
  tbody.appendChild(trTot);
  tb.appendChild(tbody);
}

// ═══════════════════════════════════════════════════════
// 8. AGUA  (Cálculos 3 y 4)
// ═══════════════════════════════════════════════════════
function initAgua() {
  calcAgua();
  document.getElementById('ag-calcular')
    .addEventListener('click', calcAgua);
}

function calcAgua() {
  const m1     = parseInt(document.getElementById('ag-m1').value);
  const m2     = parseInt(document.getElementById('ag-m2').value);
  const precio = parseFloat(document.getElementById('ag-precio').value) || DATA.agua.coste_m3;

  const base = DATA.agua.m3_mensual;
  const am   = base.map(applyMejora);

  // Cálculo 3 — consumo anual agua
  const totalAnual = am.reduce((a, b) => a + b, 0);
  const proyAnual  = proyectar(totalAnual, DATA.agua.tendencia_anual);

  // Cálculo 4 — período específico
  const totPeriodo = sumRange(am, m1, m2);
  const mLabel     = `${MESES[Math.min(m1,m2)]}–${MESES[Math.max(m1,m2)]}`;

  document.getElementById('ag-anual').textContent     = fmt(totalAnual) + ' m³';
  document.getElementById('ag-anual-eur').textContent = fmt(totalAnual * precio, 0) + ' €';
  document.getElementById('ag-periodo').textContent   = fmt(totPeriodo) + ' m³';
  document.getElementById('ag-periodo-eur').textContent = fmt(totPeriodo * precio, 0) + ' € (' + mLabel + ')';
  document.getElementById('ag-proyec').textContent    = fmt(proyAnual) + ' m³';

  // — Chart mensual
  mkChart('chartAgua', {
    type: 'line',
    data: {
      labels: MESES,
      datasets: [
        {
          label: 'm³ actual', data: am, fill: true,
          backgroundColor: 'rgba(74,144,217,.18)',
          borderColor: PALETTE.azul, tension: 0.4, pointRadius: 5,
          pointBackgroundColor: PALETTE.verdes[0]
        },
        {
          label: 'm³ base', data: base, fill: false,
          borderColor: 'rgba(100,100,100,.35)', borderDash: [5,4],
          tension: 0.4, pointRadius: 0
        }
      ]
    },
    options: { plugins: { legend: { position: 'top' } }, scales: { y: { beginAtZero: true, ticks: { callback: v => v + ' m³' } } } }
  });

  // — Chart patrón horario día lectivo tipo (real: 25/02/2024)
  const patron = DATA.agua.patron_horario_lectivo.map(applyMejora);
  mkChart('chartAguaHora', {
    type: 'bar',
    data: {
      labels: DATA.agua.horas_label,
      datasets: [{
        label: 'Litros/hora',
        data: patron,
        backgroundColor: DATA.agua.horas_label.map((_, i) =>
          (i >= 8 && i <= 16) ? PALETTE.azul : 'rgba(74,144,217,.3)'
        ),
        borderRadius: 3
      }]
    },
    options: {
      plugins: { legend: { display: false }, tooltip: { callbacks: { label: c => c.raw + ' L' } } },
      scales: { y: { beginAtZero: true } }
    }
  });

  // — Tabla
  buildTablaAgua(am, precio);
}

function buildTablaAgua(am, precio) {
  const tb = document.getElementById('tablaAgua');
  tb.innerHTML = '';
  const thead = document.createElement('thead');
  thead.appendChild(mkRow(['Mes', 'm³', 'Coste (€)', 'Nivel'], 'th'));
  tb.appendChild(thead);

  const tbody = document.createElement('tbody');
  am.forEach((v, i) => {
    tbody.appendChild(mkRow([
      MESES_FULL[i],
      fmt(v) + ' m³',
      fmt(v * precio, 2) + ' €',
      statusTag(v, 120, 160)
    ]));
  });
  const tot = am.reduce((a, b) => a + b, 0);
  tbody.appendChild(mkRow([
    '<strong>TOTAL</strong>',
    `<strong>${fmt(tot)} m³</strong>`,
    `<strong>${fmt(tot * precio, 2)} €</strong>`,
    '—'
  ]));
  tb.appendChild(tbody);
}

// ═══════════════════════════════════════════════════════
// 9. MATERIAL DE OFICINA  (Cálculos 5 y 6)
// ═══════════════════════════════════════════════════════
function initOficina() {
  calcOficina();
  document.getElementById('of-calcular')
    .addEventListener('click', calcOficina);
}

function calcOficina() {
  const m1 = parseInt(document.getElementById('of-m1').value);
  const m2 = parseInt(document.getElementById('of-m2').value);

  const base = DATA.oficina.eur_mensual;
  const oe   = base.map(applyMejora);

  // Cálculo 5 — gasto anual proyectado oficina
  const totalAnual = oe.reduce((a, b) => a + b, 0);
  const proyAnual  = proyectar(totalAnual, DATA.oficina.tendencia_anual);

  // Cálculo 6 — período específico
  const totPeriodo = sumRange(oe, m1, m2);

  document.getElementById('of-anual').textContent     = fmt(totalAnual, 0) + ' €';
  document.getElementById('of-periodo').textContent   = fmt(totPeriodo, 0) + ' €';
  document.getElementById('of-periodo-sub').textContent = MESES[Math.min(m1,m2)] + '–' + MESES[Math.max(m1,m2)];
  document.getElementById('of-proyec').textContent    = fmt(proyAnual, 0) + ' €';

  // — Chart barras mensuales
  mkChart('chartOfic', {
    type: 'bar',
    data: {
      labels: MESES,
      datasets: [{
        label: '€ material oficina',
        data: oe,
        backgroundColor: oe.map(v => v > 150 ? PALETTE.marrones[0] : v > 80 ? PALETTE.marrones[1] : PALETTE.marrones[2]),
        borderRadius: 5
      }]
    },
    options: {
      plugins: { legend: { display: false } },
      scales: { y: { beginAtZero: true, ticks: { callback: v => v + ' €' } } }
    }
  });

  // — Doughnut categorías
  const cats = DATA.oficina.categorias;
  mkChart('chartOficPie', {
    type: 'pie',
    data: {
      labels: ['Papel A4', 'Marcadores pizarra', 'Borradores'],
      datasets: [{
        data: [applyMejora(cats.papel_a4), applyMejora(cats.marcadores), applyMejora(cats.borradores)],
        backgroundColor: [PALETTE.marrones[0], PALETTE.marrones[1], PALETTE.marrones[2]],
        borderWidth: 2
      }]
    },
    options: { plugins: { legend: { position: 'bottom' } } }
  });
}

// ═══════════════════════════════════════════════════════
// 10. LIMPIEZA  (Cálculos 7 y 8)
// ═══════════════════════════════════════════════════════
function initLimpieza() {
  calcLimpieza();
  document.getElementById('li-calcular')
    .addEventListener('click', calcLimpieza);
}

function calcLimpieza() {
  const m1 = parseInt(document.getElementById('li-m1').value);
  const m2 = parseInt(document.getElementById('li-m2').value);

  const base = DATA.limpieza.eur_mensual;
  const le   = base.map(applyMejora);

  // Cálculo 7 — gasto anual proyectado limpieza
  const totalAnual = le.reduce((a, b) => a + b, 0);
  const proyAnual  = proyectar(totalAnual, DATA.limpieza.tendencia_anual);

  // Cálculo 8 — período específico
  const totPeriodo = sumRange(le, m1, m2);

  document.getElementById('li-anual').textContent     = fmt(totalAnual, 0) + ' €';
  document.getElementById('li-periodo').textContent   = fmt(totPeriodo, 0) + ' €';
  document.getElementById('li-periodo-sub').textContent = MESES[Math.min(m1,m2)] + '–' + MESES[Math.max(m1,m2)];
  document.getElementById('li-proyec').textContent    = fmt(proyAnual, 0) + ' €';

  // — Chart línea mensual
  mkChart('chartLimp', {
    type: 'line',
    data: {
      labels: MESES,
      datasets: [{
        label: '€ limpieza', data: le, fill: true,
        backgroundColor: 'rgba(46,139,87,.12)',
        borderColor: PALETTE.verdes[1], tension: 0.4,
        pointRadius: 5, pointBackgroundColor: PALETTE.verdes[0]
      }]
    },
    options: {
      plugins: { legend: { display: false } },
      scales: { y: { beginAtZero: true, ticks: { callback: v => v + ' €' } } }
    }
  });

  // — Chart consumibles clave
  const c = DATA.limpieza.consumibles_año;
  mkChart('chartLimpBar', {
    type: 'bar',
    data: {
      labels: ['Papel secam.\n(fardos)', 'Papel WC\n(fardos)', 'Jabón manos\n(garrafas)', 'Sacos ind.', 'Bolsas basura'],
      datasets: [{
        label: 'Unidades/año',
        data: [
          applyMejora(c.papel_secamanos_fardos),
          applyMejora(c.papel_wc_fardos),
          applyMejora(c.jabon_manos_garrafas),
          applyMejora(c.sacos_industriales),
          applyMejora(c.bolsas_basura)
        ],
        backgroundColor: [PALETTE.verdes[0], PALETTE.verdes[1], PALETTE.verdes[2], PALETTE.marrones[0], PALETTE.marrones[1]],
        borderRadius: 5
      }]
    },
    options: { plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true } } }
  });
}

// ═══════════════════════════════════════════════════════
// 11. PLAN −30% (3 años)
// ═══════════════════════════════════════════════════════
function initPlan() {
  const baseElec = DATA.electricidad.kwh_mensual.reduce((a, b) => a + b, 0);
  const baseAgua = DATA.agua.m3_mensual.reduce((a, b) => a + b, 0);
  const baseOfic = DATA.oficina.eur_mensual.reduce((a, b) => a + b, 0);
  const baseLimp = DATA.limpieza.eur_mensual.reduce((a, b) => a + b, 0);

  const costBase = baseElec * DATA.electricidad.coste_kwh
                 + baseAgua * DATA.agua.coste_m3
                 + baseOfic + baseLimp;

  const años = ['2024 (base)', '2025 (Año 1)', '2026 (Año 2)', '2027 (Año 3)'];
  const reduc = [0, 0.10, 0.20, 0.30];

  // Chart electricidad 3 años
  mkChart('chartPlan3Elec', {
    type: 'bar',
    data: {
      labels: años,
      datasets: [{
        label: 'kWh/año',
        data: reduc.map(r => +(baseElec * (1 - r)).toFixed(0)),
        backgroundColor: [PALETTE.verdes[0], PALETTE.verdes[1], PALETTE.verdes[2], '#a5d6a7'],
        borderRadius: 6
      }]
    },
    options: { plugins: { legend: { display: false } }, scales: { y: { beginAtZero: false, min: Math.round(baseElec * 0.6) } } }
  });

  // Chart costes totales 3 años
  mkChart('chartPlan3Cost', {
    type: 'line',
    data: {
      labels: años,
      datasets: [{
        label: 'Coste total anual (€)',
        data: reduc.map(r => +(costBase * (1 - r)).toFixed(0)),
        fill: true,
        backgroundColor: 'rgba(168,213,181,.3)',
        borderColor: PALETTE.verdes[1],
        tension: 0.3,
        pointRadius: 8,
        pointBackgroundColor: PALETTE.verdes[0]
      }]
    },
    options: {
      plugins: { legend: { display: false } },
      scales: { y: { ticks: { callback: v => fmt(v, 0) + ' €' } } }
    }
  });
}

// ═══════════════════════════════════════════════════════
// 12. CONSEJOS
// ═══════════════════════════════════════════════════════
function initConsejos() {
  // Chart horizontal — impacto por medida
  mkChart('chartConsejos', {
    type: 'bar',
    data: {
      labels: ['LED aulas', 'Sensores presencia', 'Perlizadores grifos',
               'Doble cara impresión', 'Jabón concentrado', 'Recarga marcadores'],
      datasets: [{
        label: '% reducción estimada',
        data: [18, 8, 12, 15, 10, 5],
        backgroundColor: PALETTE.verdes,
        borderRadius: 6
      }]
    },
    options: {
      indexAxis: 'y',
      plugins: { legend: { display: false } },
      scales: { x: { beginAtZero: true, max: 25, ticks: { callback: v => v + '%' } } }
    }
  });

  // Chart radar — semáforo
  mkChart('chartSemaforo', {
    type: 'radar',
    data: {
      labels: ['Electricidad', 'Agua', 'Mat. Oficina', 'Limpieza', 'Conectividad', 'Mantenimiento'],
      datasets: [
        {
          label: 'Consumo actual (%)',
          data: [85, 70, 60, 75, 40, 80],
          backgroundColor: 'rgba(231,76,34,.15)',
          borderColor: PALETTE.rojo,
          pointBackgroundColor: PALETTE.rojo
        },
        {
          label: 'Objetivo 3 años (%)',
          data: [60, 50, 42, 52, 40, 60],
          backgroundColor: 'rgba(76,175,80,.15)',
          borderColor: PALETTE.verdes[2],
          pointBackgroundColor: PALETTE.verdes[2]
        }
      ]
    },
    options: {
      plugins: { legend: { position: 'bottom' } },
      scales: { r: { beginAtZero: true, max: 100, ticks: { callback: v => v + '%' } } }
    }
  });
}

// ═══════════════════════════════════════════════════════
// 13. MÓVILES EN AULA
// ═══════════════════════════════════════════════════════
function initMobiles() {
  const grupos = ['ASIXc1A', 'ASIXc1B', 'ASIXc1C'];
  const colors = [PALETTE.verdes[0], PALETTE.verdes[2], PALETTE.marrones[1]];

  // Obtener etiquetas únicas (fechas ordenadas)
  const labels = [...new Set(DATA.mobiles.map(r => r.f))];

  const datasets = grupos.map((g, gi) => {
    const rows = DATA.mobiles.filter(r => r.g === g);
    // Alinear datos con etiquetas
    const values = labels.map(l => {
      const row = rows.find(r => r.f === l);
      return row ? row.p : null;
    });
    return {
      label: g,
      data: values,
      backgroundColor: colors[gi] + '99',
      borderColor: colors[gi],
      borderWidth: 2,
      pointRadius: 5,
      pointBackgroundColor: colors[gi],
      spanGaps: false,
      tension: 0.2
    };
  });

  mkChart('chartMobiles', {
    type: 'line',
    data: { labels, datasets },
    options: {
      plugins: {
        legend: { position: 'top' },
        tooltip: { callbacks: { label: c => `${c.dataset.label}: ${c.raw?.toFixed(2)}%` } }
      },
      scales: {
        y: {
          beginAtZero: true, max: 100,
          ticks: { callback: v => v + '%' }
        }
      }
    }
  });

  // — Tabla completa
  buildTablaMobiles();
}

function buildTablaMobiles() {
  const tb = document.getElementById('tablaMobiles');
  tb.innerHTML = '';
  const thead = document.createElement('thead');
  thead.appendChild(mkRow(['Fecha', 'Grupo', 'Móviles', 'Alumnado', '% Uso', 'Estado'], 'th'));
  tb.appendChild(thead);

  const tbody = document.createElement('tbody');
  DATA.mobiles.forEach(r => {
    let tag;
    if (r.p <= 10)      tag = `<span class="tag tag-verde">✅ Excelente</span>`;
    else if (r.p <= 20) tag = `<span class="tag tag-verde">✅ OK</span>`;
    else if (r.p <= 35) tag = `<span class="tag tag-naranja">⚠️ Atención</span>`;
    else                tag = `<span class="tag tag-rojo">❌ Alto</span>`;

    tbody.appendChild(mkRow([
      r.f,
      `<strong>${r.g}</strong>`,
      r.m,
      r.a,
      r.p.toFixed(2) + '%',
      tag
    ]));
  });
  tb.appendChild(tbody);
}

// ═══════════════════════════════════════════════════════
// 14. EXPORTAR PDF (jsPDF)
// ═══════════════════════════════════════════════════════
function exportPDF() {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  const tE = DATA.electricidad.kwh_mensual.map(applyMejora).reduce((a, b) => a + b, 0);
  const tA = DATA.agua.m3_mensual.map(applyMejora).reduce((a, b) => a + b, 0);
  const tO = DATA.oficina.eur_mensual.map(applyMejora).reduce((a, b) => a + b, 0);
  const tL = DATA.limpieza.eur_mensual.map(applyMejora).reduce((a, b) => a + b, 0);

  // Cabecera
  doc.setFillColor(26, 92, 42);
  doc.rect(0, 0, 210, 28, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.text('ITB — Calculadora de Ahorro Energético', 14, 12);
  doc.setFontSize(10);
  doc.text('Institut Tecnològic de Barcelona · Fase 3: Sostenibilidad', 14, 20);
  doc.text(`Generado: ${new Date().toLocaleDateString('es-ES')}  |  Modo: ${mejoras ? 'Con mejoras (−30%)' : 'Sin mejoras'}`, 14, 26);

  doc.setTextColor(0, 0, 0);
  doc.setFontSize(13);
  doc.text('Resumen de Consumos Anuales', 14, 38);

  // Tabla resumen KPI
  doc.autoTable({
    startY: 42,
    head: [['Indicador', 'Consumo/Año', 'Coste estimado (€)']],
    body: [
      ['⚡ Electricidad', fmt(tE) + ' kWh', fmt(tE * DATA.electricidad.coste_kwh, 0) + ' €'],
      ['💧 Agua',         fmt(tA) + ' m³',  fmt(tA * DATA.agua.coste_m3, 0) + ' €'],
      ['📋 Material Oficina', '—',          fmt(tO, 0) + ' €'],
      ['🧹 Limpieza',     '—',              fmt(tL, 0) + ' €'],
      ['TOTAL COSTES', '—', fmt(tE*DATA.electricidad.coste_kwh + tA*DATA.agua.coste_m3 + tO + tL, 0) + ' €']
    ],
    headStyles: { fillColor: [26, 92, 42] },
    alternateRowStyles: { fillColor: [240, 248, 240] }
  });

  // Tabla mensual electricidad
  const yAfterFirst = doc.lastAutoTable.finalY + 10;
  doc.setFontSize(12);
  doc.text('Detalle mensual — Electricidad', 14, yAfterFirst);

  const ek = DATA.electricidad.kwh_mensual.map(applyMejora);
  doc.autoTable({
    startY: yAfterFirst + 4,
    head: [['Mes', 'kWh', 'Coste (€)']],
    body: MESES_FULL.map((m, i) => [m, fmt(ek[i]) + ' kWh', fmt(ek[i] * DATA.electricidad.coste_kwh, 2) + ' €']),
    headStyles: { fillColor: [46, 139, 87] }
  });

  // Plan −30%
  doc.addPage();
  doc.setFillColor(26, 92, 42);
  doc.rect(0, 0, 210, 16, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(13);
  doc.text('Plan de Reducción a 3 Años — Reto del 30%', 14, 11);
  doc.setTextColor(0, 0, 0);

  doc.autoTable({
    startY: 22,
    head: [['Año', 'kWh/año electricidad', 'Reducción', 'Coste estimado (€)']],
    body: [
      ['2024 (base)', fmt(tE * (1/0.70)), '0%',  fmt(tE * (1/0.70) * DATA.electricidad.coste_kwh, 0) + ' €'],
      ['2025 (Año 1)', fmt(tE * (1/0.70) * 0.90), '−10%', fmt(tE * (1/0.70) * 0.90 * DATA.electricidad.coste_kwh, 0) + ' €'],
      ['2026 (Año 2)', fmt(tE * (1/0.70) * 0.80), '−20%', fmt(tE * (1/0.70) * 0.80 * DATA.electricidad.coste_kwh, 0) + ' €'],
      ['2027 (Año 3)', fmt(tE * (1/0.70) * 0.70), '−30%', fmt(tE * (1/0.70) * 0.70 * DATA.electricidad.coste_kwh, 0) + ' €']
    ],
    headStyles: { fillColor: [26, 92, 42] }
  });

  doc.save('ITB_Calculadora_Ahorro_Energetico.pdf');
}

// ═══════════════════════════════════════════════════════
// 15. EVENT LISTENERS GLOBALES
// ═══════════════════════════════════════════════════════
document.addEventListener('DOMContentLoaded', () => {
  // Navegación
  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('click', () => showSection(btn.dataset.section));
  });

  // Botón mejoras
  document.getElementById('btnMejoras')
    ?.addEventListener('click', toggleMejoras);

  // Botón exportar
  document.getElementById('btnExport')
    ?.addEventListener('click', exportPDF);

  // Init sección inicial
  initDashboard();
});