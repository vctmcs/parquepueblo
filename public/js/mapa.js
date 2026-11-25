/* ==========================================================
   Mapa interactivo: dibuja los recintos del plano sobre la base
   SVG, maneja zoom/arrastre, filtros, búsqueda y el detalle.
   ========================================================== */
(async function () {
    const P = window.Parque;
    const NS = 'http://www.w3.org/2000/svg';
    const ANCHO = 610, ALTO = 1370;

    const svg = document.getElementById('mapa');
    const lienzo = document.getElementById('lienzo');
    const capaRecintos = document.getElementById('capa-recintos');
    const capaServicios = document.getElementById('capa-servicios');
    const listaRecintos = document.getElementById('lista-recintos');
    const listaServicios = document.getElementById('lista-servicios');
    const listaSinUbicar = document.getElementById('lista-sin-ubicar');
    const chips = document.getElementById('chips-mapa');
    const buscar = document.getElementById('buscar-mapa');
    const detalle = document.getElementById('detalle');
    const detalleCuerpo = document.getElementById('detalle-cuerpo');

    const COLORES = {
        felinos: ['#e2a55f', '#a8692a'],
        herbivoros: ['#c9dc9f', '#6c9649'],
        aves: ['#ecd36e', '#a88d1f'],
        primates: ['#a7c9e0', '#4f86ab'],
        carnivoros: ['#d3b08c', '#8a6239'],
        reptiles: ['#94c2a1', '#4c7f5a']
    };

    let especies, recintos, leyenda, servicios;
    try {
        [especies, recintos, leyenda, servicios] = await Promise.all([
            P.api('especies'), P.api('recintos'), P.api('leyenda'), P.api('servicios')
        ]);
    } catch (e) {
        listaRecintos.innerHTML = '<li>No se pudo cargar el mapa. Recarga la página.</li>';
        return;
    }

    const el = (tag, attrs = {}, padre) => {
        const n = document.createElementNS(NS, tag);
        for (const [k, v] of Object.entries(attrs)) n.setAttribute(k, v);
        if (padre) padre.appendChild(n);
        return n;
    };
    const normal = t => (t || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
    const catDe = esp => especies[esp[0]]?.categoria || 'herbivoros';
    const nombresDe = esp => esp.map(s => especies[s]?.nombre).join(' y ');
    const tiene3d = esp => esp.some(s => especies[s]?.modelo3d);

    /* ==========================================================
       Elementos seleccionables. Cada clave agrupa una o varias
       figuras del mapa y una fila de la lista:
         n-12      número de la leyenda (puede tener varias figuras)
         s-kiosko  servicio
    ========================================================== */
    const nodos = new Map();

    /* ---------- Figuras de los recintos ---------- */
    for (const r of recintos) {
        const [relleno, borde] = COLORES[catDe(r.especies)] || COLORES.herbivoros;
        const g = el('g', {
            class: 'recinto',
            tabindex: 0,
            role: 'button',
            'aria-label': `Recinto ${r.numero}: ${nombresDe(r.especies)}`,
            'data-clave': 'n-' + r.numero
        }, capaRecintos);

        const estilo = { class: 'recinto__forma', fill: relleno, stroke: borde };
        const textura = { class: 'recinto__textura', fill: 'url(#p-textura)' };
        let forma;
        if (r.forma === 'elipse') {
            const e = { cx: r.x + r.w / 2, cy: r.y + r.h / 2, rx: r.w / 2, ry: r.h / 2 };
            forma = el('ellipse', { ...e, ...estilo }, g);
            el('ellipse', { ...e, ...textura }, g);
        } else if (r.forma === 'path') {
            forma = el('path', { d: r.d, ...estilo }, g);
            el('path', { d: r.d, ...textura }, g);
        } else {
            const e = { x: r.x, y: r.y, width: r.w, height: r.h, rx: r.r ?? 14 };
            forma = el('rect', { ...e, ...estilo }, g);
            el('rect', { ...e, ...textura }, g);
        }

        // Etiqueta arriba del número (el plano pone el número abajo a la derecha)
        // En recintos chicos solo va el número, como en el plano
        const caja = forma.getBBox();
        if (caja.height >= 60) {
            const ly = Math.max(caja.y + 15, r.ny - 19);
            const etiqueta = el('text', { class: 'recinto__nombre', x: caja.x + caja.width / 2, y: ly }, g);
            etiqueta.textContent = r.corta || r.etiqueta.split(' y ')[0];
        }

        el('circle', { class: 'recinto__num-fondo', cx: r.nx, cy: r.ny, r: 12 }, g);
        el('text', { class: 'recinto__num', x: r.nx, y: r.ny }, g).textContent = r.numero;

        if (tiene3d(r.especies)) {
            const t = el('g', { class: 'recinto__icono3d', transform: `translate(${caja.x + 6} ${caja.y + 6})` }, g);
            el('rect', { width: 24, height: 14, rx: 4, fill: '#1c211d' }, t);
            el('text', { x: 12, y: 10.5, 'text-anchor': 'middle', 'font-size': 9, 'font-weight': 700, fill: '#fff', 'font-family': 'Outfit, sans-serif' }, t).textContent = '3D';
        }

        const clave = 'n-' + r.numero;
        if (!nodos.has(clave)) nodos.set(clave, { figuras: [], cajas: [] });
        nodos.get(clave).figuras.push(g);
        nodos.get(clave).cajas.push(caja);
    }

    /* ---------- Lista numerada (leyenda) ---------- */
    for (const L of leyenda) {
        const clave = 'n-' + L.numero;
        const [relleno] = COLORES[catDe(L.especies)] || COLORES.herbivoros;
        const veces = nodos.get(clave)?.figuras.length || 0;
        const li = document.createElement('li');
        li.dataset.clave = clave;
        li.innerHTML = `
            <button type="button">
                <span class="lista__num" style="background:${relleno}">${L.numero}</span>
                <span class="lista__texto">${P.escapar(L.etiqueta)}<small>${P.escapar(L.especies.map(s => especies[s]?.cientifico).join(' · '))}${veces > 1 ? ` · ${veces} lugares en el plano` : ''}</small></span>
                ${tiene3d(L.especies) ? '<span class="marca3d lista__3d">3D</span>' : ''}
            </button>`;
        (L.ubicado ? listaRecintos : listaSinUbicar).appendChild(li);

        const n = nodos.get(clave) || { figuras: [], cajas: [] };
        Object.assign(n, {
            li, tipo: 'recinto', datos: L, categorias: L.especies.map(s => especies[s]?.categoria),
            texto: normal(`${L.numero} ${L.etiqueta} ${L.especies.map(s => `${especies[s]?.nombre} ${especies[s]?.cientifico} ${especies[s]?.alias}`).join(' ')}`)
        });
        nodos.set(clave, n);
    }

    /* ---------- Servicios ---------- */
    for (const s of servicios) {
        const clave = 's-' + s.id;
        const ubicado = s.x !== null && s.y !== null;
        const n = { figuras: [], cajas: [], tipo: 'servicio', datos: s, categorias: ['servicios'], texto: normal(s.nombre + ' ' + s.descripcion) };

        if (ubicado) {
            const g = el('g', {
                class: 'servicio', tabindex: 0, role: 'button', 'aria-label': s.nombre,
                'data-clave': clave, transform: `translate(${s.x} ${s.y})`
            }, capaServicios);
            el('circle', { class: 'servicio__fondo', r: 15 }, g);
            el('use', { href: '#ico-' + s.icono, x: -9, y: -9, width: 18, height: 18 }, g);
            n.figuras.push(g);
            n.cajas.push({ x: s.x - 18, y: s.y - 18, width: 36, height: 36 });
        }

        const li = document.createElement('li');
        li.dataset.clave = clave;
        li.innerHTML = `
            <button type="button">
                <span class="lista__icono"><svg viewBox="0 0 24 24"><use href="#ico-${s.icono}"/></svg></span>
                <span class="lista__texto">${P.escapar(s.nombre)}</span>
            </button>`;
        (ubicado ? listaServicios : listaSinUbicar).appendChild(li);
        n.li = li;
        nodos.set(clave, n);
    }

    /* ---------- Vista: zoom y arrastre (viewBox) ---------- */
    const vista = { cx: ANCHO / 2, cy: ALTO / 2, s: 1 };
    let animacion = null;

    const medidas = () => {
        const r = lienzo.getBoundingClientRect();
        return { W: r.width || 1, H: r.height || 1 };
    };
    const escalaAjuste = () => {
        const { W, H } = medidas();
        return Math.min(W / ANCHO, H / ALTO) * 0.96;
    };
    function limitar() {
        const { W, H } = medidas();
        vista.s = Math.min(Math.max(vista.s, escalaAjuste() * 0.9), 5);
        const mw = W / vista.s / 2, mh = H / vista.s / 2;
        vista.cx = mw * 2 >= ANCHO ? ANCHO / 2 : Math.min(Math.max(vista.cx, mw - 20), ANCHO - mw + 20);
        vista.cy = mh * 2 >= ALTO ? ALTO / 2 : Math.min(Math.max(vista.cy, mh - 20), ALTO - mh + 20);
    }
    function aplicar() {
        limitar();
        const { W, H } = medidas();
        const w = W / vista.s, h = H / vista.s;
        svg.setAttribute('viewBox', `${vista.cx - w / 2} ${vista.cy - h / 2} ${w} ${h}`);
    }
    function vistaInicial() {
        const { W, H } = medidas();
        vista.cx = ANCHO / 2;
        if (W > H) {
            vista.s = Math.max(escalaAjuste(), Math.min(W / ANCHO, H / 880) * 0.96);
            vista.cy = 0;
        } else {
            vista.s = escalaAjuste();
            vista.cy = ALTO / 2;
        }
        aplicar();
    }
    function zoomEn(factor, px, py) {
        const { W, H } = medidas();
        px ??= W / 2; py ??= H / 2;
        const ux = vista.cx + (px - W / 2) / vista.s;
        const uy = vista.cy + (py - H / 2) / vista.s;
        vista.s *= factor;
        limitar();
        vista.cx = ux - (px - W / 2) / vista.s;
        vista.cy = uy - (py - H / 2) / vista.s;
        aplicar();
    }
    function animarA(cx, cy, s, duracion = 450) {
        cancelAnimationFrame(animacion);
        const ini = { ...vista };
        const t0 = performance.now();
        const paso = t => {
            const k = Math.min((t - t0) / duracion, 1);
            const e = 1 - Math.pow(1 - k, 3);
            vista.cx = ini.cx + (cx - ini.cx) * e;
            vista.cy = ini.cy + (cy - ini.cy) * e;
            vista.s = ini.s + (s - ini.s) * e;
            aplicar();
            if (k < 1) animacion = requestAnimationFrame(paso);
        };
        animacion = requestAnimationFrame(paso);
    }

    const punteros = new Map();
    let inicio = null, movido = false, objetivo = null, distanciaPellizco = 0;

    lienzo.addEventListener('pointerdown', ev => {
        punteros.set(ev.pointerId, { x: ev.clientX, y: ev.clientY });
        if (punteros.size === 1) {
            inicio = { x: ev.clientX, y: ev.clientY, cx: vista.cx, cy: vista.cy };
            movido = false;
            objetivo = ev.target.closest('.recinto, .servicio');
        } else if (punteros.size === 2) {
            const [a, b] = [...punteros.values()];
            distanciaPellizco = Math.hypot(a.x - b.x, a.y - b.y);
            movido = true;
        }
    });
    lienzo.addEventListener('pointermove', ev => {
        if (!punteros.has(ev.pointerId)) return;
        punteros.set(ev.pointerId, { x: ev.clientX, y: ev.clientY });
        if (punteros.size === 2) {
            const [a, b] = [...punteros.values()];
            const d = Math.hypot(a.x - b.x, a.y - b.y);
            const caja = lienzo.getBoundingClientRect();
            if (distanciaPellizco) zoomEn(d / distanciaPellizco, (a.x + b.x) / 2 - caja.left, (a.y + b.y) / 2 - caja.top);
            distanciaPellizco = d;
            return;
        }
        if (!inicio) return;
        const dx = ev.clientX - inicio.x, dy = ev.clientY - inicio.y;
        if (!movido && Math.hypot(dx, dy) > 5) {
            movido = true;
            lienzo.setPointerCapture(ev.pointerId);
            lienzo.classList.add('arrastrando');
            cancelAnimationFrame(animacion);
        }
        if (movido) {
            vista.cx = inicio.cx - dx / vista.s;
            vista.cy = inicio.cy - dy / vista.s;
            aplicar();
        }
    });
    const soltar = ev => {
        punteros.delete(ev.pointerId);
        if (punteros.size === 0) {
            if (!movido && objetivo && ev.type === 'pointerup') seleccionar(objetivo.dataset.clave);
            inicio = null;
            objetivo = null;
            lienzo.classList.remove('arrastrando');
        } else if (punteros.size === 1) {
            const [p] = [...punteros.values()];
            inicio = { x: p.x, y: p.y, cx: vista.cx, cy: vista.cy };
            distanciaPellizco = 0;
        }
    };
    lienzo.addEventListener('pointerup', soltar);
    lienzo.addEventListener('pointercancel', soltar);
    lienzo.addEventListener('wheel', ev => {
        ev.preventDefault();
        const caja = lienzo.getBoundingClientRect();
        zoomEn(ev.deltaY < 0 ? 1.15 : 1 / 1.15, ev.clientX - caja.left, ev.clientY - caja.top);
    }, { passive: false });

    document.querySelector('.mapa-controles').addEventListener('click', ev => {
        const b = ev.target.closest('button');
        if (!b) return;
        if (b.dataset.zoom === 'in') zoomEn(1.3);
        if (b.dataset.zoom === 'out') zoomEn(1 / 1.3);
        if (b.dataset.zoom === 'reset') animarA(ANCHO / 2, ALTO / 2, escalaAjuste());
    });
    svg.addEventListener('keydown', ev => {
        const g = ev.target.closest('.recinto, .servicio');
        if (g && (ev.key === 'Enter' || ev.key === ' ')) {
            ev.preventDefault();
            seleccionar(g.dataset.clave);
        }
    });
    window.addEventListener('resize', aplicar);

    /* ---------- Selección ---------- */
    let actual = null;
    let pulsos = [];
    const esEscritorio = () => window.matchMedia('(min-width: 981px)').matches;

    function marcar(clave, activo) {
        const n = nodos.get(clave);
        if (!n) return;
        n.figuras.forEach(f => f.classList.toggle('seleccionado', activo));
        n.li?.querySelector('button').classList.toggle('seleccionado', activo);
    }

    function seleccionar(clave) {
        const n = nodos.get(clave);
        if (!n) return;
        if (actual) marcar(actual, false);
        actual = clave;
        marcar(clave, true);

        const boton = n.li?.querySelector('button');
        if (boton && esEscritorio()) boton.scrollIntoView({ block: 'nearest' });

        pulsos.forEach(p => p.remove());
        pulsos = n.cajas.map(c => el('circle', {
            class: 'pulso', cx: c.x + c.width / 2, cy: c.y + c.height / 2, r: Math.max(c.width, c.height) / 2 + 6
        }, capaServicios));
        n.figuras.forEach(f => f.parentNode.appendChild(f));

        // Encuadra todas las figuras del número (p. ej. los tres recintos 25)
        if (n.cajas.length) {
            const x0 = Math.min(...n.cajas.map(c => c.x)), y0 = Math.min(...n.cajas.map(c => c.y));
            const x1 = Math.max(...n.cajas.map(c => c.x + c.width)), y1 = Math.max(...n.cajas.map(c => c.y + c.height));
            const { W, H } = medidas();
            const movil = !esEscritorio();
            const altoUtil = movil ? H * 0.42 : H;
            let s = Math.min(W / (x1 - x0 + 160), altoUtil / (y1 - y0 + 160));
            s = Math.min(Math.max(s, escalaAjuste()), 2.4);
            if (movil) lienzo.parentElement.scrollIntoView({ block: 'start', behavior: 'smooth' });
            animarA((x0 + x1) / 2, (y0 + y1) / 2 + (movil ? H * 0.28 / s : 0), s);
        }

        detalleCuerpo.innerHTML = n.tipo === 'recinto' ? htmlRecinto(n) : htmlServicio(n);
        detalle.hidden = false;
        detalle.scrollTop = 0;

        const url = new URL(location.href);
        url.searchParams.delete('recinto');
        url.searchParams.delete('servicio');
        url.searchParams.set(n.tipo, n.tipo === 'recinto' ? n.datos.numero : n.datos.id);
        history.replaceState(null, '', url);
    }

    function cerrarDetalle() {
        detalle.hidden = true;
        if (actual) marcar(actual, false);
        actual = null;
        pulsos.forEach(p => p.remove());
        pulsos = [];
        const url = new URL(location.href);
        url.searchParams.delete('recinto');
        url.searchParams.delete('servicio');
        history.replaceState(null, '', url);
    }

    function htmlRecinto(n) {
        const L = n.datos;
        const aviso = !n.figuras.length
            ? '<p class="detalle__aviso">Este número aparece en la lista del plano, pero el plano no marca su ubicación.</p>'
            : n.figuras.length > 1
                ? `<p class="detalle__aviso">El plano marca el número ${L.numero} en ${n.figuras.length} lugares; quedan resaltados en el mapa.</p>`
                : '';
        const fichas = L.especies.map(slug => {
            const recs = leyenda.filter(x => x.especies.includes(slug));
            return Ficha.html(slug, especies[slug], recs, { ocultarMapa: true });
        }).join('');
        return `<div class="detalle__recinto">Recinto ${L.numero}</div>${aviso}${fichas}`;
    }

    function htmlServicio(n) {
        const s = n.datos;
        return `
            <div class="detalle__servicio-icono"><svg viewBox="0 0 24 24"><use href="#ico-${s.icono}"/></svg></div>
            <div class="detalle__recinto">Servicio</div>
            ${n.figuras.length ? '' : '<p class="detalle__aviso">Aparece en la leyenda del plano, pero el plano no marca su ubicación.</p>'}
            <h2>${P.escapar(s.nombre)}</h2>
            <p>${P.escapar(s.descripcion)}</p>`;
    }

    document.getElementById('cerrar-detalle').addEventListener('click', cerrarDetalle);
    document.addEventListener('keydown', ev => { if (ev.key === 'Escape' && !detalle.hidden) cerrarDetalle(); });
    [listaRecintos, listaServicios, listaSinUbicar].forEach(lista => lista.addEventListener('click', ev => {
        const li = ev.target.closest('li[data-clave]');
        if (li) seleccionar(li.dataset.clave);
    }));

    /* ---------- Filtros y búsqueda ---------- */
    let filtro = 'todos';
    const cats = [
        ['todos', 'Todos', 'var(--tinta)'],
        ...Object.entries(Ficha.categorias).map(([id, c]) => [id, c.nombre, COLORES[id][0]]),
        ['servicios', 'Servicios', '#fffdf8']
    ];
    chips.innerHTML = cats.map(([id, nombre, color]) =>
        `<button class="chip" type="button" data-cat="${id}" aria-pressed="${id === 'todos'}"><i style="background:${color};border:1px solid #0002"></i>${nombre}</button>`
    ).join('');
    chips.addEventListener('click', ev => {
        const b = ev.target.closest('.chip');
        if (!b) return;
        filtro = b.dataset.cat;
        chips.querySelectorAll('.chip').forEach(c => c.setAttribute('aria-pressed', String(c === b)));
        filtrar();
    });
    buscar.addEventListener('input', filtrar);

    function filtrar() {
        const q = normal(buscar.value.trim());
        for (const n of nodos.values()) {
            const visible = (filtro === 'todos' || n.categorias.includes(filtro)) && (!q || n.texto.includes(q));
            n.figuras.forEach(f => f.classList.toggle('atenuado', !visible));
            n.li?.classList.toggle('oculto', !visible);
        }
    }

    /* ---------- Arranque ---------- */
    vistaInicial();
    const params = new URLSearchParams(location.search);
    if (params.has('recinto')) seleccionar('n-' + params.get('recinto'));
    else if (params.has('servicio')) seleccionar('s-' + params.get('servicio'));
})();
