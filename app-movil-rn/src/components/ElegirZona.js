/* ElegirZona.js: selector de la zona de estacionamiento (se despliega la lista de las 12 zonas con sus espacios libres). */
import { useState } from 'react';
import { Pressable, View } from 'react-native';
import Icono from './Icono';
import { T } from './ui';
import { useTema } from '../lib/tema';
import { useDatos } from '../lib/datos';
import { ZONAS, ocupados } from '../lib/logica';

export default function ElegirZona({ valor, onCambio, error, conLibres = true }){
  const c = useTema(), tickets = useDatos(e => e.tickets), [abierto, setAbierto] = useState(false);
  const libres = n => (ZONAS.find(z => z.n === n)?.cap || 0) - ocupados(tickets, n).length;
  const cap = n => ZONAS.find(z => z.n === n)?.cap || 0;
  return <View>
    <Pressable onPress={() => setAbierto(a => !a)} accessibilityRole="button" accessibilityLabel="Zona de estacionamiento"
      style={{ flexDirection:'row', alignItems:'center', gap:12, minHeight:56, paddingHorizontal:14, paddingVertical:8, borderWidth:abierto ? 2 : 1, borderColor:error ? c.bad : abierto ? c.primary : c.outline, borderRadius:12, backgroundColor:c.surface }}>
      <View style={{ width:36, height:36, borderRadius:11, backgroundColor:valor ? c.primarySoft : c.surface2, alignItems:'center', justifyContent:'center' }}><Icono n="pin" size={18} color={valor ? c.primary : c.text3} /></View>
      <T peso={valor ? 'medio' : 'texto'} size={15} color={valor ? c.text : c.text3} style={{ flex:1 }} numberOfLines={1}>{valor || 'Selecciona la zona…'}</T>
      {valor && conLibres ? <View style={{ paddingHorizontal:8, paddingVertical:3, borderRadius:99, backgroundColor:libres(valor) ? c.okSoft : c.badSoft }}><T peso="medio" size={11.5} color={libres(valor) ? c.ok : c.bad}>{libres(valor)}/{cap(valor)} libres</T></View> : null}
      <View style={{ transform:[{ rotate:abierto ? '180deg' : '0deg' }] }}><Icono n="chev" size={20} color={c.text2} /></View>
    </Pressable>
    {abierto ? <View style={{ marginTop:6, borderWidth:1, borderColor:c.outline, borderRadius:12, overflow:'hidden', backgroundColor:c.surface }}>
      {ZONAS.map((z, i) => { const on = z.n === valor, l = libres(z.n);
        return <Pressable key={z.n} onPress={() => { onCambio(z.n); setAbierto(false); }} android_ripple={{ color:'rgba(0,0,0,0.06)' }}
          style={{ flexDirection:'row', alignItems:'center', gap:10, paddingHorizontal:14, paddingVertical:12, borderTopWidth:i ? 1 : 0, borderTopColor:c.outline, backgroundColor:on ? c.primarySoft : 'transparent' }}>
          <T size={14} peso={on ? 'medio' : 'texto'} color={on ? c.onPrimarySoft : c.text} style={{ flex:1 }}>{z.n}</T>
          <T size={12.5} color={l ? c.text2 : c.bad}>{l}/{z.cap} libres</T>
        </Pressable>; })}
    </View> : null}
  </View>;
}
