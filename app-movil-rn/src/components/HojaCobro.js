/* HojaCobro.js: hoja de cobro al detener el tiempo (o al cobrar una deuda).
   Muestra el total (estacionamiento + deudas anteriores de la placa, con su detalle), el QR de la municipalidad,
   la verificación de la constancia y los botones: Efectivo, Pagó con QR, Seguir contando y Se fue sin pagar. */
import { useMemo, useRef, useState } from 'react';
import { Image, Pressable, View } from 'react-native';
import Icono from './Icono';
import Camara from './Camara';
import ElegirZona from './ElegirZona';
import { HojaAcciones, HojaCabecera, HojaCuerpo, pagoOk, snack } from './Capas';
import { Avatar, Btn, Campo, T } from './ui';
import { useTema } from '../lib/tema';
import { cambiarCfg, leer, useDatos } from '../lib/datos';
import { analizarConstancia, calc, durTxt, hhmm, money, opUsada } from '../lib/logica';
import { armarCobro, noPago, pagar, seguirContando } from '../lib/acciones';
import { vibrar } from '../lib/servicios';

export default function HojaCobro({ id, esDeuda, cerrar }){
  const c = useTema(), cfg = useDatos(e => e.cfg), qr = useDatos(e => e.qr), tickets = useDatos(e => e.tickets);
  const cobro = useMemo(() => armarCobro(id, esDeuda), [id, esDeuda]);
  const { t, prev, total } = cobro, ms = (t.fin || Date.now()) - t.inicio, f = calc(ms, cfg);
  const [verif, setVerif] = useState(null), [op, setOp] = useState(''), [forzar, setForzar] = useState(false);
  const [zona, setZona] = useState(t.zona || cfg.zona || ''), [errZona, setErrZona] = useState(false), [camara, setCamara] = useState(false);
  const scroll = useRef(null);
  const opLimpio = op.replace(/\D/g, ''), opPrevio = opLimpio.length >= 6 && opUsada(tickets, opLimpio, t.id);
  const fecha = x => new Date(x.inicio).toLocaleDateString('es-PE', { day:'numeric', month:'short' }) + ' · ' + hhmm(x.inicio);
  const desc = [t.modelo, t.color, t.nombre ? 'Paga ' + t.nombre + (t.pagador === 'conductor' ? ' (conductor)' : t.pagador === 'dueno' ? ' (dueño)' : '') : ''].filter(Boolean).join(' · ');

  /* La zona es obligatoria antes de registrar el pago o la deuda */
  const zonaOk = () => { if (t.zona || zona) return t.zona || zona; setErrZona(true); vibrar([40, 30, 40]); scroll.current?.scrollToEnd(); return null; };
  const alPagar = metodo => {
    const z = zonaOk(); if (!z) return;
    // Con QR: si la constancia no cuadra o el N° de operación ya se usó, se pide un segundo toque para confirmar
    if (metodo === 'qr' && !forzar && ((verif && verif.estado === 'alerta') || opPrevio)){ setForzar(true); snack('Revisa la constancia: tiene problemas', 'alert'); vibrar([40, 30, 40]); return; }
    const r = pagar({ cobro, metodo, op:opLimpio, zona:z, verif:metodo === 'qr' ? verif : null });
    cerrar(true); pagoOk(r.monto, r.texto);
  };
  const alNoPagar = () => { const z = zonaOk(); if (!z) return; noPago({ id:t.id, zona:z }); cerrar(true); };
  const alLeer = txt => {
    const v = analizarConstancia(txt, { t, debe:total, esDeuda, tickets:leer().tickets });
    setVerif(v); setForzar(false); if (v.op && !opLimpio) setOp(v.op); setCamara(false);
    vibrar(v.estado === 'ok' ? 30 : [40, 30, 40]);
  };

  return <>
    <HojaCabecera icono={esDeuda ? 'alert' : 'car'} tipo={esDeuda ? 'bad' : 'on'} titulo={t.placa} onCerrar={() => cerrar()}
      sub={esDeuda ? (prev.length > 1 ? prev.length + ' deudas pendientes' : 'Deuda del ' + new Date(t.inicio).toLocaleDateString('es-PE', { day:'numeric', month:'long' })) : desc || 'Ticket de salida'} />
    <HojaCuerpo refScroll={scroll}>
      {/* Total a pagar */}
      <View style={{ marginTop:16, borderRadius:20, backgroundColor:c.surface2, padding:16, alignItems:'center' }}>
        <T size={13} color={c.text2}>Total a pagar</T>
        <T peso="numero" size={50} style={{ marginVertical:2 }}>{money(total)}</T>
        <View style={{ flexDirection:'row', flexWrap:'wrap', justifyContent:'center', gap:6 }}>
          {esDeuda ? <Chip icono="alert">{prev.length} {prev.length > 1 ? 'deudas' : 'deuda'}</Chip>
            : <><Chip icono="clock">{durTxt(ms)}</Chip><Chip icono="receipt">{f.n} {f.n > 1 ? 'fracciones' : 'fracción'} × {money(cfg.tarifa)}</Chip></>}
          {!esDeuda && prev.length ? <Chip icono="alert">+ {prev.length} {prev.length > 1 ? 'deudas' : 'deuda'}</Chip> : null}
        </View>
      </View>

      {/* Detalle cuando incluye deudas anteriores */}
      {prev.length ? <View style={{ marginTop:12, borderWidth:1, borderColor:c.outline, borderRadius:16, overflow:'hidden' }}>
        <View style={{ flexDirection:'row', alignItems:'center', gap:8, paddingHorizontal:14, paddingVertical:10, backgroundColor:c.badSoft }}>
          <Icono n="alert" size={17} color={c.bad} /><T peso="textoMedio" size={13.5} color={c.bad}>{esDeuda ? 'Deudas pendientes de esta placa' : 'Incluye deudas anteriores de esta placa'}</T></View>
        {!esDeuda ? <Linea a="Estacionamiento de hoy" sub={`${durTxt(ms)} · ${f.n} ${f.n > 1 ? 'fracciones' : 'fracción'}`} b={money(t.monto)} /> : null}
        {prev.map(x => <Linea key={x.id} a={'Deuda del ' + fecha(x)} sub={x.zona ? (x.espacio ? 'E' + x.espacio + ' · ' : '') + x.zona : 'Se fue sin pagar'} b={money(x.monto)} />)}
        <Linea a="Total a cobrar" b={money(total)} fuerte />
      </View> : null}

      {!esDeuda ? <View style={{ marginVertical:12 }}>
        <Detalle a="Entrada" b={hhmm(t.inicio)} /><Detalle a="Salida" b={hhmm(t.fin || Date.now())} borde />
      </View> : <View style={{ height:12 }} />}

      {/* QR de la municipalidad */}
      <View style={{ borderWidth:1, borderColor:c.outline, borderRadius:20, padding:16, alignItems:'center', backgroundColor:'#fff' }}>
        {qr ? <Image source={{ uri:qr }} style={{ width:190, height:190 }} resizeMode="contain" />
          : <View style={{ width:190, height:190, borderRadius:12, backgroundColor:'#F1F3F6', alignItems:'center', justifyContent:'center', gap:8, padding:16 }}>
              <Icono n="qr" size={32} color="#8B919A" /><T size={12.5} color="#5C626B" style={{ textAlign:'center' }}>Sube el QR de la municipalidad en Ajustes</T></View>}
        <T size={14} color="#191C20" style={{ marginTop:10, textAlign:'center' }}>Pide al conductor que escanee y pague <T peso="medio" size={14} color="#191C20">{money(total)}</T></T>
        <T size={12.5} color="#5C626B">{cfg.qrText}</T>
      </View>

      {/* Verificación de la constancia */}
      <View style={{ marginTop:16, borderWidth:1, borderColor:c.outline, borderRadius:20, padding:14 }}>
        <View style={{ flexDirection:'row', alignItems:'center', gap:12, marginBottom:12 }}>
          <View style={{ width:40, height:40, borderRadius:12, backgroundColor:c.primarySoft, alignItems:'center', justifyContent:'center' }}><Icono n="shield" size={21} color={c.primary} /></View>
          <View style={{ flex:1 }}><T peso="textoMedio" size={15}>Verificar el pago</T><T size={12.5} color={c.text2}>Foto de la constancia de Yape o Plin del conductor</T></View>
        </View>
        <Btn tipo="tonal" icono="camera" onPress={() => setCamara(true)}>Leer constancia</Btn>
        {verif ? <Resultado v={verif} onRepetir={() => setCamara(true)} /> : null}
        <Campo label="N° de operación" style={{ marginTop:12 }} value={op} onChangeText={v => { setOp(v); setForzar(false); }} keyboardType="number-pad" placeholder="Ej. 12345678"
          error={opPrevio ? `Este N° ya se usó para ${opPrevio.placa} a las ${hhmm(opPrevio.pagadoEn || opPrevio.fin || opPrevio.inicio)}` : null} />
        {!opPrevio && opLimpio.length >= 6 ? <T size={12.5} color={c.ok} style={{ marginLeft:4, marginTop:5 }}>N° no usado antes</T> : null}
      </View>

      {/* Ubicación del vehículo o zona (obligatoria si el ticket no la tiene) */}
      {t.zona ? <View style={{ flexDirection:'row', alignItems:'center', gap:12, padding:14, borderRadius:14, backgroundColor:c.surface2, marginTop:16 }}>
          <View style={{ width:36, height:36, borderRadius:11, backgroundColor:c.primarySoft, alignItems:'center', justifyContent:'center' }}><Icono n="pin" size={18} color={c.primary} /></View>
          <View style={{ flex:1 }}><T size={12} color={c.text2}>Ubicación del vehículo{t.gps ? ` · GPS ±${t.gps.prec} m` : cfg.gps ? ' · sin GPS' : ''}</T><T peso="medio" size={14.5} numberOfLines={1}>{t.zona}</T></View>
          {t.espacio ? <View style={{ alignItems:'center', backgroundColor:c.primary, borderRadius:10, paddingHorizontal:10, paddingVertical:4 }}><T size={10.5} color={c.onPrimary}>Espacio</T><T peso="numero" size={20} color={c.onPrimary}>{t.espacio}</T></View> : null}
        </View>
        : <View style={{ marginTop:16 }}>
          <T size={12} color={c.text2} style={{ marginLeft:4, marginBottom:5 }}>Zona de estacionamiento</T>
          <ElegirZona valor={zona} conLibres={false} error={errZona} onCambio={z => { setZona(z); setErrZona(false); cambiarCfg({ zona:z }); }} />
          <T size={12.5} color={errZona ? c.bad : c.text2} style={{ marginLeft:4, marginTop:5 }}>{errZona ? 'Selecciona la zona antes de continuar' : zona ? 'Se recordará para el siguiente cobro' : 'Obligatorio para registrar el cobro'}</T>
        </View>}
    </HojaCuerpo>

    <HojaAcciones>
      <View style={{ flexDirection:'row', gap:8 }}>
        <Btn tipo="borde" icono="cash" flex={1} onPress={() => alPagar('efectivo')}>Efectivo</Btn>
        <Btn tipo={forzar ? 'peligro' : 'primario'} icono={forzar ? 'alert' : 'check'} flex={1.6} onPress={() => alPagar('qr')}>{forzar ? 'Registrar de todos modos' : 'Pagó con QR'}</Btn>
      </View>
      {!esDeuda ? <View style={{ flexDirection:'row' }}>
        <Btn tipo="texto" flex={1} onPress={() => { seguirContando(t.id); cerrar(true); }}>Seguir contando</Btn>
        <Btn tipo="peligroTexto" flex={1} onPress={alNoPagar}>Se fue sin pagar</Btn>
      </View> : null}
    </HojaAcciones>

    <Camara visible={camara} onCerrar={() => setCamara(false)} onTexto={alLeer} />
  </>;
}

