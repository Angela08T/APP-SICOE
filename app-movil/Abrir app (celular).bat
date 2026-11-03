@echo off
rem Abre el aplicativo en una ventana con tamano de celular
set "APP=%~dp0index.html"
set "PERFIL=%LOCALAPPDATA%\ParqueoMuniDemo"
start "" msedge --app="file:///%APP:\=/%" --window-size=500,980 --user-data-dir="%PERFIL%" --no-first-run --allow-file-access-from-files
