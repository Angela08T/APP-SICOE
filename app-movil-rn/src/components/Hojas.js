/* Hojas.js: hojas inferiores más pequeñas.
   - HojaDatos: quién maneja (dueño u otro conductor) y datos del vehículo en parqueo
   - HojaGps: explicación del registro de ubicación (se muestra una sola vez)
   - HojaCierre: cierre de turno con cuadre de caja */
import { useState } from 'react';
import { Pressable, View } from 'react-native';
import Icono from './Icono';
import { HojaAcciones, HojaCabecera, HojaCuerpo, snack } from './Capas';
import { Aviso, Btn, Campo, Segmentado, T } from './ui';
import { useTema } from '../lib/tema';
import { guardar, leer, useDatos } from '../lib/datos';
import { DENOM, datosTurno, datosDueno, denTxt, durTxt, hhmm, key, money, sum } from '../lib/logica';
import { guardarDatos } from '../lib/acciones';
import { gpsExplicado, vibrar } from '../lib/servicios';

/* Los dos botones de «¿Quién maneja?» (también se usan en el registro de ingreso) */
export const QUIEN = [['dueno', 'Dueño'], ['conductor', 'Otro conductor']];
export const textoQuien = (q, hayDueno) => q === 'conductor' ? 'El pago quedará a nombre del conductor. Sus datos no se guardan como dueño de la placa.'
  : hayDueno ? 'Datos del dueño guardados para esta placa' : 'Primera vez con esta placa: escribe los datos del dueño y la app los recordará';

export function HojaDatos({ id, cerrar }){
  const c = useTema(), t = leer().tickets.find(x => x.id === id), dueno = datosDueno(leer().vehs, key(t.placa));
  const [quien, setQuien] = useState(t.pagador || 'dueno');
  const [d, setD] = useState({ nombre:t.nombre || '', dni:t.dni || '', color:t.color || '', modelo:t.modelo || '' });
  const cambiar = q => { setQuien(q); setD(x => ({ ...x, nombre:q === 'dueno' && dueno ? dueno.nombre : '', dni:q === 'dueno' && dueno ? dueno.dni : '' })); };
  return <>
    <HojaCabecera icono="user" titulo={t.placa} sub="Quién maneja y datos del vehículo" onCerrar={() => cerrar()} />
    <HojaCuerpo>
      <T size={12} color={c.text2} style={{ marginTop:18, marginLeft:4, marginBottom:6 }}>¿Quién maneja el vehículo?</T>
      <Segmentado opciones={QUIEN} valor={quien} onCambio={cambiar} />
      <T size={12.5} color={quien === 'dueno' && dueno ? c.ok : c.text2} style={{ marginTop:6, marginLeft:4 }}>{textoQuien(quien, !!dueno)}</T>
      <Campo label={quien === 'conductor' ? 'Nombre del conductor' : 'Nombre del dueño'} style={{ marginTop:14 }} value={d.nombre} onChangeText={v => setD(x => ({ ...x, nombre:v }))} />
      <View style={{ flexDirection:'row', gap:10, marginTop:12 }}>
        <Campo label="DNI" style={{ flex:1 }} value={d.dni} keyboardType="number-pad" maxLength={8} onChangeText={v => setD(x => ({ ...x, dni:v.replace(/\D/g, '') }))} />
        <Campo label="Color" style={{ flex:1 }} value={d.color} onChangeText={v => setD(x => ({ ...x, color:v }))} />
      </View>
      <Campo label="Marca y modelo" style={{ marginTop:12 }} value={d.modelo} onChangeText={v => setD(x => ({ ...x, modelo:v }))} />
    </HojaCuerpo>
    <HojaAcciones><Btn onPress={() => { guardarDatos(id, { nombre:d.nombre.trim(), dni:d.dni.trim(), color:d.color.trim(), modelo:d.modelo.trim() }, quien); cerrar(true); }}>Guardar</Btn></HojaAcciones>
  </>;
}