function Chip({ icono, children }){
  const c = useTema();
  return <View style={{ flexDirection:'row', alignItems:'center', gap:5, borderWidth:1, borderColor:c.outline, backgroundColor:c.surface, borderRadius:99, paddingHorizontal:10, paddingVertical:4 }}>
    <Icono n={icono} size={14} color={c.text2} /><T size={12.5} color={c.text2}>{children}</T></View>;
}
function Linea({ a, sub, b, fuerte }){
  const c = useTema();
  return <View style={{ flexDirection:'row', justifyContent:'space-between', gap:10, paddingHorizontal:14, paddingVertical:10, borderTopWidth:1, borderTopColor:c.outline, backgroundColor:fuerte ? c.surface2 : 'transparent' }}>
    <View style={{ flex:1 }}><T peso={fuerte ? 'medio' : 'texto'} size={14} color={fuerte ? c.text : c.text2}>{a}</T>{sub ? <T size={12} color={c.text3}>{sub}</T> : null}</View>
    <T peso={fuerte ? 'titulo' : 'textoMedio'} size={14}>{b}</T>
  </View>;
}
function Detalle({ a, b, borde }){
  const c = useTema();
  return <View style={{ flexDirection:'row', justifyContent:'space-between', paddingVertical:10, paddingHorizontal:4, borderTopWidth:borde ? 1 : 0, borderTopColor:c.outline, borderStyle:'dashed' }}>
    <T size={14} color={c.text2}>{a}</T><T peso="medio" size={14}>{b}</T></View>;
}
/* Resultado de la lectura: válida, revisar o posible constancia falsa, con el detalle de cada revisión */
function Resultado({ v, onRepetir }){
  const c = useTema();
  const [bg, fg, ic, tit] = { ok:[c.okSoft, c.ok, 'checkc', 'Constancia válida'], revisar:[c.warnSoft, c.warn, 'info', 'Revisa la constancia'], alerta:[c.badSoft, c.bad, 'alert', 'Posible constancia falsa o repetida'] }[v.estado];
  return <View style={{ marginTop:12, borderRadius:16, overflow:'hidden', borderWidth:1, borderColor:c.outline }}>
    <View style={{ flexDirection:'row', alignItems:'center', gap:10, paddingHorizontal:14, paddingVertical:12, backgroundColor:bg }}>
      <Icono n={ic} size={20} color={fg} /><T peso="textoMedio" size={14.5} color={fg} style={{ flex:1 }}>{tit}</T>
      <Pressable onPress={onRepetir} hitSlop={8}><T peso="medio" size={13} color={fg} style={{ textDecorationLine:'underline' }}>Repetir</T></Pressable>
    </View>
    {v.items.map((i, k) => { const [b2, f2, i2] = { ok:[c.okSoft, c.ok, 'check'], bad:[c.badSoft, c.bad, 'x'], unk:[c.warnSoft, c.warn, 'info'] }[i.s];
      return <View key={k} style={{ flexDirection:'row', gap:10, paddingHorizontal:14, paddingVertical:9, borderTopWidth:k ? 1 : 0, borderTopColor:c.outline }}>
        <View style={{ width:22, height:22, borderRadius:11, backgroundColor:b2, alignItems:'center', justifyContent:'center', marginTop:1 }}><Icono n={i2} size={13} color={f2} grosor={2.6} /></View>
        <View style={{ flex:1 }}><T peso="textoMedio" size={13.5}>{i.t}</T><T size={13} color={c.text2}>{i.d}</T></View>
      </View>; })}
  </View>;
}
