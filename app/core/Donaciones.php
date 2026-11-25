<?php
declare(strict_types=1);

/**
 * Lógica de donaciones: campañas con su avance, registro y consultas.
 */
final class Donaciones
{
    private PDO $db;

    public function __construct()
    {
        $this->db = BaseDatos::conexion();
    }

    /** Campañas activas con lo recaudado y el número de donativos. */
    public function campanas(): array
    {
        $sql = 'SELECT c.id, c.clave, c.titulo, c.descripcion, c.meta, c.icono,
                       COALESCE(SUM(d.monto), 0) AS recaudado,
                       COUNT(d.id) AS donativos
                FROM campanas c
                LEFT JOIN donaciones d ON d.campana_id = c.id
                WHERE c.activa = 1
                GROUP BY c.id
                ORDER BY c.orden';
        return array_map(static function (array $c): array {
            $c['meta'] = (int) $c['meta'];
            $c['recaudado'] = (int) $c['recaudado'];
            $c['donativos'] = (int) $c['donativos'];
            $c['porcentaje'] = $c['meta'] > 0 ? min(100, round($c['recaudado'] * 100 / $c['meta'], 1)) : 0;
            return $c;
        }, $this->db->query($sql)->fetchAll());
    }

    /**
     * Valida y guarda un donativo. Devuelve ['folio' => ...] o ['errores' => [...]].
     */
    public function registrar(array $e, array $especies): array
    {
        $nombre  = trim((string) ($e['nombre'] ?? ''));
        $correo  = trim((string) ($e['correo'] ?? ''));
        $mensaje = trim((string) ($e['mensaje'] ?? ''));
        $monto   = filter_var($e['monto'] ?? null, FILTER_VALIDATE_INT);
        $clave   = (string) ($e['campana'] ?? '');
        $especie = (string) ($e['especie'] ?? '');
        $anonimo = !empty($e['anonimo']);

        $errores = [];
        if (mb_strlen($nombre) < 2 || mb_strlen($nombre) > 80) {
            $errores['nombre'] = 'Escribe tu nombre (de 2 a 80 caracteres).';
        }
        if (!filter_var($correo, FILTER_VALIDATE_EMAIL) || mb_strlen($correo) > 120) {
            $errores['correo'] = 'Escribe un correo válido.';
        }
        if ($monto === false || $monto < DONACION_MINIMA || $monto > DONACION_MAXIMA) {
            $errores['monto'] = sprintf('El monto debe ser entre $%s y $%s.', number_format(DONACION_MINIMA), number_format(DONACION_MAXIMA));
        }
        if (mb_strlen($mensaje) > 280) {
            $errores['mensaje'] = 'El mensaje puede tener hasta 280 caracteres.';
        }

        $campana = $this->db->prepare('SELECT id FROM campanas WHERE clave = ? AND activa = 1');
        $campana->execute([$clave]);
        $campanaId = $campana->fetchColumn();
        if ($campanaId === false) {
            $errores['campana'] = 'Elige a qué quieres destinar tu donativo.';
        }
        if ($clave === 'apadrina' && !isset($especies[$especie])) {
            $errores['especie'] = 'Elige el animal que quieres apadrinar.';
        }
        if ($errores) {
            return ['errores' => $errores];
        }

        $folio = 'PP-' . date('ymd') . '-' . strtoupper(bin2hex(random_bytes(3)));
        $st = $this->db->prepare(
            'INSERT INTO donaciones (folio, campana_id, especie, nombre, correo, monto, mensaje, anonimo)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
        );
        $st->execute([
            $folio,
            (int) $campanaId,
            $clave === 'apadrina' ? $especie : null,
            $nombre,
            $correo,
            $monto,
            $mensaje !== '' ? $mensaje : null,
            $anonimo ? 1 : 0,
        ]);

        return ['folio' => $folio];
    }

    /** Datos del recibo de un folio (sin el correo completo). */
    public function porFolio(string $folio): ?array
    {
        $st = $this->db->prepare(
            'SELECT d.folio, d.nombre, d.correo, d.monto, d.mensaje, d.especie, d.anonimo, d.creado_en,
                    c.titulo AS campana
             FROM donaciones d JOIN campanas c ON c.id = d.campana_id
             WHERE d.folio = ?'
        );
        $st->execute([$folio]);
        $d = $st->fetch();
        if (!$d) {
            return null;
        }
        $d['correo'] = self::ocultarCorreo($d['correo']);
        $d['monto'] = (int) $d['monto'];
        $d['anonimo'] = (bool) $d['anonimo'];
        return $d;
    }

    /** Muro público: últimos donativos, respetando a quien pidió ser anónimo. */
    public function recientes(int $limite = 12): array
    {
        $st = $this->db->prepare(
            'SELECT d.nombre, d.monto, d.mensaje, d.especie, d.anonimo, d.creado_en, c.titulo AS campana
             FROM donaciones d JOIN campanas c ON c.id = d.campana_id
             ORDER BY d.id DESC LIMIT ?'
        );
        $st->bindValue(1, $limite, PDO::PARAM_INT);
        $st->execute();
        return array_map(static function (array $d): array {
            $anon = (bool) $d['anonimo'];
            return [
                'nombre'    => $anon ? 'Donante anónimo' : self::nombreCorto($d['nombre']),
                'monto'     => (int) $d['monto'],
                'mensaje'   => $anon ? null : $d['mensaje'],
                'especie'   => $d['especie'],
                'campana'   => $d['campana'],
                'creado_en' => $d['creado_en'],
            ];
        }, $st->fetchAll());
    }

    /** Todo el detalle para el panel de administración. */
    public function todas(): array
    {
        return $this->db->query(
            'SELECT d.id, d.folio, d.nombre, d.correo, d.monto, d.mensaje, d.especie, d.anonimo, d.creado_en,
                    c.titulo AS campana
             FROM donaciones d JOIN campanas c ON c.id = d.campana_id
             ORDER BY d.id DESC'
        )->fetchAll();
    }

    /** "Víctor Hugo Estrada" -> "Víctor E." */
    private static function nombreCorto(string $nombre): string
    {
        $partes = preg_split('/\s+/', trim($nombre)) ?: [$nombre];
        $primero = $partes[0];
        $ultimo = count($partes) > 1 ? mb_substr(end($partes), 0, 1) . '.' : '';
        return trim($primero . ' ' . $ultimo);
    }

    private static function ocultarCorreo(string $correo): string
    {
        [$usuario, $dominio] = array_pad(explode('@', $correo, 2), 2, '');
        return mb_substr($usuario, 0, 2) . str_repeat('•', max(1, mb_strlen($usuario) - 2)) . '@' . $dominio;
    }
}
