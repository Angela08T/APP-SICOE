# SICOE · Sistema de Cobro de Estacionamiento

Municipalidad de San Juan de Lurigancho · Subgerencia de Transporte

| Carpeta | Qué contiene | Estado |
|---|---|---|
| `app-movil/` | App Android para los cobradores de campo (`ParqueoMuni.apk`) | Funcional, guarda los datos en cada celular |
| `panel-admin/` | Panel web para el personal administrativo (abrir `index.html`) | Boceto con datos de ejemplo |
| `servidor/` | API y base de datos que unirán la app y el panel | Pendiente: se definirá la base de datos |
| `docs/` | Guías de instalación y uso | Pendiente |

## Cómo ver cada parte

- **App en el celular virtual:** doble clic en `app-movil/Abrir en celular virtual.bat`.
- **App en una ventana de PC:** doble clic en `app-movil/Abrir app (celular).bat`.
- **Panel administrativo:** abrir `panel-admin/index.html` en el navegador.

## Editar el panel

El panel está hecho con **React 19** y **Motion** (animaciones). El código está en `panel-admin/src/`:

| Archivo | Qué contiene |
|---|---|
| `App.jsx` | Estructura: barra lateral, barra superior, búsqueda (Ctrl + K), notificaciones |
| `components/Login.jsx` | Pantalla de inicio de sesión |
| `components/ui.jsx` | Piezas reutilizables: tarjetas, gráficos, dona, modal, contadores animados |
| `views/` | Una pantalla por sección (Resumen, En vivo, Movimientos, Deudas, Cobradores, Zonas, Reportes) |
| `data.js` | Datos de ejemplo del boceto |

**Perfiles de acceso** (se eligen en el login):

- **Administrador del sistema** (equipo que creó y mantiene la página y la app): ve y edita todo, incluidos
  **Reportes** y la **Actividad del sistema**.
- **Personal administrativo** (trabajadores de la Subgerencia): Resumen, Ocupación en vivo, Movimientos, Deudas,
  Usuarios, Cobradores y Zonas y tarifa, también con permiso para editar. No ve Reportes ni Actividad, no puede
  asignar el perfil de administrador ni modificar las cuentas de los administradores.

**Sección Control** (la ven los dos perfiles):

- **Cierres de turno:** el cuadre de caja que hace cada cobrador al cerrar su turno en la app (efectivo a entregar,
  contado y diferencia con su motivo), con filtros por resultado y por cobrador.
- **Ubicaciones:** plano de las zonas con la ubicación de cada ingreso y cobro del día, y la lista de los registros
  hechos a más de 120 m de su zona.
- Además, **Movimientos** muestra si la constancia de cada pago con QR se verificó y la precisión del GPS;
  **Deudas** tiene la pestaña **Recuperadas**; y el **Resumen**, el bloque **Control del día**.

Los permisos de cada perfil están en `NAV` dentro de `App.jsx`. En el boceto se aplican solo en la pantalla:
al conectar el servidor, este también debe validarlos.
| `styles.css` | Colores, tipografías y estilos |

- **Ver los cambios mientras editas:** en `panel-admin/`, ejecutar `npm install` (solo la primera vez) y luego `npm run dev`.
- **Generar el panel final:** `node panel-admin/construir.js`. Regenera `panel-admin/index.html`, un solo archivo
  con todo incluido (logo y tipografías) que se abre con doble clic y funciona sin internet.

La versión anterior en HTML simple quedó en `panel-admin/version-html/` como respaldo.

## Verificación de constancias (app de campo)

Al cobrar con QR, el cobrador puede tomar una foto de la constancia de Yape o Plin del conductor. La app la lee
**dentro del celular, sin internet**, y revisa tres cosas:

- que el **monto** sea el total a pagar;
- que el **N° de operación** no se haya usado antes en otro cobro (si se repite, pide confirmar con un segundo toque);
- que la constancia sea **de hoy** y no anterior al ingreso del vehículo.

El lector de texto (Tesseract.js con el idioma español) está en `app-movil/ocr/` y agrega unos 3,6 MB al APK.
Por ahora la revisión de números repetidos usa solo los cobros guardados en ese celular; cuando exista el servidor,
se podrá comparar con los de todos los cobradores.

## Aviso, cuadre de caja y ubicación (app de campo, versión 1.2)

- **Aviso de cambio de fracción:** cuando a un vehículo le faltan pocos minutos (2 por defecto) para subir de monto,
  el celular vibra, muestra el aviso con el botón «Cobrar» y su tarjeta en «Activos» se resalta en amarillo. Si la app
  está en segundo plano, llega como notificación. Se activa y se ajusta en Ajustes › Avisos y ubicación.
- **Cuadre de caja al cerrar el turno:** «Cerrar turno» (en Ajustes) muestra el efectivo que el cobrador debe entregar,
  le pide el efectivo contado (a mano o contando billetes y monedas) e indica si cuadra, falta o sobra. Si no cuadra,
  hay que escribir el motivo. Los cierres quedan en Ajustes › Cierres de turno y se pueden descargar en Excel.
- **Ubicación al registrar:** al registrar un ingreso y al confirmar un cobro se guarda la ubicación del celular
  (latitud, longitud y precisión). No sigue el recorrido del cobrador. La primera vez se le explica antes de pedir
  el permiso, y se puede desactivar en Ajustes. La ubicación sale en el reporte de Excel.

## Compilar el APK

```
SDK=<ruta Android SDK> JDK=<ruta JDK 17> bash app-movil/android/build.sh
```
