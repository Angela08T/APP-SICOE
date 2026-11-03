@echo off
title Parqueo Muni - Celular virtual
rem Enciende el celular Android virtual, instala la app y la abre.
set "SDK=%LOCALAPPDATA%\ParqueoMuniSDK\sdk"
set "ANDROID_SDK_ROOT=%SDK%"
set "ADB=%SDK%\platform-tools\adb.exe"
set "APK=%~dp0ParqueoMuni.apk"

echo Encendiendo el celular virtual... (la primera vez tarda 1-2 minutos)
"%ADB%" start-server >nul 2>&1
"%ADB%" get-state >nul 2>&1 || start "" "%SDK%\emulator\emulator.exe" -avd ParqueoPhone -no-boot-anim
"%ADB%" wait-for-device

:espera
set "BOOT="
for /f "delims=" %%a in ('%ADB% shell getprop sys.boot_completed 2^>nul') do set "BOOT=%%a"
if not "%BOOT%"=="1" (
  timeout /t 2 /nobreak >nul
  goto espera
)

echo Instalando la app...
"%ADB%" install -r "%APK%"
"%ADB%" shell monkey -p pe.muni.parqueo -c android.intent.category.LAUNCHER 1 >nul 2>&1
echo Listo. La app esta abierta en el celular virtual.
timeout /t 4 >nul
