/* abrir.js: atajos para abrir las hojas desde cualquier pantalla. */
import { abrirHoja } from '../components/Capas';
import HojaCobro from '../components/HojaCobro';
import { HojaCierre, HojaDatos, HojaGps } from '../components/Hojas';
import { detener, seguirContando } from './acciones';

/* Detener el tiempo y abrir el cobro; si se cierra sin cobrar, el tiempo sigue contando */
export function abrirCobro(id){ detener(id); abrirHoja(HojaCobro, { id, esDeuda:false }, () => seguirContando(id)); }
/* Cobrar las deudas de una placa (sin estacionamiento nuevo) */
export const abrirDeuda = id => abrirHoja(HojaCobro, { id, esDeuda:true });
export const abrirDatos = id => abrirHoja(HojaDatos, { id });
export const abrirCierre = () => abrirHoja(HojaCierre);
/* Explicación de la ubicación (la primera vez); al cerrarla se continúa con «seguir» */
export const abrirGps = seguir => abrirHoja(HojaGps, {}, seguir);
