/* ui.js: piezas de interfaz que se repiten en todas las pantallas (equivalen a los estilos de la app anterior). */
import { useState } from 'react';
import { Pressable, Text, TextInput, View, Switch, ActivityIndicator } from 'react-native';
import Icono from './Icono';
import { ARCOIRIS, F, useTema } from '../lib/tema';
import { calc, colorHex, durTxt, hace, hhmm, money } from '../lib/logica';
import { useDatos } from '../lib/datos';

/* Texto con la tipografía de la app; «peso» elige la variante: texto, textoMedio, medio, titulo, tituloFuerte o numero */
export function T({ style, peso = 'texto', color, size = 15, children, ...rest }){
  const c = useTema();
  return <Text style={[{ fontFamily:F[peso], fontSize:size, color:color || c.text }, style]} {...rest}>{children}</Text>;
}

/* Franja de colores de San Juan de Lurigancho */
export const Franja = ({ alto = 4, style }) => <View style={[{ flexDirection:'row', height:alto }, style]}>{ARCOIRIS.map(c => <View key={c} style={{ flex:1, backgroundColor:c }} />)}</View>;

/* Botón. tipo: primario, tonal, borde, texto, peligro, peligroTexto · chico: más bajo y angosto */
export function Btn({ tipo = 'primario', icono, children, onPress, disabled, chico, cargando, style, flex }){
  const c = useTema();
  const v = {
    primario:[c.primary, c.onPrimary, null], tonal:[c.primarySoft, c.onPrimarySoft, null], borde:[c.surface, c.primary, c.outline],
    texto:['transparent', c.primary, null], peligro:[c.bad, '#FFFFFF', null], peligroTexto:['transparent', c.bad, null], amarillo:[c.yel, c.ink, null]
  }[tipo];
  return <Pressable onPress={onPress} disabled={disabled || cargando} android_ripple={{ color:'rgba(0,0,0,0.08)', borderless:false }}
    style={({ pressed }) => [{ height:chico ? 40 : 52, borderRadius:chico ? 20 : 26, paddingHorizontal:chico ? 16 : 20, backgroundColor:v[0], borderWidth:v[2] ? 1 : 0, borderColor:v[2],
      flexDirection:'row', alignItems:'center', justifyContent:'center', gap:8, opacity:disabled ? .4 : pressed ? .85 : 1, overflow:'hidden' }, flex ? { flex } : null, style]}>
    {cargando ? <ActivityIndicator color={v[1]} /> : icono ? <Icono n={icono} size={chico ? 18 : 20} color={v[1]} /> : null}
    <T peso="medio" size={chico ? 14 : 15.5} color={v[1]} numberOfLines={1}>{children}</T>
  </Pressable>;
}

/* Tarjeta blanca con borde suave */
export function Tarjeta({ children, style, pad = true }){
  const c = useTema();
  return <View style={[{ backgroundColor:c.surface, borderRadius:18, borderWidth:1, borderColor:c.outline, padding:pad ? 18 : 0, overflow:'hidden' }, style]}>{children}</View>;
}

/* Título pequeño de una sección, con una acción opcional a la derecha */
export function Subtitulo({ children, accion, onAccion, style }){
  const c = useTema();
  return <View style={[{ flexDirection:'row', alignItems:'center', justifyContent:'space-between', marginTop:22, marginBottom:10, marginHorizontal:4 }, style]}>
    <T peso="textoMedio" size={14} color={c.text2}>{children}</T>
    {accion ? <Pressable onPress={onAccion} hitSlop={8}><T peso="medio" size={14} color={c.primary}>{accion}</T></Pressable> : null}
  </View>;
}

/* Aviso de color con ícono. tipo: info, warn, bad, ok */
export function Aviso({ tipo = 'info', icono = 'info', titulo, children, accion }){
  const c = useTema(), [bg, fg] = { info:[c.primarySoft, c.primary], warn:[c.warnSoft, c.warn], bad:[c.badSoft, c.bad], ok:[c.okSoft, c.ok] }[tipo];
  return <View style={{ flexDirection:'row', gap:12, padding:14, borderRadius:14, marginTop:12, backgroundColor:bg }}>
    <Icono n={icono} size={20} color={fg} />
    <View style={{ flex:1 }}>
      {titulo ? <T peso="medio" size={14.5}>{titulo}</T> : null}
      {children ? <T size={13.5} color={c.text2} style={{ marginTop:2 }}>{children}</T> : null}
      {accion ? <View style={{ marginTop:10, alignItems:'flex-start' }}>{accion}</View> : null}
    </View>
  </View>;
}

