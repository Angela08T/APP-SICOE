/* index.js: «Inicio». Resumen del día, registro de ingreso (placa, zona, espacio y quién maneja) y últimos movimientos. */
import { useEffect, useRef, useState } from 'react';
import { Pressable, TextInput, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import Pantalla from '../../components/Pantalla';
import Icono from '../../components/Icono';
import ElegirZona from '../../components/ElegirZona';
import { snack } from '../../components/Capas';
import { QUIEN, textoQuien } from '../../components/Hojas';
import { Aviso, Btn, Campo, FilaMovimiento, Franja, Segmentado, Subtitulo, T, Tarjeta, Vacio } from '../../components/ui';
import { F, useTema } from '../../lib/tema';
import { cambiarCfg, leer, useDatos } from '../../lib/datos';
import { activoDe, datosDueno, deudasDe, fmtPlaca, hace, hhmm, hoyTxt, isToday, key, money, ocupados, saludo, sum, zonaCap } from '../../lib/logica';
import { registrarIngreso, ubicarIngreso } from '../../lib/acciones';
import { abrirDeuda, abrirGps } from '../../lib/abrir';
import { vibrar } from '../../lib/servicios';

const VACIO = { nombre:'', dni:'', color:'', modelo:'' };

export default function Inicio(){
  const c = useTema(), { foco } = useLocalSearchParams();
  const tickets = useDatos(e => e.tickets), cfg = useDatos(e => e.cfg), vehs = useDatos(e => e.vehs);
  const [placa, setPlaca] = useState(''), [esp, setEsp] = useState(null), [mas, setMas] = useState(false);
  const [quien, setQuien] = useState('dueno'), [d, setD] = useState(VACIO);
  const refPlaca = useRef(null), scroll = useRef(null);
  const [, refrescar] = useState(0);
  useEffect(() => { const iv = setInterval(() => refrescar(x => x + 1), 10000); return () => clearInterval(iv); }, []); // «hace X min»
  useEffect(() => { if (foco){ scroll.current?.scrollTo({ y:0 }); setTimeout(() => refPlaca.current?.focus(), 120); } }, [foco]);

  const k = key(placa), ok = k.length >= 5, zona = zonaCap(cfg.zona) ? cfg.zona : '';
  const act = ok ? activoDe(tickets, k) : null, deu = ok ? deudasDe(tickets, k) : [], veh = ok ? vehs[k] : null, dueno = ok ? datosDueno(vehs, k) : null;
  const occ = {}; if (zona) ocupados(tickets, zona).forEach(t => occ[t.espacio] = t.placa);
  const espSel = esp && !occ[esp] ? esp : null, libres = zonaCap(zona) - Object.keys(occ).length;
  const listo = ok && !act && zona && espSel;

  /* Al reconocer la placa: avisa si debe; propone color, modelo y, si maneja el dueño, sus datos */
  useEffect(() => {
    if (!ok) return;
    if (deudasDe(leer().tickets, k).length) vibrar([60, 40, 60]);
    const v = leer().vehs[k], o = datosDueno(leer().vehs, k);
    if (v || o) setD(x => ({ color:x.color || v?.color || '', modelo:x.modelo || v?.modelo || '', nombre:x.nombre || (quien === 'dueno' && o ? o.nombre : ''), dni:x.dni || (quien === 'dueno' && o ? o.dni : '') }));
  }, [k]);

  const cambiarQuien = q => { setQuien(q); setD(x => ({ ...x, nombre:q === 'dueno' && dueno ? dueno.nombre : '', dni:q === 'dueno' && dueno ? dueno.dni : '' })); };
  const elegirEsp = n => { if (occ[n]){ snack(`El espacio ${n} está ocupado por ${occ[n]}`, 'alert'); vibrar(30); return; } setEsp(e => e === n ? null : n); vibrar(15); };
  const iniciar = () => {
    if (!listo) return;
    const datos = { nombre:d.nombre.trim(), dni:d.dni.trim(), color:d.color.trim(), modelo:d.modelo.trim() };
    const t = registrarIngreso({ placa:fmtPlaca(placa), zona, espacio:espSel, datos, quien });
    if (cfg.gps && !cfg.gpsVisto) setTimeout(() => abrirGps(() => ubicarIngreso(t.id)), 500); else ubicarIngreso(t.id);
    setPlaca(''); setEsp(null); setD(VACIO); setQuien('dueno'); setMas(false);
  };

  const pagHoy = tickets.filter(t => t.estado === 'pagado' && isToday(t.pagadoEn)), enParqueo = tickets.filter(t => t.estado === 'activo').length;
  const txtBoton = !ok ? 'Iniciar tiempo' : !zona ? 'Elige la zona' : !espSel ? 'Elige el espacio' : `Iniciar tiempo · ${fmtPlaca(placa)} · E${espSel}`;

  return <Pantalla ref={scroll} titulo={cfg.nombre} sub={`${saludo()} · ${hoyTxt()}`} derecha="receipt" onDerecha={() => router.navigate('/historial')}>
    {/* Resumen del día */}
    <View style={{ borderRadius:22, backgroundColor:c.ink, padding:18, paddingBottom:22, overflow:'hidden' }}>
      {/* Brillo amarillo suave en la esquina */}
      <View style={{ position:'absolute', right:-60, top:-80, width:210, height:210, borderRadius:105, backgroundColor:'rgba(247,181,0,0.10)' }} />
      <View style={{ position:'absolute', right:-20, top:-40, width:120, height:120, borderRadius:60, backgroundColor:'rgba(247,181,0,0.10)' }} />
      <View style={{ flexDirection:'row', alignItems:'center', gap:8 }}><Icono n="trend" size={18} color={c.yel} /><T size={13} color="rgba(255,255,255,0.85)">Cobrado hoy</T></View>
      <T peso="numero" size={38} color="#fff" style={{ marginVertical:4 }}>{money(sum(pagHoy))}</T>
      <View style={{ flexDirection:'row', gap:8 }}>
        <Ficha icono="receipt">{pagHoy.length} {pagHoy.length === 1 ? 'pago' : 'pagos'}</Ficha>
        <Ficha icono="qr">{money(sum(pagHoy.filter(t => t.metodo === 'qr')))} por QR</Ficha>
      </View>
      <Franja alto={5} style={{ position:'absolute', left:0, right:0, bottom:0 }} />
    </View>
    <View style={{ flexDirection:'row', gap:12, marginTop:12 }}>
      <Mini icono="car" fondo={c.yelSoft} color="#A07400" titulo="En parqueo" valor={String(enParqueo)} onPress={() => router.navigate('/activos')} />
      <Mini icono="alert" fondo={c.badSoft} color={c.bad} titulo="Por cobrar" valor={money(sum(tickets.filter(t => t.estado === 'pendiente')))} onPress={() => router.navigate({ pathname:'/historial', params:{ f:'pend' } })} />
    </View>

    {/* Registro de ingreso */}
    <Tarjeta style={{ marginTop:16 }}>
      <View style={{ flexDirection:'row', alignItems:'center', justifyContent:'space-between' }}>
        <T peso="medio" size={16}>Registrar ingreso</T>
        <View style={{ backgroundColor:c.yelSoft, borderRadius:99, paddingHorizontal:10, paddingVertical:3 }}><T peso="medio" size={11.5} color={c.yelInk}>Paso 1 de 2</T></View>
      </View>
      <View style={{ flexDirection:'row', alignItems:'center', gap:12, marginTop:14, borderWidth:2, borderColor:ok && !act ? c.ok : c.outline, borderRadius:16, paddingHorizontal:12, paddingVertical:8, backgroundColor:c.surface }}>
        <View style={{ width:48, height:48, borderRadius:10, backgroundColor:c.surface2, alignItems:'center', justifyContent:'center' }}><Icono n="car" size={20} color={c.text2} /><T peso="medio" size={9} color={c.text2}>PERÚ</T></View>
        <View style={{ flex:1 }}>
          <T size={12} color={c.text2}>Placa del vehículo</T>
          <TextInput ref={refPlaca} value={placa} onChangeText={v => setPlaca(fmtPlaca(v))} autoCapitalize="characters" autoCorrect={false} placeholder="ABC-123" placeholderTextColor={c.text3}
            onSubmitEditing={iniciar} style={{ fontFamily:F.tituloFuerte, fontSize:30, letterSpacing:3, color:c.text, padding:0 }} />
        </View>
        {ok && !act ? <Icono n="checkc" size={24} color={c.ok} /> : null}
      </View>
      <View style={{ flexDirection:'row', justifyContent:'space-between', marginTop:6, marginHorizontal:4 }}>
        <T size={12} color={c.text2}>Auto: ABC-123 · Moto: 1234-AB</T><T size={12} color={c.text2}>{k.length ? `${k.length}/6` : ''}</T>
      </View>

      {/* Avisos según la placa */}
      {act ? <Aviso tipo="info" icono="clock" titulo="Este vehículo ya está en el parqueo" accion={<Btn tipo="tonal" chico onPress={() => router.navigate('/activos')}>Ver en activos</Btn>}>
        Ingresó a las {hhmm(act.inicio)} ({hace(act.inicio)}){act.espacio ? ` en el espacio ${act.espacio}` : ''}.</Aviso> : null}
      {!act && deu.length ? <Aviso tipo="warn" icono="alert" titulo={`Tiene una deuda de ${money(sum(deu))}`} accion={<Btn tipo="tonal" chico icono="wallet" onPress={() => abrirDeuda(deu[0].id)}>Cobrar deuda · {money(sum(deu))}</Btn>}>
        Se retiró sin pagar {deu.length} {deu.length > 1 ? 'veces' : 'vez'}. Puedes cobrarla ahora, o se sumará al cobro cuando salga.</Aviso> : null}
      {!act && (veh?.modelo || veh?.color || dueno) ? <Aviso tipo="info" icono="car" titulo="Vehículo registrado antes">{[[veh?.modelo, veh?.color].filter(Boolean).join(' · '), dueno?.nombre ? 'Dueño: ' + dueno.nombre : ''].filter(Boolean).join(' — ')}</Aviso> : null}

      {/* Zona y espacio */}
      <T size={12} color={c.text2} style={{ marginTop:16, marginLeft:4, marginBottom:5 }}>Zona de estacionamiento</T>
      <ElegirZona valor={zona} onCambio={z => { cambiarCfg({ zona:z }); setEsp(null); }} />
      <View style={{ flexDirection:'row', alignItems:'center', justifyContent:'space-between', marginTop:14, marginBottom:8, marginHorizontal:4 }}>
        <T size={12} color={c.text2}>Espacio que ocupará</T>
        <View style={{ flexDirection:'row', gap:10 }}><Ley borde={c.outline}>Libre</Ley><Ley fondo={c.surface3}>Ocupado</Ley><Ley fondo={c.primary}>Elegido</Ley></View>
      </View>
      {zona ? <View style={{ flexDirection:'row', flexWrap:'wrap', gap:8 }}>
        {Array.from({ length:zonaCap(zona) }, (_, i) => { const n = i + 1, p = occ[n], on = espSel === n;
          return <Pressable key={n} onPress={() => elegirEsp(n)} accessibilityLabel={p ? `Espacio ${n}, ocupado por ${p}` : `Espacio ${n}, libre`}
            style={({ pressed }) => ({ width:'17.6%', height:46, borderRadius:12, borderWidth:1.5, alignItems:'center', justifyContent:'center', transform:[{ scale:pressed ? .92 : 1 }],
              borderColor:on ? c.primary : p ? c.surface3 : c.outline, backgroundColor:on ? c.primary : p ? c.surface3 : c.surface })}>
            {p ? <><Icono n="car" size={16} color={c.text3} /><T size={9} color={c.text3} style={{ position:'absolute', top:2, right:5 }}>{n}</T></>
              : <T peso="medio" size={15} color={on ? c.onPrimary : c.text}>{n}</T>}
          </Pressable>; })}
      </View> : <View style={{ padding:18, borderRadius:12, backgroundColor:c.surface2, alignItems:'center' }}><T size={13} color={c.text2}>Elige la zona para ver sus espacios</T></View>}
      {zona ? <T size={12.5} color={!libres ? c.bad : c.text2} style={{ marginTop:8, marginLeft:4 }}>{!libres ? 'Esta zona está llena: no hay espacios libres' : espSel ? `Espacio ${espSel} elegido` : 'Toca el espacio donde se estacionó el vehículo'}</T> : null}

      <Btn icono="play" disabled={!listo} onPress={iniciar} style={{ marginTop:14 }}>{txtBoton}</Btn>

      {/* Quién maneja y sus datos (opcional) */}
      <Pressable onPress={() => setMas(m => !m)} style={{ flexDirection:'row', alignItems:'center', gap:12, marginTop:10, padding:12, borderRadius:12 }}>
        <View style={{ width:36, height:36, borderRadius:18, backgroundColor:c.surface2, alignItems:'center', justifyContent:'center' }}><Icono n="user" size={18} color={c.text2} /></View>
        <View style={{ flex:1 }}><T size={14.5}>Quién maneja y sus datos</T><T size={12.5} color={c.text2}>Opcional · dueño u otro conductor</T></View>
        <View style={{ transform:[{ rotate:mas ? '180deg' : '0deg' }] }}><Icono n="chev" size={20} color={c.text2} /></View>
      </Pressable>
      {mas ? <View>
        <T size={12} color={c.text2} style={{ marginLeft:4, marginBottom:6 }}>¿Quién maneja el vehículo?</T>
        <Segmentado opciones={QUIEN} valor={quien} onCambio={cambiarQuien} />
        <T size={12.5} color={quien === 'dueno' && dueno ? c.ok : c.text2} style={{ marginTop:6, marginLeft:4 }}>{textoQuien(quien, !!dueno)}</T>
        <Campo label={quien === 'conductor' ? 'Nombre del conductor' : 'Nombre del dueño'} style={{ marginTop:12 }} value={d.nombre} onChangeText={v => setD(x => ({ ...x, nombre:v }))} />
        <View style={{ flexDirection:'row', gap:10, marginTop:12 }}>
          <Campo label="DNI" style={{ flex:1 }} value={d.dni} keyboardType="number-pad" maxLength={8} onChangeText={v => setD(x => ({ ...x, dni:v.replace(/\D/g, '') }))} />
          <Campo label="Color" style={{ flex:1 }} value={d.color} onChangeText={v => setD(x => ({ ...x, color:v }))} />
        </View>
        <Campo label="Marca y modelo" style={{ marginTop:12 }} value={d.modelo} onChangeText={v => setD(x => ({ ...x, modelo:v }))} />
      </View> : null}
    </Tarjeta>

    <Subtitulo accion="Ver todo" onAccion={() => router.navigate('/historial')}>Últimos movimientos</Subtitulo>
    <Tarjeta pad={false}>
      {tickets.length ? tickets.slice(0, 4).map((t, i) => <FilaMovimiento key={t.id} t={t} borde={i > 0} onPress={t.estado === 'pendiente' ? () => abrirDeuda(t.id) : null} />)
        : <Vacio titulo="Sin movimientos todavía">Registra la primera placa del turno.</Vacio>}
    </Tarjeta>
  </Pantalla>;
}

const Ficha = ({ icono, children }) => <View style={{ flexDirection:'row', alignItems:'center', gap:6, backgroundColor:'rgba(255,255,255,0.12)', borderRadius:99, paddingHorizontal:10, paddingVertical:4 }}>
  <Icono n={icono} size={14} color="#fff" /><T size={12.5} color="#fff">{children}</T></View>;
function Mini({ icono, fondo, color, titulo, valor, onPress }){
  const c = useTema();
  return <Pressable onPress={onPress} style={{ flex:1, flexDirection:'row', alignItems:'center', gap:12, backgroundColor:c.surface, borderRadius:18, borderWidth:1, borderColor:c.outline, padding:14 }}>
    <View style={{ width:38, height:38, borderRadius:12, backgroundColor:fondo, alignItems:'center', justifyContent:'center' }}><Icono n={icono} size={19} color={color} /></View>
    <View style={{ flex:1 }}><T size={12.5} color={c.text2}>{titulo}</T><T peso="medio" size={18} numberOfLines={1}>{valor}</T></View>
  </Pressable>;
}
function Ley({ fondo, borde, children }){
  const c = useTema();
  return <View style={{ flexDirection:'row', alignItems:'center', gap:4 }}><View style={{ width:10, height:10, borderRadius:3, backgroundColor:fondo || 'transparent', borderWidth:borde ? 1.5 : 0, borderColor:borde }} /><T size={11} color={c.text3}>{children}</T></View>;
}
