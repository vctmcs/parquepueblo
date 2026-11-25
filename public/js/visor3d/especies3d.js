/* ==========================================================
   Configuración 3D de cada especie: proporciones del cuerpo y
   colores/patrón de su pelaje. Las medidas están en "metros de
   escena"; el visor ajusta la cámara a cada animal.
   ========================================================== */

const copia = o => JSON.parse(JSON.stringify(o));
function combinar(base, extra) {
    const r = copia(base);
    for (const [k, v] of Object.entries(extra)) {
        r[k] = v && typeof v === 'object' && !Array.isArray(v) && r[k] && typeof r[k] === 'object'
            ? combinar(r[k], v) : v;
    }
    return r;
}

/* ---------- Base común de los felinos ---------- */
const FELINO = {
    cuerpo: {
        largo: 1.55, y: .8, ancho: .8, alto: 1.1, inclinacion: 0,
        perfil: [[0, .04], [.04, .19], [.14, .28], [.38, .26], [.62, .28], [.82, .31], [.94, .25], [1, .05]]
    },
    patas: {
        delantera: { x: .46, z: .13, y: .76, sup: .36, inf: .34, rArriba: .14, rRodilla: .075, rTobillo: .058, pie: .075, angulo: .05, anguloRodilla: -.05 },
        trasera:   { x: -.52, z: .125, y: .82, sup: .4, inf: .36, rArriba: .18, rRodilla: .08, rTobillo: .058, pie: .075, angulo: -.18, anguloRodilla: .22 }
    },
    cuello: { base: [.55, .1], largo: .36, radio: .2, radioFin: .16, angulo: 1.0, ancho: .9 },
    cabeza: {
        largo: .46, atras: .32, ancho: 1.15, alto: .95, inclinacion: -.12,
        perfil: [[0, .05], [.12, .18], [.34, .21], [.58, .19], [.78, .13], [.93, .1], [1, .03]],
        bigotes: { t: .85, angulo: 1.05, tam: .05 }
    },
    ojos: { t: .6, angulo: .95, tam: .03, color: '#c08a2a', frontal: .8 },
    nariz: { t: .965, tam: .04, color: '#3a2420' },
    orejas: { t: .3, angulo: .62, tam: .07, interior: '#4a3428' },
    cola: { largo: .85, radio: .05, radioFin: .032, caida: .55, curva: [.35, .25, .1, -.15, -.35], alto: .12 },
    animacion: { velocidad: .85, paso: .42 }
};

/* ---------- Especies ---------- */

