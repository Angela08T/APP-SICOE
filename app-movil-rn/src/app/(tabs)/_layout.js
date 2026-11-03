/* (tabs)/_layout.js: las cuatro secciones (Inicio, Activos, Historial y Ajustes) con la barra inferior flotante.
   El botón amarillo del centro («Nuevo») lleva al registro de ingreso y pone el cursor en la placa. */
import { Pressable, View } from 'react-native';
import { Tabs, router, usePathname } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icono from '../../components/Icono';
import { T } from '../../components/ui';
import { useTema } from '../../lib/tema';
import { useDatos } from '../../lib/datos';

// Cada sección: ruta, ícono y texto
const SECCIONES = { index:['/', 'home', 'Inicio'], activos:['/activos', 'car', 'Activos'], historial:['/historial', 'receipt', 'Historial'], ajustes:['/ajustes', 'settings', 'Ajustes'] };

/* Navega con «router» y detecta la sección actual por la ruta (no depende de las props del navegador) */
function BarraInferior(){
  const c = useTema(), ins = useSafeAreaInsets(), tickets = useDatos(e => e.tickets);
  const enParqueo = tickets.filter(t => t.estado === 'activo').length, ruta = usePathname();
  const ir = name => router.navigate(SECCIONES[name][0]);
  const Boton = ({ name }) => { const [r, ic, txt] = SECCIONES[name], on = ruta === r;
    return <Pressable onPress={() => ir(name)} accessibilityRole="tab" accessibilityState={{ selected:on }} style={{ flex:1, alignItems:'center', gap:3, paddingVertical:4 }}>
      <View style={{ width:44, height:30, borderRadius:15, alignItems:'center', justifyContent:'center', backgroundColor:on ? c.primarySoft : 'transparent' }}>
        <Icono n={ic} size={22} color={on ? c.primary : c.text3} />
        {name === 'activos' && enParqueo ? <View style={{ position:'absolute', top:-2, right:4, minWidth:18, height:18, borderRadius:9, paddingHorizontal:4, backgroundColor:c.bad, alignItems:'center', justifyContent:'center', borderWidth:2, borderColor:c.surface }}>
          <T peso="medio" size={10} color="#fff">{enParqueo}</T></View> : null}
      </View>
      <T peso={on ? 'medio' : 'textoMedio'} size={11.5} color={on ? c.primary : c.text3}>{txt}</T>
    </Pressable>; };
  return <View style={{ position:'absolute', left:14, right:14, bottom:ins.bottom + 12, flexDirection:'row', alignItems:'center', backgroundColor:c.surface, borderWidth:1, borderColor:c.outline, borderRadius:28, paddingVertical:8, paddingHorizontal:6, elevation:10 }}>
    <Boton name="index" /><Boton name="activos" />
    <Pressable onPress={() => router.navigate({ pathname:'/', params:{ foco:String(Date.now()) } })} accessibilityLabel="Nuevo ingreso" style={{ flex:1, alignItems:'center', gap:3, marginTop:-22 }}>
      <View style={{ width:52, height:52, borderRadius:26, backgroundColor:c.yel, alignItems:'center', justifyContent:'center', elevation:6, borderWidth:3, borderColor:c.surface }}><Icono n="plus" size={26} color={c.ink} grosor={2.6} /></View>
      <T peso="medio" size={11.5} color={c.primary}>Nuevo</T>
    </Pressable>
    <Boton name="historial" /><Boton name="ajustes" />
  </View>;
}

export default function Secciones(){
  return <Tabs tabBar={() => <BarraInferior />} screenOptions={{ headerShown:false }}>
    <Tabs.Screen name="index" /><Tabs.Screen name="activos" /><Tabs.Screen name="historial" /><Tabs.Screen name="ajustes" />
  </Tabs>;
}
