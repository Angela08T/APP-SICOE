/* tema.js: colores y tipografías de SICOE (los mismos de la app anterior).
   useTema() devuelve los colores del modo claro u oscuro según Ajustes › Tema (o el celular, si es «Automático»). */
import { useColorScheme } from 'react-native';
import { useDatos } from './datos';

const CLARO = {
  bg:'#F3F4F7', surface:'#FFFFFF', surface2:'#F1F3F6', surface3:'#E9ECF1', text:'#191C20', text2:'#5C626B', text3:'#8B919A', outline:'#E4E7EB',
  primary:'#1A6FB5', primary2:'#2AA7B8', onPrimary:'#FFFFFF', primarySoft:'#E3EFFA', onPrimarySoft:'#0F4C80',
  yel:'#F7B500', yel2:'#FFCB3D', yelSoft:'#FFF4D2', yelInk:'#5C4200',
  ok:'#4C7F12', okSoft:'#EEF6DE', bad:'#C8142A', badSoft:'#FCE9EB', warn:'#A85600', warnSoft:'#FFF1DC',
  ink:'#16203A', scrim:'rgba(15,18,24,0.42)', oscuro:false
};
const OSCURO = {
  ...CLARO,
  bg:'#101215', surface:'#1A1D21', surface2:'#22262B', surface3:'#2B3036', text:'#E4E6EA', text2:'#A6ACB4', text3:'#7D838B', outline:'#2D3238',
  primary:'#74B6F2', onPrimary:'#062A4D', primarySoft:'#14304D', onPrimarySoft:'#D3E8FC', yelSoft:'#3A2F0E', yelInk:'#FFD666',
  ok:'#A6D96A', okSoft:'#24361A', bad:'#FF8A95', badSoft:'#3E1A20', warn:'#FFB65C', warnSoft:'#3A2A12', ink:'#0B1222', scrim:'rgba(0,0,0,0.6)', oscuro:true
};
/* Colores de San Juan de Lurigancho (franja arcoíris y letras de SICOE) */
export const ARCOIRIS = ['#D7182A', '#E5127D', '#F39200', '#F7B500', '#8DBE22', '#2AA7B8'];

/* Tipografías (incluidas en la app, funcionan sin internet) */
export const F = {
  titulo:'PlusJakartaSans_700Bold', tituloFuerte:'PlusJakartaSans_800ExtraBold', medio:'PlusJakartaSans_600SemiBold',
  texto:'PlusJakartaSans_400Regular', textoMedio:'PlusJakartaSans_500Medium', numero:'Fredoka_700Bold'
};

export function useTema(){
  const sistema = useColorScheme(), tema = useDatos(e => e.cfg.tema);
  return (tema === 'auto' ? sistema === 'dark' : tema === 'dark') ? OSCURO : CLARO;
}
