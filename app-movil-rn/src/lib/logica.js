/* logica.js: reglas de negocio de SICOE, sin nada de interfaz.
   Son las mismas reglas de la app anterior (app-movil): tarifa por fracción, formato de placas,
   deudas por placa, lectura de la constancia de pago y reportes en Excel (CSV). */

/* Zonas de estacionamiento de la municipalidad: nombre y cantidad de espacios */
export const ZONAS = [
  { n:'AV. FERNANDO WIESSE 32 IMPAR', cap:10 }, { n:'AV. FERNANDO WIESSE 32 PAR', cap:10 },
  { n:'AV. FERNANDO WIESSE 33 IMPAR', cap:22 }, { n:'AV. FERNANDO WIESSE 33 PAR', cap:22 },
  { n:'CL. VARA DE ORO 2 IMPAR', cap:16 },      { n:'CL. VARA DE ORO 2 PAR', cap:16 },
  { n:'JR. ALAMEDA LANZON 2 IMPAR', cap:16 },   { n:'JR. ALAMEDA LANZON 2 PAR', cap:16 },
  { n:'JR. LAS MAQUINARIAS TRAMO 01', cap:28 }, { n:'JR. LAS MAQUINARIAS TRAMO 02', cap:28 },
  { n:'JR. WIRACOCHA 2 IMPAR', cap:7 },         { n:'JR. WIRACOCHA 2 PAR', cap:19 }
];
export const zonaCap = n => (ZONAS.find(z => z.n === n) || {}).cap || 0;

/* Configuración por defecto (se puede cambiar en Ajustes) */
export const DEF = { nombre:'Parqueo Municipal', tarifa:0.80, fraccion:30, tol:0, qrText:'Yape / Plin · Municipalidad', tema:'auto', aviso:true, avisoMin:2, gps:true, gpsVisto:false, zona:'' };

/* ---------- Formatos ---------- */
export const money = n => 'S/ ' + (Math.round(n * 100) / 100).toFixed(2);
export const key = p => String(p || '').replace(/[^A-Z0-9]/g, '');
export const pad = n => String(n).padStart(2, '0');
export const hhmm = t => { const d = new Date(t); return pad(d.getHours()) + ':' + pad(d.getMinutes()); };
export const dur = ms => { const s = Math.max(0, Math.floor(ms / 1000)); return pad(Math.floor(s / 3600)) + ':' + pad(Math.floor(s % 3600 / 60)) + ':' + pad(s % 60); };
export const durTxt = ms => { const m = Math.max(0, Math.round(ms / 60000)); return m < 60 ? m + ' min' : Math.floor(m / 60) + ' h ' + pad(m % 60) + ' min'; };
export const hace = t => { const m = Math.floor((Date.now() - t) / 60000); return m < 1 ? 'ahora' : m < 60 ? `hace ${m} min` : `hace ${Math.floor(m / 60)} h ${m % 60 ? (m % 60) + ' min' : ''}`.trim(); };
export const isToday = t => !!t && new Date(t).toDateString() === new Date().toDateString();
export const sum = l => l.reduce((s, t) => s + t.monto, 0);
export const nuevoId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
export const saludo = () => { const h = new Date().getHours(); return h < 12 ? 'Buenos días' : h < 19 ? 'Buenas tardes' : 'Buenas noches'; };
export const hoyTxt = () => { const f = new Date().toLocaleDateString('es-PE', { weekday:'long', day:'numeric', month:'long' }); return f.charAt(0).toUpperCase() + f.slice(1); };
export function diaTxt(t){
  const d = new Date(t), y = new Date(); y.setDate(y.getDate() - 1);
  if (isToday(t)) return 'Hoy';
  if (d.toDateString() === y.toDateString()) return 'Ayer';
  return d.toLocaleDateString('es-PE', { weekday:'long', day:'numeric', month:'long' });
}