/* Campo de texto con etiqueta, mensaje de error y elemento a la izquierda o derecha */
export function Campo({ label, error, izq, der, style, inputStyle, ...rest }){
  const c = useTema(), [foco, setFoco] = useState(false);
  return <View style={style}>
    {label ? <T size={12} color={c.text2} style={{ marginLeft:4, marginBottom:5 }}>{label}</T> : null}
    <View style={{ flexDirection:'row', alignItems:'center', minHeight:50, borderWidth:foco ? 2 : 1, borderColor:error ? c.bad : foco ? c.primary : c.outline, borderRadius:12, backgroundColor:c.surface, paddingHorizontal:foco ? 12 : 13, gap:10 }}>
      {izq}
      <TextInput placeholderTextColor={c.text3} onFocus={() => setFoco(true)} onBlur={() => setFoco(false)}
        style={[{ flex:1, fontFamily:F.texto, fontSize:15.5, color:c.text, paddingVertical:10 }, inputStyle]} {...rest} />
      {der}
    </View>
    {error ? <T size={12.5} color={c.bad} style={{ marginLeft:4, marginTop:5 }}>{error}</T> : null}
  </View>;
}

/* Botones de opción en fila (segmentado). opciones: [[valor, texto, número opcional]] */
export function Segmentado({ opciones, valor, onCambio }){
  const c = useTema();
  return <View style={{ flexDirection:'row', borderWidth:1, borderColor:c.outline, borderRadius:22, overflow:'hidden', backgroundColor:c.surface }}>
    {opciones.map(([v, txt, n], i) => { const on = v === valor;
      return <Pressable key={v} onPress={() => onCambio(v)} accessibilityRole="radio" accessibilityState={{ checked:on }}
        style={{ flex:1, height:44, flexDirection:'row', alignItems:'center', justifyContent:'center', gap:6, backgroundColor:on ? c.primarySoft : 'transparent', borderLeftWidth:i ? 1 : 0, borderLeftColor:c.outline }}>
        {on ? <Icono n="check" size={16} color={c.onPrimarySoft} /> : null}
        <T peso={on ? 'medio' : 'textoMedio'} size={14} color={on ? c.onPrimarySoft : c.text2}>{txt}</T>
        {n ? <View style={{ minWidth:18, height:18, borderRadius:9, backgroundColor:c.bad, alignItems:'center', justifyContent:'center', paddingHorizontal:5 }}><T peso="medio" size={11} color="#fff">{n}</T></View> : null}
      </Pressable>; })}
  </View>;
}

/* Etiqueta de estado. tipo: on (azul), ok (verde), bad (rojo), warn */
export function Pildora({ tipo = 'on', punto, children }){
  const c = useTema(), [bg, fg] = { on:[c.primarySoft, c.onPrimarySoft], ok:[c.okSoft, c.ok], bad:[c.badSoft, c.bad], warn:[c.warnSoft, c.warn] }[tipo];
  return <View style={{ flexDirection:'row', alignItems:'center', gap:5, paddingHorizontal:8, paddingVertical:2, borderRadius:99, backgroundColor:bg }}>
    {punto ? <View style={{ width:6, height:6, borderRadius:3, backgroundColor:fg }} /> : null}
    <T peso="textoMedio" size={11.5} color={fg}>{children}</T>
  </View>;
}

/* Círculo con ícono; si el vehículo tiene color conocido, aparece un punto de ese color */
export function Avatar({ tipo = 'on', icono = 'car', colorAuto }){
  const c = useTema(), [bg, fg] = { on:[c.primarySoft, c.primary], ok:[c.okSoft, c.ok], bad:[c.badSoft, c.bad], gris:[c.surface2, c.text2] }[tipo];
  const hex = colorHex(colorAuto);
  return <View style={{ width:42, height:42, borderRadius:21, backgroundColor:bg, alignItems:'center', justifyContent:'center' }}>
    <Icono n={icono} size={20} color={fg} />
    {hex ? <View style={{ position:'absolute', right:-1, bottom:-1, width:14, height:14, borderRadius:7, backgroundColor:hex, borderWidth:2, borderColor:c.surface }} /> : null}
  </View>;
}

