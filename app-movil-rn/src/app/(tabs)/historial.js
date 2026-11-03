/* historial.js: «Historial». Resumen de lo cobrado hoy (QR, efectivo y deudas), movimientos por día y descarga en Excel. */
import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import Pantalla from '../../components/Pantalla';
import { snack } from '../../components/Capas';
import { Btn, FilaMovimiento, Segmentado, T, Tarjeta, Vacio } from '../../components/ui';
import { useTema } from '../../lib/tema';
import { leer, useDatos } from '../../lib/datos';
import { csvTickets, diaTxt, isToday, money, sum } from '../../lib/logica';
import { abrirDeuda } from '../../lib/abrir';
import { compartirCsv } from '../../lib/servicios';

const exportarMovimientos = () => compartirCsv('parqueo-' + new Date().toISOString().slice(0, 10) + '.csv', csvTickets(leer().tickets)).catch(() => snack('No se pudo crear el reporte', 'alert'));

export default function Historial(){
  const c = useTema(), tickets = useDatos(e => e.tickets), { f } = useLocalSearchParams();
  const [filtro, setFiltro] = useState('hoy');
  useEffect(() => { if (f) setFiltro(f); }, [f]);
  const pagHoy = tickets.filter(t => t.estado === 'pagado' && isToday(t.pagadoEn));
  const qr = sum(pagHoy.filter(t => t.metodo === 'qr')), ef = sum(pagHoy.filter(t => t.metodo !== 'qr'));
  const deu = tickets.filter(t => t.estado === 'pendiente'), pe = sum(deu), tot = qr + ef + pe || 1;
  const lista = (filtro === 'hoy' ? tickets.filter(t => isToday(t.inicio)) : filtro === 'pend' ? deu : tickets).slice(0, 300);
  // Agrupado por día (Hoy, Ayer, martes 13 de octubre…)
  const grupos = []; lista.forEach(t => { const g = diaTxt(t.inicio); if (!grupos.length || grupos[grupos.length - 1][0] !== g) grupos.push([g, []]); grupos[grupos.length - 1][1].push(t); });

  return <Pantalla titulo="Historial" sub="Pagos, deudas y reportes">
    <Segmentado opciones={[['hoy', 'Hoy'], ['pend', 'Deudas', deu.length || null], ['todo', 'Todo']]} valor={filtro} onCambio={setFiltro} />
    <Tarjeta style={{ marginTop:12 }}>
      <View style={{ flexDirection:'row', alignItems:'flex-end', justifyContent:'space-between' }}>
        <View><T size={12.5} color={c.text2}>Cobrado hoy</T><T peso="medio" size={26}>{money(qr + ef)}</T></View>
        <T size={12.5} color={c.text2} style={{ textAlign:'right' }}>{pagHoy.length} {pagHoy.length === 1 ? 'pago' : 'pagos'}{'\n'}{deu.length} {deu.length === 1 ? 'deuda' : 'deudas'}</T>
      </View>
      <View style={{ flexDirection:'row', height:8, borderRadius:4, overflow:'hidden', backgroundColor:c.surface2, marginTop:14, marginBottom:12, gap:2 }}>
        <View style={{ width:qr / tot * 100 + '%', backgroundColor:c.primary }} /><View style={{ width:ef / tot * 100 + '%', backgroundColor:c.ok }} /><View style={{ width:pe / tot * 100 + '%', backgroundColor:c.bad }} />
      </View>
      <View style={{ flexDirection:'row' }}>
        {[['QR', qr, c.primary], ['Efectivo', ef, c.ok], ['Deudas', pe, c.bad]].map(([l, v, col]) => <View key={l} style={{ flex:1 }}>
          <View style={{ flexDirection:'row', alignItems:'center', gap:6 }}><View style={{ width:8, height:8, borderRadius:2, backgroundColor:col }} /><T size={12} color={c.text2}>{l}</T></View>
          <T peso="medio" size={14}>{money(v)}</T></View>)}
      </View>
    </Tarjeta>
    {filtro === 'pend' && lista.length ? <T size={13} color={c.text2} style={{ marginTop:18, marginBottom:8, marginLeft:4 }}>Toca una deuda para cobrarla</T> : null}
    {!lista.length ? <Tarjeta style={{ marginTop:16 }}>{filtro === 'pend' ? <Vacio titulo="No hay deudas">Todos los conductores pagaron.</Vacio> : <Vacio titulo="Sin movimientos">Aún no hay registros en este periodo.</Vacio>}</Tarjeta>
      : grupos.map(([g, ts]) => <View key={g}>
        {filtro !== 'pend' ? <T peso="textoMedio" size={13} color={c.text2} style={{ marginTop:18, marginBottom:8, marginLeft:4 }}>{g}</T> : null}
        <Tarjeta pad={false}>{ts.map((t, i) => <FilaMovimiento key={t.id} t={t} borde={i > 0} onPress={t.estado === 'pendiente' ? () => abrirDeuda(t.id) : null} />)}</Tarjeta>
      </View>)}
    <Btn tipo="borde" icono="download" style={{ marginTop:18 }} onPress={exportarMovimientos}>Descargar reporte (Excel)</Btn>
  </Pantalla>;
}
