<?php
declare(strict_types=1);

final class PaginaController
{
    public function inicio(): void
    {
        $repo = new Repositorio();
        View::render('inicio', $this->comunes('inicio', 'Inicio') + [
            'total_especies' => count($repo->especies()),
            'total_recintos' => count($repo->leyenda()),
            'total_3d'       => count($repo->modelos3d()),
        ]);
    }

    public function mapa(): void
    {
        View::render('mapa', $this->comunes('mapa', 'Mapa interactivo', ['catalogo.css', 'mapa.css'], ['ficha.js', 'mapa.js']));
    }

    public function animales(): void
    {
        View::render('animales', $this->comunes('animales', 'Animales', ['catalogo.css'], ['ficha.js', 'catalogo.js']));
    }

    public function modelos3d(): void
    {
        View::render('modelos3d', $this->comunes('3d', 'Animales en 3D', ['visor3d.css'], [], ['visor3d/app.js']));
    }

    public function noEncontrada(): void
    {
        View::render('404', $this->comunes('', 'Página no encontrada'));
    }

    /**
     * Variables que usa el layout: título, enlace activo y hojas/scripts extra.
     */
    private function comunes(string $activo, string $titulo, array $css = [], array $js = [], array $modulos = []): array
    {
        $b = BASE_URL;
        $hojas = implode("\n", array_map(
            static fn ($c) => '<link rel="stylesheet" href="' . $b . '/public/css/' . $c . '">',
            $css
        ));
        $scripts = implode("\n", array_map(
            static fn ($s) => '<script src="' . $b . '/public/js/' . $s . '" defer></script>',
            $js
        ));
        $scripts .= implode("\n", array_map(
            static fn ($s) => '<script type="module" src="' . $b . '/public/js/' . $s . '"></script>',
            $modulos
        ));

        return [
            'titulo'          => $titulo,
            'css_extra'       => $hojas,
            'js_extra'        => $scripts,
            'activo_inicio'   => $activo === 'inicio' ? 'activo' : '',
            'activo_mapa'     => $activo === 'mapa' ? 'activo' : '',
            'activo_animales' => $activo === 'animales' ? 'activo' : '',
            'activo_3d'       => $activo === '3d' ? 'activo' : '',
        ];
    }
}
