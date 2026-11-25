<?php
declare(strict_types=1);

/**
 * Router mínimo: asocia un método HTTP + ruta con un método de controlador.
 * Acepta URLs limpias (/mapa) y, si el hosting no tiene mod_rewrite,
 * también ?ruta=mapa.
 */
final class Router
{
    /** @var array<string, array<string, callable|array>> */
    private array $rutas = [];

    public function get(string $ruta, callable|array $accion): void
    {
        $this->rutas['GET'][$this->normalizar($ruta)] = $accion;
    }

    public function despachar(): void
    {
        $metodo = $_SERVER['REQUEST_METHOD'] ?? 'GET';
        $ruta   = $this->rutaActual();
        $accion = $this->rutas[$metodo][$ruta] ?? null;

        if ($accion === null) {
            http_response_code(404);
            (new PaginaController())->noEncontrada();
            return;
        }

        if (is_array($accion)) {
            [$clase, $funcion] = $accion;
            (new $clase())->$funcion();
            return;
        }

        $accion();
    }

    private function rutaActual(): string
    {
        if (isset($_GET['ruta'])) {
            return $this->normalizar((string) $_GET['ruta']);
        }

        $ruta = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH) ?: '/';
        if (BASE_URL !== '' && str_starts_with($ruta, BASE_URL)) {
            $ruta = substr($ruta, strlen(BASE_URL));
        }
        if (str_ends_with($ruta, '/index.php')) {
            $ruta = substr($ruta, 0, -strlen('/index.php'));
        }
        return $this->normalizar($ruta);
    }

    private function normalizar(string $ruta): string
    {
        $ruta = '/' . trim($ruta, '/');
        return $ruta === '' ? '/' : $ruta;
    }
}
