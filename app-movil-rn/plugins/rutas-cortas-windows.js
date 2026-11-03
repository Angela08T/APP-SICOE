// Plugin de configuración de Expo: en Windows, la compilación nativa (C++) de React Native crea archivos con rutas
// de más de 260 caracteres y falla («Filename longer than 260 characters»). Este plugin hace que esos archivos
// intermedios se guarden en una carpeta corta (C:\c). Solo afecta la compilación en Windows.
const { withAppBuildGradle } = require('expo/config-plugins');

const BLOQUE = `
    // Agregado por plugins/rutas-cortas-windows.js: archivos intermedios de C++ en una ruta corta (límite de 260 caracteres de Windows)
    if (System.getProperty('os.name').toLowerCase().contains('windows')) {
        externalNativeBuild { cmake { buildStagingDirectory = file('C:/c/sicoe') } }
        // CMake acorta (con un resumen) los nombres de archivos intermedios que superen este largo
        defaultConfig { externalNativeBuild { cmake { arguments '-DCMAKE_OBJECT_PATH_MAX=128' } } }
    }
`;

module.exports = config => withAppBuildGradle(config, cfg => {
  if (!cfg.modResults.contents.includes('rutas-cortas-windows'))
    cfg.modResults.contents = cfg.modResults.contents.replace(/android\s*\{/, m => m + BLOQUE);
  return cfg;
});
