<?php
/**
 * Parque del Pueblo - Guía no oficial
 * Punto de entrada único (front controller).
 *
 * En local:      php -S localhost:8000 index.php
 * En hosting:    Apache + .htaccess (InfinityFree, XAMPP, etc.)
 */

declare(strict_types=1);

// Con el servidor embebido de PHP, los archivos estáticos (css, js, img, glb)
// se entregan tal cual sin pasar por el router.
if (PHP_SAPI === 'cli-server') {
    $ruta = (string) parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
    if (str_starts_with($ruta, '/public/') && is_file(__DIR__ . $ruta)) {
        return false;
    }
}

require __DIR__ . '/app/config.php';
require __DIR__ . '/app/core/View.php';
require __DIR__ . '/app/core/Router.php';
require __DIR__ . '/app/core/Repositorio.php';
require __DIR__ . '/app/controllers/PaginaController.php';
require __DIR__ . '/app/controllers/ApiController.php';

$router = new Router();

// Páginas
$router->get('/',            [PaginaController::class, 'inicio']);
$router->get('/mapa',        [PaginaController::class, 'mapa']);
$router->get('/animales',    [PaginaController::class, 'animales']);
$router->get('/animales-3d', [PaginaController::class, 'modelos3d']);

// API JSON (la consume el JavaScript del sitio)
$router->get('/api/especies', [ApiController::class, 'especies']);
$router->get('/api/recintos', [ApiController::class, 'recintos']);
$router->get('/api/servicios', [ApiController::class, 'servicios']);
$router->get('/api/modelos',  [ApiController::class, 'modelos']);

$router->despachar();
