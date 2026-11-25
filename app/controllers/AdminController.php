<?php
declare(strict_types=1);

/**
 * Panel sencillo para revisar los donativos registrados.
 * La contraseña se define en app/config.local.php (ver config.php).
 */
final class AdminController
{
    public function formulario(): void
    {
        if (Sesion::esAdmin()) {
            $this->redirigir('/admin');
            return;
        }
        $p = new PaginaController();
        $aviso = ADMIN_HASH === ''
            ? '<p class="admin__aviso">El panel está desactivado: falta crear <code>app/config.local.php</code> con la contraseña. Revisa el README.</p>'
            : '';
        $error = isset($_GET['error'])
            ? '<p class="admin__error">Usuario o contraseña incorrectos.</p>'
            : '';
        if (isset($_GET['espera'])) {
            $error = '<p class="admin__error">Demasiados intentos. Espera unos minutos.</p>';
        }
        View::render('admin-entrar', $p->comunesPublico('', 'Administración', ['donar.css']) + [
            'aviso' => $aviso,
            'error' => $error,
        ]);
    }

    public function entrar(): void
    {
        if (!Sesion::csrfValido($_POST['csrf'] ?? null) || ADMIN_HASH === '') {
            $this->redirigir('/admin/entrar?error=1');
            return;
        }
        if (!Sesion::permitir('admin', 5, 900)) {
            $this->redirigir('/admin/entrar?espera=1');
            return;
        }
        $usuario = (string) ($_POST['usuario'] ?? '');
        $clave = (string) ($_POST['clave'] ?? '');
        if (hash_equals(ADMIN_USUARIO, $usuario) && password_verify($clave, ADMIN_HASH)) {
            session_regenerate_id(true);
            $_SESSION['admin'] = true;
            $this->redirigir('/admin');
            return;
        }
        $this->redirigir('/admin/entrar?error=1');
    }

    public function salir(): void
    {
        if (Sesion::csrfValido($_POST['csrf'] ?? null)) {
            unset($_SESSION['admin']);
            session_regenerate_id(true);
        }
        $this->redirigir('/');
    }

    public function panel(): void
    {
        if (!$this->exigir()) {
            return;
        }
        $p = new PaginaController();
        View::render('admin', $p->comunesPublico('', 'Donativos', ['catalogo.css', 'donar.css'], ['admin.js']));
    }

    public function datos(): void
    {
        if (!Sesion::esAdmin()) {
            View::json(['error' => 'No autorizado'], 401, false);
            return;
        }
        $d = new Donaciones();
        View::json(['campanas' => $d->campanas(), 'donaciones' => $d->todas()], 200, false);
    }

    public function csv(): void
    {
        if (!$this->exigir()) {
            return;
        }
        header('Content-Type: text/csv; charset=utf-8');
        header('Content-Disposition: attachment; filename="donativos-' . date('Y-m-d') . '.csv"');
        $salida = fopen('php://output', 'w');
        fwrite($salida, "\xEF\xBB\xBF"); // BOM para que Excel respete los acentos
        fputcsv($salida, ['Folio', 'Fecha', 'Nombre', 'Correo', 'Campaña', 'Especie', 'Monto', 'Anónimo', 'Mensaje']);
        foreach ((new Donaciones())->todas() as $r) {
            $fila = [$r['folio'], $r['creado_en'], $r['nombre'], $r['correo'], $r['campana'], $r['especie'], $r['monto'], $r['anonimo'] ? 'Sí' : 'No', $r['mensaje']];
            // Evita que una celda que empiece con = + - @ se ejecute como fórmula en Excel
            $fila = array_map(static fn ($v) => is_string($v) && preg_match('/^[=+\-@]/', $v) ? "'" . $v : $v, $fila);
            fputcsv($salida, $fila);
        }
        fclose($salida);
    }

    private function exigir(): bool
    {
        if (Sesion::esAdmin()) {
            return true;
        }
        $this->redirigir('/admin/entrar');
        return false;
    }

    private function redirigir(string $ruta): void
    {
        header('Location: ' . BASE_URL . $ruta, true, 303);
    }
}
