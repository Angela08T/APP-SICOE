/* datos.js: estado de la app guardado en el celular (sin servidor).
   Todo vive en un solo objeto «estado». Cualquier pantalla lo lee con useDatos(),
   y lo cambia con guardar({ ... }): se actualiza la pantalla y se guarda en el celular (AsyncStorage). */
import { useSyncExternalStore } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DEF } from './logica';

/* Cada dato con su nombre en el celular (son los mismos nombres que usaba la app anterior) */
const CLAVES = { tickets:'pm_tickets', vehs:'pm_vehs', cfg:'pm_cfg', qr:'pm_qr', turnos:'pm_turnos', sesion:'pm_sesion', dniRecordado:'pm_dni' };
const INICIAL = { tickets:[], vehs:{}, cfg:DEF, qr:null, turnos:[], sesion:null, dniRecordado:'' };

let estado = { ...INICIAL, cargado:false };
const oyentes = new Set();
const avisar = () => oyentes.forEach(f => f());

/* Lee todo del celular al abrir la app */
export async function cargarDatos(){
  const pares = await AsyncStorage.multiGet(Object.values(CLAVES));
  const leido = {};
  Object.entries(CLAVES).forEach(([k, clave]) => {
    const v = pares.find(([c]) => c === clave)?.[1];
    try { leido[k] = v != null ? JSON.parse(v) : INICIAL[k]; } catch { leido[k] = INICIAL[k]; }
  });
  leido.cfg = { ...DEF, ...(leido.cfg || {}) };
  estado = { ...estado, ...leido, cargado:true };
  avisar();
}

/* Cambia uno o más datos; acepta un objeto o una función que recibe el estado actual */
export function guardar(cambios){
  const c = typeof cambios === 'function' ? cambios(estado) : cambios;
  estado = { ...estado, ...c };
  avisar();
  const aGuardar = Object.keys(c).filter(k => CLAVES[k]).map(k => [CLAVES[k], JSON.stringify(c[k])]);
  if (aGuardar.length) AsyncStorage.multiSet(aGuardar).catch(() => {});
}

/* Lectura directa (fuera de las pantallas, por ejemplo en temporizadores) */
export const leer = () => estado;

/* Para las pantallas: se vuelven a dibujar cuando cambia el dato elegido */
export function useDatos(elegir = e => e){
  return useSyncExternalStore(f => { oyentes.add(f); return () => oyentes.delete(f); }, () => elegir(estado));
}

/* Atajos para cambiar tickets y ajustes */
export const cambiarTicket = (id, cambios) => guardar(e => ({ tickets:e.tickets.map(t => t.id === id ? { ...t, ...cambios } : t) }));
export const cambiarCfg = cambios => guardar(e => ({ cfg:{ ...e.cfg, ...cambios } }));
