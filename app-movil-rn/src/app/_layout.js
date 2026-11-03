/* _layout.js: raíz de la app.
   Carga las tipografías y los datos guardados, prepara las notificaciones, muestra el inicio de sesión si no hay
   sesión, y revisa cada 15 segundos si algún vehículo está por cambiar de fracción (aviso dentro de la app). */
import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { Stack, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as Notifications from 'expo-notifications';
import { useFonts, Fredoka_700Bold } from '@expo-google-fonts/fredoka';
import { PlusJakartaSans_400Regular, PlusJakartaSans_500Medium, PlusJakartaSans_600SemiBold, PlusJakartaSans_700Bold, PlusJakartaSans_800ExtraBold } from '@expo-google-fonts/plus-jakarta-sans';
import Capas, { hojaAbierta, snack } from '../components/Capas';
import Login from '../components/Login';
import { cargarDatos, leer, useDatos } from '../lib/datos';
import { calc, money } from '../lib/logica';
import { prepararNotificaciones, vibrar } from '../lib/servicios';
import { abrirCobro } from '../lib/abrir';
import { useTema } from '../lib/tema';

/* Aviso de cambio de fracción con la app abierta: una sola vez por fracción de cada vehículo */
const avisados = {};
function revisarFracciones(){
  const { cfg, tickets, sesion } = leer(); if (!cfg.aviso || !sesion) return;
  const nuevos = [];
  tickets.filter(t => t.estado === 'activo').forEach(t => {
    const f = calc(Date.now() - t.inicio, cfg);
    if (f.falta <= cfg.avisoMin && avisados[t.id] !== f.n){ avisados[t.id] = f.n; nuevos.push({ t, f }); }
  });
  if (!nuevos.length) return;
  const { t, f } = nuevos[0], uno = nuevos.length === 1;
  vibrar([250, 120, 250]);
  snack(uno ? `${t.placa} sube a ${money((f.n + 1) * cfg.tarifa)} en ${f.falta} min · Espacio ${t.espacio}` : `${nuevos.length} vehículos suben de monto en ${cfg.avisoMin} min o menos`, 'bell',
    uno ? { label:'Cobrar', fn:() => { if (!hojaAbierta()) abrirCobro(t.id); } } : { label:'Ver', fn:() => router.navigate('/activos') });
}

export default function Raiz(){
  const [fuentes] = useFonts({ Fredoka_700Bold, PlusJakartaSans_400Regular, PlusJakartaSans_500Medium, PlusJakartaSans_600SemiBold, PlusJakartaSans_700Bold, PlusJakartaSans_800ExtraBold });
  const cargado = useDatos(e => e.cargado), sesion = useDatos(e => e.sesion), c = useTema();

  useEffect(() => {
    cargarDatos(); prepararNotificaciones();
    const iv = setInterval(revisarFracciones, 15000);
    // Al tocar una notificación de cambio de fracción, se abre «Activos»
    const sub = Notifications.addNotificationResponseReceivedListener(() => router.navigate('/activos'));
    return () => { clearInterval(iv); sub.remove(); };
  }, []);

  if (!fuentes || !cargado) return <View style={{ flex:1, backgroundColor:c.bg }} />;
  return <SafeAreaProvider>
    <StatusBar style={c.oscuro ? 'light' : 'dark'} />
    <Stack screenOptions={{ headerShown:false, contentStyle:{ backgroundColor:c.bg } }}><Stack.Screen name="(tabs)" /></Stack>
    {/* Sin sesión, el inicio de sesión tapa la app (la navegación sigue montada debajo) */}
    {!sesion ? <View style={StyleSheet.absoluteFill}><Login /></View> : null}
    <Capas />
  </SafeAreaProvider>;
}
