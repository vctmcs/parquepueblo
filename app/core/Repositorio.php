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
    private static ?array $leyenda   = null;

    public function especies(): array
    {
        return self::$especies ??= require RUTA_DATOS . '/especies.php';
    }

    /**
     * Figuras del mapa, completadas con la etiqueta y las especies de la leyenda.
     */
    public function recintos(): array
    {
        if (self::$recintos !== null) {
            return self::$recintos;
        }
        $leyenda = require RUTA_DATOS . '/leyenda.php';
        $lista = require RUTA_DATOS . '/recintos.php';
        foreach ($lista as &$r) {
            [$etiqueta, $especies] = $leyenda[$r['numero']];
            $r['etiqueta'] = $etiqueta;
            $r['especies'] = $especies;
        }
        return self::$recintos = $lista;
    }

    /**
     * Lista numerada del plano. "ubicado" indica si el plano marca ese número.
     */
    public function leyenda(): array
    {
        if (self::$leyenda !== null) {
            return self::$leyenda;
        }
        $ubicados = array_unique(array_column(require RUTA_DATOS . '/recintos.php', 'numero'));
        $lista = [];
        foreach (require RUTA_DATOS . '/leyenda.php' as $numero => [$etiqueta, $especies]) {
            $lista[] = [
                'numero'   => $numero,
                'etiqueta' => $etiqueta,
                'especies' => $especies,
                'ubicado'  => in_array($numero, $ubicados, true),
            ];
        }
        return self::$leyenda = $lista;
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
        $creditos = require RUTA_DATOS . '/modelos.php';
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
                'credito' => is_file($glb) ? ($creditos[$slug] ?? null) : null,
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
