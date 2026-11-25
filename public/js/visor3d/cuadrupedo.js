/* ==========================================================
   Constructor de cuadrúpedos a partir de una configuración.
   Cada pieza (torso, cuello, cabeza, patas, cola) es un "torno"
   (LatheGeometry) con su propio perfil y su propia textura de
   pelaje, así el patrón (rayas, rosetas, manchas) se acomoda
   bien a la forma de cada parte.
   ========================================================== */
import * as THREE from 'three';
import { pelaje, relievePelo, aTextura } from './texturas.js';

const V3 = THREE.Vector3;

/* ---------- Geometrías ---------- */

/** Interpola el perfil [[t, radio], ...] de forma suave. */
function muestrearPerfil(perfil, n = 48) {
    const curva = new THREE.SplineCurve(perfil.map(([t, r]) => new THREE.Vector2(t, r)));
    return curva.getSpacedPoints(n);
}

function radioEn(perfil, t) {
    const pts = muestrearPerfil(perfil, 96);
    let mejor = pts[0];
    for (const p of pts) if (Math.abs(p.x - t) < Math.abs(mejor.x - t)) mejor = p;
    return mejor.y;
}

/**
 * Pieza torneada a lo largo de +Y, de 0 a "largo".
 * escalaX / escalaZ deforman la sección para que no sea un tubo perfecto.
 */
function torno(perfil, largo, { segmentos = 40, escalaX = 1, escalaZ = 1 } = {}) {
    const puntos = muestrearPerfil(perfil, 56).map(p => new THREE.Vector2(Math.max(p.y, 0.0005), p.x * largo));
    const g = new THREE.LatheGeometry(puntos, segmentos);
    g.scale(escalaX, 1, escalaZ);
    g.computeVertexNormals();
    return g;
}

/* ---------- Materiales ---------- */

function materialPelo(mapa, relieve, { brillo = '#fff3dc', repetirRelieve = [3, 3], rugosidad = .88 } = {}) {
    const bump = relieve.clone();
    bump.repeat.set(...repetirRelieve);
    bump.wrapS = bump.wrapT = THREE.RepeatWrapping;
    bump.needsUpdate = true;
    return new THREE.MeshPhysicalMaterial({
        map: mapa,
        bumpMap: bump,
        bumpScale: 1.6,
        roughness: rugosidad,
        metalness: 0,
        sheen: .3,
        sheenRoughness: .8,
        sheenColor: new THREE.Color(brillo)
    });
}

function materialLiso(color, opciones = {}) {
    return new THREE.MeshPhysicalMaterial({ color, roughness: .5, metalness: 0, ...opciones });
}

/* ---------- Constructor ---------- */

