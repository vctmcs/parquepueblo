<?php
declare(strict_types=1);

define('RAIZ', dirname(__DIR__));
define('RUTA_VISTAS', RAIZ . '/views');
define('RUTA_DATOS', RAIZ . '/app/data');
define('RUTA_MODELOS', RAIZ . '/public/modelos');
define('RUTA_STORAGE', RAIZ . '/storage');

// Carpeta base de la URL. En la raíz del dominio queda vacía ('');
// en XAMPP dentro de htdocs/parquepueblo queda '/parquepueblo'.
// Con el servidor de PHP (php -S) el sitio siempre corre en la raíz.
$base = PHP_SAPI === 'cli-server'
    ? ''
    : rtrim(str_replace('\\', '/', dirname($_SERVER['SCRIPT_NAME'] ?? '/')), '/');
define('BASE_URL', $base === '/' ? '' : $base);

define('NOMBRE_SITIO', 'Parque del Pueblo');
define('SUBTITULO_SITIO', 'Guía no oficial');

date_default_timezone_set('America/Mexico_City');

// Donaciones (modo demostración: no se cobra nada)
define('DONACION_MINIMA', 10);
define('DONACION_MAXIMA', 50000);

// Panel de administración. La contraseña NO va en el repositorio:
// crea app/config.local.php (está en .gitignore) con:
//   <?php define('ADMIN_HASH', '...');
// y genera el hash con:  php -r "echo password_hash('TuClave', PASSWORD_DEFAULT);"
if (is_file(__DIR__ . '/config.local.php')) {
    require __DIR__ . '/config.local.php';
}
if (!defined('ADMIN_USUARIO')) {
    define('ADMIN_USUARIO', 'admin');
}
if (!defined('ADMIN_HASH')) {
    define('ADMIN_HASH', '');
}
