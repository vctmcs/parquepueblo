<?php
/**
 * Servicios de la leyenda del plano.
 * x, y = posición del marcador en el lienzo del mapa (610 x 1370).
 * Los que el plano no ubica llevan x/y en null y se listan aparte.
 * icono = símbolo SVG definido en views/mapa.html
 */
return [
    ['id' => 'entrada',     'nombre' => 'Entrada principal', 'icono' => 'entrada',     'x' => 465,  'y' => 1300, 'descripcion' => 'Acceso al parque, al sur. El andador principal sube hacia los felinos y la explanada del kiosko.'],
    ['id' => 'kiosko',      'nombre' => 'Kiosko',            'icono' => 'kiosko',      'x' => 240,  'y' => 883,  'descripcion' => 'Centro de la explanada circular; buen punto de reunión para orientarse.'],
    ['id' => 'isla',        'nombre' => 'Isla',              'icono' => 'isla',        'x' => 214,  'y' => 575,  'descripcion' => 'Isla arbolada al centro del lago.'],
    ['id' => 'banos-1',     'nombre' => 'Baños',             'icono' => 'banos',       'x' => 40,   'y' => 672,  'descripcion' => 'Sanitarios junto al lago, del lado poniente.'],
    ['id' => 'banos-2',     'nombre' => 'Baños',             'icono' => 'banos',       'x' => 570,  'y' => 1090, 'descripcion' => 'Sanitarios sobre el andador que lleva a la entrada.'],
    ['id' => 'juegos-1',    'nombre' => 'Juegos infantiles', 'icono' => 'juegos',      'x' => 148,  'y' => 747,  'descripcion' => 'Área de juegos junto al lago.'],
    ['id' => 'juegos-2',    'nombre' => 'Juegos infantiles', 'icono' => 'juegos',      'x' => 55,   'y' => 862,  'descripcion' => 'Área de columpios al poniente de la explanada.'],

    // Aparecen en la leyenda pero el plano no marca dónde están
    ['id' => 'embarcadero', 'nombre' => 'Embarcadero',       'icono' => 'embarcadero', 'x' => null, 'y' => null, 'descripcion' => 'Muelle del lago.'],
    ['id' => 'acuario',     'nombre' => 'Acuario',           'icono' => 'acuario',     'x' => null, 'y' => null, 'descripcion' => 'Peceras con especies acuáticas.'],
    ['id' => 'museo',       'nombre' => 'Museo',             'icono' => 'museo',       'x' => null, 'y' => null, 'descripcion' => 'Sala de exhibición del parque.'],
    ['id' => 'aviario',     'nombre' => 'Aviario',           'icono' => 'aviario',     'x' => null, 'y' => null, 'descripcion' => 'Aviario del parque.'],
    ['id' => 'nocturnario', 'nombre' => 'Nocturnario',       'icono' => 'nocturnario', 'x' => null, 'y' => null, 'descripcion' => 'Espacio con poca luz para observar especies de hábitos nocturnos.'],
    ['id' => 'teatro',      'nombre' => 'Teatro',            'icono' => 'teatro',      'x' => null, 'y' => null, 'descripcion' => 'Foro para presentaciones y actividades.'],
    ['id' => 'serpientes',  'nombre' => 'El mundo mágico de las serpientes', 'icono' => 'serpientes', 'x' => null, 'y' => null, 'descripcion' => 'Exhibición de serpientes.'],
    ['id' => 'codornices',  'nombre' => 'Sistema de reproducción de codornices', 'icono' => 'codornices', 'x' => null, 'y' => null, 'descripcion' => 'Área dedicada a la cría de codornices.'],
    ['id' => 'granja',      'nombre' => 'Granja',            'icono' => 'granja',      'x' => null, 'y' => null, 'descripcion' => 'Animales de granja.'],
];
