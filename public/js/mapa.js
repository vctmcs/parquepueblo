/* ==========================================================
   Mapa interactivo: pinta recintos y servicios sobre el SVG,
   maneja zoom/arrastre, filtros, búsqueda y el panel de detalle.
   ========================================================== */
(async function () {
    const P = window.Parque;
    const NS = 'http://www.w3.org/2000/svg';
    const ANCHO = 600, ALTO = 1360;

    const svg = document.getElementById('mapa');
    const lienzo = document.getElementById('lienzo');
    const capaRecintos = document.getElementById('capa-recintos');
    const capaServicios = document.getElementById('capa-servicios');
    const capaArboles = document.getElementById('capa-arboles');
    const listaRecintos = document.getElementById('lista-recintos');
    const listaServicios = document.getElementById('lista-servicios');
    const chips = document.getElementById('chips-mapa');
    const buscar = document.getElementById('buscar-mapa');
    const detalle = document.getElementById('detalle');
    const detalleCuerpo = document.getElementById('detalle-cuerpo');

    const COLORES = {
        felinos: ['#e2a55f', '#a8692a'],
        herbivoros: ['#b5d38f', '#6c9649'],
        aves: ['#ecd36e', '#a88d1f'],
        primates: ['#a7c9e0', '#4f86ab'],
        carnivoros: ['#d3b08c', '#8a6239'],
        reptiles: ['#94c2a1', '#4c7f5a']
    };

    let especies, recintos, servicios;
    try {
        [especies, recintos, servicios] = await Promise.all([
            P.api('especies'), P.api('recintos'), P.api('servicios')
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
    const categoriaDe = r => especies[r.especies[0]]?.categoria || 'herbivoros';
    const tiene3d = r => r.especies.some(s => especies[s]?.modelo3d);
    const normal = t => (t || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

    /* ---------- Árboles decorativos ---------- */
    const arboles = [
        [372, 40, 9], [380, 150, 8], [386, 300, 7], [140, 500, 8], [144, 860, 9],
        [160, 925, 12], [332, 925, 11], [120, 1150, 10], [360, 1130, 12], [110, 1310, 11],
        [215, 1305, 10], [300, 1300, 9], [480, 1225, 12], [560, 1215, 10], [500, 1295, 9],
        [180, 960, 7], [300, 960, 7], [175, 1125, 8], [305, 1120, 8], [42, 1300, 9],
        [585, 1010, 7], [420, 1090, 7], [520, 1105, 7], [370, 1030, 8]
    ];
    for (const [x, y, r] of arboles) {
        const g = el('g', { transform: `translate(${x} ${y})` }, capaArboles);
        el('circle', { r: r + 1.5, fill: '#3f6e2e', opacity: .35, cy: 2 }, g);
        el('circle', { r, fill: '#4f8a39' }, g);
        el('circle', { r: r * .55, cx: -r * .25, cy: -r * .25, fill: '#6aa74c' }, g);
    }

    /* ---------- Recintos ---------- */
    const nodos = new Map(); // clave "r-18" / "s-banos-1" -> {g, boton}

    for (const r of recintos) {
        const cat = categoriaDe(r);
        const [relleno, borde] = COLORES[cat] || COLORES.herbivoros;
        const nombres = r.especies.map(s => especies[s]?.nombre).join(' y ');

        const g = el('g', {
            class: 'recinto',
            tabindex: 0,
            role: 'button',
            'aria-label': `Recinto ${r.numero}: ${nombres}`,
            'data-clave': 'r-' + r.numero
        }, capaRecintos);

        const comun = { class: 'recinto__forma', fill: relleno, stroke: borde };
        const textura = { class: 'recinto__textura', fill: 'url(#p-textura)' };
        if (r.forma === 'elipse') {
            const e = { cx: r.x + r.w / 2, cy: r.y + r.h / 2, rx: r.w / 2, ry: r.h / 2 };
            el('ellipse', { ...e, ...comun }, g);
            el('ellipse', { ...e, ...textura }, g);
        } else {
            const e = { x: r.x, y: r.y, width: r.w, height: r.h, rx: 14 };
            el('rect', { ...e, ...comun }, g);
            el('rect', { ...e, ...textura }, g);
        }

        const elipse = r.forma === 'elipse';
        const nx = elipse ? r.x + r.w / 2 : r.x + 17;
        const ny = elipse ? r.y + r.h / 2 - 12 : r.y + 17;
        el('circle', { class: 'recinto__num-fondo', cx: nx, cy: ny, r: 12 }, g);
        el('text', { class: 'recinto__num', x: nx, y: ny }, g).textContent = r.numero;

        const etiqueta = el('text', {
            class: 'recinto__nombre',
            x: r.x + r.w / 2,
            y: elipse ? r.y + r.h / 2 + 14 : r.y + r.h - 11
        }, g);
        etiqueta.textContent = r.etiqueta;

        if (tiene3d(r)) {
            const t = el('g', { class: 'recinto__icono3d', transform: `translate(${r.x + r.w - (elipse ? r.w / 2 + 14 : 30)} ${elipse ? r.y + 14 : r.y + 8})` }, g);
            el('rect', { width: 26, height: 15, rx: 4, fill: '#1c211d' }, t);
            el('text', { x: 13, y: 11, 'text-anchor': 'middle', 'font-size': 9.5, 'font-weight': 700, fill: '#fff', 'font-family': 'Outfit, sans-serif' }, t).textContent = '3D';
        }

        // Elemento de la lista lateral
        const li = document.createElement('li');
        li.dataset.clave = 'r-' + r.numero;
        li.innerHTML = `
            <button type="button">
                <span class="lista__num" style="background:${relleno}">${r.numero}</span>
                <span class="lista__texto">${P.escapar(nombres)}<small>${P.escapar(r.especies.map(s => especies[s]?.cientifico).join(' · '))}</small></span>
                ${tiene3d(r) ? '<span class="marca3d lista__3d">3D</span>' : ''}
            </button>`;
        listaRecintos.appendChild(li);

        nodos.set('r-' + r.numero, {
            g, li, tipo: 'recinto', datos: r, categorias: r.especies.map(s => especies[s]?.categoria),
            texto: normal(`${r.numero} ${r.etiqueta} ${nombres} ${r.especies.map(s => especies[s]?.cientifico + ' ' + especies[s]?.alias).join(' ')}`),
            centro: [r.x + r.w / 2, r.y + r.h / 2], radio: Math.max(r.w, r.h) / 2 + 6
        });
    }

    /* ---------- Servicios ---------- */
    for (const s of servicios) {
        const g = el('g', {
            class: 'servicio',
            tabindex: 0,
            role: 'button',
            'aria-label': s.nombre,
            'data-clave': 's-' + s.id,
            transform: `translate(${s.x} ${s.y})`
        }, capaServicios);
        el('circle', { class: 'servicio__fondo', r: 15 }, g);
        el('use', { href: '#ico-' + s.icono, x: -9, y: -9, width: 18, height: 18 }, g);

        const li = document.createElement('li');
        li.dataset.clave = 's-' + s.id;
        li.innerHTML = `
            <button type="button">
                <span class="lista__icono"><svg viewBox="0 0 24 24"><use href="#ico-${s.icono}"/></svg></span>
                <span class="lista__texto">${P.escapar(s.nombre)}</span>
            </button>`;
        listaServicios.appendChild(li);

        nodos.set('s-' + s.id, {
            g, li, tipo: 'servicio', datos: s, categorias: ['servicios'],
            texto: normal(s.nombre + ' ' + s.descripcion), centro: [s.x, s.y], radio: 20
        });
    }

    /* ---------- Vista: zoom y arrastre ---------- */
    const vista = { cx: ANCHO / 2, cy: ALTO / 2, s: 1 };
    let animacion = null;

    function medidas() {
        const r = lienzo.getBoundingClientRect();
        return { W: r.width || 1, H: r.height || 1 };
    }
    function escalaAjuste() {
        const { W, H } = medidas();
        return Math.min(W / ANCHO, H / ALTO) * 0.96;
    }
    function limitar() {
        const { W, H } = medidas();
        const min = escalaAjuste() * 0.9;
        vista.s = Math.min(Math.max(vista.s, min), 5);
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
        const ajuste = escalaAjuste();
        if (W > H) {
            // Pantallas anchas: mostrar la mitad norte con buen tamaño de texto
            vista.s = Math.max(ajuste, Math.min(W / ANCHO, H / 860) * 0.96);
            vista.cx = ANCHO / 2;
            vista.cy = 0;
        } else {
            vista.s = ajuste;
            vista.cx = ANCHO / 2;
            vista.cy = ALTO / 2;
        }
        aplicar();
    }
    function verTodo() {
        animarA(ANCHO / 2, ALTO / 2, escalaAjuste());
    }
    function zoomEn(factor, px, py) {
        // px, py: punto en pantalla (relativo al lienzo) que se queda fijo
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

    // Punteros (mouse, touch y lápiz) con soporte de pellizco
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
        if (b.dataset.zoom === 'reset') verTodo();
    });

    // Teclado sobre recintos y servicios
    svg.addEventListener('keydown', ev => {
        const g = ev.target.closest('.recinto, .servicio');
        if (g && (ev.key === 'Enter' || ev.key === ' ')) {
            ev.preventDefault();
            seleccionar(g.dataset.clave);
        }
    });

    window.addEventListener('resize', aplicar);

    /* ---------- Selección y detalle ---------- */
    let actual = null;
    let pulso = null;

    function seleccionar(clave, { mover = true } = {}) {
        const n = nodos.get(clave);
        if (!n) return;

        if (actual) {
            const prev = nodos.get(actual);
            prev.g.classList.remove('seleccionado');
            prev.li.querySelector('button').classList.remove('seleccionado');
        }
        actual = clave;
        n.g.classList.add('seleccionado');
        const boton = n.li.querySelector('button');
        boton.classList.add('seleccionado');
        // Solo en escritorio la lista tiene su propio scroll; en móvil moveríamos la página
        if (window.matchMedia('(min-width: 981px)').matches) boton.scrollIntoView({ block: 'nearest' });

        // Anillo animado
        pulso?.remove();
        pulso = el('circle', { class: 'pulso', cx: n.centro[0], cy: n.centro[1], r: n.radio }, capaServicios);

        // Mueve el contenido al frente para que no lo tapen los vecinos
        n.g.parentNode.appendChild(n.g);

        if (mover) {
            const objetivoS = Math.max(vista.s, Math.min(escalaAjuste() * 2.4, 2.2));
            // En móvil la hoja de detalle tapa la parte baja: subimos el recinto.
            // En escritorio el detalle tapa el panel derecho, no el mapa.
            const movil = !window.matchMedia('(min-width: 981px)').matches;
            const { H } = medidas();
            if (movil) lienzo.parentElement.scrollIntoView({ block: 'start', behavior: 'smooth' });
            animarA(n.centro[0], n.centro[1] + (movil ? H * 0.3 / objetivoS : 0), objetivoS);
        }

        detalleCuerpo.innerHTML = n.tipo === 'recinto' ? htmlRecinto(n.datos) : htmlServicio(n.datos);
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
        if (actual) {
            const n = nodos.get(actual);
            n.g.classList.remove('seleccionado');
            n.li.querySelector('button').classList.remove('seleccionado');
        }
        actual = null;
        pulso?.remove();
        const url = new URL(location.href);
        url.searchParams.delete('recinto');
        url.searchParams.delete('servicio');
        history.replaceState(null, '', url);
    }

    function htmlRecinto(r) {
        const fichas = r.especies.map(slug => {
            const recs = recintos.filter(x => x.especies.includes(slug));
            return Ficha.html(slug, especies[slug], recs, { ocultarMapa: true });
        }).join('');
        return `<div class="detalle__recinto">Recinto ${r.numero}</div>${fichas}`;
    }

    function htmlServicio(s) {
        return `
            <div class="detalle__servicio-icono"><svg viewBox="0 0 24 24"><use href="#ico-${s.icono}"/></svg></div>
            <div class="detalle__recinto">Servicio</div>
            <h2>${P.escapar(s.nombre)}</h2>
            <p>${P.escapar(s.descripcion)}</p>`;
    }

    document.getElementById('cerrar-detalle').addEventListener('click', cerrarDetalle);
    document.addEventListener('keydown', ev => { if (ev.key === 'Escape' && !detalle.hidden) cerrarDetalle(); });

    [listaRecintos, listaServicios].forEach(lista => lista.addEventListener('click', ev => {
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
            const okCat = filtro === 'todos' || n.categorias.includes(filtro);
            const okTxt = !q || n.texto.includes(q);
            const visible = okCat && okTxt;
            n.g.classList.toggle('atenuado', !visible);
            n.li.classList.toggle('oculto', !visible);
        }
    }

    /* ---------- Arranque ---------- */
    vistaInicial();
    const params = new URLSearchParams(location.search);
    if (params.has('recinto')) seleccionar('r-' + params.get('recinto'));
    else if (params.has('servicio')) seleccionar('s-' + params.get('servicio'));
})();
