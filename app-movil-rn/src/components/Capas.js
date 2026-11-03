/* Capas.js: lo que aparece encima de las pantallas.
   - snack(): aviso inferior con acción opcional (por ejemplo «Deshacer» o «Cobrar»)
   - pagoOk(): ventana «Pago registrado» con el monto
   - abrirHoja() / cerrarHoja(): hoja que sube desde abajo (cobro, datos, cierre de turno, ubicación)
   Se usan desde cualquier pantalla, sin pasar nada por props. */
import { useEffect, useRef, useSyncExternalStore } from 'react';
import { Animated, KeyboardAvoidingView, Modal, Pressable, ScrollView, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icono from './Icono';
import { T } from './ui';
import { F, useTema } from '../lib/tema';

let capas = { snack:null, pago:null, hoja:null };
const oyentes = new Set();
const poner = c => { capas = { ...capas, ...c }; oyentes.forEach(f => f()); };
const useCapas = () => useSyncExternalStore(f => { oyentes.add(f); return () => oyentes.delete(f); }, () => capas);

let tSnack, tPago;
export function snack(texto, icono = 'checkc', accion){
  clearTimeout(tSnack); poner({ snack:{ texto, icono, accion, k:Date.now() } });
  tSnack = setTimeout(() => poner({ snack:null }), accion ? 5000 : 2600);
}
export function pagoOk(monto, texto){ clearTimeout(tPago); poner({ pago:{ monto, texto } }); tPago = setTimeout(() => poner({ pago:null }), 1600); }
/* La hoja recibe un componente y sus datos; «alCerrar» se llama si se cierra tocando fuera o con Atrás */
export const abrirHoja = (Componente, datos = {}, alCerrar) => poner({ hoja:{ Componente, datos, alCerrar, k:Date.now() } });
export const cerrarHoja = () => poner({ hoja:null });
export const hojaAbierta = () => !!capas.hoja;

export default function Capas(){
  const { snack:s, pago, hoja } = useCapas();
  return <>
    <Hoja hoja={hoja} />
    <Snack s={s} />
    <Pago pago={pago} />
  </>;
}

function Snack({ s }){
  const c = useTema(), ins = useSafeAreaInsets(), y = useRef(new Animated.Value(0)).current;
  useEffect(() => { Animated.timing(y, { toValue:s ? 1 : 0, duration:200, useNativeDriver:true }).start(); }, [s]);
  if (!s) return null;
  return <Animated.View pointerEvents="box-none" style={{ position:'absolute', left:12, right:12, bottom:96 + ins.bottom, opacity:y, transform:[{ translateY:y.interpolate({ inputRange:[0, 1], outputRange:[10, 0] }) }] }}>
    <View style={{ minHeight:48, borderRadius:10, backgroundColor:'#2E3036', flexDirection:'row', alignItems:'center', gap:12, paddingLeft:16, paddingRight:8, paddingVertical:6, elevation:8 }}>
      <Icono n={s.icono} size={18} color="#7FD6E0" />
      <T size={14} color="#EFF0F3" style={{ flex:1 }}>{s.texto}</T>
      {s.accion ? <Pressable onPress={() => { poner({ snack:null }); s.accion.fn(); }} style={{ paddingHorizontal:10, paddingVertical:8 }}><T peso="medio" size={14} color={c.oscuro ? '#9CC8F5' : '#9CC8F5'}>{s.accion.label}</T></Pressable> : null}
    </View>
  </Animated.View>;
}

function Pago({ pago }){
  const c = useTema(), a = useRef(new Animated.Value(0)).current;
  useEffect(() => { if (pago) { a.setValue(0); Animated.spring(a, { toValue:1, useNativeDriver:true, friction:6 }).start(); } }, [pago]);
  return <Modal visible={!!pago} transparent animationType="fade" statusBarTranslucent>
    <View style={{ flex:1, backgroundColor:c.scrim, alignItems:'center', justifyContent:'center' }}>
      <Animated.View style={{ width:300, maxWidth:'86%', backgroundColor:c.surface, borderRadius:28, padding:26, alignItems:'center', transform:[{ scale:a.interpolate({ inputRange:[0, 1], outputRange:[.9, 1] }) }] }}>
        <View style={{ width:64, height:64, borderRadius:32, backgroundColor:c.okSoft, alignItems:'center', justifyContent:'center', marginBottom:14 }}><Icono n="check" size={32} color={c.ok} grosor={2.6} /></View>
        <T peso="medio" size={17}>Pago registrado</T>
        <T peso="numero" size={34} style={{ marginVertical:4 }}>{pago?.monto}</T>
        <T size={13.5} color={c.text2} style={{ textAlign:'center' }}>{pago?.texto}</T>
      </Animated.View>
    </View>
  </Modal>;
}

/* Hoja inferior: se desliza desde abajo; el contenido se puede desplazar y los botones de «acciones» quedan fijos abajo */
function Hoja({ hoja }){
  const c = useTema(), ins = useSafeAreaInsets(), { height } = useWindowDimensions();
  // cerrar(true) = cerrar después de completar la acción (no ejecuta «alCerrar», por ejemplo «Seguir contando»)
  const cerrar = completado => { const f = hoja?.alCerrar; cerrarHoja(); if (completado !== true && f) f(); };
  const C = hoja?.Componente;
  return <Modal visible={!!hoja} transparent animationType="slide" statusBarTranslucent onRequestClose={() => cerrar()}>
    <View style={{ flex:1, justifyContent:'flex-end' }}>
      <Pressable style={{ position:'absolute', top:0, bottom:0, left:0, right:0, backgroundColor:c.scrim }} onPress={() => cerrar()} />
      <KeyboardAvoidingView behavior="height" style={{ maxHeight:height * .94 }}>
        <View style={{ backgroundColor:c.surface, borderTopLeftRadius:28, borderTopRightRadius:28, paddingBottom:ins.bottom, maxHeight:height * .94 }}>
          <View style={{ width:36, height:4, borderRadius:2, backgroundColor:c.surface3, alignSelf:'center', marginTop:10, marginBottom:6 }} />
          {C ? <C key={hoja.k} {...hoja.datos} cerrar={cerrar} /> : null}
        </View>
      </KeyboardAvoidingView>
    </View>
  </Modal>;
}

/* Partes de una hoja: cabecera, cuerpo desplazable y acciones fijas abajo */
export function HojaCabecera({ icono, tipo = 'on', titulo, sub, onCerrar }){
  const c = useTema(), [bg, fg] = { on:[c.primarySoft, c.primary], bad:[c.badSoft, c.bad] }[tipo];
  return <View style={{ flexDirection:'row', alignItems:'center', gap:12, paddingHorizontal:20, paddingTop:8 }}>
    <View style={{ width:42, height:42, borderRadius:21, backgroundColor:bg, alignItems:'center', justifyContent:'center' }}><Icono n={icono} size={20} color={fg} /></View>
    <View style={{ flex:1 }}><T peso="medio" size={18} style={{ letterSpacing:.3 }}>{titulo}</T>{sub ? <T size={13} color={c.text2}>{sub}</T> : null}</View>
    {onCerrar ? <Pressable onPress={onCerrar} hitSlop={10} style={{ width:42, height:42, alignItems:'center', justifyContent:'center' }}><Icono n="x" color={c.text2} /></Pressable> : null}
  </View>;
}
export const HojaCuerpo = ({ children, refScroll }) => <ScrollView ref={refScroll} keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingHorizontal:20, paddingBottom:16 }} style={{ flexGrow:0 }}>{children}</ScrollView>;
export function HojaAcciones({ children }){
  const c = useTema();
  return <View style={{ paddingHorizontal:20, paddingTop:12, paddingBottom:14, borderTopWidth:1, borderTopColor:c.outline, backgroundColor:c.surface, gap:4 }}>{children}</View>;
}
export { F };
