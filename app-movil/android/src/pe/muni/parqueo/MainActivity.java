package pe.muni.parqueo;

import android.Manifest;
import android.app.Activity;
import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.ContentValues;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.Environment;
import android.provider.MediaStore;
import android.util.Log;
import android.webkit.ConsoleMessage;
import android.webkit.GeolocationPermissions;
import android.webkit.JavascriptInterface;
import android.webkit.PermissionRequest;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.Toast;

import java.io.File;
import java.io.FileOutputStream;
import java.io.OutputStream;
import java.nio.charset.StandardCharsets;

public class MainActivity extends Activity {
    private static final int PICK_IMAGE = 1;
    private static final int CAMERA_PERM = 2;
    private static final int GPS_PERM = 3;
    private static final int NOTIF_PERM = 4;
    private static final String CANAL = "avisos";
    private int avisoId = 100;
    private WebView web;
    private ValueCallback<Uri[]> fileCallback;
    private PermissionRequest camRequest;
    private GeolocationPermissions.Callback gpsCallback;
    private String gpsOrigin;

    @Override
    protected void onCreate(Bundle state) {
        super.onCreate(state);
        web = new WebView(this);
        setContentView(web);

        WebSettings s = web.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);
        s.setAllowFileAccess(true);
        // El lector de constancias carga sus archivos (ocr/) desde la propia app
        s.setAllowFileAccessFromFileURLs(true);
        s.setMediaPlaybackRequiresUserGesture(false);
        s.setGeolocationEnabled(true);
        s.setTextZoom(100);

        WebView.setWebContentsDebuggingEnabled(true);
        web.addJavascriptInterface(new Bridge(), "AndroidApp");
        web.setWebViewClient(new WebViewClient());
        web.setWebChromeClient(new WebChromeClient() {
            @Override
            public boolean onConsoleMessage(ConsoleMessage m) {
                Log.i("Parqueo", m.message() + " @" + m.lineNumber());
                return true;
            }

            // La página pide la cámara para leer la constancia: se concede si el usuario dio el permiso
            @Override
            public void onPermissionRequest(final PermissionRequest req) {
                runOnUiThread(new Runnable() {
                    @Override
                    public void run() {
                        boolean video = false;
                        for (String r : req.getResources()) if (PermissionRequest.RESOURCE_VIDEO_CAPTURE.equals(r)) video = true;
                        if (!video) { req.deny(); return; }
                        if (checkSelfPermission(Manifest.permission.CAMERA) == PackageManager.PERMISSION_GRANTED) {
                            req.grant(new String[]{PermissionRequest.RESOURCE_VIDEO_CAPTURE});
                        } else {
                            camRequest = req;
                            requestPermissions(new String[]{Manifest.permission.CAMERA}, CAMERA_PERM);
                        }
                    }
                });
            }

            // Ubicación al registrar: se concede si el usuario dio el permiso de ubicación
            @Override
            public void onGeolocationPermissionsShowPrompt(String origin, GeolocationPermissions.Callback cb) {
                if (tieneGps()) { cb.invoke(origin, true, false); return; }
                gpsOrigin = origin; gpsCallback = cb;
                requestPermissions(new String[]{Manifest.permission.ACCESS_FINE_LOCATION, Manifest.permission.ACCESS_COARSE_LOCATION}, GPS_PERM);
            }

            // Permite elegir una imagen de la galería (QR de cobro o foto de la constancia)
            @Override
            public boolean onShowFileChooser(WebView view, ValueCallback<Uri[]> cb, FileChooserParams params) {
                if (fileCallback != null) fileCallback.onReceiveValue(null);
                fileCallback = cb;
                Intent i = new Intent(Intent.ACTION_GET_CONTENT);
                i.addCategory(Intent.CATEGORY_OPENABLE);
                i.setType("image/*");
                try {
                    startActivityForResult(Intent.createChooser(i, "Elegir imagen"), PICK_IMAGE);
                } catch (Exception e) {
                    fileCallback = null;
                    return false;
                }
                return true;
            }
        });

