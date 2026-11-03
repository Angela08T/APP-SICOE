/* acciones.js: lo que pasa al registrar, cobrar o dejar una deuda.
   Cada acción cambia los datos, programa o cancela los avisos y guarda la ubicación cuando corresponde. */
import { guardar, leer } from './datos';
import { calc, deudasDe, hhmm, key, money, nuevoId, sum, vehiculoActualizado } from './logica';
import { cancelarAvisos, programarAvisos, ubicar, vibrar } from './servicios';
import { snack } from '../components/Capas';

let avisoGps = false;
const avisarGps = r => {
  if (avisoGps || r === 'ok' || r === 'apagado') return; avisoGps = true;
  setTimeout(() => snack(r === 'denegado' ? 'Sin permiso de ubicación: el registro se guardó sin GPS' : 'No se pudo obtener la ubicación (sin señal GPS)', 'pin'), 2800);
};

/* Registrar un ingreso: placa, zona, espacio y datos opcionales de quien maneja */
export function registrarIngreso({ placa, zona, espacio, datos, quien }){
  const { sesion } = leer(), k = key(placa);
  const t = { id:nuevoId(), placa, inicio:Date.now(), fin:null, monto:0, estado:'activo', zona, espacio, cobrador:sesion && sesion.dni, ...datos,
    pagador:datos.nombre || datos.dni ? quien : '' };
  guardar(e => {
    const nv = vehiculoActualizado(e.vehs, k, datos, quien);
    return { tickets:[t, ...e.tickets], ...(nv ? { vehs:{ ...e.vehs, [k]:nv } } : {}) };
  });
  programarAvisos(t);
  vibrar(40);
  const deb = deudasDe(leer().tickets, k);
  snack(deb.length ? `${placa} en el espacio ${espacio}: su deuda de ${money(sum(deb))} se cobrará al salir` : `${placa} en el espacio ${espacio} desde las ${hhmm(t.inicio)}`, deb.length ? 'alert' : 'checkc',
    { label:'Deshacer', fn:() => { cancelarAvisos(leer().tickets.find(x => x.id === t.id)); guardar(e => ({ tickets:e.tickets.filter(x => x.id !== t.id) })); snack('Ingreso anulado', 'x'); } });
  return t;
}
/* La ubicación del ingreso se guarda después (para mostrar antes la explicación la primera vez) */
export const ubicarIngreso = async id => avisarGps(await ubicar(id, 'gps'));

/* Detener el tiempo: fija la salida y el monto (si luego se elige «Seguir contando», se deshace) */
export function detener(id){
  const ahora = Date.now();
  guardar(e => ({ tickets:e.tickets.map(t => t.id === id ? { ...t, fin:ahora, monto:calc(ahora - t.inicio, e.cfg).monto } : t) }));
  vibrar(30);
}
export function seguirContando(id){
  const t = leer().tickets.find(x => x.id === id);
  if (t && t.estado === 'activo'){ guardar(e => ({ tickets:e.tickets.map(x => x.id === id ? { ...x, fin:null, monto:0 } : x) })); snack('El tiempo sigue contando', 'clock'); }
}

/* Qué se cobra: si es una deuda se cobran todas las de la placa; si el vehículo sale, su estacionamiento + sus deudas */
export function armarCobro(id, esDeuda){
  const { tickets } = leer(), t = tickets.find(x => x.id === id);
  const prev = deudasDe(tickets, key(t.placa)).filter(x => esDeuda || x.id !== t.id).sort((a, b) => a.inicio - b.inicio);
  return { t, prev, total:Math.round(((esDeuda ? 0 : t.monto) + sum(prev)) * 100) / 100, esDeuda };
}

/* Registrar el pago (QR o efectivo) del ticket y de todas las deudas incluidas */
export function pagar({ cobro, metodo, op, zona, verif }){
  const ahora = Date.now(), ids = new Set([cobro.t.id, ...cobro.prev.map(x => x.id)]);
  guardar(e => ({ tickets:e.tickets.map(x => {
    if (!ids.has(x.id)) return x;
    const y = { ...x, estado:'pagado', metodo, op, zona:x.zona || zona, pagadoEn:ahora };
    if (cobro.esDeuda || x.id !== cobro.t.id){ y.recuperada = true; y.cobradoJunto = cobro.t.id; } // deuda cobrada al volver
    if (x.id === cobro.t.id && metodo === 'qr' && verif) y.verif = { estado:verif.estado, monto:verif.monto, op:verif.op, fecha:verif.fecha, leido:ahora };
    return y;
  }) }));
  cancelarAvisos(cobro.t);
  ubicar(cobro.t.id, 'gpsCobro').then(avisarGps);
  vibrar([30, 40, 30]);
  const nDeu = cobro.esDeuda ? cobro.prev.length : cobro.prev.length;
  return { monto:money(cobro.total), texto:`${cobro.t.placa} · ${metodo === 'qr' ? 'pagado con QR' : 'pagado en efectivo'}${nDeu ? ` · incluye ${nDeu} ${nDeu > 1 ? 'deudas' : 'deuda'}` : ''}` };
}

/* El vehículo se fue sin pagar: queda como deuda de su placa */
export function noPago({ id, zona }){
  const t = leer().tickets.find(x => x.id === id);
  guardar(e => ({ tickets:e.tickets.map(x => x.id === id ? { ...x, estado:'pendiente', zona:x.zona || zona } : x) }));
  cancelarAvisos(t);
  ubicar(id, 'gpsCobro').then(avisarGps);
  snack(`${t.placa} quedó con deuda de ${money(t.monto)}`, 'alert', { label:'Deshacer', fn:() => {
    guardar(e => ({ tickets:e.tickets.map(x => x.id === id ? { ...x, estado:'activo', fin:null, monto:0 } : x) }));
    programarAvisos({ ...t, estado:'activo' }); snack('El tiempo sigue contando', 'clock');
  } });
}

/* Guardar los datos de quien maneja y del vehículo (desde «Datos» en Activos) */
export function guardarDatos(id, datos, quien){
  guardar(e => {
    const t = e.tickets.find(x => x.id === id), k = key(t.placa), nv = vehiculoActualizado(e.vehs, k, datos, quien);
    return { tickets:e.tickets.map(x => x.id === id ? { ...x, ...datos, pagador:datos.nombre || datos.dni ? quien : '' } : x), ...(nv ? { vehs:{ ...e.vehs, [k]:nv } } : {}) };
  });
  snack('Datos guardados');
}
