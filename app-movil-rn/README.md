# SICOE · App de campo (React Native)

App Android para los cobradores de estacionamiento de la Municipalidad de San Juan de Lurigancho.
Está hecha con **React Native + Expo (SDK 58)**.

Funciona **sin internet**: los registros se guardan en el celular. Todavía no se conecta a un servidor.

## Qué hace

- **Registro de ingreso:** placa, zona, espacio y, si se quiere, quién maneja (dueño u otro conductor).
- **Activos:** tiempo y monto de cada vehículo en vivo.
- **Cobro:** total con las deudas anteriores de la placa sumadas, QR de la municipalidad, pago con QR o efectivo, o «se fue sin pagar».
- **Verificación de la constancia:** foto del comprobante de Yape o Plin. El texto se lee en el celular con **ML Kit** y se revisan el monto, el N° de operación (que no esté repetido) y la fecha.
- **Aviso de cambio de fracción:** notificación con vibración unos minutos antes de que un vehículo suba de monto, **aunque la app esté cerrada**.
- **Ubicación al registrar:** guarda el GPS al registrar un ingreso y al cobrar (no sigue el recorrido).
- **Cierre de turno:** cuadre de caja del efectivo, con el motivo si no cuadra.
- **Historial y reportes:** movimientos por día y descarga en Excel (CSV) para compartir.

## Estructura

| Carpeta / archivo | Qué contiene |
|---|---|
| `src/app/_layout.js` | Raíz: tipografías, datos guardados, inicio de sesión y aviso de fracción con la app abierta |
| `src/app/(tabs)/` | Las cuatro secciones: `index.js` (Inicio), `activos.js`, `historial.js`, `ajustes.js` |
| `src/components/` | Pantallas emergentes (cobro, cámara, cierre de turno, datos) y piezas de interfaz |
| `src/lib/logica.js` | Reglas de negocio: tarifa, placas, deudas, lectura de constancias, reportes |
| `src/lib/datos.js` | Datos guardados en el celular (AsyncStorage) |
| `src/lib/acciones.js` | Registrar, cobrar, dejar deuda y deshacer |
| `src/lib/servicios.js` | Cámara/lector de texto, GPS, notificaciones, archivos |
| `app.json` | Nombre, ícono, permisos de Android y configuración de los módulos nativos |

La carpeta `android/` **no se edita ni se sube**: Expo la genera a partir de `app.json` (`npx expo prebuild`).

## Cómo usarla

Requisitos: Node.js 20 o más, JDK 17 y Android SDK con la plataforma 36.

```bash
cd app-movil-rn
npm install
npm run apk        # genera SICOE.apk en esta carpeta
```

Para desarrollar con recarga inmediata en un celular conectado por USB o en el emulador:

```bash
npx expo run:android
```

> La app usa módulos nativos (lector de texto ML Kit), así que **no funciona en Expo Go**: hay que instalar el APK
> o usar `npx expo run:android`.

## Pendiente

- Conectar con el servidor para compartir registros entre celulares y con el panel web.
- Firma propia para publicar en Play Store (hoy el APK se firma con la clave de depuración de React Native).
- Probar la lectura con constancias reales de Yape y Plin.
