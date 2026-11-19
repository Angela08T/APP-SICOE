# SICOE · Documentación completa

**Sistema de Cobro de Estacionamiento**
Municipalidad de San Juan de Lurigancho · Subgerencia de Transporte

---

## Contenido

1. [¿Qué es SICOE?](#1-qué-es-sicoe)
2. [Cómo funciona (visión general)](#2-cómo-funciona-visión-general)
3. [Guía de instalación](#3-guía-de-instalación)
4. [Manual de usuario: app de campo](#4-manual-de-usuario-app-de-campo)
5. [Manual de usuario: panel web](#5-manual-de-usuario-panel-web)
6. [Reglas del cobro](#6-reglas-del-cobro)
7. [Cómo está hecho (documentación técnica)](#7-cómo-está-hecho-documentación-técnica)
8. [Problemas comunes y soluciones](#8-problemas-comunes-y-soluciones)
9. [Estado actual y próximos pasos](#9-estado-actual-y-próximos-pasos)

---

## 1. ¿Qué es SICOE?

SICOE ayuda a la municipalidad a cobrar el estacionamiento en la vía pública de forma ordenada y transparente.
Tiene dos partes:

| Parte | Para quién | Dónde funciona | Carpeta |
|---|---|---|---|
| **App de campo** | Cobradores que están en la calle | Celular Android | `app-movil-rn/` |
| **Panel web** | Personal administrativo y soporte | Navegador de la computadora | `panel-admin/` |

**Con la app**, el cobrador registra cada vehículo que se estaciona (placa, zona y espacio), ve cuánto tiempo lleva y
cuánto debe pagar, cobra por QR (Yape/Plin) o en efectivo, verifica la constancia de pago, controla las deudas y al
final del turno hace el cuadre de caja.

**Con el panel**, la oficina sigue la recaudación del día, la ocupación de cada zona, los movimientos, las deudas, los
cierres de turno y las ubicaciones; además gestiona usuarios, cobradores, zonas y la tarifa.

> **Importante:** por ahora es solo el *frontend* (lo que se ve y se usa). La app guarda los datos en cada celular y
> el panel muestra datos de ejemplo. Todavía no hay un servidor ni base de datos que los conecte (ver
> [sección 9](#9-estado-actual-y-próximos-pasos)).

---

## 2. Cómo funciona (visión general)

```
   CALLE                                        OFICINA
┌──────────────────────┐                ┌───────────────────────────┐
│  App de campo        │                │  Panel web                │
│  (celular Android)   │   (futuro:     │  (navegador)              │
│                      │    servidor)   │                           │
│  • Registrar placa   │  ───────────▶  │  • Resumen del día        │
│  • Tiempo y monto    │                │  • Ocupación en vivo      │
│  • Cobrar QR/efect.  │                │  • Movimientos y deudas   │
│  • Deudas            │                │  • Cierres de turno       │
│  • Cierre de turno   │  ◀───────────  │  • Zonas y tarifa         │
│                      │   (tarifa,     │  • Usuarios y cobradores  │
│  Datos en el celular │    zonas)      │  Datos de ejemplo         │
└──────────────────────┘                └───────────────────────────┘
```

### El recorrido de un vehículo

1. **Llega un vehículo.** El cobrador escribe la placa, elige la zona y toca un espacio libre → **Iniciar**.
   La app guarda la hora de entrada y, si está activado, la ubicación GPS.
2. **Mientras está estacionado.** En **Activos** se ve el tiempo y el monto en vivo. Unos minutos antes de que suba
   de fracción, el celular vibra y avisa (aunque la app esté cerrada).
3. **Se retira.** El cobrador toca **Detener y cobrar**. La app muestra el total (con las deudas anteriores de esa
   placa ya sumadas) y el QR de la municipalidad.
4. **Paga.**
   - **Con QR:** el conductor escanea y paga. El cobrador puede tomar foto de la constancia de Yape/Plin y la app
     revisa el monto, el N° de operación y la fecha.
   - **En efectivo:** se registra el cobro.
   - **Se fue sin pagar:** queda como **deuda**. La próxima vez que esa placa se registre, la app lo avisa y el
     monto se suma al cobro.
5. **Fin del turno.** El cobrador hace el **cierre de turno**: cuenta el efectivo por billetes y monedas, y la app lo
   compara con lo que debería tener.
6. **Oficina.** Toda esa información es la que el panel muestra (cuando exista el servidor, llegará sola).

---

## 3. Guía de instalación

### 3.1 Requisitos

| Para… | Necesitas |
|---|---|
| Solo **ver el panel** | Un navegador (Chrome, Edge, Firefox). Nada más. |
| Solo **usar la app** | Un celular Android 7 o superior, o el emulador. |
| **Editar el panel** | [Node.js](https://nodejs.org) 20 o superior. |
| **Editar o compilar la app** | Node.js 20+, **JDK 17** y **Android SDK** (plataforma 36). |

### 3.2 Descargar el proyecto

```powershell
git clone https://github.com/Angela08T/APP-SICOE.git
cd APP-SICOE
```

O en GitHub: botón verde **Code → Download ZIP**, y descomprimirlo.

### 3.3 Panel web

**Opción A — Solo verlo (sin instalar nada):**
abrir `panel-admin/index.html` con doble clic. Funciona sin internet: es un solo archivo con todo incluido.

**Opción B — Editarlo con recarga inmediata:**

```powershell
cd panel-admin
npm.cmd install        # solo la primera vez
cd ..
npm.cmd run dev        # desde la carpeta principal
```

Abrir en el navegador la dirección que aparece (normalmente `http://localhost:5173`). Cada cambio que guardes en
`panel-admin/src/` se ve al instante.

**Generar el archivo final** (actualiza `panel-admin/index.html`):

```powershell
npm.cmd run build
```

> En PowerShell usa `npm.cmd` en lugar de `npm` si te aparece un error de "ejecución de scripts deshabilitada".

### 3.4 App de campo

**Opción A — Instalarla en un celular (lo más fácil):**

1. Conseguir el archivo `SICOE.apk` (de la sección **Releases** del repositorio, o generarlo con la opción C).
2. Pasarlo al celular (cable, WhatsApp, Drive…) y abrirlo → **Instalar**.
   Si el celular lo pide, permitir "instalar apps de origen desconocido".
3. Abrir **SICOE**.

**Opción B — En el emulador de la PC (PowerShell):**

```powershell
# 1. Abrir el emulador (esperar a que cargue la pantalla del celular)
& "$env:LOCALAPPDATA\ParqueoMuniSDK\sdk\emulator\emulator.exe" -avd ParqueoPhone

# 2. En otra ventana de PowerShell, desde la carpeta del proyecto: instalar la app
& "$env:LOCALAPPDATA\ParqueoMuniSDK\sdk\platform-tools\adb.exe" install -r app-movil-rn\SICOE.apk
```

Cuando diga `Success`, abrir el ícono **SICOE** en el emulador.

> Si tu Android SDK está en otra carpeta, cambia `$env:LOCALAPPDATA\ParqueoMuniSDK\sdk` por esa ruta
> (por ejemplo la de Android Studio: `$env:LOCALAPPDATA\Android\Sdk`). Si no tienes un emulador creado, créalo
> desde Android Studio → *Device Manager*.

**Opción C — Generar el APK:**

```powershell
cd app-movil-rn
npm.cmd install
npm.cmd run apk        # deja SICOE.apk en app-movil-rn/
```

La primera vez tarda varios minutos (compila el código nativo). Si no están definidas las variables `ANDROID_HOME` y
`JAVA_HOME`, el script usa el SDK y la JDK de `%LOCALAPPDATA%\ParqueoMuniSDK`.

> **Windows y rutas largas:** la compilación nativa puede fallar con *"Filename longer than 260 characters"* si el
> proyecto está en una carpeta muy profunda. Solución: copiar el proyecto a una ruta corta (por ejemplo `C:\s\rn`) y
> compilar desde ahí.

**Opción D — Modo desarrollo (editar y ver los cambios al instante):**
con el emulador abierto o un celular conectado por USB (con *depuración USB* activada):

```powershell
cd app-movil-rn
npx expo run:android
```

> La app **no funciona con Expo Go** (la app de la Play Store), porque usa módulos nativos como el lector de texto
> de la cámara. Siempre se usa el APK o `npx expo run:android`.

---

## 4. Manual de usuario: app de campo

### 4.1 Iniciar sesión

Escribir el **DNI** (8 dígitos) y la **contraseña**, y tocar **Ingresar**.

> Versión de prueba: acepta cualquier DNI de 8 dígitos y una contraseña de 4 caracteres o más. Cuando exista el
> servidor, se validará con los usuarios creados en el panel.

### 4.2 Pantallas

La app tiene una barra inferior con cinco botones:

| Botón | Para qué sirve |
|---|---|
| **Inicio** | Resumen del turno y registro de nuevos ingresos |
| **Activos** | Vehículos que están estacionados ahora, con su tiempo y monto |
| **+ Nuevo** (amarillo) | Atajo para registrar un ingreso: lleva a Inicio con el cursor en la placa |
| **Historial** | Pagos, deudas y reportes |
| **Ajustes** | QR, tarifa, avisos, ubicación, tema, cierre de turno |

### 4.3 Registrar un ingreso (Inicio)

1. Escribir la **placa** (por ejemplo `ABC-123`; el guion se pone solo).
2. La app avisa si:
   - la placa **ya está en el parqueo**;
   - la placa **tiene deudas** (muestra el monto, que se sumará al cobrar);
   - la placa **ya se registró antes** (muestra sus datos).
3. Elegir la **zona** (la primera vez; luego la recuerda).
4. Tocar un **espacio libre** en la cuadrícula (los ocupados se ven marcados).
5. Opcional: abrir **¿Quién maneja?** y elegir *Dueño* u *Otro conductor*, con nombre, DNI y teléfono.
6. Tocar **Iniciar**. Aparece un aviso con **Deshacer** por si hubo un error.

La primera vez, la app explica para qué usa la ubicación y pide el permiso de GPS.

### 4.4 Vehículos activos

Cada tarjeta muestra la placa, la hora de entrada, el espacio y la zona, el **tiempo transcurrido**, el **monto
actual**, la fracción y cuánto falta para que suba (por ejemplo *"Sube a S/ 1.60 en 28 min"*).

- Un **borde amarillo** indica que está por subir de fracción.
- Un **aviso rojo** indica que esa placa tiene deudas anteriores.
- **Datos:** ver o completar los datos del conductor.
- **Detener y cobrar:** abre la hoja de cobro.
- Se puede **buscar por placa** arriba.

### 4.5 Cobrar

La hoja de cobro muestra:

- **Total a pagar**, con el tiempo y las fracciones; si hay deudas anteriores, el desglose.
- Hora de entrada y salida.
- El **QR de la municipalidad** (se sube en Ajustes) para que el conductor pague con Yape o Plin.
- **Verificar el pago:** tomar una foto (o elegir de la galería) de la constancia del conductor. La app lee el texto y
  revisa:
  - que el **monto** coincida con el total;
  - que el **N° de operación** no se haya usado antes (evita constancias repetidas);
  - que la **fecha** sea de hoy.

  Si todo está bien se ve en verde; si algo no coincide, avisa qué es.

Botones:

| Botón | Qué hace |
|---|---|
| **Efectivo** | Registra el pago en efectivo |
| **Pagó con QR** | Registra el pago con QR (se puede anotar el N° de operación) |
| **Registrar de todos modos** | Si la constancia no cuadra o el N° de operación ya se usó, el botón cambia a este texto: hay que tocarlo otra vez para confirmar |
| **Seguir contando** | Cierra la hoja sin cobrar; el tiempo sigue corriendo |
| **Se fue sin pagar** | Deja el monto como **deuda** de esa placa (con opción de *Deshacer*) |

Al pagar, se marcan como pagadas también las deudas anteriores de esa placa.

### 4.6 Avisos de cambio de fracción

Si están activados (Ajustes), unos minutos antes de que un vehículo suba de monto el celular **vibra y muestra una
notificación**, aunque la app esté cerrada. Con la app abierta aparece un aviso con los botones **Cobrar** y **Ver**.
Los avisos de un vehículo se cancelan solos al cobrarlo.

### 4.7 Historial

- Filtros: **Hoy**, **Deudas** (pendientes) y **Todo**.
- Resumen: total cobrado, cantidad de pagos y deudas, y cuánto fue por QR, efectivo y deudas.
- Lista de movimientos agrupados por día; tocar una **deuda** abre su cobro.
- **Descargar reporte (Excel):** genera un archivo CSV y abre el menú para compartirlo (WhatsApp, correo, Drive…).

### 4.8 Ajustes

| Sección | Opciones |
|---|---|
| **Pago con QR** | Subir o quitar la imagen del QR de la municipalidad; texto que aparece debajo |
| **Tarifa** | Monto por fracción (S/ 0.80), duración de la fracción (30 min) y tolerancia (minutos de gracia) |
| **Avisos y ubicación** | Activar avisos de fracción, cuántos minutos antes avisar, guardar ubicación al registrar |
| **Cierres de turno** | Lista de cierres anteriores y descarga en Excel |
| **Preferencias** | Nombre del parqueo y tema: claro, oscuro o automático |
| **Turno** | **Cerrar turno** y **Borrar datos** (pide confirmación) |

### 4.9 Cierre de turno

1. Ajustes → **Cerrar turno**.
2. La app muestra lo cobrado en el turno: efectivo, QR, cantidad de vehículos y deudas.
3. Contar el efectivo con los botones de **billetes y monedas** (S/ 200 a S/ 0.10).
4. La app compara lo contado con lo esperado: **cuadra**, **sobra** o **falta**.
5. Si no cuadra, hay que escribir el **motivo**.
6. **Cerrar turno** guarda el cierre y vuelve a la pantalla de inicio de sesión.

---

## 5. Manual de usuario: panel web

### 5.1 Iniciar sesión

Elegir el perfil, escribir el **DNI** (8 dígitos) y la **contraseña**, y tocar **Ingresar**.
Al elegir un perfil se llena el DNI de un usuario de ejemplo.

| Perfil | Qué puede hacer |
|---|---|
| **Administrador del sistema - Soporte** | Ve y edita todo, incluidos **Reportes** y la **Actividad** del sistema |
| **Personal administrativo** | Todo menos Reportes y Actividad. Puede crear usuarios, pero **no** asignar el perfil de administrador ni editar cuentas de administrador |

### 5.2 Partes de la pantalla

- **Menú lateral** (en celular se abre con el botón ☰): secciones agrupadas en *Operación*, *Control*,
  *Administración* y *Sistema*. Deudas muestra un contador rojo; Ocupación en vivo, un punto verde.
- **Barra superior:** búsqueda rápida de placas, cambio de tema claro/oscuro y campana de notificaciones.
- Cada sección tiene su propia dirección (`#resumen`, `#deudas`…), así que se puede guardar en favoritos.

### 5.3 Secciones

| Grupo | Sección | Qué muestra | Admin | Personal |
|---|---|---|:-:|:-:|
| Operación | **Resumen** | Recaudación del día, QR vs. efectivo, ocupación, deudas y actividad reciente | ✔ | ✔ |
| Operación | **Ocupación en vivo** | Espacios ocupados en las 12 zonas, ahora mismo | ✔ | ✔ |
| Operación | **Movimientos** | Ingresos, pagos y deudas registrados por los cobradores, con filtros, verificación de constancias y "¿quién maneja?" | ✔ | ✔ |
| Operación | **Deudas** | Vehículos que se retiraron sin pagar y deudas recuperadas | ✔ | ✔ |
| Control | **Cierres de turno** | Cuadre de caja de cada cobrador: esperado, contado, diferencia y motivo | ✔ | ✔ |
| Control | **Ubicaciones** | Dónde se registró cada ingreso y cobro de hoy (GPS) | ✔ | ✔ |
| Administración | **Usuarios** | Personal de campo y administrativo: crear, editar, activar o desactivar | ✔ | ✔ (sin perfil admin) |
| Administración | **Cobradores** | Personal de campo con acceso a la app y su estado (activo o desactivado) | ✔ | ✔ |
| Administración | **Zonas y tarifa** | Zonas, capacidad, tarifa, fracción y tolerancia que reciben las apps | ✔ | ✔ |
| Administración | **Reportes** | Descarga de información para control y rendición | ✔ | — |
| Sistema | **Actividad** | Todo lo que pasa en el panel y en las apps | ✔ | — |

---

## 6. Reglas del cobro

### 6.1 Tarifa

- **Monto por fracción:** S/ 0.80
- **Duración de la fracción:** 30 minutos
- **Tolerancia:** 0 minutos (configurable)
- Toda fracción empezada se cobra completa, y siempre se cobra al menos una fracción.

```
fracciones = máximo(1, redondear hacia arriba((minutos − tolerancia) ÷ 30))
monto      = fracciones × S/ 0.80
```

| Tiempo | Fracciones | Monto |
|---|---|---|
| 10 min | 1 | S/ 0.80 |
| 30 min | 1 | S/ 0.80 |
| 1 h | 2 | S/ 1.60 |
| 1 h 10 min | 3 | S/ 2.40 |

### 6.2 Deudas

- Si el vehículo **se fue sin pagar**, el monto queda como deuda de la **placa**.
- Al registrar de nuevo esa placa, la app avisa de la deuda.
- Al cobrar, el total incluye las deudas anteriores; al pagar, todas quedan pagadas y se marcan como **recuperadas**.

### 6.3 Zonas

| Zona | Espacios |
|---|:-:|
| AV. FERNANDO WIESSE 32 IMPAR | 10 |
| AV. FERNANDO WIESSE 32 PAR | 10 |
| AV. FERNANDO WIESSE 33 IMPAR | 22 |
| AV. FERNANDO WIESSE 33 PAR | 22 |
| CL. VARA DE ORO 2 IMPAR | 16 |
| CL. VARA DE ORO 2 PAR | 16 |
| JR. ALAMEDA LANZON 2 IMPAR | 16 |
| JR. ALAMEDA LANZON 2 PAR | 16 |
| JR. LAS MAQUINARIAS TRAMO 01 | 28 |
| JR. LAS MAQUINARIAS TRAMO 02 | 28 |
| JR. WIRACOCHA 2 IMPAR | 7 |
| JR. WIRACOCHA 2 PAR | 19 |

---

## 7. Cómo está hecho (documentación técnica)

### 7.1 Tecnologías

| | App de campo | Panel web |
|---|---|---|
| Lenguaje / base | JavaScript, **React Native 0.88** + **React 19** | JavaScript, **React 19** |
| Marco | **Expo SDK 58** con Expo Router | **Vite 8** |
| Animaciones | Animated de React Native | **Motion** |
| Datos | AsyncStorage (en el celular) | Datos de ejemplo (`data.js`) |
| Resultado | APK Android | Un solo `index.html` que funciona sin internet |

**Módulos nativos de la app:** `expo-camera` (cámara), `expo-image-picker` (galería), `expo-text-extractor`
(lectura de texto con ML Kit, sin internet), `expo-location` (GPS), `expo-notifications` (avisos programados),
`expo-file-system` y `expo-sharing` (exportar CSV), `react-native-svg` (íconos).

### 7.2 Estructura del repositorio

```
APP-SICOE/
├── README.md                  Presentación del proyecto
├── package.json               Atajos: npm run dev / npm run build (panel)
├── docs/
│   └── DOCUMENTACION.md       Este documento
├── app-movil-rn/              App de campo (React Native + Expo)
│   ├── app.json               Nombre, ícono, permisos y módulos nativos
│   ├── package.json           Librerías y comandos (apk, android)
│   ├── construir-apk.js       Genera SICOE.apk
│   ├── plugins/
│   │   └── rutas-cortas-windows.js   Evita el límite de 260 caracteres al compilar en Windows
│   ├── assets/                Ícono, pantalla de inicio y logo
│   └── src/
│       ├── app/               Pantallas (Expo Router)
│       │   ├── _layout.js     Raíz: fuentes, datos, sesión, avisos
│       │   └── (tabs)/        index (Inicio), activos, historial, ajustes
│       ├── components/        HojaCobro, Camara, Hojas (datos, GPS, cierre), Login, ui, Icono…
│       └── lib/
│           ├── logica.js      Reglas: tarifa, deudas, constancias, cuadre, reportes
│           ├── datos.js       Estado de la app y guardado en el celular
│           ├── acciones.js    Registrar, cobrar, dejar deuda, deshacer
│           ├── abrir.js       Abre las hojas (cobro, deuda, datos, cierre, GPS)
│           ├── servicios.js   Cámara/OCR, GPS, notificaciones, archivos
│           └── tema.js        Colores claro/oscuro y tipografías
└── panel-admin/               Panel web (React + Motion + Vite)
    ├── index.html             Panel ya generado (abrir con doble clic)
    ├── construir.js           Genera index.html con Vite
    └── src/
        ├── App.jsx            Estructura, menú y permisos por perfil (NAV)
        ├── data.js            Datos de ejemplo, zonas, roles
        ├── styles.css         Colores y estilos
        ├── recursos/          Logo y tipografías
        ├── components/        Login, Icon, ui (piezas reutilizables)
        └── views/             Una pantalla por sección: Resumen, Vivo, Movimientos, Deudas,
                               Cierres, Mapa, Usuarios, Cobradores, Zonas, Reportes, Actividad
```

### 7.3 Cómo funciona la app por dentro

- **Estado:** `datos.js` guarda todo en un solo objeto (tickets, vehículos, configuración, QR, turnos, sesión) y lo
  persiste en AsyncStorage con las claves `pm_tickets`, `pm_vehs`, `pm_cfg`, `pm_qr`, `pm_turnos`, `pm_sesion` y
  `pm_dni`. Las pantallas lo leen con el hook `useDatos(selector)`.
- **Ticket:** cada vehículo registrado es un ticket con placa, zona, espacio, inicio, fin, monto, estado
  (`activo`, `pagado` o `pendiente` = deuda), método de pago, N° de operación, ubicación y verificación.
- **Reglas puras:** `logica.js` no depende de React; contiene el cálculo de la tarifa (`calc`), las deudas
  (`deudasDe`), la lectura de constancias (`analizarConstancia`), el cuadre de caja (`datosTurno`) y los reportes CSV.
- **Avisos:** al registrar un vehículo se programan notificaciones locales para los próximos cambios de fracción;
  al cobrar o cambiar la tarifa se cancelan o reprograman.
- **Carpeta `android/`:** no se sube al repositorio; Expo la genera desde `app.json` (`npx expo prebuild`).

### 7.4 Cómo funciona el panel por dentro

- `App.jsx` decide qué sección mostrar según la dirección (`#resumen`, `#vivo`…) y qué menú ve cada perfil (`NAV`).
  Si un perfil intenta abrir una sección que no le corresponde, vuelve al Resumen.
- Cada sección es un componente en `views/`. Los datos vienen de `data.js` (ejemplos realistas del día).
- `construir.js` usa Vite con `vite-plugin-singlefile` para juntar todo (código, estilos, logo y fuentes) en un
  solo `index.html` que se abre sin servidor ni internet.

> **Seguridad:** los permisos por perfil hoy solo se aplican en la pantalla. Cuando exista el servidor, también debe
> validarlos.

---

## 8. Problemas comunes y soluciones

| Problema | Solución |
|---|---|
| PowerShell: *"la ejecución de scripts está deshabilitada"* al usar `npm` | Usar `npm.cmd` en lugar de `npm` |
| PowerShell: *"Token '-avd' inesperado"* | Poner `&` delante de la ruta entre comillas: `& "ruta\emulator.exe" -avd ParqueoPhone` |
| `npm run dev` falla desde la carpeta principal | Ejecutar antes `npm.cmd install` dentro de `panel-admin` |
| Al compilar la app: *"Filename longer than 260 characters"* | Copiar el proyecto a una ruta corta (por ejemplo `C:\s\rn`) y compilar desde ahí |
| `npm install` falla con *ERESOLVE* en la app | El archivo `.npmrc` ya trae `legacy-peer-deps=true`; ejecutar el comando dentro de `app-movil-rn` |
| La app no abre en Expo Go | Es normal: usa módulos nativos. Instalar el APK o usar `npx expo run:android` |
| El celular no deja instalar el APK | Permitir "instalar apps de origen desconocido" para la app con la que abriste el archivo |
| `adb` no encuentra el dispositivo | Esperar a que el emulador termine de cargar; en un celular, activar *depuración USB* y aceptar el aviso |
| No llegan los avisos de fracción | Revisar en Ajustes que estén activados y que la app tenga permiso de notificaciones en Android |

---

## 9. Estado actual y próximos pasos

**Listo:**

- App de campo completa en React Native (Android), funcionando sin internet.
- Panel web con todas las secciones, dos perfiles de acceso, tema claro/oscuro y animaciones.

**Pendiente:**

1. **Servidor y base de datos** para unir la app y el panel: usuarios reales, tickets compartidos entre cobradores,
   tarifa y zonas enviadas desde el panel, y validación de permisos en el servidor.
2. **Firma propia de la app** para publicarla en la Play Store (hoy el APK se firma con la clave de depuración de
   React Native, que sirve solo para pruebas).
3. **Pruebas en campo** con constancias reales de Yape y Plin y con cobradores en un piloto.
