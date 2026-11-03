// Genera el APK de la app de campo (React Native) en esta PC, sin Android Studio ni servicios en la nube.
// Uso: npm run apk   →   deja SICOE.apk en esta carpeta.
// Necesita la JDK 17 y el Android SDK (plataforma 36). Si no se definen ANDROID_HOME y JAVA_HOME,
// usa los que instaló SICOE en %LOCALAPPDATA%\ParqueoMuniSDK.
const { execSync } = require('child_process'), fs = require('fs'), path = require('path');
const dir = __dirname, base = path.join(process.env.LOCALAPPDATA || '', 'ParqueoMuniSDK');
const env = { ...process.env,
  ANDROID_HOME:process.env.ANDROID_HOME || path.join(base, 'sdk'),
  JAVA_HOME:process.env.JAVA_HOME || path.join(base, 'jdk') };
const correr = (cmd, cwd = dir) => execSync(cmd, { cwd, env, stdio:'inherit' });

if (!fs.existsSync(path.join(dir, 'node_modules'))) correr('npm install');
// La carpeta android/ se genera desde app.json (no se edita a mano ni se sube al repositorio)
if (!fs.existsSync(path.join(dir, 'android'))) correr('npx expo prebuild --platform android --no-install');
// Windows tiene un límite de 260 caracteres por ruta. El plugin plugins/rutas-cortas-windows.js acorta los archivos
// intermedios de C++, pero si la carpeta del proyecto ya es muy profunda la compilación puede fallar igual:
// en ese caso, copiar el proyecto a una ruta corta (por ejemplo C:\s\rn) y compilar desde ahí.
const androidDir = path.join(dir, 'android');
if (process.platform === 'win32' && dir.length > 25)
  console.warn(`Aviso: la carpeta del proyecto es larga (${dir.length} caracteres). Si falla con «Filename longer than 260 characters», `
    + 'copia el proyecto a una ruta corta como C:\\s\\rn y ejecuta npm run apk desde ahí.');
// Solo celulares Android de 64 bits (arm64) y el emulador de PC (x86_64): APK más liviano y compilación más rápida
correr((process.platform === 'win32' ? 'gradlew.bat' : './gradlew') + ' assembleRelease -PreactNativeArchitectures=arm64-v8a,x86_64', androidDir);
fs.copyFileSync(path.join(dir, 'android/app/build/outputs/apk/release/app-release.apk'), path.join(dir, 'SICOE.apk'));
console.log('Listo: app-movil-rn/SICOE.apk (' + Math.round(fs.statSync(path.join(dir, 'SICOE.apk')).size / 1048576) + ' MB)');
