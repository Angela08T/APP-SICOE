/* servicios.js: funciones del celular que usan módulos nativos de Expo
   (vibración, ubicación, notificaciones, lector de texto, archivos y compartir). */
import { Platform, Vibration } from 'react-native';
import * as Location from 'expo-location';
import * as Notifications from 'expo-notifications';
import * as Sharing from 'expo-sharing';
import { File, Paths } from 'expo-file-system';
import { extractTextFromImage, isSupported as lectorDisponible } from 'expo-text-extractor';
import { cambiarCfg, cambiarTicket, leer } from './datos';
import { money } from './logica';

/* Vibración: un número (ms) o un patrón [pausa, vibra, pausa, vibra…] */
export const vibrar = p => { try { Vibration.vibrate(Array.isArray(p) ? [0, ...p] : p); } catch {} };

/* ---------- Ubicación al registrar ----------
   Solo en el momento de registrar un ingreso o un cobro (no sigue al cobrador).
   Guarda latitud, longitud y precisión en el ticket. Devuelve 'ok', 'denegado' o 'sin-senal'. */
export async function ubicar(id, campo){
  if (!leer().cfg.gps) return 'apagado';
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') return 'denegado';
    const pos = await Promise.race([
      Location.getCurrentPositionAsync({ accuracy:Location.Accuracy.High }),
      new Promise((_, mal) => setTimeout(() => mal(new Error('tiempo')), 20000))
    ]);
    cambiarTicket(id, { [campo]:{ lat:+pos.coords.latitude.toFixed(6), lng:+pos.coords.longitude.toFixed(6), prec:Math.round(pos.coords.accuracy || 0), en:Date.now() } });
    return 'ok';
  } catch { return 'sin-senal'; }
}

/* ---------- Aviso de cambio de fracción ----------
   Al registrar un vehículo se programan notificaciones para los próximos cambios de fracción
   (unos minutos antes de cada uno). Llegan aunque la app esté cerrada. Al cobrar se cancelan. */
const CANAL = 'avisos';
export async function prepararNotificaciones(){
  Notifications.setNotificationHandler({
    // Con la app abierta no se muestra la notificación: el aviso aparece dentro de la app
    handleNotification:async () => ({ shouldShowBanner:false, shouldShowList:false, shouldPlaySound:false, shouldSetBadge:false })
  });
  if (Platform.OS === 'android') await Notifications.setNotificationChannelAsync(CANAL, {
    name:'Avisos de cobro', description:'Cambio de fracción de los vehículos en parqueo',
    importance:Notifications.AndroidImportance.HIGH, vibrationPattern:[0, 250, 120, 250]
  });
}
export async function pedirPermisoAvisos(){
  try { const p = await Notifications.getPermissionsAsync(); if (!p.granted) await Notifications.requestPermissionsAsync(); } catch {}
}
const CUANTOS = 12; // cambios de fracción que se programan por vehículo (6 horas con fracciones de 30 min)
export async function programarAvisos(t){
  const { cfg } = leer(); if (!cfg.aviso) return;
  const ids = [];
  for (let k = 1; k <= CUANTOS; k++){
    const cambio = t.inicio + (cfg.tol + k * cfg.fraccion) * 60000, cuando = cambio - cfg.avisoMin * 60000;
    if (cuando < Date.now() + 5000) continue;
    try {
      ids.push(await Notifications.scheduleNotificationAsync({
        content:{ title:'Cambio de fracción', body:`${t.placa} sube a ${money((k + 1) * cfg.tarifa)} en ${cfg.avisoMin} min · Espacio ${t.espacio}`, data:{ id:t.id } },
        trigger:{ type:Notifications.SchedulableTriggerInputTypes.DATE, date:new Date(cuando), channelId:CANAL }
      }));
    } catch {}
  }
  cambiarTicket(t.id, { notis:ids });
}
export async function cancelarAvisos(t){
  for (const id of (t && t.notis) || []) { try { await Notifications.cancelScheduledNotificationAsync(id); } catch {} }
}
/* Al cambiar la tarifa o los avisos en Ajustes, se reprograman los de todos los vehículos en parqueo */
export async function reprogramarAvisos(){
  try { await Notifications.cancelAllScheduledNotificationsAsync(); } catch {}
  for (const t of leer().tickets.filter(x => x.estado === 'activo')) await programarAvisos(t);
}

/* ---------- Lector de constancias (ML Kit de Google, dentro del celular, sin internet) ---------- */
export async function leerTexto(uri){
  if (!lectorDisponible) throw new Error('Este celular no tiene el lector de texto');
  const lineas = await extractTextFromImage(uri);
  return (lineas || []).join('\n');
}

/* ---------- Archivos ---------- */
/* Crea el CSV y abre «Compartir» para guardarlo en Descargas, Drive, WhatsApp o correo */
export async function compartirCsv(nombre, contenido){
  const f = new File(Paths.cache, nombre);
  f.create({ overwrite:true });
  await f.write(contenido);
  await Sharing.shareAsync(f.uri, { mimeType:'text/csv', dialogTitle:'Guardar o enviar el reporte', UTI:'public.comma-separated-values-text' });
}
/* Copia la imagen del QR de cobro dentro de la app para que no dependa de la galería */
export async function guardarQr(uri){
  const destino = new File(Paths.document, 'qr-cobro-' + Date.now() + '.jpg');
  await new File(uri).copy(destino);
  const anterior = leer().qr;
  if (anterior){ try { new File(anterior).delete(); } catch {} }
  return destino.uri;
}
export const quitarQr = () => { const q = leer().qr; if (q){ try { new File(q).delete(); } catch {} } };
/* Marca que ya se explicó el registro de ubicación */
export const gpsExplicado = () => cambiarCfg({ gpsVisto:true });
