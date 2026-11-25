<?php
declare(strict_types=1);

/**
 * Acceso a los datos del parque. Hoy salen de arreglos PHP en app/data;
 * si después se pasa a SQLite, solo cambia esta clase.
 */
final class Repositorio
{
    private static ?array $especies  = null;
    private static ?array $recintos  = null;
    private static ?array $servicios = null;

    public function especies(): array
    {
        return self::$especies ??= require RUTA_DATOS . '/especies.php';
    }

    public function recintos(): array
    {
        return self::$recintos ??= require RUTA_DATOS . '/recintos.php';
    }

    public function servicios(): array
    {
        return self::$servicios ??= require RUTA_DATOS . '/servicios.php';
    }

    /**
     * Especies con vista 3D. Si existe public/modelos/{slug}.glb se usa ese
     * archivo (modelo descargado); si no, el visor arma el modelo procedural
     * con texturas generadas.
     */
    public function modelos3d(): array
    {
        $lista = [];
        foreach ($this->especies() as $slug => $especie) {
            if (empty($especie['modelo3d'])) {
                continue;
            }
            $glb = RUTA_MODELOS . '/' . $slug . '.glb';
            $lista[] = [
                'slug'    => $slug,
                'nombre'  => $especie['nombre'],
                'cientifico' => $especie['cientifico'],
                'tipo'    => $especie['modelo3d'],
                'archivo' => is_file($glb) ? BASE_URL . '/public/modelos/' . $slug . '.glb' : null,
            ];
        }
        // León y tigre primero; el resto en el orden de la lista
        $prioridad = ['leon', 'tigre', 'jaguar', 'leopardo', 'puma', 'jirafa'];
        $pos = static function (string $slug) use ($prioridad): int {
            $i = array_search($slug, $prioridad, true);
            return $i === false ? 99 : $i;
        };
        usort($lista, static fn ($a, $b) => $pos($a['slug']) <=> $pos($b['slug']));

        return $lista;
    }
}
