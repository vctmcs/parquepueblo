<?php
declare(strict_types=1);

/**
 * Sesión, token CSRF y un límite simple de intentos por sesión.
 */
final class Sesion
{
    public static function iniciar(): void
    {
        if (session_status() === PHP_SESSION_ACTIVE) {
            return;
        }
        $https = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off')
            || ($_SERVER['HTTP_X_FORWARDED_PROTO'] ?? '') === 'https';
        session_name('parque_sesion');
        session_set_cookie_params([
            'lifetime' => 0,
            'path'     => BASE_URL === '' ? '/' : BASE_URL . '/',
            'secure'   => $https,
            'httponly' => true,
            'samesite' => 'Lax',
        ]);
        session_start();
    }

    public static function csrf(): string
    {
        if (empty($_SESSION['csrf'])) {
            $_SESSION['csrf'] = bin2hex(random_bytes(32));
        }
        return $_SESSION['csrf'];
    }

    public static function csrfValido(?string $token): bool
    {
        return is_string($token) && !empty($_SESSION['csrf']) && hash_equals($_SESSION['csrf'], $token);
    }

    /**
     * Devuelve false si se superó el límite de $max acciones en $segundos.
     */
    public static function permitir(string $accion, int $max, int $segundos): bool
    {
        $ahora = time();
        $lista = array_filter(
            $_SESSION['limite'][$accion] ?? [],
            static fn (int $t) => $t > $ahora - $segundos
        );
        if (count($lista) >= $max) {
            $_SESSION['limite'][$accion] = $lista;
            return false;
        }
        $lista[] = $ahora;
        $_SESSION['limite'][$accion] = array_values($lista);
        return true;
    }

    public static function esAdmin(): bool
    {
        return !empty($_SESSION['admin']);
    }
}
