<?php
/**
 * Recintos del mapa. El número es el de la lista del plano oficial.
 * Coordenadas en el lienzo SVG del mapa (600 x 1360), acomodadas según
 * la distribución del plano: felinos y herbívoros grandes al oriente,
 * río y lago con la isla al centro, explanada del kiosko al sur.
 *
 * forma: rect | elipse
 */
return [
    ['numero' => 1,  'etiqueta' => 'Gamo',          'especies' => ['gamo'],                 'forma' => 'rect',   'x' => 506, 'y' => 24,  'w' => 84,  'h' => 80],
    ['numero' => 2,  'etiqueta' => 'Jaguar',        'especies' => ['jaguar'],               'forma' => 'rect',   'x' => 132, 'y' => 24,  'w' => 140, 'h' => 80],
    ['numero' => 3,  'etiqueta' => 'Cocodrilario',  'especies' => ['cocodrilo', 'pavo-real'], 'forma' => 'elipse', 'x' => 12,  'y' => 24,  'w' => 92,  'h' => 92],
    ['numero' => 4,  'etiqueta' => 'Puma',          'especies' => ['puma'],                 'forma' => 'rect',   'x' => 412, 'y' => 288, 'w' => 84,  'h' => 85],
    ['numero' => 5,  'etiqueta' => 'Gamo',          'especies' => ['gamo'],                 'forma' => 'rect',   'x' => 412, 'y' => 116, 'w' => 84,  'h' => 75],
    ['numero' => 6,  'etiqueta' => 'Lince rojo',    'especies' => ['lince-rojo'],           'forma' => 'rect',   'x' => 506, 'y' => 116, 'w' => 84,  'h' => 160],
    ['numero' => 7,  'etiqueta' => 'Guacamaya',     'especies' => ['guacamaya'],            'forma' => 'elipse', 'x' => 412, 'y' => 24,  'w' => 84,  'h' => 80],
    ['numero' => 8,  'etiqueta' => 'Zorro gris',    'especies' => ['zorro-gris'],           'forma' => 'rect',   'x' => 412, 'y' => 203, 'w' => 84,  'h' => 73],
    ['numero' => 9,  'etiqueta' => 'Coyote',        'especies' => ['coyote'],               'forma' => 'rect',   'x' => 506, 'y' => 288, 'w' => 84,  'h' => 85],
    ['numero' => 10, 'etiqueta' => 'Hipopótamo',    'especies' => ['hipopotamo'],           'forma' => 'rect',   'x' => 412, 'y' => 824, 'w' => 84,  'h' => 80],
    ['numero' => 11, 'etiqueta' => 'Jirafa',        'especies' => ['jirafa'],               'forma' => 'elipse', 'x' => 496, 'y' => 385, 'w' => 94,  'h' => 190],
    ['numero' => 12, 'etiqueta' => 'Avestruz',      'especies' => ['avestruz'],             'forma' => 'elipse', 'x' => 412, 'y' => 395, 'w' => 80,  'h' => 170],
    ['numero' => 13, 'etiqueta' => 'Black buck',    'especies' => ['blackbuck'],            'forma' => 'rect',   'x' => 132, 'y' => 116, 'w' => 140, 'h' => 75],
    ['numero' => 14, 'etiqueta' => 'Ñu azul',       'especies' => ['nu'],                   'forma' => 'rect',   'x' => 132, 'y' => 203, 'w' => 140, 'h' => 75],
    ['numero' => 15, 'etiqueta' => 'Aves mexicanas', 'especies' => ['aves-mexicanas'],      'forma' => 'rect',   'x' => 12,  'y' => 655, 'w' => 92,  'h' => 80],
    ['numero' => 16, 'etiqueta' => 'Mono araña',    'especies' => ['mono-arana'],           'forma' => 'elipse', 'x' => 196, 'y' => 560, 'w' => 64,  'h' => 70],
    ['numero' => 17, 'etiqueta' => 'Tigre',         'especies' => ['tigre'],                'forma' => 'rect',   'x' => 12,  'y' => 128, 'w' => 92,  'h' => 92],
    ['numero' => 18, 'etiqueta' => 'León',          'especies' => ['leon'],                 'forma' => 'rect',   'x' => 12,  'y' => 430, 'w' => 92,  'h' => 110],
    ['numero' => 19, 'etiqueta' => 'Papión',        'especies' => ['papion'],               'forma' => 'rect',   'x' => 12,  'y' => 232, 'w' => 92,  'h' => 92],
    ['numero' => 20, 'etiqueta' => 'Leopardo',      'especies' => ['leopardo'],             'forma' => 'rect',   'x' => 132, 'y' => 290, 'w' => 140, 'h' => 75],
    ['numero' => 21, 'etiqueta' => 'Lémur',         'especies' => ['lemur'],                'forma' => 'rect',   'x' => 12,  'y' => 555, 'w' => 92,  'h' => 85],
    ['numero' => 22, 'etiqueta' => 'Papión',        'especies' => ['papion'],               'forma' => 'rect',   'x' => 12,  'y' => 336, 'w' => 92,  'h' => 80],
    ['numero' => 23, 'etiqueta' => 'Mapache',       'especies' => ['mapache'],              'forma' => 'rect',   'x' => 506, 'y' => 590, 'w' => 84,  'h' => 70],
    ['numero' => 24, 'etiqueta' => 'León',          'especies' => ['leon'],                 'forma' => 'rect',   'x' => 412, 'y' => 590, 'w' => 84,  'h' => 100],
    ['numero' => 25, 'etiqueta' => 'Tigre',         'especies' => ['tigre'],                'forma' => 'rect',   'x' => 412, 'y' => 702, 'w' => 84,  'h' => 110],
    ['numero' => 26, 'etiqueta' => 'Oso',           'especies' => ['oso'],                  'forma' => 'rect',   'x' => 506, 'y' => 672, 'w' => 84,  'h' => 100],
    ['numero' => 27, 'etiqueta' => 'Carabao',       'especies' => ['carabao'],              'forma' => 'rect',   'x' => 412, 'y' => 916, 'w' => 84,  'h' => 80],
    ['numero' => 28, 'etiqueta' => 'Bisonte',       'especies' => ['bisonte'],              'forma' => 'rect',   'x' => 506, 'y' => 866, 'w' => 84,  'h' => 110],
    ['numero' => 29, 'etiqueta' => 'Ciervo sika',   'especies' => ['ciervo-sika'],          'forma' => 'rect',   'x' => 132, 'y' => 377, 'w' => 140, 'h' => 70],
    ['numero' => 30, 'etiqueta' => 'Guanaco',       'especies' => ['guanaco'],              'forma' => 'rect',   'x' => 506, 'y' => 784, 'w' => 84,  'h' => 70],
];
