/* Camara.js: pantalla completa para fotografiar la constancia de Yape o Plin del conductor.
   También permite elegir una foto de la galería (por ejemplo, una captura enviada por WhatsApp).
   El texto se lee dentro del celular con ML Kit, sin internet. */
import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Image, Modal, Pressable, View } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icono from './Icono';
import { Btn, T } from './ui';
import { leerTexto, vibrar } from '../lib/servicios';

export default function Camara({ visible, onCerrar, onTexto }){
  const ins = useSafeAreaInsets(), cam = useRef(null);
  const [permiso, pedirPermiso] = useCameraPermissions();
  const [lista, setLista] = useState(false), [foto, setFoto] = useState(null), [leyendo, setLeyendo] = useState(false), [error, setError] = useState('');
  const laser = useRef(new Animated.Value(0)).current;

  useEffect(() => { if (visible){ setFoto(null); setLeyendo(false); setError(''); if (permiso && !permiso.granted && permiso.canAskAgain) pedirPermiso(); } }, [visible]);
  // Línea amarilla que recorre la foto mientras se lee
  useEffect(() => {
    if (!leyendo) return;
    const a = Animated.loop(Animated.sequence([
      Animated.timing(laser, { toValue:1, duration:650, easing:Easing.inOut(Easing.ease), useNativeDriver:false }),
      Animated.timing(laser, { toValue:0, duration:650, easing:Easing.inOut(Easing.ease), useNativeDriver:false })]));
    a.start(); return () => a.stop();
  }, [leyendo]);

  const leer = async uri => {
    setFoto(uri); setLeyendo(true); setError('');
    try { const txt = await leerTexto(uri); vibrar(20); onTexto(txt); }
    catch { setLeyendo(false); setFoto(null); setError('No se pudo leer la foto. Intenta de nuevo con más luz o escribe el N° de operación a mano.'); }
  };
  const tomar = async () => {
    if (!lista || !cam.current) return;
    try { const p = await cam.current.takePictureAsync({ quality:.85 }); leer(p.uri); } catch { setError('No se pudo tomar la foto.'); }
  };
  const galeria = async () => {
    const r = await ImagePicker.launchImageLibraryAsync({ mediaTypes:['images'], quality:1 });
    if (!r.canceled && r.assets?.[0]) leer(r.assets[0].uri);
  };

  return <Modal visible={visible} animationType="fade" statusBarTranslucent onRequestClose={onCerrar}>
    <View style={{ flex:1, backgroundColor:'#000' }}>
      {foto ? <Image source={{ uri:foto }} style={{ position:'absolute', top:0, bottom:0, left:0, right:0 }} resizeMode="contain" />
        : permiso?.granted ? <CameraView ref={cam} style={{ flex:1 }} facing="back" onCameraReady={() => setLista(true)} />
        : <View style={{ flex:1, alignItems:'center', justifyContent:'center', padding:30, gap:14 }}>
            <T color="#E9ECF1" style={{ textAlign:'center' }}>Para leer la constancia, SICOE necesita usar la cámara.</T>
            <Btn tipo="tonal" icono="camera" onPress={pedirPermiso}>Permitir la cámara</Btn>
          </View>}

      {/* Recuadro amarillo para encuadrar la constancia */}
      <View pointerEvents="none" style={{ position:'absolute', left:'7%', right:'7%', top:'13%', bottom:'27%', borderRadius:24, borderWidth:3, borderColor:'#F7B500' }}>
        {leyendo ? <Animated.View style={{ position:'absolute', left:'5%', right:'5%', height:3, borderRadius:3, backgroundColor:'#F7B500', top:laser.interpolate({ inputRange:[0, 1], outputRange:['4%', '95%'] }) }} /> : null}
      </View>

      <View style={{ position:'absolute', top:0, left:0, right:0, flexDirection:'row', alignItems:'center', gap:6, paddingTop:ins.top + 8, paddingHorizontal:10, paddingBottom:16, backgroundColor:'rgba(0,0,0,0.45)' }}>
        <Pressable onPress={onCerrar} hitSlop={10} style={{ width:42, height:42, alignItems:'center', justifyContent:'center' }}><Icono n="x" color="#fff" /></Pressable>
        <T peso="medio" size={16} color="#fff">Leer constancia</T>
      </View>

      {leyendo ? <View style={{ position:'absolute', alignSelf:'center', bottom:ins.bottom + 60, backgroundColor:'rgba(22,32,58,0.94)', borderRadius:99, paddingHorizontal:18, paddingVertical:11 }}>
          <T size={14} color="#fff">Leyendo constancia…</T>
        </View>
        : <>
          <T size={13.5} color="#E9ECF1" style={{ position:'absolute', left:24, right:24, bottom:'21%', textAlign:'center' }}>{error || 'Encuadra la constancia completa: monto, fecha y N° de operación'}</T>
          <View style={{ position:'absolute', left:0, right:0, bottom:0, flexDirection:'row', alignItems:'center', justifyContent:'space-around', paddingTop:16, paddingBottom:ins.bottom + 26, backgroundColor:'rgba(0,0,0,0.5)' }}>
            <Pressable onPress={galeria} accessibilityLabel="Elegir foto de la galería" style={{ width:52, height:52, borderRadius:26, backgroundColor:'rgba(255,255,255,0.15)', alignItems:'center', justifyContent:'center' }}><Icono n="image" color="#fff" /></Pressable>
            <Pressable onPress={tomar} accessibilityLabel="Tomar foto" disabled={!permiso?.granted} style={({ pressed }) => ({ width:76, height:76, borderRadius:38, borderWidth:4, borderColor:'#fff', backgroundColor:'rgba(255,255,255,0.22)', transform:[{ scale:pressed ? .9 : 1 }], opacity:permiso?.granted ? 1 : .4 })} />
            <View style={{ width:52 }} />
          </View>
        </>}
    </View>
  </Modal>;
}
