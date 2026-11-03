#!/bin/bash
# Compila ParqueoMuni.apk sin Android Studio.
# Uso: SDK=<ruta Android SDK> JDK=<ruta JDK 17> bash android/build.sh
set -e
cd "$(dirname "$0")"
BT="$SDK/build-tools/34.0.0"; JAR="$SDK/platforms/android-34/android.jar"
export JAVA_HOME="$JDK"; export PATH="$(cygpath -u "$JDK" 2>/dev/null || echo "$JDK")/bin:$PATH"

rm -rf build && mkdir -p build/gen build/classes build/assets build/dex build/extra/assets
cp ../index.html ../icon.svg build/assets/

"$BT/aapt2" compile --dir res -o build/res.zip
"$BT/aapt2" link -o build/app.apk -I "$JAR" --manifest AndroidManifest.xml --java build/gen -A build/assets build/res.zip
javac -nowarn -source 8 -target 8 -bootclasspath "$JAR" -d build/classes $(find src build/gen -name '*.java')
"$BT/d8.bat" --release --lib "$JAR" --min-api 24 --output build/dex $(find build/classes -name '*.class')
(cd build/dex && "$BT/aapt" add ../app.apk classes.dex > /dev/null)
# Lector de texto para verificar constancias (sin internet). Se agrega aparte porque aapt2 en Windows
# guarda las subcarpetas con barra invertida y Android no las encontraría.
cp -r ../ocr build/extra/assets/
(cd build/extra && "$BT/aapt" add ../app.apk $(find assets -type f) > /dev/null)
"$BT/zipalign" -f -p 4 build/app.apk build/app.aligned.apk

# Contraseña de la firma: variable KS_PASS o archivo firma.local (no se sube al repositorio)
KS_PASS="${KS_PASS:-$(cat firma.local 2>/dev/null)}"
[ -n "$KS_PASS" ] || { echo "Falta la contraseña de la firma: crea android/firma.local o define KS_PASS"; exit 1; }
[ -f parqueo.keystore ] || keytool -genkeypair -keystore parqueo.keystore -alias parqueo -keyalg RSA -keysize 2048 \
  -validity 10000 -storepass "$KS_PASS" -keypass "$KS_PASS" -dname "CN=Parqueo Municipal, C=PE"
"$BT/apksigner.bat" sign --ks parqueo.keystore --ks-pass pass:"$KS_PASS" --out ../ParqueoMuni.apk build/app.aligned.apk
"$BT/apksigner.bat" verify ../ParqueoMuni.apk && echo "Listo: ParqueoMuni.apk"
