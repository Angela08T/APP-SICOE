/* Pantalla.js: marco de cada sección: franja de colores, barra superior (logo, título y subtítulo) y contenido desplazable.
   El espacio de abajo deja lugar a la barra de navegación flotante. */
import { forwardRef } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icono from './Icono';
import { Franja, T } from './ui';
import { ARCOIRIS, useTema } from '../lib/tema';

const Pantalla = forwardRef(function Pantalla({ titulo, sub, derecha, onDerecha, children, scroll = true }, ref){
  const c = useTema(), ins = useSafeAreaInsets();
  return <View style={{ flex:1, backgroundColor:c.bg }}>
    <View style={{ backgroundColor:c.surface, paddingTop:ins.top }}>
      <Franja />
      <View style={{ flexDirection:'row', alignItems:'center', gap:12, paddingHorizontal:16, paddingVertical:12 }}>
        <View style={{ width:40, height:40, borderRadius:13, borderWidth:2, borderColor:ARCOIRIS[3], backgroundColor:'#fff', alignItems:'center', justifyContent:'center' }}>
          <T peso="numero" size={20} color={ARCOIRIS[1]}>P</T>
          <View style={{ position:'absolute', right:-3, top:-3, width:11, height:11, borderRadius:6, backgroundColor:c.yel, borderWidth:2, borderColor:c.surface }} />
        </View>
        <View style={{ flex:1 }}>
          <T peso="titulo" size={19} numberOfLines={1}>{titulo}</T>
          {sub ? <T size={12.5} color={c.text2} numberOfLines={1}>{sub}</T> : null}
        </View>
        {derecha ? <Pressable onPress={onDerecha} hitSlop={8} style={{ width:42, height:42, borderRadius:21, alignItems:'center', justifyContent:'center' }}><Icono n={derecha} color={c.text2} /></Pressable> : null}
      </View>
    </View>
    {scroll ? <ScrollView ref={ref} keyboardShouldPersistTaps="handled" contentContainerStyle={{ padding:16, paddingBottom:120 + ins.bottom }}>{children}</ScrollView> : children}
  </View>;
});
export default Pantalla;