export const ESPECIES_3D = {
    leon: combinar(FELINO, {
        nombre: 'León',
        semilla: 11,
        rasgos: [
            'Pelaje leonado uniforme, sin manchas en el adulto',
            'Melena del macho, más oscura en la nuca y el pecho',
            'Borla oscura al final de la cola'
        ],
        cuerpo: { largo: 1.7, y: .84, perfil: [[0, .04], [.04, .2], [.14, .29], [.4, .27], [.62, .29], [.82, .33], [.94, .27], [1, .05]] },
        patas: {
            delantera: { y: .8, sup: .38, inf: .36, rArriba: .15, rRodilla: .082, rTobillo: .062, pie: .082 },
            trasera: { y: .86, sup: .42, inf: .38, rArriba: .19, rRodilla: .085, rTobillo: .062, pie: .08 }
        },
        cabeza: { largo: .5, perfil: [[0, .05], [.12, .19], [.34, .22], [.58, .2], [.78, .15], [.93, .115], [1, .03]] },
        nariz: { color: '#5a3328' },
        orejas: { tam: .065, interior: '#4a3020', dorso: '#4b3322' },
        melena: {
            color: '#5a3419', color2: '#a8733a', punta: '#d1a062',
            radios: [.34, .4, .38], altura: .78, adelante: -.06,
            mechones: 2200, largo: .22, grosor: .026, hueco: .45
        },
        cola: { borla: { tam: .055, color: '#3a2414', color2: '#5a3a1c' } },
        pelo: {
            torso: { base: '#c08a4a', base2: '#d9a866', vientre: '#ead2a3', vientreAncho: .2, lomo: '#a8763c', semilla: 3 },
            cabeza: { base: '#c48d4c', base2: '#d7a565', vientre: '#f0e0c0', vientreAncho: .22, hocico: { desde: .78, color: '#efe0c4', fuerza: .85 }, semilla: 4 },
            pata: { base: '#c99552', base2: '#ddb06f', vientre: null, semilla: 5 },
            cola: { base: '#c08a4a', base2: '#d3a061', vientre: null, semilla: 6 }
        }
    }),

    tigre: combinar(FELINO, {
        nombre: 'Tigre',
        semilla: 21,
        rasgos: [
            'Pelaje naranja intenso con rayas negras verticales',
            'Vientre, mejillas y contorno de los ojos blancos',
            'Dorso de las orejas negro con una mancha blanca',
            'Cola con anillos negros y punta oscura'
        ],
        cuerpo: { largo: 1.85, y: .82, perfil: [[0, .04], [.04, .2], [.14, .29], [.4, .27], [.62, .29], [.82, .32], [.94, .26], [1, .05]] },
        patas: {
            delantera: { rArriba: .15, rRodilla: .085, rTobillo: .064, pie: .085 },
            trasera: { rArriba: .19, rRodilla: .086, rTobillo: .062, pie: .08 }
        },
        cabeza: { largo: .5, ancho: 1.2 },
        ojos: { color: '#c79a2c' },
        nariz: { color: '#d38f86' },
        orejas: { interior: '#f1e8db', dorso: '#141010', mancha: '#f6f1e8' },
        cola: { largo: .95 },
        pelo: {
            torso: {
                base: '#d9701f', base2: '#ec8a2e', vientre: '#f5efe3', vientreAncho: .2, lomo: '#c75f15', semilla: 13,
                patron: { tipo: 'rayas', cantidad: 26, grosor: .028, largo: .36 }
            },
            cuello: {
                base: '#d9701f', base2: '#ec8a2e', vientre: '#f5efe3', vientreAncho: .24, semilla: 14,
                patron: { tipo: 'rayas', cantidad: 6, grosor: .05, largo: .3 }
            },
            cabeza: {
                base: '#dc7522', base2: '#ee8d30', vientre: '#f7f2e8', vientreAncho: .32, semilla: 15,
                hocico: { desde: .7, color: '#f7f2e8', fuerza: .9 },
                patron: { tipo: 'rayas', cantidad: 9, grosor: .03, largo: .22, margenV: .2 }
            },
            pata: {
                base: '#e0791f', base2: '#ef9136', vientre: null, semilla: 16,
                patron: { tipo: 'rayas', cantidad: 10, grosor: .028, largo: .42 }
            },
            cola: {
                base: '#df7a22', base2: '#ef9136', vientre: null, semilla: 17,
                patron: { tipo: 'rayas', cantidad: 9, grosor: .055, anillo: true, margenV: 0 }
            }
        }
    }),

    jaguar: combinar(FELINO, {
        nombre: 'Jaguar',
        semilla: 31,
        rasgos: [
            'Cuerpo compacto y musculoso con cabeza grande',
            'Rosetas grandes con uno o más puntos negros al centro',
            'Patas más cortas y cola más corta que la del leopardo'
        ],
        cuerpo: { largo: 1.5, y: .74, perfil: [[0, .04], [.04, .21], [.14, .3], [.4, .29], [.62, .3], [.82, .32], [.94, .26], [1, .05]] },
        patas: {
            delantera: { y: .7, sup: .33, inf: .31, rArriba: .15, rRodilla: .085, rTobillo: .066, pie: .085 },
            trasera: { y: .76, sup: .37, inf: .33, rArriba: .19, rRodilla: .088, rTobillo: .064, pie: .082 }
        },
        cabeza: { largo: .5, ancho: 1.25, alto: 1 },
        cola: { largo: .62, radio: .055 },
        pelo: {
            torso: {
                base: '#d29a45', base2: '#e2b25e', vientre: '#f1e6cf', vientreAncho: .19, semilla: 33,
                patron: { tipo: 'rosetas', separacion: .085, tamano: .042, puntosCentro: true, relleno: 'rgba(160, 90, 30, .35)' }
            },
            cabeza: {
                base: '#d49c47', base2: '#e2b25e', vientre: '#f3e9d6', vientreAncho: .26, semilla: 34,
                hocico: { desde: .8, color: '#efe2c8', fuerza: .7 },
                patron: { tipo: 'puntos', cantidad: 110, tamano: .014, evitarVientre: true, hastaV: .82 }
            },
            pata: {
                base: '#d6a04b', base2: '#e5b663', vientre: null, semilla: 35,
                patron: { tipo: 'puntos', cantidad: 120, tamano: .02 }
            },
            cola: {
                base: '#d29a45', base2: '#e2b25e', vientre: null, semilla: 36,
                patron: { tipo: 'rosetas', separacion: .16, tamano: .07, puntosCentro: false }
            }
        }
    }),

    leopardo: combinar(FELINO, {
        nombre: 'Leopardo',
        semilla: 41,
        rasgos: [
            'Cuerpo esbelto y cola larga para equilibrarse en los árboles',
            'Rosetas más pequeñas y juntas, sin puntos en el centro',
            'Manchas sólidas en cabeza y patas'
        ],
        cuerpo: { largo: 1.5, y: .72, ancho: .74, perfil: [[0, .04], [.04, .17], [.14, .25], [.4, .23], [.62, .25], [.82, .28], [.94, .23], [1, .05]] },
        patas: {
            delantera: { y: .68, sup: .33, inf: .31, rArriba: .12, rRodilla: .066, rTobillo: .05, pie: .068 },
            trasera: { y: .74, sup: .36, inf: .33, rArriba: .16, rRodilla: .07, rTobillo: .05, pie: .066 }
        },
        cuello: { radio: .17, radioFin: .14 },
        cabeza: { largo: .42, ancho: 1.1 },
        ojos: { color: '#b9a43a' },
        cola: { largo: 1.05, radio: .042, radioFin: .03, curva: [.3, .2, .1, -.1, -.3, -.45] },
        pelo: {
            torso: {
                base: '#d6a24f', base2: '#e8bd6c', vientre: '#f4ecda', vientreAncho: .19, semilla: 43,
                patron: { tipo: 'rosetas', separacion: .06, tamano: .028, puntosCentro: false, relleno: 'rgba(170, 100, 35, .3)' }
            },
            cabeza: {
                base: '#d8a552', base2: '#e8bd6c', vientre: '#f5eedd', vientreAncho: .26, semilla: 44,
                hocico: { desde: .8, color: '#f1e6cf', fuerza: .7 },
                patron: { tipo: 'puntos', cantidad: 150, tamano: .011, evitarVientre: true, hastaV: .82 }
            },
            pata: {
                base: '#daa955', base2: '#ebc272', vientre: null, semilla: 45,
                patron: { tipo: 'puntos', cantidad: 170, tamano: .016 }
            },
            cola: {
                base: '#d6a24f', base2: '#e8bd6c', vientre: null, semilla: 46,
                patron: { tipo: 'rosetas', separacion: .12, tamano: .05, puntosCentro: false }
            }
        }
    }),

    puma: combinar(FELINO, {
        nombre: 'Puma',
        semilla: 51,
        rasgos: [
            'Pelaje liso color canela o gris arena, sin manchas',
            'Cabeza pequeña y patas traseras largas para saltar',
            'Hocico claro y punta de la cola oscura'
        ],
        cuerpo: { largo: 1.45, y: .74, ancho: .74, perfil: [[0, .04], [.04, .18], [.14, .26], [.4, .23], [.62, .24], [.82, .27], [.94, .22], [1, .05]] },
        patas: {
            delantera: { y: .68, sup: .33, inf: .31, rArriba: .12, rRodilla: .066, rTobillo: .052, pie: .07 },
            trasera: { y: .78, sup: .4, inf: .35, rArriba: .17, rRodilla: .072, rTobillo: .052, pie: .068 }
        },
        cuello: { radio: .17, radioFin: .13 },
        cabeza: { largo: .38, ancho: 1.05, perfil: [[0, .05], [.12, .17], [.34, .2], [.58, .18], [.78, .12], [.93, .095], [1, .03]] },
        ojos: { color: '#a9893a' },
        nariz: { color: '#c98a7c' },
        orejas: { tam: .062, dorso: '#3a2a20' },
        cola: { largo: 1, radio: .05, radioFin: .04, curva: [.3, .2, .1, -.1, -.3, -.45] },
        pelo: {
            torso: { base: '#b8875a', base2: '#c99a6a', vientre: '#ece1cf', vientreAncho: .2, lomo: '#a4764b', semilla: 53 },
            cabeza: { base: '#b98a5c', base2: '#c99a6a', vientre: '#f1e8da', vientreAncho: .3, hocico: { desde: .76, color: '#f1e8da', fuerza: .9 }, semilla: 54 },
            pata: { base: '#bd8e60', base2: '#cda070', vientre: null, semilla: 55 },
            cola: { base: '#b8875a', base2: '#c99a6a', vientre: null, hocico: { desde: .85, color: '#2a1d14', fuerza: 1 }, semilla: 56 }
        }
    }),

    jirafa: {
        nombre: 'Jirafa',
        semilla: 61,
        rasgos: [
            'Manchas cafés irregulares separadas por líneas color crema',
            'Cuello con siete vértebras muy largas y crin corta',
            'Osiconos: dos "cuernos" cubiertos de piel con punta oscura'
        ],
        cuerpo: {
            largo: 1.3, y: 1.55, ancho: .78, alto: 1.05, inclinacion: .2,
            perfil: [[0, .05], [.05, .22], [.18, .3], [.45, .31], [.7, .33], [.88, .3], [.97, .2], [1, .05]]
        },
        patas: {
            delantera: { x: .42, z: .15, y: 1.42, yRel: 0, sup: .74, inf: .68, rArriba: .11, rRodilla: .058, rTobillo: .045, pie: .06, angulo: 0, anguloRodilla: 0 },
            trasera:   { x: -.46, z: .15, y: 1.3, yRel: 0, sup: .68, inf: .6, rArriba: .14, rRodilla: .06, rTobillo: .045, pie: .06, angulo: -.04, anguloRodilla: .06 }
        },
        pezunas: '#2b2018',
        musculo: 1.1,
        cuello: { base: [.48, .12], largo: 1.4, radio: .17, radioFin: .085, angulo: .42, ancho: .75 },
        cabeza: {
            largo: .52, atras: .25, ancho: .85, alto: 1.1, inclinacion: -.95,
            perfil: [[0, .05], [.1, .12], [.28, .135], [.5, .105], [.75, .085], [.93, .075], [1, .03]]
        },
        ojos: { t: .36, angulo: 1.05, tam: .027, color: '#2a1a10', frontal: .2 },
        nariz: { t: .965, tam: .03, angulo: .9, color: '#4a3326' },
        orejas: { tipo: 'punta', t: .2, angulo: 1.15, tam: .07, abrir: 1.3, inclinar: .5 },
        osiconos: { t: .2, angulo: .35, largo: .13, radio: .024, punta: '#2a1d14' },
        crin: { color: '#6b3d1c', grosor: .03, alto: .06 },
        cola: { largo: .85, radio: .03, radioFin: .018, caida: 1.15, curva: [.05, .03, 0, 0, 0], alto: .08, borla: { tam: .055, color: '#1f150f', color2: '#3a271a' } },
        animacion: { velocidad: .6, paso: .3 },
        pelo: {
            torso: {
                base: '#d7b17a', base2: '#e2c08c', vientre: '#efe2c4', vientreAncho: .17, semilla: 63,
                patron: { tipo: 'jirafa', celdasU: 13, celdasV: 7, mancha: '#8f4f22', mancha2: '#6b3514', linea: .02, crema: '#efe0bf' }
            },
            cuello: {
                base: '#d7b17a', base2: '#e2c08c', vientre: '#efe2c4', vientreAncho: .14, semilla: 64,
                patron: { tipo: 'jirafa', celdasU: 7, celdasV: 9, mancha: '#8f4f22', mancha2: '#6b3514', linea: .022, crema: '#efe0bf' }
            },
            cabeza: {
                base: '#d9b07a', base2: '#e5c592', vientre: '#efe2c4', vientreAncho: .25, semilla: 65,
                hocico: { desde: .62, color: '#e9d2a8', fuerza: .8 },
                patron: { tipo: 'puntos', cantidad: 35, tamano: .025, color: '#8f4f22', hastaV: .55 }
            },
            pata: {
                base: '#e3c79a', base2: '#ecd6ae', vientre: null, semilla: 66,
                patron: { tipo: 'jirafa', celdasU: 4, celdasV: 7, mancha: '#a8652f', mancha2: '#8a4c20', linea: .03, crema: '#efe2c6' }
            },
            cola: { base: '#d9b07a', base2: '#e5c592', vientre: null, semilla: 67 }
        }
    }
};
