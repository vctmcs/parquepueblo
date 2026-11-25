<?php
declare(strict_types=1);

/**
 * Motor de plantillas sencillo para no mezclar PHP con HTML.
 *
 *   {{variable}}    se imprime escapada
 *   {{{variable}}}  se imprime tal cual (solo para HTML generado por nosotros)
 *
 * Las vistas son archivos .html dentro de /views. Toda la parte dinámica
 * (listas, mapa, visor 3D) la pinta JavaScript leyendo la API JSON.
 */
final class View
{
    public static function render(string $vista, array $datos = [], string $layout = 'layout'): void
    {
        $datos += [
            'csrf'      => Sesion::csrf(),
            'base'      => BASE_URL,
            'sitio'     => NOMBRE_SITIO,
            'subtitulo' => SUBTITULO_SITIO,
            'anio'      => date('Y'),
        ];

        $contenido = self::compilar(self::leer($vista), $datos);
        $pagina    = self::compilar(self::leer($layout), $datos + ['contenido' => $contenido]);

        header('Content-Type: text/html; charset=utf-8');
        echo $pagina;
    }

    public static function json(mixed $datos, int $estado = 200, bool $cache = true): void
    {
        http_response_code($estado);
        header('Content-Type: application/json; charset=utf-8');
        header($cache ? 'Cache-Control: public, max-age=300' : 'Cache-Control: no-store');
        echo json_encode($datos, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    }

    private static function leer(string $vista): string
    {
        $archivo = RUTA_VISTAS . '/' . $vista . '.html';
        if (!is_file($archivo)) {
            throw new RuntimeException("La vista {$vista} no existe");
        }
        return (string) file_get_contents($archivo);
    }

    private static function compilar(string $html, array $datos): string
    {
        // Primero las triples (sin escapar), luego las dobles (escapadas).
        $html = preg_replace_callback('/\{\{\{\s*(\w+)\s*\}\}\}/', static fn ($m) => (string) ($datos[$m[1]] ?? ''), $html);
        return preg_replace_callback(
            '/\{\{\s*(\w+)\s*\}\}/',
            static fn ($m) => htmlspecialchars((string) ($datos[$m[1]] ?? ''), ENT_QUOTES, 'UTF-8'),
            $html
        );
    }
}