/* Estado vacío (cuando no hay nada que mostrar) */
export function Vacio({ titulo, children }){
  const c = useTema();
  return <View style={{ alignItems:'center', paddingVertical:36, paddingHorizontal:24 }}>
    <View style={{ width:64, height:64, borderRadius:20, backgroundColor:c.primarySoft, alignItems:'center', justifyContent:'center', marginBottom:12 }}><Icono n="parking" size={34} color={c.primary} grosor={2.4} /></View>
    <T peso="medio" size={15.5}>{titulo}</T>
    <T size={14} color={c.text2} style={{ textAlign:'center', marginTop:4 }}>{children}</T>
  </View>;
}

/* Fila de un ajuste: ícono, título y descripción, y un control a la derecha */
export function FilaAjuste({ icono, titulo, sub, children, apagado, borde = true }){
  const c = useTema();
  return <View style={{ flexDirection:'row', alignItems:'center', gap:16, padding:16, minHeight:64, borderTopWidth:borde ? 1 : 0, borderTopColor:c.outline, opacity:apagado ? .45 : 1 }} pointerEvents={apagado ? 'none' : 'auto'}>
    {icono ? <Icono n={icono} size={22} color={c.text2} /> : null}
    <View style={{ flex:1 }}>{titulo ? <T size={15}>{titulo}</T> : null}{sub ? <T size={12.5} color={c.text2} style={{ marginTop:2 }}>{sub}</T> : null}</View>
    {children}
  </View>;
}
export function Interruptor({ valor, onCambio }){
  const c = useTema();
  return <Switch value={valor} onValueChange={onCambio} trackColor={{ true:c.primary, false:c.surface3 }} thumbColor="#FFFFFF" />;
}

/* Fila de un movimiento (inicio e historial). Si es una deuda, al tocarla se cobra */
export function FilaMovimiento({ t, onPress, borde }){
  const c = useTema(), cfg = useDatos(e => e.cfg);
  const desc = [t.modelo, t.color].filter(Boolean).join(' · ');
  const extra = t.estado === 'activo' ? hace(t.inicio) : (desc || durTxt(t.fin - t.inicio));
  const ubic = t.zona ? (t.espacio ? 'E' + t.espacio + ' · ' : '') + t.zona : '';
  const hora = hhmm(t.inicio) + (t.fin ? ' – ' + hhmm(t.fin) : '') + ' · ' + (t.estado === 'activo' ? (t.espacio ? 'E' + t.espacio + ' · ' : '') + extra : (ubic || extra));
  const monto = t.estado === 'activo' ? calc(Date.now() - t.inicio, cfg).monto : t.monto;
  const [tipo, icono, pil, ptxt] = { activo:['on', 'clock', 'on', 'En parqueo'], pagado:['ok', 'check', 'ok', t.metodo === 'qr' ? 'QR' : 'Efectivo'], pendiente:['bad', 'alert', 'bad', 'Cobrar'] }[t.estado];
  const Cont = onPress ? Pressable : View;
  return <Cont onPress={onPress} android_ripple={onPress ? { color:'rgba(0,0,0,0.06)' } : undefined}
    style={{ flexDirection:'row', alignItems:'center', gap:14, paddingHorizontal:16, paddingVertical:12, minHeight:70, borderTopWidth:borde ? 1 : 0, borderTopColor:c.outline }}>
    <Avatar tipo={tipo} icono={icono} colorAuto={t.color} />
    <View style={{ flex:1 }}>
      <T peso="medio" size={16} style={{ letterSpacing:.5 }}>{t.placa}</T>
      <T size={12.5} color={c.text2} numberOfLines={1}>{hora}</T>
    </View>
    <View style={{ alignItems:'flex-end', gap:4 }}>
      <T peso="medio" size={15} color={t.estado === 'pendiente' ? c.bad : c.text}>{money(monto)}</T>
      <Pildora tipo={pil} punto={t.estado === 'activo'}>{ptxt}</Pildora>
    </View>
  </Cont>;
}
