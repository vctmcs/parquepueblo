<?php
declare(strict_types=1);

final class DonacionController
{
    public function pagina(): void
    {
        $p = new PaginaController();
        View::render('donar', $p->comunesPublico('donar', 'Donar', ['donar.css'], ['donar.js']) + [
            'minimo' => DONACION_MINIMA,
            'maximo' => DONACION_MAXIMA,
            'minimo_txt' => number_format(DONACION_MINIMA),
            'maximo_txt' => number_format(DONACION_MAXIMA),
        ]);
    }

    public function gracias(): void
    {
        $p = new PaginaController();
        View::render('gracias', $p->comunesPublico('donar', 'Gracias por tu donativo', ['donar.css'], ['gracias.js']));
    }

    public function campanas(): void
    {
        View::json((new Donaciones())->campanas(), 200, false);
    }

    public function donadores(): void
    {
        View::json((new Donaciones())->recientes(12), 200, false);
    }

    public function recibo(): void
    {
        $folio = (string) ($_GET['folio'] ?? '');
        if (!preg_match('/^PP-\d{6}-[A-F0-9]{6}$/', $folio)) {
            View::json(['error' => 'Folio no válido'], 400, false);
            return;
        }
        $d = (new Donaciones())->porFolio($folio);
        $d ? View::json($d, 200, false) : View::json(['error' => 'No encontramos ese folio'], 404, false);
    }

    public function registrar(): void
    {
        $datos = json_decode((string) file_get_contents('php://input'), true);
        if (!is_array($datos)) {
            View::json(['error' => 'Solicitud no válida'], 400, false);
            return;
        }
        if (!Sesion::csrfValido($_SERVER['HTTP_X_CSRF_TOKEN'] ?? null)) {
            View::json(['error' => 'La sesión expiró. Recarga la página e intenta de nuevo.'], 419, false);
            return;
        }
        // Campo trampa para bots: un humano no lo ve ni lo llena
        if (!empty($datos['sitio_web'])) {
            View::json(['error' => 'Solicitud no válida'], 400, false);
            return;
        }
        if (!Sesion::permitir('donar', 5, 600)) {
            View::json(['error' => 'Hiciste varios donativos seguidos. Espera unos minutos e intenta de nuevo.'], 429, false);
            return;
        }

        $resultado = (new Donaciones())->registrar($datos, (new Repositorio())->especies());
        if (isset($resultado['errores'])) {
            View::json(['errores' => $resultado['errores']], 422, false);
            return;
        }
        View::json(['folio' => $resultado['folio']], 201, false);
    }
}
