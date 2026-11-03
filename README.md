# SICOE · Sistema de Cobro de Estacionamiento

Municipalidad de San Juan de Lurigancho · Subgerencia de Transporte

SICOE reúne dos herramientas:

- una **app Android para los cobradores de campo**, que registran placa, zona y espacio, cobran con QR o efectivo y controlan las deudas;
- un **panel web para el personal administrativo**, que sigue la recaudación, la ocupación, los cierres de turno y gestiona usuarios, zonas y tarifa.

> **Estado:** frontend en desarrollo. La app guarda los datos en cada celular y el panel usa datos de ejemplo;
> todavía no hay un servidor que los conecte.

## Carpetas

| Carpeta | Qué contiene | Tecnología |
|---|---|---|
| [`app-movil-rn/`](app-movil-rn/) | **App de campo actual** | React Native + Expo (SDK 58), solo Android |
| [`panel-admin/`](panel-admin/) | Panel web administrativo | React 19 + Motion + Vite |
| [`app-movil/`](app-movil/) | Versión anterior de la app (referencia) | HTML/JS dentro de un WebView Android |

## App de campo (`app-movil-rn`)

Detalle completo en [`app-movil-rn/README.md`](app-movil-rn/README.md).

```bash
cd app-movil-rn
npm install
npm run apk          # genera app-movil-rn/SICOE.apk (necesita JDK 17 y Android SDK 36)
npx expo run:android # para desarrollar en un celular conectado o en el emulador
```

Funciones: registro por placa, zona y espacio · «¿quién maneja?» (dueño u otro conductor) · tiempo y monto en vivo ·
cobro con deudas anteriores sumadas · verificación de la constancia de Yape/Plin con el lector de texto del celular ·
aviso de cambio de fracción (también con la app cerrada) · ubicación al registrar · cierre de turno con cuadre de caja ·
historial y reportes en Excel.

## Panel administrativo (`panel-admin`)

- **Ver sin instalar nada:** abrir `panel-admin/index.html` con doble clic (funciona sin internet).
- **Editar con recarga inmediata:** desde la carpeta principal, `npm run dev` (la primera vez, `npm install` dentro de `panel-admin`).
- **Generar el archivo final:** `npm run build`. Regenera `panel-admin/index.html`, un solo archivo con todo incluido.

Código en `panel-admin/src/`: `App.jsx` (estructura y permisos por perfil), `views/` (una pantalla por sección),
`components/` (inicio de sesión y piezas reutilizables), `data.js` (datos de ejemplo) y `styles.css` (colores y estilos).

**Perfiles de acceso** (se eligen al iniciar sesión):

- **Administrador del sistema:** ve y edita todo, incluidos Reportes y la Actividad del sistema.
- **Personal administrativo:** Resumen, Ocupación en vivo, Movimientos, Deudas, Cierres de turno, Ubicaciones,
  Usuarios, Cobradores y Zonas y tarifa. No ve Reportes ni Actividad, y no puede asignar el perfil de administrador.

Los permisos se aplican solo en la pantalla (`NAV` en `App.jsx`); cuando exista el servidor, también deberá validarlos.

## Próximos pasos

- Servidor y base de datos para unir la app y el panel (registros compartidos entre cobradores).
- Firma propia de la app para publicarla en Play Store.
- Pruebas con constancias reales de Yape y Plin y con cobradores en un piloto.
