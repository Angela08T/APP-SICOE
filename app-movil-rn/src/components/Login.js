/* Login.js: inicio de sesión del cobrador al empezar el turno.
   Versión de prueba: acepta cualquier DNI de 8 dígitos y una contraseña de al menos 4 caracteres (aún no hay servidor). */
import { useEffect, useRef, useState } from 'react';
import { Animated, Image, KeyboardAvoidingView, Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icono from './Icono';
import { Btn, Campo, Franja, T } from './ui';
import { snack } from './Capas';
import { ARCOIRIS, useTema } from '../lib/tema';
import { guardar, useDatos } from '../lib/datos';
import { saludo } from '../lib/logica';
import { pedirPermisoAvisos, vibrar } from '../lib/servicios';

export default function Login(){
  const c = useTema(), ins = useSafeAreaInsets(), recordado = useDatos(e => e.dniRecordado), aviso = useDatos(e => e.cfg.aviso);
  const [dni, setDni] = useState(recordado || ''), [pass, setPass] = useState(''), [ver, setVer] = useState(false), [recordar, setRecordar] = useState(true);
  const [err, setErr] = useState({}), [cargando, setCargando] = useState(false);
  const sacudir = useRef(new Animated.Value(0)).current, entrada = useRef(new Animated.Value(0)).current;
  useEffect(() => { Animated.spring(entrada, { toValue:1, useNativeDriver:true, friction:7 }).start(); }, []);

  const error = (campo, msg) => {
    setErr({ [campo]:msg }); vibrar([40, 30, 40]);
    Animated.sequence([-10, 9, -6, 4, 0].map(v => Animated.timing(sacudir, { toValue:v, duration:60, useNativeDriver:true }))).start();
  };
  const entrar = () => {
    if (!/^\d{8}$/.test(dni)) return error('dni', 'El DNI debe tener 8 dígitos.');
    if (pass.length < 4) return error('pass', 'La contraseña debe tener al menos 4 caracteres.');
    setCargando(true);
    setTimeout(() => {
      guardar({ sesion:{ dni, desde:Date.now() }, dniRecordado:recordar ? dni : '' });
      if (aviso) pedirPermisoAvisos();
      vibrar(30); setTimeout(() => snack(`${saludo()}, sesión iniciada con DNI ${dni}`), 350);
    }, 700);
  };

  return <View style={{ flex:1, backgroundColor:c.bg }}>
    <Franja alto={6} style={{ marginTop:ins.top }} />
    <KeyboardAvoidingView behavior="height" style={{ flex:1 }}>
      <ScrollView contentContainerStyle={{ flexGrow:1, justifyContent:'center', padding:22, paddingBottom:ins.bottom + 22 }} keyboardShouldPersistTaps="handled">
        <Animated.View style={{ alignItems:'center', opacity:entrada, transform:[{ translateY:entrada.interpolate({ inputRange:[0, 1], outputRange:[20, 0] }) }] }}>
          <Image source={require('../../assets/logo-sjl.png')} style={{ width:170, height:52 }} resizeMode="contain" />
          <View style={{ marginTop:22, width:64, height:64, borderRadius:20, borderWidth:3, borderColor:ARCOIRIS[3], backgroundColor:'#fff', alignItems:'center', justifyContent:'center', elevation:4 }}>
            <T peso="numero" size={32} color={ARCOIRIS[1]}>P</T>
          </View>
          <View style={{ flexDirection:'row', marginTop:14 }}>{'SICOE'.split('').map((l, i) => <T key={i} peso="numero" size={46} color={[ARCOIRIS[0], ARCOIRIS[1], ARCOIRIS[2], ARCOIRIS[4], ARCOIRIS[5]][i]}>{l}</T>)}</View>
          <T size={13.5} color={c.text2}>Sistema de Cobro de Estacionamiento</T>
        </Animated.View>

        <Animated.View style={{ marginTop:24, backgroundColor:c.surface, borderRadius:24, borderWidth:1, borderColor:c.outline, padding:20, transform:[{ translateX:sacudir }] }}>
          <T peso="titulo" size={20} style={{ textAlign:'center' }}>Iniciar sesión</T>
          <T size={13.5} color={c.text2} style={{ textAlign:'center', marginTop:2, marginBottom:16 }}>Ingresa con tu DNI para empezar el turno</T>
          <Campo label="DNI" value={dni} onChangeText={v => { setDni(v.replace(/\D/g, '').slice(0, 8)); setErr({}); }} keyboardType="number-pad" maxLength={8}
            izq={<Icono n="idcard" size={20} color={c.text3} />} error={err.dni} placeholder="12345678" />
          <Campo label="Contraseña" style={{ marginTop:12 }} value={pass} onChangeText={v => { setPass(v); setErr({}); }} secureTextEntry={!ver} onSubmitEditing={entrar}
            izq={<Icono n="lock" size={20} color={c.text3} />} error={err.pass}
            der={<Pressable onPress={() => setVer(v => !v)} hitSlop={10} accessibilityLabel={ver ? 'Ocultar contraseña' : 'Mostrar contraseña'}><Icono n={ver ? 'eyeoff' : 'eye'} size={20} color={c.text2} /></Pressable>} />
          <Pressable onPress={() => setRecordar(r => !r)} style={{ flexDirection:'row', alignItems:'center', gap:10, marginVertical:14 }}>
            <View style={{ width:20, height:20, borderRadius:6, borderWidth:recordar ? 0 : 2, borderColor:c.text3, backgroundColor:recordar ? c.primary : 'transparent', alignItems:'center', justifyContent:'center' }}>
              {recordar ? <Icono n="check" size={14} color="#fff" grosor={3} /> : null}</View>
            <T size={14}>Recordar mi DNI</T>
          </Pressable>
          <Btn icono="logout" onPress={entrar} cargando={cargando} style={{ backgroundColor:c.ink }}>Ingresar</Btn>
          <Franja alto={3} style={{ marginTop:-3, marginHorizontal:24, borderRadius:2, overflow:'hidden' }} />
        </Animated.View>

        <View style={{ flexDirection:'row', gap:10, marginTop:14, padding:12, borderRadius:16, backgroundColor:c.yelSoft }}>
          <Icono n="info" size={18} color={c.yelInk} />
          <T size={13} color={c.yelInk} style={{ flex:1 }}><T peso="medio" size={13} color={c.yelInk}>Versión de prueba:</T> ingresa cualquier DNI de 8 dígitos y una contraseña de al menos 4 caracteres.</T>
        </View>
        <T size={12} color={c.text3} style={{ textAlign:'center', marginTop:18 }}>Municipalidad de San Juan de Lurigancho · SICOE 2.0</T>
      </ScrollView>
    </KeyboardAvoidingView>
  </View>;
}