export function HojaGps({ cerrar }){
  const c = useTema();
  return <>
    <HojaCabecera icono="pin" titulo="Registro de ubicación" sub="Una sola vez" />
    <HojaCuerpo>
      <T size={14.5} color={c.text2} style={{ marginTop:16, lineHeight:22 }}>Al <T peso="medio" size={14.5}>registrar un ingreso</T> y al <T peso="medio" size={14.5}>confirmar un cobro</T>, la app guarda la ubicación del celular. Sirve para comprobar que el cobro se hizo en la zona asignada.</T>
      <T size={14.5} color={c.text2} style={{ marginTop:10, lineHeight:22 }}>No sigue tu recorrido: solo guarda el punto de esos dos momentos. Puedes desactivarlo en Ajustes.</T>
    </HojaCuerpo>
    <HojaAcciones><Btn icono="check" onPress={() => { gpsExplicado(); cerrar(); }}>Entendido</Btn></HojaAcciones>
  </>;
}

/* Cierre de turno: efectivo que el cobrador debe entregar (pagos en efectivo del turno) frente a lo que cuenta.
   Si no cuadra, se pide el motivo. Al confirmar se guarda el cierre y se cierra la sesión. */
export function HojaCierre({ cerrar }){
  const c = useTema(), tickets = useDatos(e => e.tickets), sesion = useDatos(e => e.sesion);
  const d = datosTurno(tickets, sesion);
  const [txt, setTxt] = useState(''), [conteo, setConteo] = useState({}), [abrirConteo, setAbrirConteo] = useState(false);
  const [nota, setNota] = useState(''), [err, setErr] = useState({});
  const raw = txt.replace(',', '.'), dif = raw === '' || isNaN(parseFloat(raw)) ? null : Math.round((parseFloat(raw) - d.esperado) * 100) / 100;
  const cuadra = dif !== null && Math.abs(dif) < .005;
  const sumar = (v, s) => { const n = { ...conteo, [v]:Math.max(0, (conteo[v] || 0) + s) }; setConteo(n); const tot = DENOM.reduce((a, x) => a + x * (n[x] || 0), 0); setTxt(tot ? tot.toFixed(2) : ''); setErr({}); };
  const confirmar = () => {
    if (dif === null){ setErr({ monto:true }); vibrar([40, 30, 40]); return; }
    if (!cuadra && !nota.trim()){ setErr({ nota:true }); snack('Explica por qué no cuadra la caja', 'alert'); vibrar([40, 30, 40]); return; }
    const ahora = Date.now();
    guardar(e => ({ turnos:[{ id:ahora.toString(36), dni:d.dni, desde:d.desde, hasta:ahora, cobros:d.pag.length, qr:Math.round(sum(d.qr) * 100) / 100,
      efectivo:d.esperado, contado:Math.round((d.esperado + dif) * 100) / 100, diferencia:dif, deudas:Math.round(sum(d.deu) * 100) / 100, nota:nota.trim(), activos:d.act.length }, ...e.turnos], sesion:null }));
    vibrar([30, 40, 30]); cerrar(true);
  };
  const Res = ({ a, b, s }) => <View style={{ flex:1, backgroundColor:c.surface2, borderRadius:14, paddingHorizontal:12, paddingVertical:10 }}>
    <T size={12} color={c.text2}>{a}</T><T peso="medio" size={17} numberOfLines={1}>{b}</T><T size={11.5} color={c.text3}>{s}</T></View>;
  return <>
    <HojaCabecera icono="wallet" titulo="Cerrar turno" sub={`DNI ${d.dni} · desde las ${hhmm(d.desde)} (${durTxt(Date.now() - d.desde)})`} onCerrar={() => cerrar()} />
    <HojaCuerpo>
      <View style={{ flexDirection:'row', gap:8, marginTop:16, marginBottom:10 }}>
        <Res a="Cobros" b={d.pag.length} s="en el turno" />
        <Res a="Por QR" b={money(sum(d.qr))} s={`${d.qr.length} ${d.qr.length === 1 ? 'pago' : 'pagos'}`} />
        <Res a="Deudas" b={money(sum(d.deu))} s={`${d.deu.length} ${d.deu.length === 1 ? 'placa' : 'placas'}`} />
      </View>
      <View style={{ borderRadius:18, backgroundColor:c.ink, padding:16, overflow:'hidden' }}>
        <T size={13} color="#C9D1E3">Efectivo que debes entregar</T>
        <T peso="numero" size={36} color="#fff">{money(d.esperado)}</T>
        <T size={12.5} color="#C9D1E3">{d.ef.length} {d.ef.length === 1 ? 'pago' : 'pagos'} en efectivo</T>
      </View>
      <Campo label="Efectivo contado" style={{ marginTop:14 }} value={txt} keyboardType="decimal-pad" placeholder="0.00" error={err.monto ? 'Escribe el efectivo que contaste' : null}
        onChangeText={v => { setTxt(v.replace(/[^\d.,]/g, '')); setConteo({}); setErr({}); }} inputStyle={{ fontSize:24, fontFamily:'PlusJakartaSans_600SemiBold' }} />
      <Pressable onPress={() => setAbrirConteo(a => !a)} style={{ flexDirection:'row', alignItems:'center', gap:6, paddingVertical:10, paddingHorizontal:4 }}>
        <View style={{ transform:[{ rotate:abrirConteo ? '180deg' : '0deg' }] }}><Icono n="chev" size={18} color={c.primary} /></View>
        <T peso="textoMedio" size={14} color={c.primary}>Contar billetes y monedas</T>
      </Pressable>
      {abrirConteo ? <View style={{ flexDirection:'row', flexWrap:'wrap', gap:6 }}>
        {DENOM.map(v => <View key={v} style={{ width:'48.8%', flexDirection:'row', alignItems:'center', gap:6, paddingVertical:6, paddingHorizontal:8, borderRadius:12, backgroundColor:c.surface2 }}>
          <T peso="textoMedio" size={13.5} style={{ flex:1 }}>{denTxt(v)}</T>
          <Mas icono="minus" onPress={() => sumar(v, -1)} /><T peso="medio" size={14} style={{ minWidth:22, textAlign:'center' }}>{conteo[v] || 0}</T><Mas icono="plus" onPress={() => sumar(v, 1)} />
        </View>)}
      </View> : null}
      {dif === null ? <Aviso tipo="info" icono="info">Cuenta el efectivo que tienes y escríbelo aquí</Aviso>
        : cuadra ? <Aviso tipo="ok" icono="checkc" titulo="La caja cuadra" />
        : dif < 0 ? <Aviso tipo="bad" icono="alert" titulo={`Faltan ${money(-dif)}`} /> : <Aviso tipo="warn" icono="alert" titulo={`Sobran ${money(dif)}`} />}
      {dif !== null && !cuadra ? <Campo label="¿Por qué no cuadra?" style={{ marginTop:12 }} value={nota} multiline placeholder="Ej.: di vuelto de más a ABC-123"
        onChangeText={v => { setNota(v); setErr({}); }} error={err.nota ? 'Escribe el motivo' : null} inputStyle={{ minHeight:60, textAlignVertical:'top' }} /> : null}
      {d.act.length ? <Aviso tipo="info" icono="info" titulo={`${d.act.length} ${d.act.length === 1 ? 'vehículo sigue' : 'vehículos siguen'} en parqueo`}>Seguirán contando y los cobrará el siguiente turno.</Aviso> : null}
    </HojaCuerpo>
    <HojaAcciones>
      <View style={{ flexDirection:'row', gap:8 }}>
        <Btn tipo="borde" flex={1} onPress={() => cerrar()}>Seguir trabajando</Btn>
        <Btn icono="check" flex={1.4} onPress={confirmar}>Cerrar turno</Btn>
      </View>
    </HojaAcciones>
  </>;
}
function Mas({ icono, onPress }){
  const c = useTema();
  return <Pressable onPress={onPress} hitSlop={4} style={{ width:30, height:30, borderRadius:15, backgroundColor:c.surface, borderWidth:1, borderColor:c.outline, alignItems:'center', justifyContent:'center' }}><Icono n={icono} size={16} color={c.primary} /></Pressable>;
}