export function crearCuadrupedo(cfg) {
    const raiz = new THREE.Group();
    raiz.name = cfg.nombre;

    const relieve = aTextura(relievePelo(cfg.semilla || 5), { color: false });
    const tex = (o, w, h) => aTextura(pelaje({ ...o, w, h }));

    // Texturas de cada pieza
    const tTorso = tex(cfg.pelo.torso, 1024, 512);
    const tCuello = tex(cfg.pelo.cuello || { ...cfg.pelo.torso, semilla: 31 }, 512, 512);
    const tCabeza = tex(cfg.pelo.cabeza || cfg.pelo.torso, 512, 512);
    const tPataD = tex(cfg.pelo.pata, 256, 512);
    const tPataT = tex({ ...cfg.pelo.pata, semilla: (cfg.pelo.pata.semilla || 9) + 3 }, 256, 512);
    const tCola = tex(cfg.pelo.cola || cfg.pelo.pata, 256, 256);

    const brillo = cfg.brillo || '#fff1d6';
    const mTorso = materialPelo(tTorso, relieve, { brillo, repetirRelieve: [4, 2] });
    const mCuello = materialPelo(tCuello, relieve, { brillo, repetirRelieve: [2, 2] });
    const mCabeza = materialPelo(tCabeza, relieve, { brillo, repetirRelieve: [2, 2] });
    const mPataD = materialPelo(tPataD, relieve, { brillo, repetirRelieve: [1, 2] });
    const mPataT = materialPelo(tPataT, relieve, { brillo, repetirRelieve: [1, 2] });
    const mCola = materialPelo(tCola, relieve, { brillo, repetirRelieve: [1, 2] });

    const partes = {};

    /* --- Torso (eje X: atrás -> adelante) --- */
    const c = cfg.cuerpo;
    const torso = new THREE.Group();
    torso.position.set(0, c.y, 0);
    torso.rotation.z = c.inclinacion || 0;
    raiz.add(torso);

    const gTorso = torno(c.perfil, c.largo, { segmentos: 64, escalaZ: c.ancho, escalaX: c.alto || 1 });
    gTorso.rotateZ(-Math.PI / 2);
    gTorso.translate(-c.largo / 2, 0, 0);
    const mallaTorso = new THREE.Mesh(gTorso, mTorso);
    torso.add(mallaTorso);
    partes.torso = mallaTorso;

    // Ubica un punto del torso (x relativo al centro) en coordenadas de la raíz
    const puntoTorso = (x, y = 0, z = 0) => torso.localToWorld(new V3(x, y, z));
    raiz.updateMatrixWorld(true);

    /* --- Patas --- */
    partes.patas = [];
    for (const [tipo, p] of [['delantera', cfg.patas.delantera], ['trasera', cfg.patas.trasera]]) {
        for (const lado of [1, -1]) {
            const cadera = new THREE.Group();
            const ancla = puntoTorso(p.x, p.yRel ?? -0.05, 0);
            cadera.position.set(ancla.x, p.y ?? ancla.y, p.z * lado);
            raiz.add(cadera);

            const rA = p.rArriba * (cfg.musculo ?? 1.25);
            const gSup = torno([[0, p.rRodilla * .95], [.3, p.rRodilla * 1.15], [.62, (p.rRodilla + rA) / 2 * 1.08], [.86, rA], [.97, rA * .72], [1, rA * .25]], p.sup * 1.08, { segmentos: 32, escalaX: 1.2, escalaZ: .62 });
            gSup.translate(0, -p.sup * .08, 0);
            gSup.translate(0, -p.sup, 0);
            const sup = new THREE.Mesh(gSup, tipo === 'delantera' ? mPataD : mPataT);
            cadera.add(sup);
            cadera.rotation.z = p.angulo || 0;

            const rodilla = new THREE.Group();
            rodilla.position.y = -p.sup;
            rodilla.rotation.z = p.anguloRodilla || 0;
            cadera.add(rodilla);

            const gInf = torno([[0, p.rTobillo * 1.05], [.18, p.rTobillo * .92], [.55, (p.rTobillo + p.rRodilla) / 2], [.92, p.rRodilla * 1.05], [1, p.rRodilla * .9]], p.inf, { segmentos: 24, escalaX: 1.1, escalaZ: .85 });
            gInf.translate(0, -p.inf, 0);
            // reutiliza la textura pero desplazada para que no se vean iguales
            const inf = new THREE.Mesh(gInf, tipo === 'delantera' ? mPataD : mPataT);
            rodilla.add(inf);
            // articulación redondeada para que no se vea el corte entre piezas
            const junta = new THREE.Mesh(new THREE.SphereGeometry(p.rRodilla * 1.02, 20, 14), tipo === 'delantera' ? mPataD : mPataT);
            junta.scale.set(1.25, 1.15, .8);
            rodilla.add(junta);

            // Pie: zarpa redonda o pezuña
            let pie;
            if (cfg.pezunas) {
                const g = new THREE.CylinderGeometry(p.rTobillo * .95, p.rTobillo * 1.15, p.pie * 1.1, 18);
                pie = new THREE.Mesh(g, materialLiso(cfg.pezunas, { roughness: .45, clearcoat: .4 }));
                pie.position.set(0, -p.inf - p.pie * .35, 0);
            } else {
                const g = new THREE.SphereGeometry(p.pie, 24, 16);
                g.scale(1.35, .6, 1.05);
                pie = new THREE.Mesh(g, tipo === 'delantera' ? mPataD : mPataT);
                pie.position.set(p.pie * .35, -p.inf - p.pie * .1, 0);
            }
            rodilla.add(pie);

            partes.patas.push({ cadera, rodilla, tipo, lado, base: cadera.rotation.z, baseRodilla: rodilla.rotation.z });
        }
    }

    /* --- Cuello --- */
    const cu = cfg.cuello;
    const cuello = new THREE.Group();
    const baseCuello = puntoTorso(cu.base[0], cu.base[1], 0);
    cuello.position.copy(baseCuello);
    cuello.rotation.z = -cu.angulo;
    raiz.add(cuello);

    const gCuello = torno(cu.perfil || [[0, cu.radio], [.5, (cu.radio + cu.radioFin) / 2], [1, cu.radioFin]], cu.largo, { segmentos: 40, escalaZ: cu.ancho || .9 });
    gCuello.translate(0, -cu.radio * .4, 0);
    const mallaCuello = new THREE.Mesh(gCuello, mCuello);
    cuello.add(mallaCuello);

    /* --- Cabeza (eje X hacia el hocico) --- */
    const ca = cfg.cabeza;
    const cabeza = new THREE.Group();
    cabeza.position.set(0, cu.largo - cu.radio * .4, 0);
    // inclinación de la cabeza en el mundo, independiente del cuello
    cabeza.rotation.z = (ca.inclinacion || 0) + cu.angulo;
    cuello.add(cabeza);

    const gCabeza = torno(ca.perfil, ca.largo, { segmentos: 48, escalaX: ca.alto || 1, escalaZ: ca.ancho || 1 });
    gCabeza.rotateZ(-Math.PI / 2);
    gCabeza.translate(-ca.largo * (ca.atras ?? .3), 0, 0);
    const mallaCabeza = new THREE.Mesh(gCabeza, mCabeza);
    cabeza.add(mallaCabeza);

    // Punto sobre la superficie de la cabeza: t a lo largo, ángulo desde arriba
    const sobreCabeza = (t, anguloDesdeArriba, lado = 1, salir = 0) => {
        const r = radioEn(ca.perfil, t) + salir;
        const x = t * ca.largo - ca.largo * (ca.atras ?? .3);
        const y = Math.cos(anguloDesdeArriba) * r * (ca.alto || 1);
        const z = Math.sin(anguloDesdeArriba) * r * (ca.ancho || 1) * lado;
        return new V3(x, y, z);
    };

    // Ojos
    const o = cfg.ojos;
    for (const lado of [1, -1]) {
        const globo = new THREE.Mesh(
            new THREE.SphereGeometry(o.tam, 20, 14),
            materialLiso(o.color, { roughness: .12, clearcoat: 1, clearcoatRoughness: .05 })
        );
        globo.position.copy(sobreCabeza(o.t, o.angulo, lado, -o.tam * .45));
        cabeza.add(globo);
        const pupila = new THREE.Mesh(new THREE.SphereGeometry(o.tam * .55, 14, 10), materialLiso('#0b0705', { roughness: .1, clearcoat: 1 }));
        // la pupila mira hacia afuera y al frente (más al frente en depredadores)
        const fuera = new V3(0, globo.position.y, globo.position.z).normalize();
        const mira = new V3(1, 0, 0).multiplyScalar(o.frontal ?? .8).addScaledVector(fuera, 1 - (o.frontal ?? .8) + .2).normalize();
        pupila.position.copy(globo.position).addScaledVector(mira, o.tam * .62);
        pupila.scale.setScalar(o.pupila ?? .85);
        cabeza.add(pupila);
    }

    // Almohadillas de los bigotes y barbilla (dan volumen al hocico)
    if (ca.bigotes) {
        const b = ca.bigotes;
        for (const lado of [1, -1]) {
            const g = new THREE.SphereGeometry(b.tam, 20, 14);
            const pad = new THREE.Mesh(g, mCabeza);
            pad.scale.set(1.1, .85, 1);
            pad.position.copy(sobreCabeza(b.t, b.angulo, lado, -b.tam * .75));
            cabeza.add(pad);
        }
        const barbilla = new THREE.Mesh(new THREE.SphereGeometry(b.tam * .9, 18, 12), mCabeza);
        barbilla.scale.set(1.2, .7, 1);
        barbilla.position.copy(sobreCabeza(b.t - .06, Math.PI * .97, 1, -b.tam * .5)).setZ(0);
        cabeza.add(barbilla);
    }

    // Nariz
    const n = cfg.nariz;
    const nariz = new THREE.Mesh(new THREE.SphereGeometry(n.tam, 20, 14), materialLiso(n.color, { roughness: .35, clearcoat: .6 }));
    nariz.scale.set(.75, .6, 1.15);
    nariz.position.copy(sobreCabeza(n.t, n.angulo ?? .55, 1, -n.tam * .5)).setZ(0);
    cabeza.add(nariz);

    // Orejas
    const ore = cfg.orejas;
    partes.orejas = [];
    for (const lado of [1, -1]) {
        const pivote = new THREE.Group();
        pivote.position.copy(sobreCabeza(ore.t, ore.angulo, lado, -ore.tam * .25));
        cabeza.add(pivote);

        let oreja;
        if (ore.tipo === 'punta') {
            const g = new THREE.ConeGeometry(ore.tam * .45, ore.tam * 1.8, 18);
            g.translate(0, ore.tam * .9, 0);
            g.scale(1, 1, .45);
            oreja = new THREE.Mesh(g, mCabeza);
            pivote.rotation.set(lado * -(ore.abrir ?? 1.1), 0, ore.inclinar ?? .4);
        } else {
            const g = new THREE.SphereGeometry(ore.tam, 20, 12, 0, Math.PI * 2, 0, Math.PI / 2);
            g.scale(1, 1.05, .42);
            oreja = new THREE.Mesh(g, mCabeza);
            const interior = new THREE.Mesh(
                new THREE.CircleGeometry(ore.tam * .68, 18, 0, Math.PI),
                materialLiso(ore.interior || '#3a2a20', { roughness: .9, side: THREE.DoubleSide })
            );
            interior.position.set(ore.tam * .005, ore.tam * .02, 0);
            interior.rotation.y = Math.PI / 2;
            interior.position.x = ore.tam * .17;
            oreja.add(interior);
            if (ore.dorso) {
                const dorso = new THREE.Mesh(
                    new THREE.CircleGeometry(ore.tam * .8, 18, 0, Math.PI),
                    materialLiso(ore.dorso, { roughness: .9, side: THREE.DoubleSide })
                );
                dorso.rotation.y = -Math.PI / 2;
                dorso.position.x = -ore.tam * .43;
                oreja.add(dorso);
                if (ore.mancha) {
                    const m = new THREE.Mesh(new THREE.CircleGeometry(ore.tam * .25, 14), materialLiso(ore.mancha, { side: THREE.DoubleSide }));
                    m.rotation.y = -Math.PI / 2;
                    m.position.set(-ore.tam * .44, ore.tam * .35, 0);
                    oreja.add(m);
                }
            }
            pivote.rotation.set(lado * -(ore.abrir ?? .45), 0, ore.inclinar ?? .15);
        }
        pivote.add(oreja);
        partes.orejas.push({ pivote, base: pivote.rotation.clone(), lado });
    }

    // Osiconos (jirafa)
    if (cfg.osiconos) {
        const os = cfg.osiconos;
        for (const lado of [1, -1]) {
            const grupo = new THREE.Group();
            grupo.position.copy(sobreCabeza(os.t, os.angulo, lado, -.01));
            grupo.rotation.set(lado * -.25, 0, .35);
            const palo = new THREE.Mesh(new THREE.CylinderGeometry(os.radio * .85, os.radio, os.largo, 14), mCabeza);
            palo.position.y = os.largo / 2;
            const punta = new THREE.Mesh(new THREE.SphereGeometry(os.radio * 1.25, 14, 10), materialLiso(os.punta, { roughness: .9 }));
            punta.position.y = os.largo;
            grupo.add(palo, punta);
            cabeza.add(grupo);
        }
    }

    // Crin corta a lo largo del cuello (jirafa)
    if (cfg.crin) {
        const cr = cfg.crin;
        const g = new THREE.BoxGeometry(cr.grosor, cu.largo * .92, cr.alto, 1, 12, 1);
        const crin = new THREE.Mesh(g, materialLiso(cr.color, { roughness: .95 }));
        crin.position.set(-cu.radio * .85, cu.largo * .5, 0);
        crin.rotation.y = Math.PI / 2;
        cuello.add(crin);
    }

    /* --- Melena (león) --- */
    if (cfg.melena) {
        partes.melena = crearMelena(cfg.melena, cu, ca, relieve);
        cuello.add(partes.melena);
    }

    /* --- Cola: cadena de segmentos para poder ondularla --- */
    const co = cfg.cola;
    const baseCola = puntoTorso(-c.largo / 2 + (co.desde ?? .06), co.alto ?? .12, 0);
    let padre = new THREE.Group();
    padre.position.copy(baseCola);
    padre.rotation.z = Math.PI / 2 + (co.caida ?? .5);
    raiz.add(padre);
    partes.cola = [padre];

    const largoSeg = co.largo / co.curva.length;
    co.curva.forEach((giro, i) => {
        const r0 = co.radio + (co.radioFin - co.radio) * (i / co.curva.length);
        const r1 = co.radio + (co.radioFin - co.radio) * ((i + 1) / co.curva.length);
        const g = torno([[0, r0], [1, r1 * 1.02]], largoSeg * 1.06, { segmentos: 18 });
        // cada segmento usa una franja distinta de la textura (desplaza v)
        const uv = g.attributes.uv;
        for (let k = 0; k < uv.count; k++) uv.setY(k, (uv.getY(k) + i) / co.curva.length);
        const seg = new THREE.Mesh(g, mCola);
        const grupo = i === 0 ? padre : new THREE.Group();
        if (i > 0) {
            grupo.position.y = largoSeg;
            padre.add(grupo);
            partes.cola.push(grupo);
        }
        grupo.rotation.z += giro;
        grupo.add(seg);
        // articulación redonda para que no se vean cortes
        const junta = new THREE.Mesh(new THREE.SphereGeometry(r0, 14, 10), mCola);
        grupo.add(junta);
        padre = grupo;
    });
    if (co.borla) {
        const g = new THREE.SphereGeometry(co.borla.tam, 18, 14);
        g.scale(.8, 1.5, .8);
        const borla = new THREE.Mesh(g, materialPelo(aTextura(pelaje({ ...cfg.pelo.cola, base: co.borla.color, base2: co.borla.color2 || co.borla.color, vientre: null, patron: null, w: 128, h: 128 })), relieve, { brillo }));
        borla.position.y = largoSeg + co.borla.tam * .7;
        padre.add(borla);
    }

    // Sombras para todo
    raiz.traverse(m => {
        if (m.isMesh) {
            m.castShadow = true;
            m.receiveShadow = true;
        }
    });

    // Apoyar en el piso y centrar en X
    raiz.updateMatrixWorld(true);
    const caja = new THREE.Box3().setFromObject(raiz);
    raiz.position.y -= caja.min.y;
    raiz.position.x -= (caja.min.x + caja.max.x) / 2;

    const animal = new THREE.Group();
    animal.add(raiz);

    return {
        objeto: animal,
        partes: { ...partes, torso, cuello, cabeza, raiz },
        alturaBase: raiz.position.y,
        actualizar: crearAnimador({ ...partes, torso, cuello, cabeza, raiz }, cfg, raiz.position.y)
    };
}

