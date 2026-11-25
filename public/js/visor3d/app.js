/* ==========================================================
   Página "Animales en 3D": lista de especies, visor y ficha.
   ========================================================== */
import { Escena, cargarGLB } from './escena.js';
import { crearCuadrupedo } from './cuadrupedo.js';
import { ESPECIES_3D } from './especies3d.js';

const P = window.Parque;
const $ = s => document.querySelector(s);

const lista = $('#lista-3d');
const ficha = $('#ficha-3d');
const carga = $('#carga-3d');
const escenario = $('#escenario');

const escena = new Escena(escenario);
window.visor3d = escena; // útil para depurar desde la consola
const cache = new Map();
let modelos = [], especies = {}, actual = null;

try {
    [modelos, especies] = await Promise.all([P.api('modelos'), P.api('especies')]);
} catch (e) {
    lista.innerHTML = '<p>No se pudieron cargar los modelos.</p>';
    throw e;
}

/* ---------- Lista de especies ---------- */
lista.innerHTML = modelos.map(m => `
    <button class="especie3d" type="button" data-slug="${m.slug}" aria-pressed="false">
        <span class="especie3d__muestra especie3d__muestra--${m.tipo}" aria-hidden="true"></span>
        <span class="especie3d__texto">
            <strong>${P.escapar(m.nombre)}</strong>
            <em>${P.escapar(m.cientifico)}</em>
        </span>
        ${m.archivo ? '<span class="etiqueta">GLB</span>' : ''}
    </button>`).join('');

lista.addEventListener('click', ev => {
    const b = ev.target.closest('.especie3d');
    if (b) seleccionar(b.dataset.slug);
});

/* ---------- Controles del visor ---------- */
const grupos = document.querySelectorAll('[data-control]');
grupos.forEach(g => g.addEventListener('click', ev => {
    const b = ev.target.closest('button[data-valor]');
    if (!b) return;
    g.querySelectorAll('button').forEach(x => x.setAttribute('aria-pressed', String(x === b)));
    const valor = b.dataset.valor;
    switch (g.dataset.control) {
        case 'modo': escena.modo = valor; break;
        case 'acabado': escena.ponerArcilla(valor === 'arcilla'); break;
        case 'luz': escena.aplicarIluminacion(valor); break;
    }
}));

$('#girar').addEventListener('click', ev => {
    const b = ev.currentTarget;
    const activo = b.getAttribute('aria-pressed') !== 'true';
    b.setAttribute('aria-pressed', String(activo));
    escena.controles.autoRotate = activo;
});
$('#encuadrar').addEventListener('click', () => escena.encuadrar());
$('#captura').addEventListener('click', () => {
    const a = document.createElement('a');
    a.href = escena.capturar();
    a.download = `parque-del-pueblo-${actual || 'animal'}.png`;
    a.click();
});
$('#completa').addEventListener('click', () => {
    const zona = $('.visor');
    if (document.fullscreenElement) document.exitFullscreen();
    else zona.requestFullscreen?.();
});

/* ---------- Selección ---------- */
async function seleccionar(slug) {
    const m = modelos.find(x => x.slug === slug);
    if (!m || slug === actual) return;
    actual = slug;

    lista.querySelectorAll('.especie3d').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.slug === slug)));
    pintarFicha(slug, m);
    carga.hidden = false;

    // deja que el navegador pinte el indicador antes de generar texturas
    await new Promise(r => requestAnimationFrame(() => setTimeout(r, 30)));

    try {
        let modelo = cache.get(slug);
        if (!modelo) {
            if (m.archivo) {
                modelo = await cargarGLB(m.archivo);
            } else {
                const cfg = ESPECIES_3D[m.tipo];
                if (!cfg) throw new Error('Sin configuración 3D para ' + m.tipo);
                modelo = crearCuadrupedo(cfg);
            }
            cache.set(slug, modelo);
        }
        if (actual === slug) escena.mostrar(modelo);
    } catch (e) {
        console.error(e);
        ficha.insertAdjacentHTML('afterbegin', '<p class="aviso-error">No se pudo cargar este modelo.</p>');
    } finally {
        if (actual === slug) carga.hidden = true;
    }

    const url = new URL(location.href);
    url.searchParams.set('animal', slug);
    history.replaceState(null, '', url);
}

function pintarFicha(slug, m) {
    const e = especies[slug];
    const cfg = ESPECIES_3D[m.tipo];
    const rasgos = cfg?.rasgos || [];
    ficha.innerHTML = `
        <span class="etiqueta uicn uicn--${e.uicn}">${P.escapar(P.uicn[e.uicn] || e.uicn)}</span>
        <h2>${P.escapar(e.nombre)}</h2>
        <p class="ficha3d__cientifico">${P.escapar(e.cientifico)} · ${P.escapar(e.alias)}</p>
        <p>${P.escapar(e.descripcion)}</p>

        ${rasgos.length ? `
        <h3>Cómo reconocerlo en el modelo</h3>
        <ul class="ficha3d__rasgos">${rasgos.map(r => `<li>${P.escapar(r)}</li>`).join('')}</ul>` : ''}

        <dl class="ficha3d__datos">
            <div><dt>Dieta</dt><dd>${P.escapar(e.dieta)}</dd></div>
            <div><dt>Origen</dt><dd>${P.escapar(e.origen)}</dd></div>
            <div><dt>Tamaño</dt><dd>${P.escapar(e.peso)}</dd></div>
            <div><dt>Longevidad</dt><dd>${P.escapar(e.longevidad)}</dd></div>
        </dl>
        <div class="ficha3d__curiosidad"><strong>Dato curioso</strong>${P.escapar(e.curiosidad)}</div>
        <a class="boton boton--chico" href="${P.url('/mapa')}?animal=${encodeURIComponent(slug)}" data-mapa>Ver dónde está en el mapa</a>
        ${m.archivo ? '' : '<p class="ficha3d__nota">Modelo y pelaje generados por código con Three.js.</p>'}
    `;
    // enlace al primer recinto del animal
    P.api('recintos').then(rs => {
        const r = rs.find(x => x.especies.includes(slug));
        const a = ficha.querySelector('[data-mapa]');
        if (r && a) a.href = P.url('/mapa') + '?recinto=' + r.numero;
    }).catch(() => {});
}

/* ---------- Arranque ---------- */
const pedido = new URLSearchParams(location.search).get('animal');
seleccionar(modelos.some(m => m.slug === pedido) ? pedido : modelos[0]?.slug);
