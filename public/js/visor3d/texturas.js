/* ==========================================================
   Texturas procedurales de pelaje (canvas 2D -> THREE.CanvasTexture)

   Convención UV de todas las piezas (son "tornos" / LatheGeometry):
     u (eje X del canvas) = vuelta alrededor de la pieza
     v (eje Y del canvas) = a lo largo de la pieza
   En torso, cuello y cabeza el vientre/garganta queda en u = 0.25
   y el lomo en u = 0.75.
   ========================================================== */
import * as THREE from 'three';

/* ---------- Utilidades ---------- */

export function aleatorio(semilla) {
    // mulberry32: mismo resultado en cada carga para una misma semilla
    let a = semilla >>> 0;
    return function () {
        a |= 0; a = (a + 0x6D2B79F5) | 0;
        let t = Math.imul(a ^ (a >>> 15), 1 | a);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

const hexARgb = h => {
    const n = parseInt(h.replace('#', ''), 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};
const mezclar = (a, b, k) => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k];
const suave = (a, b, x) => {
    const t = Math.min(Math.max((x - a) / (b - a), 0), 1);
    return t * t * (3 - 2 * t);
};
// Distancia circular en u (0..1)
const distU = (a, b) => {
    const d = Math.abs(a - b) % 1;
    return Math.min(d, 1 - d);
};

/** Ruido de valor con repetición horizontal (para que no se note la costura). */
function crearRuido(rnd, celdasX, celdasY) {
    const g = new Float32Array((celdasX) * (celdasY + 1));
    for (let i = 0; i < g.length; i++) g[i] = rnd();
    const at = (x, y) => g[((y) * celdasX) + (((x % celdasX) + celdasX) % celdasX)];
    return (u, v) => {
        const x = u * celdasX, y = v * celdasY;
        const x0 = Math.floor(x), y0 = Math.min(Math.floor(y), celdasY - 1);
        const fx = x - x0, fy = y - y0;
        const sx = fx * fx * (3 - 2 * fx), sy = fy * fy * (3 - 2 * fy);
        const a = at(x0, y0), b = at(x0 + 1, y0), c = at(x0, y0 + 1), d = at(x0 + 1, y0 + 1);
        return a + (b - a) * sx + (c - a) * sy + (a - b - c + d) * sx * sy;
    };
}

function fbm(ruidos, u, v) {
    let s = 0, amp = .5, tot = 0;
    for (const r of ruidos) { s += r(u, v) * amp; tot += amp; amp *= .5; }
    return s / tot;
}

/** Dibuja algo tres veces (x-W, x, x+W) para que cruce la costura sin cortarse. */
function envolver(ctx, W, dibujar) {
    for (const dx of [-W, 0, W]) {
        ctx.save();
        ctx.translate(dx, 0);
        dibujar();
        ctx.restore();
    }
}

/* ---------- Generador principal ---------- */

/**
 * @param {object} o
 *  w, h            tamaño del canvas
 *  base, base2     colores del pelaje (se mezclan con ruido)
 *  vientre         color del vientre / garganta (null = sin vientre)
 *  vientreAncho    0..0.5 qué tanto sube el color claro por los costados
 *  lomo            color opcional más oscuro sobre la espalda
 *  hocico          {desde, color} aclara el final de la pieza (cabeza)
 *  patron          {tipo: 'rayas'|'rosetas'|'jirafa'|'puntos', ...}
 *  mechones        {cantidad, largo, alfa}
 *  semilla
 */
export function pelaje(o) {
    const W = o.w || 1024, H = o.h || 512;
    const rnd = aleatorio(o.semilla || 1);
    const canvas = document.createElement('canvas');
    canvas.width = W; canvas.height = H;
    const ctx = canvas.getContext('2d');

    const base = hexARgb(o.base), base2 = hexARgb(o.base2 || o.base);
    const vientre = o.vientre ? hexARgb(o.vientre) : null;
    const lomo = o.lomo ? hexARgb(o.lomo) : null;
    const hocico = o.hocico ? { ...o.hocico, rgb: hexARgb(o.hocico.color) } : null;
    const vAncho = o.vientreAncho ?? .16;

    const ruidos = [crearRuido(rnd, 6, 4), crearRuido(rnd, 14, 8), crearRuido(rnd, 40, 22), crearRuido(rnd, 110, 60)];

    // Voronoi para la jirafa
    const jir = o.patron?.tipo === 'jirafa' ? prepararJirafa(o.patron, rnd) : null;

    const img = ctx.createImageData(W, H);
    const px = img.data;
    for (let y = 0; y < H; y++) {
        const v = y / (H - 1);
        for (let x = 0; x < W; x++) {
            const u = x / W;
            const n = fbm(ruidos, u, v);
            let c = mezclar(base, base2, suave(.3, .7, n));

            if (lomo) c = mezclar(c, lomo, (1 - suave(0, .22, distU(u, .75))) * .55);

            if (jir) c = jir.color(u, v, c, n);

            if (vientre) {
                const k = 1 - suave(vAncho * .45, vAncho, distU(u, .25) + (n - .5) * .05);
                c = mezclar(c, vientre, k);
            }
            if (hocico) {
                const k = suave(hocico.desde, hocico.desde + .12, v + (n - .5) * .06) * (hocico.fuerza ?? 1);
                c = mezclar(c, hocico.rgb, k);
            }

            const fino = ruidos[3](u, v) - .5;
            const i = (y * W + x) * 4;
            px[i] = c[0] + fino * 18;
            px[i + 1] = c[1] + fino * 16;
            px[i + 2] = c[2] + fino * 12;
            px[i + 3] = 255;
        }
    }
    ctx.putImageData(img, 0, 0);

    if (o.patron?.tipo === 'rayas') rayas(ctx, W, H, rnd, o.patron);
    if (o.patron?.tipo === 'rosetas') rosetas(ctx, W, H, rnd, o.patron);
    if (o.patron?.tipo === 'puntos') puntos(ctx, W, H, rnd, o.patron);

    mechones(ctx, W, H, rnd, o.mechones || {});

    return canvas;
}

/** Relieve de pelo: trazos finos claros y oscuros sobre gris medio. */
export function relievePelo(semilla = 7, w = 512, h = 512, largo = 9) {
    const rnd = aleatorio(semilla);
    const canvas = document.createElement('canvas');
    canvas.width = w; canvas.height = h;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#808080';
    ctx.fillRect(0, 0, w, h);
    ctx.lineCap = 'round';
    const total = w * h / 9;
    for (let i = 0; i < total; i++) {
        const x = rnd() * w, y = rnd() * h;
        const l = largo * (.5 + rnd());
        const a = (rnd() - .5) * .5;
        ctx.strokeStyle = rnd() > .5 ? 'rgba(255,255,255,.35)' : 'rgba(0,0,0,.35)';
        ctx.lineWidth = .6 + rnd() * .8;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + Math.sin(a) * l, y + Math.cos(a) * l);
        ctx.stroke();
    }
    return canvas;
}

export function aTextura(canvas, { repetir = [1, 1], color = true, anisotropia = 8 } = {}) {
    const t = new THREE.CanvasTexture(canvas);
    t.wrapS = THREE.RepeatWrapping;
    t.wrapT = THREE.ClampToEdgeWrapping;
    if (repetir[1] !== 1) t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(repetir[0], repetir[1]);
    t.colorSpace = color ? THREE.SRGBColorSpace : THREE.NoColorSpace;
    t.anisotropy = anisotropia;
    t.needsUpdate = true;
    return t;
}

/* ---------- Patrones ---------- */

/** Rayas de tigre: salen del lomo (u=.75) y bajan por ambos costados. */
function rayas(ctx, W, H, rnd, p) {
    const n = p.cantidad || 18;
    const color = p.color || '#1b1410';
    const inicio = p.inicioU ?? .75;
    const anilloCompleto = p.anillo === true;

    ctx.fillStyle = color;
    for (let i = 0; i < n; i++) {
        const v = (i + .5 + (rnd() - .5) * .6) / n;
        if (v < (p.margenV ?? .04) || v > 1 - (p.margenV ?? .04)) continue;
        const y0 = v * H;
        const grosor = (p.grosor || .025) * H * (.7 + rnd() * .7);

        for (const lado of [-1, 1]) {
            if (!anilloCompleto && rnd() < .12) continue; // rayas que no bajan de un lado
            const largo = (anilloCompleto ? .52 : (p.largo || .38) * (.65 + rnd() * .5)) * W;
            const inclinacion = (rnd() - .5) * (p.inclinacion ?? .35) * H * .1;
            const ondas = 1 + rnd() * 2, fase = rnd() * 6;
            const pasos = 18;
            const arriba = [], abajo = [];
            for (let k = 0; k <= pasos; k++) {
                const t = k / pasos;
                const x = inicio * W + lado * t * largo;
                const y = y0 + inclinacion * t + Math.sin(t * ondas * Math.PI + fase) * grosor * .5;
                // grosor: crece al inicio y se afila en la punta
                const g = grosor * (anilloCompleto ? .9 : Math.sin(Math.min(t * 1.1, 1) * Math.PI * .5 + .25) * (1 - t * .85));
                arriba.push([x, y - g / 2]);
                abajo.push([x, y + g / 2]);
            }
            envolver(ctx, W, () => {
                ctx.beginPath();
                ctx.moveTo(arriba[0][0], arriba[0][1]);
                for (const [x, y] of arriba) ctx.lineTo(x, y);
                for (let k = abajo.length - 1; k >= 0; k--) ctx.lineTo(abajo[k][0], abajo[k][1]);
                ctx.closePath();
                ctx.fill();
            });

            // Algunas rayas se bifurcan
            if (!anilloCompleto && rnd() < .3) {
                const t0 = .35 + rnd() * .3;
                const xb = inicio * W + lado * t0 * largo;
                const yb = y0 + inclinacion * t0 + (rnd() > .5 ? 1 : -1) * grosor * 1.6;
                envolver(ctx, W, () => {
                    ctx.beginPath();
                    ctx.ellipse(xb + lado * largo * .12, yb, largo * .14, grosor * .35, 0, 0, Math.PI * 2);
                    ctx.fill();
                });
            }
        }
    }
}

/** Rosetas (jaguar y leopardo). Cerca del vientre se vuelven manchas sólidas. */
function rosetas(ctx, W, H, rnd, p) {
    const color = p.color || '#1e1611';
    const relleno = p.relleno || 'rgba(150, 85, 25, .35)';
    const celda = (p.separacion || .07) * H;
    const tam = (p.tamano || .03) * H;

    for (let gy = -1; gy < H / celda + 1; gy++) {
        for (let gx = 0; gx < W / celda; gx++) {
            const cx = (gx + .5 + (rnd() - .5) * .8) * celda;
            const cy = (gy + .5 + (rnd() - .5) * .8) * celda;
            const u = cx / W;
            const cercaVientre = 1 - suave(.06, .2, distU(u, .25));
            const s = tam * (.65 + rnd() * .7) * (1 - cercaVientre * .45);

            envolver(ctx, W, () => {
                if (cercaVientre > .5 || rnd() < (p.manchasSueltas ?? .12)) {
                    // mancha sólida
                    ctx.fillStyle = color;
                    ctx.beginPath();
                    ctx.ellipse(cx, cy, s * .45, s * .38, rnd() * 3, 0, Math.PI * 2);
                    ctx.fill();
                    return;
                }
                // interior un poco más oscuro
                ctx.fillStyle = relleno;
                ctx.beginPath();
                ctx.ellipse(cx, cy, s * .85, s * .75, rnd() * 3, 0, Math.PI * 2);
                ctx.fill();

                // anillo roto de 4 a 6 manchitas
                ctx.fillStyle = color;
                const k = 4 + Math.floor(rnd() * 3);
                const giro = rnd() * Math.PI * 2;
                for (let j = 0; j < k; j++) {
                    if (rnd() < .15) continue;
                    const a = giro + (j / k) * Math.PI * 2 + (rnd() - .5) * .4;
                    const bx = cx + Math.cos(a) * s, by = cy + Math.sin(a) * s * .9;
                    ctx.beginPath();
                    ctx.ellipse(bx, by, s * (.3 + rnd() * .22), s * (.18 + rnd() * .12), a + Math.PI / 2, 0, Math.PI * 2);
                    ctx.fill();
                }
                // puntos al centro (jaguar)
                if (p.puntosCentro) {
                    const m = 1 + Math.floor(rnd() * 2.4);
                    for (let j = 0; j < m; j++) {
                        ctx.beginPath();
                        ctx.arc(cx + (rnd() - .5) * s * .7, cy + (rnd() - .5) * s * .6, s * (.12 + rnd() * .08), 0, Math.PI * 2);
                        ctx.fill();
                    }
                }
            });
        }
    }
}

/** Puntos sólidos pequeños (patas y cabeza de leopardo/jaguar). */
function puntos(ctx, W, H, rnd, p) {
    ctx.fillStyle = p.color || '#1e1611';
    const n = p.cantidad || 160;
    for (let i = 0; i < n; i++) {
        const x = rnd() * W, y = rnd() * H;
        if (p.evitarVientre && distU(x / W, .25) < .1) continue;
        if (p.hastaV && y / H > p.hastaV) continue;
        const r = (p.tamano || .012) * H * (.5 + rnd());
        envolver(ctx, W, () => {
            ctx.beginPath();
            ctx.ellipse(x, y, r, r * (.7 + rnd() * .5), rnd() * 3, 0, Math.PI * 2);
            ctx.fill();
        });
    }
}

/** Manchas de jirafa: celdas de Voronoi cafés separadas por líneas crema. */
function prepararJirafa(p, rnd) {
    const cx = p.celdasU || 14, cy = p.celdasV || 7;
    const pts = [];
    const tonos = [];
    const c1 = hexARgb(p.mancha || '#8a4b1f'), c2 = hexARgb(p.mancha2 || '#6b3412');
    for (let j = 0; j < cy; j++) for (let i = 0; i < cx; i++) {
        pts.push([(i + .2 + rnd() * .6) / cx, (j + .2 + rnd() * .6) / cy]);
        tonos.push(mezclar(c1, c2, rnd()));
    }
    const linea = p.linea || .022;
    const crema = hexARgb(p.crema || '#efe2c4');

    return {
        color(u, v, c, n) {
            const ix = Math.floor(u * cx), iy = Math.floor(v * cy);
            let d1 = 9, d2 = 9, mejor = 0;
            for (let dy = -1; dy <= 1; dy++) {
                const jy = iy + dy;
                if (jy < 0 || jy >= cy) continue;
                for (let dx = -1; dx <= 1; dx++) {
                    let jx = ix + dx, ox = 0;
                    if (jx < 0) { jx += cx; ox = -1; }
                    if (jx >= cx) { jx -= cx; ox = 1; }
                    const k = jy * cx + jx;
                    const px = pts[k][0] + ox, py = pts[k][1];
                    // las celdas son algo más anchas que altas en el UV
                    const d = Math.hypot((u - px) * cx, (v - py) * cy * .9);
                    if (d < d1) { d2 = d1; d1 = d; mejor = k; } else if (d < d2) d2 = d;
                }
            }
            const borde = d2 - d1;
            const ancho = linea * 10 * (.8 + n * .6);
            if (borde < ancho) return mezclar(crema, c, .12);
            const t = tonos[mejor];
            // los bordes de cada mancha son un poco más oscuros
            return mezclar(t, mezclar(t, [40, 18, 6], .35), 1 - suave(ancho, ancho * 4, borde));
        }
    };
}

function mechones(ctx, W, H, rnd, m) {
    const cantidad = m.cantidad ?? W * H / 18;
    const largo = (m.largo ?? .018) * H;
    const alfa = m.alfa ?? .07;
    ctx.lineCap = 'round';
    for (let i = 0; i < cantidad; i++) {
        const x = rnd() * W, y = rnd() * H;
        const l = largo * (.5 + rnd());
        const a = (rnd() - .5) * .6;
        ctx.strokeStyle = rnd() > .45 ? `rgba(255,240,215,${alfa})` : `rgba(20,10,0,${alfa * 1.3})`;
        ctx.lineWidth = .7 + rnd() * 1.1;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + Math.sin(a) * l, y + Math.cos(a) * l);
        ctx.stroke();
    }
}

