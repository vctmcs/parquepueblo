/* Curiosidades: tarjetas que se voltean y trivia generada con los datos */
(async function () {
    const P = window.Parque;
    const $ = s => document.querySelector(s);
    const esc = P.escapar;

    let especies, leyenda;
    try {
        [especies, leyenda] = await Promise.all([P.api('especies'), P.api('leyenda')]);
    } catch (e) {
        $('#tarjetas').innerHTML = '<p>No se pudieron cargar las curiosidades.</p>';
        return;
    }

    // Solo especies individuales (sin la colección de aves)
    const lista = Object.entries(especies)
        .filter(([, e]) => e.cientifico !== 'Varias especies')
        .map(([slug, e]) => ({ slug, ...e }));

    const barajar = a => {
        const b = [...a];
        for (let i = b.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [b[i], b[j]] = [b[j], b[i]];
        }
        return b;
    };

    /* ==========================================================
       Pestañas
    ========================================================== */
    const tabs = [$('#tab-tarjetas'), $('#tab-trivia')];
    tabs.forEach(t => t.addEventListener('click', () => activar(t)));
    tabs.forEach((t, i) => t.addEventListener('keydown', ev => {
        if (ev.key === 'ArrowRight' || ev.key === 'ArrowLeft') {
            const otro = tabs[(i + 1) % 2];
            activar(otro);
            otro.focus();
        }
    }));
    function activar(tab) {
        tabs.forEach(t => {
            const activo = t === tab;
            t.setAttribute('aria-selected', String(activo));
            t.tabIndex = activo ? 0 : -1;
            document.getElementById(t.getAttribute('aria-controls')).hidden = !activo;
        });
        if (tab.id === 'tab-trivia' && !trivia.preguntas.length) iniciarTrivia();
    }

    /* ==========================================================
       Tarjetas
    ========================================================== */
    const cont = $('#tarjetas');
    const chips = $('#chips');
    let filtro = 'todos';

    const cats = [['todos', { nombre: 'Todos', color: 'var(--tinta)' }], ...Object.entries(Ficha.categorias)];
    chips.innerHTML = cats.map(([id, c]) =>
        `<button class="chip" type="button" data-cat="${id}" aria-pressed="${id === 'todos'}"><i style="background:${c.color}"></i>${c.nombre}</button>`
    ).join('');
    chips.addEventListener('click', ev => {
        const b = ev.target.closest('.chip');
        if (!b) return;
        filtro = b.dataset.cat;
        chips.querySelectorAll('.chip').forEach(c => c.setAttribute('aria-pressed', String(c === b)));
        pintarTarjetas();
    });

    function pintarTarjetas() {
        const visibles = lista.filter(e => filtro === 'todos' || e.categoria === filtro);
        cont.innerHTML = visibles.map(e => {
            const color = Ficha.categorias[e.categoria]?.color || 'var(--arena-2)';
            return `
            <div class="tarjeta-giro" style="--color:${color}">
                <button class="tarjeta-giro__interior" type="button" aria-pressed="false" data-slug="${e.slug}"
                        aria-label="Dato curioso de ${esc(e.nombre)}. Toca para voltear.">
                    <span class="tarjeta-giro__cara tarjeta-giro__frente">
                        <span class="tarjeta-giro__pregunta">¿Sabías que...?</span>
                        <strong>${esc(e.nombre)}</strong>
                        <em>${esc(e.cientifico)}</em>
                        <span class="tarjeta-giro__pista">Toca para voltear</span>
                    </span>
                    <span class="tarjeta-giro__cara tarjeta-giro__reverso">
                        <span>${esc(e.curiosidad)}</span>
                        <span class="tarjeta-giro__mas" data-ficha="${e.slug}">Ver ficha</span>
                    </span>
                </button>
            </div>`;
        }).join('');
    }

    cont.addEventListener('click', ev => {
        const mas = ev.target.closest('[data-ficha]');
        if (mas) {
            ev.stopPropagation();
            abrirFicha(mas.dataset.ficha);
            return;
        }
        const t = ev.target.closest('.tarjeta-giro__interior');
        if (!t) return;
        t.setAttribute('aria-pressed', String(t.getAttribute('aria-pressed') !== 'true'));
    });

    $('#azar').addEventListener('click', () => {
        const tarjetas = [...cont.querySelectorAll('.tarjeta-giro__interior')];
        if (!tarjetas.length) return;
        tarjetas.forEach(t => t.setAttribute('aria-pressed', 'false'));
        const t = tarjetas[Math.floor(Math.random() * tarjetas.length)];
        t.scrollIntoView({ block: 'center', behavior: 'smooth' });
        setTimeout(() => t.setAttribute('aria-pressed', 'true'), 350);
        t.closest('.tarjeta-giro').classList.add('destacada');
        setTimeout(() => t.closest('.tarjeta-giro').classList.remove('destacada'), 1800);
    });

    const dialogo = $('#ficha');
    function abrirFicha(slug) {
        const recs = leyenda.filter(r => r.especies.includes(slug));
        $('#ficha-cuerpo').innerHTML = Ficha.html(slug, especies[slug], recs);
        dialogo.showModal();
    }
    dialogo.addEventListener('click', ev => { if (ev.target === dialogo) dialogo.close(); });

    /* ==========================================================
       Trivia: "¿De qué animal es este dato?"
    ========================================================== */
    const trivia = { preguntas: [], actual: 0, aciertos: 0 };
    const caja = $('#trivia');
    const TOTAL = 10;

    // Oculta en el texto las palabras que delatan la respuesta
    function ocultarNombre(texto, e) {
        const palabras = `${e.nombre} ${e.alias}`.split(/\s+/).filter(p => p.length >= 4);
        let r = texto;
        for (const p of palabras) {
            const raiz = p.slice(0, Math.max(4, p.length - 2)).normalize('NFD').replace(/[̀-ͯ]/g, '');
            const re = new RegExp(`\\b[\\wáéíóúñ]*${raiz.split('').map(c => `[${c}${acento(c)}]`).join('')}[\\wáéíóúñ]*`, 'gi');
            r = r.replace(re, '____');
        }
        return r;
    }
    function acento(c) {
        return { a: 'á', e: 'é', i: 'í', o: 'ó', u: 'ú', n: 'ñ' }[c.toLowerCase()] || '';
    }

    function iniciarTrivia() {
        trivia.preguntas = barajar(lista).slice(0, TOTAL).map(correcta => {
            // Distractores: de preferencia del mismo grupo, para que no sea tan obvio
            const mismos = barajar(lista.filter(x => x.slug !== correcta.slug && x.categoria === correcta.categoria));
            const otros = barajar(lista.filter(x => x.slug !== correcta.slug && x.categoria !== correcta.categoria));
            const opciones = barajar([correcta, ...[...mismos, ...otros].slice(0, 3)]);
            return { correcta, opciones, texto: ocultarNombre(correcta.curiosidad, correcta) };
        });
        trivia.actual = 0;
        trivia.aciertos = 0;
        pintarPregunta();
    }

    function pintarPregunta() {
        const q = trivia.preguntas[trivia.actual];
        caja.innerHTML = `
            <div class="trivia__progreso">
                <span>Pregunta ${trivia.actual + 1} de ${TOTAL}</span>
                <span>${trivia.aciertos} ${trivia.aciertos === 1 ? 'acierto' : 'aciertos'}</span>
            </div>
            <div class="barra"><span class="barra__relleno" style="--avance:${(trivia.actual / TOTAL) * 100}%"></span></div>
            <p class="trivia__instruccion">¿De qué animal es este dato?</p>
            <blockquote class="trivia__dato">${esc(q.texto)}</blockquote>
            <div class="trivia__opciones">
                ${q.opciones.map(o => `<button type="button" class="opcion" data-slug="${o.slug}">${esc(o.nombre)}</button>`).join('')}
            </div>
            <div class="trivia__retro" aria-live="polite"></div>`;
        caja.querySelector('.opcion').focus({ preventScroll: true });
    }

    caja.addEventListener('click', ev => {
        const op = ev.target.closest('.opcion');
        if (op && !op.disabled) return responder(op);
        if (ev.target.closest('#siguiente')) {
            trivia.actual++;
            trivia.actual < TOTAL ? pintarPregunta() : pintarFinal();
        }
        if (ev.target.closest('#otra-vez')) iniciarTrivia();
    });

    function responder(op) {
        const q = trivia.preguntas[trivia.actual];
        const bien = op.dataset.slug === q.correcta.slug;
        if (bien) trivia.aciertos++;
        caja.querySelectorAll('.opcion').forEach(b => {
            b.disabled = true;
            if (b.dataset.slug === q.correcta.slug) b.classList.add('correcta');
            else if (b === op) b.classList.add('incorrecta');
        });
        caja.querySelector('.trivia__retro').innerHTML = `
            <p><strong>${bien ? '¡Correcto!' : 'Casi.'}</strong> Es el ${esc(q.correcta.nombre.toLowerCase())}: ${esc(q.correcta.curiosidad)}</p>
            <button class="boton" type="button" id="siguiente">${trivia.actual + 1 < TOTAL ? 'Siguiente' : 'Ver resultado'}</button>`;
        caja.querySelector('#siguiente').focus({ preventScroll: true });
    }

    function pintarFinal() {
        const a = trivia.aciertos;
        const frase = a >= 9 ? '¡Eres experto en el parque!' : a >= 6 ? '¡Muy bien! Conoces a muchos de sus habitantes.' : a >= 3 ? 'Nada mal. Date una vuelta por las tarjetas y vuelve a intentarlo.' : 'Es un buen momento para recorrer las tarjetas.';
        caja.innerHTML = `
            <div class="trivia__final">
                <span class="etiqueta">Resultado</span>
                <p class="trivia__marcador"><strong>${a}</strong> / ${TOTAL}</p>
                <p>${frase}</p>
                <div class="trivia__acciones">
                    <button class="boton" type="button" id="otra-vez">Jugar otra vez</button>
                    <a class="boton boton--claro" href="${P.url('/mapa')}">Buscarlos en el mapa</a>
                </div>
            </div>`;
    }

    pintarTarjetas();
})();