/* ---------- Melena: base + cientos de mechones instanciados ---------- */

function crearMelena(m, cu, ca, relieve) {
    const grupo = new THREE.Group();

    // dirección de la cara en coordenadas del cuello
    const giro = (ca.inclinacion || 0) + cu.angulo;
    const frente = new V3(Math.cos(giro), Math.sin(giro), 0);
    const centro = new V3(0, cu.largo * (m.altura ?? .72), 0).addScaledVector(frente, m.adelante ?? -.04);
    const radios = new V3(...m.radios);

    const texBase = aTextura(pelaje({
        w: 512, h: 512, base: m.color, base2: m.color2, semilla: 77,
        mechones: { cantidad: 26000, largo: .05, alfa: .12 }
    }));
    const matBase = materialPelo(texBase, relieve, { brillo: '#ffdca8', repetirRelieve: [2, 2], rugosidad: .95 });

    const gBase = new THREE.SphereGeometry(1, 40, 28);
    gBase.scale(radios.x * .82, radios.y * .86, radios.z * .82);
    const base = new THREE.Mesh(gBase, matBase);
    base.position.copy(centro);
    grupo.add(base);

    // mechones
    // cada mechón es un "copo" alargado: más suave que un cono
    const cono = new THREE.SphereGeometry(1, 8, 6);
    cono.translate(0, 1, 0);
    cono.scale(1, .5, 1);
    const matMechon = new THREE.MeshPhysicalMaterial({
        roughness: .95, bumpMap: relieve, bumpScale: 1.2,
        sheen: .6, sheenRoughness: .7, sheenColor: new THREE.Color('#ffd79a')
    });
    const total = m.mechones ?? 520;
    const inst = new THREE.InstancedMesh(cono, matMechon, total);
    const rnd = (() => { let s = 99; return () => (s = (s * 16807) % 2147483647) / 2147483647; })();
    const col1 = new THREE.Color(m.color), col2 = new THREE.Color(m.color2), col3 = new THREE.Color(m.punta || m.color2);
    const atras = frente.clone().negate();
    const abajo = new V3(0, -1, 0);
    const mat = new THREE.Matrix4(), q = new THREE.Quaternion(), s = new V3(), arriba = new V3(0, 1, 0);

    let i = 0, intentos = 0;
    while (i < total && intentos < total * 20) {
        intentos++;
        const d = new V3(rnd() * 2 - 1, rnd() * 2 - 1, rnd() * 2 - 1);
        if (d.lengthSq() > 1 || d.lengthSq() < .05) continue;
        d.normalize();
        if (d.dot(frente) > (m.hueco ?? .45)) continue; // deja libre la cara
        const pos = centro.clone().add(new V3(d.x * radios.x, d.y * radios.y, d.z * radios.z));
        const dir = d.clone().addScaledVector(atras, .6).addScaledVector(abajo, .55).normalize();
        q.setFromUnitVectors(arriba, dir);
        const largo = (m.largo ?? .2) * (.6 + rnd() * .8);
        const grosor = (m.grosor ?? .06) * (.7 + rnd() * .6);
        s.set(grosor, largo, grosor);
        mat.compose(pos, q, s);
        inst.setMatrixAt(i, mat);
        const c = col1.clone().lerp(col2, rnd());
        if (rnd() < .25) c.lerp(col3, .5);
        inst.setColorAt(i, c);
        i++;
    }
    inst.count = i;
    inst.instanceMatrix.needsUpdate = true;
    if (inst.instanceColor) inst.instanceColor.needsUpdate = true;
    grupo.add(inst);
    return grupo;
}