/** Textura de suelo para la plataforma. */
export function suelo(semilla = 3) {
    const W = 1024, H = 1024;
    const rnd = aleatorio(semilla);
    const canvas = document.createElement('canvas');
    canvas.width = W; canvas.height = H;
    const ctx = canvas.getContext('2d');
    const g = ctx.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, W / 2);
    g.addColorStop(0, '#cdb88b');
    g.addColorStop(.62, '#bda473');
    g.addColorStop(.8, '#8eaa5c');
    g.addColorStop(1, '#6f8f45');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
    for (let i = 0; i < 26000; i++) {
        const x = rnd() * W, y = rnd() * H;
        const r = Math.hypot(x - W / 2, y - H / 2) / (W / 2);
        if (r > .74) {
            ctx.strokeStyle = rnd() > .5 ? 'rgba(60,90,30,.35)' : 'rgba(150,190,90,.3)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.lineTo(x + (rnd() - .5) * 3, y - 4 - rnd() * 6);
            ctx.stroke();
        } else {
            ctx.fillStyle = rnd() > .5 ? 'rgba(255,240,210,.18)' : 'rgba(90,60,30,.16)';
            ctx.fillRect(x, y, 1.5 + rnd() * 2, 1.5 + rnd() * 2);
        }
    }
    return canvas;
}