        if (state != null) web.restoreState(state);
        else web.loadUrl("file:///android_asset/index.html");
    }

    @Override
    protected void onActivityResult(int request, int result, Intent data) {
        if (request == PICK_IMAGE && fileCallback != null) {
            fileCallback.onReceiveValue(WebChromeClient.FileChooserParams.parseResult(result, data));
            fileCallback = null;
            return;
        }
        super.onActivityResult(request, result, data);
    }

    @Override
    public void onRequestPermissionsResult(int request, String[] perms, int[] results) {
        if (request == CAMERA_PERM && camRequest != null) {
            if (results.length > 0 && results[0] == PackageManager.PERMISSION_GRANTED)
                camRequest.grant(new String[]{PermissionRequest.RESOURCE_VIDEO_CAPTURE});
            else camRequest.deny();
            camRequest = null;
        }
        if (request == GPS_PERM && gpsCallback != null) {
            gpsCallback.invoke(gpsOrigin, tieneGps(), false);
            gpsCallback = null;
        }
    }

    private boolean tieneGps() {
        return checkSelfPermission(Manifest.permission.ACCESS_FINE_LOCATION) == PackageManager.PERMISSION_GRANTED
            || checkSelfPermission(Manifest.permission.ACCESS_COARSE_LOCATION) == PackageManager.PERMISSION_GRANTED;
    }

    // Atrás: cierra el panel abierto o vuelve a "Ingreso" antes de salir de la app
    @Override
    public void onBackPressed() {
        web.evaluateJavascript("window.onBack && window.onBack() ? '1' : '0'", new ValueCallback<String>() {
            @Override
            public void onReceiveValue(String v) {
                if (!"\"1\"".equals(v)) finish();
            }
        });
    }

    @Override
    protected void onSaveInstanceState(Bundle out) {
        super.onSaveInstanceState(out);
        web.saveState(out);
    }

    class Bridge {
        // Android 13 o más: pide permiso para mostrar notificaciones
        @JavascriptInterface
        public void pedirAvisos() {
            if (Build.VERSION.SDK_INT >= 33 && checkSelfPermission(Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED)
                runOnUiThread(new Runnable() {
                    @Override
                    public void run() { requestPermissions(new String[]{Manifest.permission.POST_NOTIFICATIONS}, NOTIF_PERM); }
                });
        }

        // Notificación con vibración (aviso de cambio de fracción con la app en segundo plano)
        @JavascriptInterface
        public void avisar(final String titulo, final String texto) {
            if (Build.VERSION.SDK_INT >= 33 && checkSelfPermission(Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED) return;
            runOnUiThread(new Runnable() {
                @Override
                public void run() {
                    NotificationManager nm = (NotificationManager) getSystemService(NOTIFICATION_SERVICE);
                    long[] vib = {0, 250, 120, 250};
                    Notification.Builder b;
                    if (Build.VERSION.SDK_INT >= 26) {
                        NotificationChannel c = new NotificationChannel(CANAL, "Avisos de cobro", NotificationManager.IMPORTANCE_HIGH);
                        c.setDescription("Cambio de fracción de los vehículos en parqueo");
                        c.enableVibration(true); c.setVibrationPattern(vib);
                        nm.createNotificationChannel(c);
                        b = new Notification.Builder(MainActivity.this, CANAL);
                    } else {
                        b = new Notification.Builder(MainActivity.this).setPriority(Notification.PRIORITY_HIGH).setVibrate(vib);
                    }
                    Intent abrir = new Intent(MainActivity.this, MainActivity.class).addFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP | Intent.FLAG_ACTIVITY_CLEAR_TOP);
                    PendingIntent pi = PendingIntent.getActivity(MainActivity.this, 0, abrir, PendingIntent.FLAG_IMMUTABLE | PendingIntent.FLAG_UPDATE_CURRENT);
                    b.setSmallIcon(R.drawable.ic_fg).setContentTitle(titulo).setContentText(texto)
                        .setStyle(new Notification.BigTextStyle().bigText(texto)).setAutoCancel(true).setContentIntent(pi);
                    nm.notify(avisoId++, b.build());
                }
            });
        }

        // Guarda el reporte CSV en la carpeta Descargas
        @JavascriptInterface
        public void saveCsv(String name, String csv) {
            String msg;
            try {
                byte[] bytes = csv.getBytes(StandardCharsets.UTF_8);
                if (Build.VERSION.SDK_INT >= 29) {
                    ContentValues v = new ContentValues();
                    v.put(MediaStore.Downloads.DISPLAY_NAME, name);
                    v.put(MediaStore.Downloads.MIME_TYPE, "text/csv");
                    Uri uri = getContentResolver().insert(MediaStore.Downloads.EXTERNAL_CONTENT_URI, v);
                    OutputStream os = getContentResolver().openOutputStream(uri);
                    os.write(bytes);
                    os.close();
                    msg = "Reporte guardado en Descargas";
                } else {
                    File f = new File(getExternalFilesDir(Environment.DIRECTORY_DOWNLOADS), name);
                    FileOutputStream os = new FileOutputStream(f);
                    os.write(bytes);
                    os.close();
                    msg = "Reporte guardado en " + f.getAbsolutePath();
                }
            } catch (Exception e) {
                msg = "No se pudo guardar el reporte";
            }
            final String m = msg;
            runOnUiThread(new Runnable() {
                @Override
                public void run() {
                    Toast.makeText(MainActivity.this, m, Toast.LENGTH_LONG).show();
                }
            });
        }
    }
}