/* ---------- Animación ---------- */

function crearAnimador(p, cfg, alturaBase) {
    const vel = cfg.animacion?.velocidad ?? .9;
    const amp = cfg.animacion?.paso ?? .42;
    // orden de pisada de los felinos al caminar: TI, DI, TD, DD
    const desfase = { 'trasera1': 0, 'delantera1': .25, 'trasera-1': .5, 'delantera-1': .75 };
    const baseCabeza = p.cabeza.rotation.clone();
    const baseCola = p.cola.map(g => g.rotation.clone());

    return function actualizar(t, modo) {
        const caminar = modo === 'caminar';
        const fase = t * vel;

        for (const pata of p.patas) {
            if (caminar) {
                const f = (fase + desfase[pata.tipo + pata.lado]) * Math.PI * 2;
                pata.cadera.rotation.z = pata.base + Math.sin(f) * amp;
                const levanta = Math.max(0, Math.cos(f));
                pata.rodilla.rotation.z = pata.baseRodilla + levanta * (pata.tipo === 'delantera' ? -.75 : .55);
            } else {
                pata.cadera.rotation.z += (pata.base - pata.cadera.rotation.z) * .1;
                pata.rodilla.rotation.z += (pata.baseRodilla - pata.rodilla.rotation.z) * .1;
            }
        }

        // cuerpo: respiración y rebote al caminar
        const respira = Math.sin(t * 1.7) * .012;
        p.torso.scale.set(1, 1 + respira, 1 + respira);
        p.raiz.position.y = alturaBase + (caminar ? Math.abs(Math.sin(fase * Math.PI * 2)) * .018 : 0);

        // cabeza: mira alrededor en reposo, acompaña el paso al caminar
        if (caminar) {
            p.cabeza.rotation.y = baseCabeza.y + Math.sin(fase * Math.PI * 2) * .04;
            p.cabeza.rotation.z = baseCabeza.z + Math.sin(fase * Math.PI * 4) * .03;
        } else {
            p.cabeza.rotation.y = baseCabeza.y + Math.sin(t * .45) * .32 + Math.sin(t * 1.3) * .03;
            p.cabeza.rotation.z = baseCabeza.z + Math.sin(t * .3) * .05;
        }

        // cola: ondulación que viaja de la base a la punta
        p.cola.forEach((g, i) => {
            g.rotation.x = baseCola[i].x + Math.sin(t * (caminar ? 3 : 1.4) - i * .7) * (.1 + i * .06);
            g.rotation.z = baseCola[i].z + Math.sin(t * .9 - i * .5) * .05;
        });

        // orejas: un pequeño movimiento de vez en cuando
        const tic = Math.max(0, Math.sin(t * .8) - .93) * 6;
        p.orejas.forEach(o => {
            o.pivote.rotation.x = o.base.x + tic * .25 * o.lado;
        });
    };
}
