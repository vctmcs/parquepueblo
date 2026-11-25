<?php
/**
 * Recintos tal como aparecen en el plano "Mapa de Áreas" del parque.
 *
 * Coordenadas en el lienzo del mapa (610 x 1370), que corresponde 1:1 con
 * la zona del mapa en la imagen del plano. Se respeta el plano aunque repita
 * números (por ejemplo hay tres recintos con el 12 y tres con el 25).
 *
 * forma: rect (x, y, w, h, r) | elipse (x, y, w, h) | path (d)
 * nx, ny: posición del número, igual que en el plano
 *
 * Los números de la lista que el plano no ubica (1, 4, 5, 8, 10, 14, 15, 16,
 * 21, 22, 23, 24, 26, 27 y 30) se muestran en el panel como
 * "sin ubicación en el plano" a partir de app/data/leyenda.php.
 */
return [
    // ---------- Columna poniente (arriba) ----------
    ['id' => '3',   'numero' => 3,  'corta' => 'Cocodrilario', 'forma' => 'rect',   'x' => 3,   'y' => 50,  'w' => 97,  'h' => 85,  'r' => 30, 'nx' => 53,  'ny' => 117],
    ['id' => '17',  'numero' => 17, 'forma' => 'rect',   'x' => 3,   'y' => 148, 'w' => 102, 'h' => 88,  'r' => 26, 'nx' => 63,  'ny' => 215],
    ['id' => '12a', 'numero' => 12, 'forma' => 'rect',   'x' => 3,   'y' => 240, 'w' => 107, 'h' => 55,  'r' => 22, 'nx' => 70,  'ny' => 286],
    ['id' => '19',  'numero' => 19, 'forma' => 'rect',   'x' => 3,   'y' => 299, 'w' => 102, 'h' => 88,  'r' => 26, 'nx' => 58,  'ny' => 360],
    ['id' => '18a', 'numero' => 18, 'forma' => 'path',   'd' => 'M40 402 C70 394 112 410 123 440 C130 472 116 506 100 524 C80 526 60 500 52 470 C45 445 28 412 40 402Z', 'nx' => 92, 'ny' => 497],

    // ---------- Centro poniente (entre andadores y el río) ----------
    ['id' => '2',   'numero' => 2,  'forma' => 'elipse', 'x' => 130, 'y' => 18,  'w' => 108, 'h' => 46,  'nx' => 207, 'ny' => 41],
    ['id' => '13',  'numero' => 13, 'corta' => 'Black buck', 'forma' => 'elipse', 'x' => 148, 'y' => 108, 'w' => 66,  'h' => 62,  'nx' => 200, 'ny' => 155],
    ['id' => '12b', 'numero' => 12, 'forma' => 'rect',   'x' => 140, 'y' => 183, 'w' => 95,  'h' => 60,  'r' => 24, 'nx' => 205, 'ny' => 230],
    ['id' => '20',  'numero' => 20, 'forma' => 'elipse', 'x' => 140, 'y' => 246, 'w' => 117, 'h' => 74,  'nx' => 222, 'ny' => 300],
    ['id' => '29',  'numero' => 29, 'forma' => 'elipse', 'x' => 150, 'y' => 322, 'w' => 105, 'h' => 44,  'nx' => 210, 'ny' => 352],
    ['id' => '7',   'numero' => 7,  'forma' => 'elipse', 'x' => 226, 'y' => 38,  'w' => 68,  'h' => 76,  'nx' => 266, 'ny' => 106],

    // ---------- Oriente ----------
    ['id' => '6',   'numero' => 6,  'forma' => 'path',   'd' => 'M522 180 L598 180 L598 395 L548 392 Q528 372 522 340Z', 'nx' => 568, 'ny' => 293],
    ['id' => '12c', 'numero' => 12, 'forma' => 'path',   'd' => 'M470 360 L515 366 L515 539 L440 540 C402 522 386 472 400 422 C414 382 440 360 470 360Z', 'nx' => 485, 'ny' => 510],
    ['id' => '11',  'numero' => 11, 'forma' => 'path',   'd' => 'M515 366 L585 380 L590 535 L515 539Z', 'nx' => 550, 'ny' => 507],

    ['id' => '25a', 'numero' => 25, 'forma' => 'rect',   'x' => 392, 'y' => 585, 'w' => 83,  'h' => 130, 'r' => 26, 'nx' => 455, 'ny' => 700],
    ['id' => '25b', 'numero' => 25, 'forma' => 'rect',   'x' => 392, 'y' => 735, 'w' => 78,  'h' => 103, 'r' => 18, 'nx' => 463, 'ny' => 808],
    ['id' => '25c', 'numero' => 25, 'forma' => 'rect',   'x' => 392, 'y' => 842, 'w' => 78,  'h' => 54,  'r' => 18, 'nx' => 455, 'ny' => 872],
    ['id' => '9a',  'numero' => 9,  'forma' => 'rect',   'x' => 500, 'y' => 597, 'w' => 98,  'h' => 108, 'r' => 22, 'nx' => 563, 'ny' => 688],
    ['id' => '18b', 'numero' => 18, 'forma' => 'rect',   'x' => 510, 'y' => 720, 'w' => 88,  'h' => 95,  'r' => 18, 'nx' => 571, 'ny' => 795],
    ['id' => '9b',  'numero' => 9,  'forma' => 'rect',   'x' => 510, 'y' => 820, 'w' => 88,  'h' => 80,  'r' => 18, 'nx' => 576, 'ny' => 882],
    ['id' => '28a', 'numero' => 28, 'forma' => 'rect',   'x' => 392, 'y' => 905, 'w' => 88,  'h' => 125, 'r' => 22, 'nx' => 470, 'ny' => 1016],
    ['id' => '28b', 'numero' => 28, 'forma' => 'rect',   'x' => 518, 'y' => 920, 'w' => 80,  'h' => 115, 'r' => 18, 'nx' => 572, 'ny' => 1012],
];
