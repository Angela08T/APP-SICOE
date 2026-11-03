/* ajustes.js: «Ajustes». QR de cobro, tarifa, aviso de cambio de fracción, ubicación, cierres de turno,
   tema, reporte en Excel, cerrar turno (con cuadre de caja) y borrar registros. */
import { useEffect, useState } from 'react';
import { Image, Pressable, TextInput, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import Pantalla from '../../components/Pantalla';
import Icono from '../../components/Icono';
import { snack } from '../../components/Capas';
import { Btn, Campo, FilaAjuste, Interruptor, Pildora, Segmentado, Subtitulo, T, Tarjeta } from '../../components/ui';
import { F, useTema } from '../../lib/tema';
import { cambiarCfg, guardar, leer, useDatos } from '../../lib/datos';
import { csvTickets, csvTurnos, hhmm, money } from '../../lib/logica';
import { abrirCierre } from '../../lib/abrir';
import { compartirCsv, guardarQr, pedirPermisoAvisos, quitarQr, reprogramarAvisos } from '../../lib/servicios';

const hoyIso = () => new Date().toISOString().slice(0, 10);

export default function Ajustes(){
  const c = useTema(), cfg = useDatos(e => e.cfg), qr = useDatos(e => e.qr), turnos = useDatos(e => e.turnos), sesion = useDatos(e => e.sesion);
  const [borrar, setBorrar] = useState(false);
  useEffect(() => { if (!borrar) return; const t = setTimeout(() => setBorrar(false), 4000); return () => clearTimeout(t); }, [borrar]);

  const subirQr = async () => {
    const r = await ImagePicker.launchImageLibraryAsync({ mediaTypes:['images'], quality:.9 });
    if (r.canceled || !r.assets?.[0]) return;
    try { guardar({ qr:await guardarQr(r.assets[0].uri) }); snack('QR guardado'); } catch { snack('No se pudo guardar la imagen', 'alert'); }
  };
  /* Tarifa: se guarda al terminar de escribir; si el valor no es válido, se deja el anterior */
  const numero = (campo, txt, min) => { const v = Number(String(txt).replace(',', '.')); if (!isFinite(v) || v < min) return false; cambiarCfg({ [campo]:v }); reprogramarAvisos(); snack('Cambio guardado'); return true; };
  const ej = m => money(Math.max(1, Math.ceil(Math.max(0, m - cfg.tol) / cfg.fraccion)) * cfg.tarifa);

  return <Pantalla titulo="Ajustes" sub="QR de pago, tarifa y preferencias">
    <Subtitulo style={{ marginTop:4 }}>Pago con QR</Subtitulo>
    <Tarjeta pad={false}>
      <FilaAjuste borde={false} titulo="Código QR de la municipalidad" sub={qr ? null : 'Aún no se ha subido'}>
        {qr ? <Image source={{ uri:qr }} style={{ width:56, height:56, borderRadius:10, borderWidth:1, borderColor:c.outline, backgroundColor:'#fff' }} resizeMode="contain" /> : <Icono n="qr" size={28} color={c.text3} />}
      </FilaAjuste>
      {qr ? <View style={{ flexDirection:'row', alignItems:'center', gap:4, marginTop:-14, marginLeft:16, marginBottom:8 }}><Icono n="checkc" size={14} color={c.ok} /><T size={12.5} color={c.ok}>Listo para cobrar</T></View> : null}
      <View style={{ flexDirection:'row', gap:8, paddingHorizontal:16, paddingBottom:14 }}>
        <Btn tipo="tonal" chico icono="upload" flex={1} onPress={subirQr}>{qr ? 'Cambiar imagen' : 'Subir imagen'}</Btn>
        {qr ? <Btn tipo="peligroTexto" chico onPress={() => { quitarQr(); guardar({ qr:null }); snack('QR quitado', 'x'); }}>Quitar</Btn> : null}
      </View>
      <View style={{ paddingHorizontal:16, paddingBottom:16 }}><CampoGuardado label="Texto debajo del QR" valor={cfg.qrText} onGuardar={v => { cambiarCfg({ qrText:v }); snack('Cambio guardado'); }} /></View>
    </Tarjeta>

    <Subtitulo>Tarifa</Subtitulo>
    <Tarjeta pad={false}>
      <FilaAjuste borde={false} icono="coins" titulo="Monto por fracción" sub="En soles"><NumeroAjuste valor={Number(cfg.tarifa).toFixed(2)} onGuardar={v => numero('tarifa', v, 0)} /></FilaAjuste>
      <FilaAjuste icono="timer" titulo="Duración de la fracción" sub="En minutos"><NumeroAjuste valor={String(cfg.fraccion)} onGuardar={v => numero('fraccion', v, 1)} /></FilaAjuste>
      <FilaAjuste icono="hourglass" titulo="Tolerancia" sub="Minutos de gracia"><NumeroAjuste valor={String(cfg.tol)} onGuardar={v => numero('tol', v, 0)} /></FilaAjuste>
      <View style={{ flexDirection:'row', gap:12, padding:16, backgroundColor:c.surface2, alignItems:'center' }}><Icono n="info" size={20} color={c.text2} />
        <T size={12.5} color={c.text2} style={{ flex:1 }}>Ejemplo: 10 min = {ej(10)} · 1 h = {ej(60)} · 1 h 10 min = {ej(70)}</T></View>
    </Tarjeta>

    <Subtitulo>Avisos y ubicación</Subtitulo>
    <Tarjeta pad={false}>
      <FilaAjuste borde={false} icono="bell" titulo="Aviso de cambio de fracción" sub="Vibra y avisa (aunque la app esté cerrada) cuando a un vehículo le falten pocos minutos para subir de monto">
        <Interruptor valor={cfg.aviso} onCambio={v => { cambiarCfg({ aviso:v }); reprogramarAvisos(); if (v) pedirPermisoAvisos(); snack(v ? 'Aviso de cambio de fracción activado' : 'Aviso desactivado', v ? 'bell' : 'x'); }} />
      </FilaAjuste>
      <FilaAjuste icono="timer" titulo="Avisar con" sub="Minutos antes del cambio" apagado={!cfg.aviso}>
        <View style={{ width:170 }}><Segmentado opciones={[[1, '1'], [2, '2'], [3, '3'], [5, '5']]} valor={cfg.avisoMin} onCambio={v => { cambiarCfg({ avisoMin:v }); reprogramarAvisos(); snack(`Avisará ${v} min antes del cambio`, 'bell'); }} /></View>
      </FilaAjuste>
      <FilaAjuste icono="pin" titulo="Registrar ubicación" sub={cfg.gps ? 'Guarda dónde se hizo cada ingreso y cada cobro' : 'Desactivado'}>
        <Interruptor valor={cfg.gps} onCambio={v => { cambiarCfg({ gps:v }); snack(v ? 'Se registrará la ubicación de ingresos y cobros' : 'Ya no se registrará la ubicación', 'pin'); }} />
      </FilaAjuste>
    </Tarjeta>

    <Subtitulo accion="Descargar" onAccion={() => turnos.length ? compartirCsv('cierres-turno-' + hoyIso() + '.csv', csvTurnos(leer().turnos)).catch(() => {}) : snack('Aún no hay cierres de turno', 'info')}>Cierres de turno</Subtitulo>
    <Tarjeta pad={false}>
      {turnos.length ? turnos.slice(0, 5).map((t, i) => { const [tipo, txt] = Math.abs(t.diferencia) < .005 ? ['ok', 'Cuadró'] : t.diferencia < 0 ? ['bad', 'Faltó ' + money(-t.diferencia)] : ['warn', 'Sobró ' + money(t.diferencia)];
        return <View key={t.id} style={{ flexDirection:'row', alignItems:'center', gap:12, paddingHorizontal:16, paddingVertical:12, borderTopWidth:i ? 1 : 0, borderTopColor:c.outline }}>
          <View style={{ flex:1 }}>
            <T peso="textoMedio" size={14.5}>{new Date(t.desde).toLocaleDateString('es-PE', { weekday:'short', day:'numeric', month:'short' })} · {hhmm(t.desde)} – {hhmm(t.hasta)}</T>
            <T size={12.5} color={c.text2}>Efectivo {money(t.efectivo)} · contado {money(t.contado)} · QR {money(t.qr)}</T>
            {t.nota ? <T size={12.5} color={c.text2}>«{t.nota}»</T> : null}
          </View>
          <Pildora tipo={tipo}>{txt}</Pildora>
        </View>; })
        : <View style={{ padding:16 }}><T size={12.5} color={c.text2}>Aún no hay cierres. Se guardan al tocar «Cerrar turno».</T></View>}
    </Tarjeta>

    <Subtitulo>General</Subtitulo>
    <Tarjeta pad={false}>
      <View style={{ padding:16 }}><CampoGuardado label="Nombre del parqueo" valor={cfg.nombre} onGuardar={v => { cambiarCfg({ nombre:v || 'Parqueo Municipal' }); snack('Cambio guardado'); }} /></View>
      <FilaAjuste icono="sun" titulo="Tema" sub="Claro, oscuro o según el celular" />
      <View style={{ paddingHorizontal:16, paddingBottom:14, marginTop:-6 }}><Segmentado opciones={[['auto', 'Automático'], ['light', 'Claro'], ['dark', 'Oscuro']]} valor={cfg.tema} onCambio={v => cambiarCfg({ tema:v })} /></View>
      <FilaAjuste icono="download" titulo="Reporte completo" sub="Todos los registros en formato Excel">
        <Btn tipo="texto" chico onPress={() => compartirCsv('parqueo-' + hoyIso() + '.csv', csvTickets(leer().tickets)).catch(() => snack('No se pudo crear el reporte', 'alert'))}>Descargar</Btn>
      </FilaAjuste>
      <FilaAjuste titulo="Sesión activa" sub={sesion ? `DNI ${sesion.dni} · desde las ${hhmm(sesion.desde)}` : ''}>
        <Btn tipo="peligroTexto" chico onPress={abrirCierre}>Cerrar turno</Btn>
      </FilaAjuste>
      <FilaAjuste icono="trash" titulo="Borrar registros" sub="Elimina todo lo guardado en este equipo">
        <Btn tipo="peligroTexto" chico onPress={() => { if (!borrar) return setBorrar(true); guardar({ tickets:[], vehs:{} }); reprogramarAvisos(); setBorrar(false); snack('Registros borrados', 'trash'); }}>{borrar ? 'Confirmar' : 'Borrar'}</Btn>
      </FilaAjuste>
    </Tarjeta>
    <T size={12} color={c.text3} style={{ textAlign:'center', marginTop:22, lineHeight:19 }}>SICOE · versión 2.0 (React Native){'\n'}Los datos se guardan en este equipo y funcionan sin internet.</T>
  </Pantalla>;
}

/* Campo numérico pequeño que se guarda al salir del campo */
function NumeroAjuste({ valor, onGuardar }){
  const c = useTema(), [v, setV] = useState(valor);
  useEffect(() => setV(valor), [valor]);
  return <TextInput value={v} onChangeText={setV} keyboardType="decimal-pad" onEndEditing={() => { if (!onGuardar(v)) setV(valor); }}
    style={{ width:78, height:40, borderRadius:12, backgroundColor:c.surface2, textAlign:'right', paddingHorizontal:12, fontFamily:F.medio, fontSize:15, color:c.text }} />;
}
/* Campo de texto que se guarda al salir del campo */
function CampoGuardado({ label, valor, onGuardar }){
  const [v, setV] = useState(valor);
  useEffect(() => setV(valor), [valor]);
  return <Campo label={label} value={v} onChangeText={setV} onEndEditing={() => v !== valor && onGuardar(v.trim())} />;
}
