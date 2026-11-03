/* activos.js: «Activos». Vehículos en parqueo con su tiempo y monto en vivo (se actualizan cada segundo).
   Si a un vehículo le faltan pocos minutos para subir de monto, su tarjeta se resalta en amarillo. */
import { useEffect, useState } from 'react';
import { Pressable, TextInput, View } from 'react-native';
import Pantalla from '../../components/Pantalla';
import Icono from '../../components/Icono';
import { Avatar, Btn, Pildora, T, Tarjeta, Vacio } from '../../components/ui';
import { F, useTema } from '../../lib/tema';
import { useDatos } from '../../lib/datos';
import { calc, deudasDe, dur, hhmm, key, money, sum } from '../../lib/logica';
import { abrirCobro, abrirDatos } from '../../lib/abrir';

export default function Activos(){
  const c = useTema(), tickets = useDatos(e => e.tickets), cfg = useDatos(e => e.cfg);
  const [q, setQ] = useState(''), [ahora, setAhora] = useState(Date.now());
  useEffect(() => { const iv = setInterval(() => setAhora(Date.now()), 1000); return () => clearInterval(iv); }, []);
  const todos = tickets.filter(t => t.estado === 'activo'), qk = key(q.toUpperCase());
  const lista = todos.filter(t => !qk || key(t.placa).includes(qk)).sort((a, b) => a.inicio - b.inicio);
  const total = todos.reduce((s, t) => s + calc(ahora - t.inicio, cfg).monto, 0);

  return <Pantalla titulo="En parqueo" sub={todos.length ? `${todos.length} ${todos.length > 1 ? 'vehículos contando tiempo' : 'vehículo contando tiempo'}` : 'Sin vehículos ahora'}>
    <View style={{ flexDirection:'row', alignItems:'center', gap:10, height:48, borderRadius:24, backgroundColor:c.surface, borderWidth:1, borderColor:c.outline, paddingHorizontal:16 }}>
      <Icono n="search" size={20} color={c.text3} />
      <TextInput value={q} onChangeText={setQ} placeholder="Buscar por placa" placeholderTextColor={c.text3} autoCapitalize="characters" style={{ flex:1, fontFamily:F.texto, fontSize:15, color:c.text }} />
      {q ? <Pressable onPress={() => setQ('')} hitSlop={8}><Icono n="x" size={20} color={c.text2} /></Pressable> : null}
    </View>
    <View style={{ flexDirection:'row', justifyContent:'space-between', marginTop:12, marginBottom:10, marginHorizontal:4 }}>
      <T size={12.5} color={c.text2}>{todos.length ? `${todos.length} ${todos.length > 1 ? 'vehículos' : 'vehículo'} · más antiguos primero` : ''}</T>
      {total ? <T size={12.5} color={c.text2}>Total: {money(total)}</T> : null}
    </View>
    {!lista.length ? <Tarjeta>{q ? <Vacio titulo="Sin resultados">No hay vehículos con «{q}».</Vacio> : <Vacio titulo="El parqueo está libre">Toca el botón «+» de abajo para registrar un vehículo.</Vacio>}</Tarjeta>
      : lista.map(t => <TarjetaVehiculo key={t.id} t={t} ahora={ahora} cfg={cfg} deudas={deudasDe(tickets, key(t.placa))} />)}
  </Pantalla>;
}

function TarjetaVehiculo({ t, ahora, cfg, deudas }){
  const c = useTema(), ms = ahora - t.inicio, f = calc(ms, cfg);
  const aviso = cfg.aviso && f.falta <= cfg.avisoMin, cerca = f.falta <= 5;
  const desc = [t.modelo, t.color].filter(Boolean).join(' · ');
  return <View style={{ backgroundColor:c.surface, borderRadius:20, borderWidth:aviso ? 2 : 1, borderColor:aviso ? c.yel : c.outline, padding:16, marginBottom:12 }}>
    <View style={{ flexDirection:'row', alignItems:'center', gap:12 }}>
      <Avatar tipo="on" icono="car" colorAuto={t.color} />
      <View style={{ flex:1 }}>
        <T peso="medio" size={17} style={{ letterSpacing:.5 }}>{t.placa}</T>
        <T size={12.5} color={c.text2} numberOfLines={1}>Entró {hhmm(t.inicio)}{desc ? ' · ' + desc : ''}</T>
        {t.zona ? <View style={{ flexDirection:'row', alignItems:'center', gap:4 }}><Icono n="pin" size={13} color={c.text2} />
          <T size={12.5} color={c.text2} numberOfLines={1} style={{ flex:1 }}>Espacio {t.espacio}{t.gps ? <T size={12.5} color={c.ok}> · GPS ±{t.gps.prec} m</T> : null} · {t.zona}</T></View> : null}
      </View>
      <Pildora tipo="on" punto>En curso</Pildora>
    </View>
    <View style={{ flexDirection:'row', backgroundColor:c.surface2, borderRadius:14, marginTop:14 }}>
      <View style={{ flex:1, paddingVertical:10, paddingHorizontal:14 }}><T size={12} color={c.text2}>Tiempo</T><T peso="medio" size={21} style={{ fontVariant:['tabular-nums'] }}>{dur(ms)}</T></View>
      <View style={{ flex:1, paddingVertical:10, paddingHorizontal:14, borderLeftWidth:1, borderLeftColor:c.outline }}><T size={12} color={c.text2}>Monto actual</T><T peso="medio" size={21}>{money(f.monto)}</T></View>
    </View>
    {/* Avance de la fracción actual */}
    <View style={{ height:6, borderRadius:3, backgroundColor:c.surface3, marginTop:14, marginBottom:6, overflow:'hidden' }}>
      <View style={{ height:6, borderRadius:3, width:(Math.max(.015, f.prog) * 100) + '%', backgroundColor:cerca ? c.warn : c.primary }} />
    </View>
    {deudas.length ? <View style={{ flexDirection:'row', alignItems:'center', gap:8, marginTop:4, marginBottom:6, paddingHorizontal:12, paddingVertical:8, borderRadius:12, backgroundColor:c.badSoft }}>
      <Icono n="alert" size={16} color={c.bad} /><T size={13} color={c.bad} style={{ flex:1 }}>Debe <T peso="titulo" size={13} color={c.bad}>{money(sum(deudas))}</T> de {deudas.length} {deudas.length > 1 ? 'veces' : 'vez'} anteriores: se sumará al cobrar</T>
    </View> : null}
    <View style={{ flexDirection:'row', justifyContent:'space-between', alignItems:'center' }}>
      <T size={12} color={aviso ? c.yelInk : c.text2} peso={aviso ? 'textoMedio' : 'texto'}>Fracción {f.n}</T>
      <View style={{ flexDirection:'row', alignItems:'center', gap:4 }}>
        {aviso ? <Icono n="bell" size={14} color={c.warn} /> : null}
        <T size={12} color={aviso ? c.yelInk : c.text2}>Sube a <T peso="medio" size={12} color={cerca ? c.warn : c.text2}>{money((f.n + 1) * cfg.tarifa)}</T> en {f.falta} min</T>
      </View>
    </View>
    <View style={{ flexDirection:'row', justifyContent:'flex-end', gap:8, marginTop:12 }}>
      <Btn tipo="texto" chico icono="pencil" onPress={() => abrirDatos(t.id)}>Datos</Btn>
      <Btn chico onPress={() => abrirCobro(t.id)}>Detener y cobrar</Btn>
    </View>
  </View>;
}
