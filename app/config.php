<?php
declare(strict_types=1);

define('RAIZ', dirname(__DIR__));
define('RUTA_VISTAS', RAIZ . '/views');
define('RUTA_DATOS', RAIZ . '/app/data');
define('RUTA_MODELOS', RAIZ . '/public/modelos');

// Carpeta base de la URL. En la raíz del dominio queda vacía ('');
// en XAMPP dentro de htdocs/parquepueblo queda '/parquepueblo'.
$base = rtrim(str_replace('\\', '/', dirname($_SERVER['SCRIPT_NAME'] ?? '/')), '/');
define('BASE_URL', $base === '/' ? '' : $base);

define('NOMBRE_SITIO', 'Parque del Pueblo');
define('SUBTITULO_SITIO', 'Guía no oficial');

date_default_timezone_set('America/Mexico_City');