/* Color del punto que aparece en el ícono del vehículo */
const COLORES = { blanco:'#F2F3F5', negro:'#1B1D21', gris:'#8A909B', plata:'#C3C8D0', rojo:'#D63031', azul:'#2B5BD7', verde:'#239B56', amarillo:'#F4C430', marron:'#7B4A2A', naranja:'#F07F1A', celeste:'#6EC1F0', guinda:'#7A1730' };
export const colorHex = c => COLORES[String(c || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')];
export const COLORES_LISTA = ['Blanco', 'Negro', 'Gris', 'Plata', 'Rojo', 'Azul', 'Verde', 'Amarillo'];

/* Placa: autos ABC-123, motos 1234-AB */
export function fmtPlaca(raw){
  const s = String(raw || '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 7);
  if (/^\d{4}[A-Z]{1,2}$/.test(s)) return s.slice(0, 4) + '-' + s.slice(4);
  return s.length > 3 && s.length <= 6 ? s.slice(0, 3) + '-' + s.slice(3) : s;
}

/* Cobro por fracción iniciada: 1 a 30 min = 1 fracción, 31 a 60 = 2, etc. (con la tolerancia de Ajustes)
   n = fracciones, monto, prog = avance de la fracción actual (0 a 1), falta = minutos para la siguiente */
export function calc(ms, cfg){
  const min = ms / 60000, util = Math.max(0, min - cfg.tol);
  const n = Math.max(1, Math.ceil(util / cfg.fraccion)), into = util % cfg.fraccion;
  return { n, monto:Math.round(n * cfg.tarifa * 100) / 100, prog:into / cfg.fraccion, falta:Math.ceil(cfg.fraccion - into) };
}

/* ---------- Consultas sobre los tickets ----------
   Un ticket es un vehículo registrado: placa, zona, espacio, inicio, fin, monto,
   estado ('activo' en parqueo, 'pagado' o 'pendiente' = se fue sin pagar), método, N° de operación, etc. */
export const deudasDe = (tickets, k) => tickets.filter(t => t.estado === 'pendiente' && key(t.placa) === k);
export const activoDe = (tickets, k) => tickets.find(t => t.estado === 'activo' && key(t.placa) === k);
export const ocupados = (tickets, zona) => tickets.filter(t => t.estado === 'activo' && t.zona === zona && t.espacio);
export const opUsada = (tickets, op, id) => tickets.find(x => x.id !== id && x.op && x.op === op);

/* Datos del dueño guardados para una placa (los registros antiguos guardaban nombre y DNI sueltos) */
export const datosDueno = (vehs, k) => { const v = vehs[k]; if (!v) return null; if (v.dueno) return v.dueno; return v.nombre || v.dni ? { nombre:v.nombre || '', dni:v.dni || '' } : null; };
/* Datos que se recuerdan del vehículo: color y modelo siempre; nombre y DNI solo si maneja el dueño */
export function vehiculoActualizado(vehs, k, d, quien){
  const v0 = vehs[k] || {}, nv = { color:d.color || v0.color || '', modelo:d.modelo || v0.modelo || '', dueno:datosDueno(vehs, k) };
  if (quien === 'dueno' && (d.nombre || d.dni)) nv.dueno = { nombre:d.nombre, dni:d.dni };
  return nv.color || nv.modelo || nv.dueno ? nv : null;
}

/* ---------- Lectura de la constancia de pago (Yape / Plin) ----------
   Recibe el texto que leyó el celular y revisa: el monto (debe ser el total a pagar), que el N° de operación
   no se haya usado antes y que la constancia sea de hoy y no anterior al ingreso del vehículo. */
const MESES = { ene:0, feb:1, mar:2, abr:3, may:4, jun:5, jul:6, ago:7, set:8, sep:8, oct:9, nov:10, dic:11 };
export function analizarConstancia(txt, { t, debe, esDeuda, tickets }){
  const s = txt.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  // Monto: «S/ 2.40», «S/2,40» (la S a veces se lee como 5)
  const montos = [...s.matchAll(/(?:s|5|\$)\s*[\/|l]\s*\.?\s*(\d{1,4}(?:[.,]\d{1,2})?)(?!\d)/g)].map(m => parseFloat(m[1].replace(',', '.'))).filter(n => n > 0 && n < 5000);
  // N° de operación: el número que sigue a «operación» (Yape) o «código de operación» (Plin)
  let op = null; const mo = s.match(/operac[il1]on[^\d\n]{0,25}((?:\d[\s-]?){6,14}\d)/) || s.match(/(?:n[°ºo.]|nro|numero|codigo)[^\d\n]{0,15}((?:\d[\s-]?){6,14}\d)/);
  if (mo) op = mo[1].replace(/\D/g, '');
  // Respaldo: el número largo que aparece solo (los de operación tienen 8 o más cifras)
  if (!op){ const n = [...s.matchAll(/(?<![\d.,:\/])(\d{7,14})(?![\d.,:\/])/g)].map(m => m[1]).sort((x, y) => y.length - x.length); if (n.length) op = n[0]; }
  // Fecha: «14 oct. 2026», «14 de octubre de 2026» o «14/10/2026»; hora «04:32 p. m.»
  let fecha = null; const hoy = new Date();
  const mf = s.match(/(\d{1,2})\s*(?:de\s*)?(ene|feb|mar|abr|may|jun|jul|ago|set|sep|oct|nov|dic)[a-z]*\.?,?\s*(?:de[l]?\s*)?(\d{4})?/);
  const md = s.match(/(\d{1,2})[\/-](\d{1,2})[\/-](\d{2,4})/);
  if (mf) fecha = new Date(mf[3] ? +mf[3] : hoy.getFullYear(), MESES[mf[2]], +mf[1]);
  else if (md) fecha = new Date(+md[3] < 100 ? 2000 + +md[3] : +md[3], +md[2] - 1, +md[1]);
  const mh = s.match(/(\d{1,2}):(\d{2})\s*(a\.?\s*m|p\.?\s*m)?/);
  if (fecha && mh){ let hh = +mh[1] % 12; if (!mh[3] || mh[3][0] === 'p') hh = mh[3] ? hh + 12 : +mh[1]; fecha.setHours(hh, +mh[2]); }

  const items = [];
  if (!montos.length) items.push({ s:'unk', t:'Monto', d:'No se pudo leer. Revísalo en la constancia.' });
  else if (montos.some(n => Math.abs(n - debe) < .005)) items.push({ s:'ok', t:'Monto', d:money(debe) + ', igual al total a pagar' });
  else items.push({ s:'bad', t:'Monto distinto', d:'La constancia dice ' + money(montos[0]) + ' y debía pagar ' + money(debe) });
  const previo = op && opUsada(tickets, op, t.id), cuando = p => p.pagadoEn || p.fin || p.inicio;
  if (!op) items.push({ s:'unk', t:'N° de operación', d:'No se pudo leer. Escríbelo a mano abajo.' });
  else if (previo) items.push({ s:'bad', t:'Constancia ya usada', d:'El N° ' + op + ' se registró para ' + previo.placa + ' el ' + new Date(cuando(previo)).toLocaleDateString('es-PE', { day:'numeric', month:'short' }) + ' a las ' + hhmm(cuando(previo)) });
  else items.push({ s:'ok', t:'N° de operación ' + op, d:'No se ha usado en otro cobro' });
  if (!fecha) items.push({ s:'unk', t:'Fecha', d:'No se pudo leer. Revisa que la constancia sea de hoy.' });
  else if (fecha.toDateString() !== hoy.toDateString()) items.push({ s:'bad', t:'No es de hoy', d:'La constancia es del ' + fecha.toLocaleDateString('es-PE', { day:'numeric', month:'long' }) });
  else if (mh && !esDeuda && fecha.getTime() < t.inicio - 5 * 60000) items.push({ s:'bad', t:'Hora anterior al ingreso', d:'Es de las ' + hhmm(fecha) + ' y el vehículo entró a las ' + hhmm(t.inicio) });
  else items.push({ s:'ok', t:'Fecha', d:'Hoy' + (mh ? ', a las ' + hhmm(fecha) : '') });
  const estado = items.some(i => i.s === 'bad') ? 'alerta' : items.some(i => i.s === 'unk') ? 'revisar' : 'ok';
  return { estado, items, op, monto:montos[0] || null, fecha:fecha ? fecha.getTime() : null };
}

/* ---------- Cuadre de caja ---------- */
export const DENOM = [200, 100, 50, 20, 10, 5, 2, 1, 0.5, 0.2, 0.1];
export const denTxt = v => v >= 1 ? 'S/ ' + v : (v * 100).toFixed(0) + ' cént.';
/* Lo que se cobró en el turno actual: el efectivo esperado es la suma de pagos en efectivo desde que inició sesión */
export function datosTurno(tickets, sesion){
  const desde = sesion ? sesion.desde : Date.now(), dni = sesion ? sesion.dni : '';
  const mios = tickets.filter(t => !t.cobrador || t.cobrador === dni);
  const pag = mios.filter(t => t.estado === 'pagado' && t.pagadoEn >= desde);
  const qr = pag.filter(t => t.metodo === 'qr'), ef = pag.filter(t => t.metodo === 'efectivo');
  const deu = mios.filter(t => t.estado === 'pendiente' && (t.fin || t.inicio) >= desde);
  return { desde, dni, pag, qr, ef, deu, act:tickets.filter(t => t.estado === 'activo'), esperado:Math.round(sum(ef) * 100) / 100 };
}

/* ---------- Reportes en formato CSV (se abre en Excel) ---------- */
const csv = filas => '﻿' + filas.map(r => r.map(v => '"' + String(v ?? '').replace(/"/g, '""') + '"').join(';')).join('\r\n');
const fh = t => t ? new Date(t).toLocaleString('es-PE') : '';
export const csvTickets = tickets => csv([
  ['Placa','Entrada','Salida','Minutos','Monto','Estado','Método','N° operación','Zona','Espacio','Cobrador (DNI)','Paga','Nombre','DNI','Color','Modelo','Ubicación del ingreso','Precisión ingreso (m)','Ubicación del cobro','Precisión cobro (m)'],
  ...tickets.map(t => [t.placa, fh(t.inicio), fh(t.fin), t.fin ? Math.round((t.fin - t.inicio) / 60000) : '', t.monto.toFixed(2), t.estado, t.metodo || '', t.op || '', t.zona || '', t.espacio || '', t.cobrador || '',
    t.pagador === 'conductor' ? 'Conductor' : t.pagador === 'dueno' ? 'Dueño' : '', t.nombre, t.dni, t.color, t.modelo,
    t.gps ? t.gps.lat + ',' + t.gps.lng : '', t.gps ? t.gps.prec : '', t.gpsCobro ? t.gpsCobro.lat + ',' + t.gpsCobro.lng : '', t.gpsCobro ? t.gpsCobro.prec : ''])
]);
export const csvTurnos = turnos => csv([
  ['Cobrador (DNI)','Inicio','Fin','Cobros','QR','Efectivo esperado','Efectivo contado','Diferencia','Deudas','Vehículos que quedaron','Explicación'],
  ...turnos.map(t => [t.dni, fh(t.desde), fh(t.hasta), t.cobros, t.qr.toFixed(2), t.efectivo.toFixed(2), t.contado.toFixed(2), t.diferencia.toFixed(2), t.deudas.toFixed(2), t.activos, t.nota])
]);
