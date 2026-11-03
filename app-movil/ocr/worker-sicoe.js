// Envoltorio del lector de texto. En el WebView de Android, fetch() no puede leer archivos locales
// (file://), así que esos pedidos se atienden con XMLHttpRequest; el resto sigue igual.
const fetchOriginal = self.fetch.bind(self);
self.fetch = (url, opts) => {
  if (!String(url).startsWith('file:')) return fetchOriginal(url, opts);
  return new Promise((ok, mal) => {
    const x = new XMLHttpRequest();
    x.open('GET', url); x.responseType = 'arraybuffer';
    x.onload = () => x.response ? ok(new Response(x.response, { status:200 })) : mal(new TypeError('Archivo vacío: ' + url));
    x.onerror = () => mal(new TypeError('No se pudo leer ' + url));
    x.send();
  });
};
importScripts('worker.min.js');
