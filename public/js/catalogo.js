/* Catálogo: búsqueda, filtro por grupo y ficha en un <dialog> */
(async function () {
    const P = window.Parque;
    const rejilla = document.getElementById('rejilla');
    const chips = document.getElementById('chips');
    const buscar = document.getElementById('buscar');
    const conteo = document.getElementById('conteo');
    const dialogo = document.getElementById('ficha');
    const cuerpo = document.getElementById('ficha-cuerpo');

    let especies, recintos;
    try {
        [especies, recintos] = await Promise.all([P.api('especies'), P.api('leyenda')]);
    } catch (e) {
        rejilla.innerHTML = '<p>No se pudieron cargar los animales. Intenta recargar la página.</p>';
        return;
    }

    const recintosDe = slug => recintos.filter(r => r.especies.includes(slug));
    const normal = t => (t || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

    let filtro = 'todos';

    // Chips de categorías
    const cats = [['todos', { nombre: 'Todos', color: 'var(--tinta)' }], ...Object.entries(Ficha.categorias)];
    chips.innerHTML = cats.map(([id, c]) =>
        `<button class="chip" type="button" data-cat="${id}" aria-pressed="${id === 'todos'}"><i style="background:${c.color}"></i>${c.nombre}</button>`
    ).join('');

    chips.addEventListener('click', ev => {
        const b = ev.target.closest('.chip');
        if (!b) return;
        filtro = b.dataset.cat;
        chips.querySelectorAll('.chip').forEach(c => c.setAttribute('aria-pressed', String(c === b)));
        pintar();
    });

    buscar.addEventListener('input', pintar);

    function pintar() {
        const q = normal(buscar.value.trim());
        const lista = Object.entries(especies).filter(([slug, e]) => {
            if (filtro !== 'todos' && e.categoria !== filtro) return false;
            if (!q) return true;
            return normal(`${e.nombre} ${e.alias} ${e.cientifico}`).includes(q);
        });

        conteo.textContent = `${lista.length} ${lista.length === 1 ? 'especie' : 'especies'}`;

        if (!lista.length) {
            rejilla.innerHTML = '<p>No encontramos ese animal. Prueba con otro nombre.</p>';
            return;
        }

        rejilla.innerHTML = lista.map(([slug, e]) => {
            const nums = recintosDe(slug).map(r => r.numero);
            const color = Ficha.categorias[e.categoria]?.color || 'var(--arena-2)';
            return `
            <button class="animal" type="button" data-slug="${slug}" style="--color:${color}">
                <span class="etiqueta uicn uicn--${e.uicn}">${P.escapar(P.uicn[e.uicn] || e.uicn)}</span>
                <h3>${P.escapar(e.nombre)}</h3>
                <div class="animal__cientifico">${P.escapar(e.cientifico)}</div>
                <div class="animal__pie">
                    ${e.modelo3d ? '<span class="marca3d">3D</span>' : ''}
                    <span class="animal__recintos">${nums.length ? 'Recinto ' + nums.join(', ') : ''}</span>
                </div>
            </button>`;
        }).join('');
    }

    rejilla.addEventListener('click', ev => {
        const tarjeta = ev.target.closest('.animal');
        if (!tarjeta) return;
        const slug = tarjeta.dataset.slug;
        cuerpo.innerHTML = Ficha.html(slug, especies[slug], recintosDe(slug));
        dialogo.showModal();
    });

    // Cerrar al hacer clic fuera del contenido
    dialogo.addEventListener('click', ev => {
        if (ev.target === dialogo) dialogo.close();
    });

    pintar();
})();
