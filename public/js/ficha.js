/* Genera el HTML de la ficha de una especie. Lo usan el catálogo y el mapa. */
window.Ficha = {
    categorias: {
        felinos:    { nombre: 'Felinos',     color: 'var(--c-felinos)' },
        herbivoros: { nombre: 'Herbívoros',  color: 'var(--c-herbivoros)' },
        aves:       { nombre: 'Aves',        color: 'var(--c-aves)' },
        primates:   { nombre: 'Primates',    color: 'var(--c-primates)' },
        carnivoros: { nombre: 'Otros carnívoros', color: 'var(--c-carnivoros)' },
        reptiles:   { nombre: 'Reptiles',    color: 'var(--c-reptiles)' }
    },

    html(slug, e, recintos, opciones = {}) {
        const P = window.Parque;
        const esc = P.escapar;
        const cat = this.categorias[e.categoria] || { nombre: e.categoria };
        const nums = recintos.map(r => r.numero);

        const botonMapa = opciones.ocultarMapa || !nums.length ? '' :
            `<a class="boton boton--chico" href="${P.url('/mapa')}?recinto=${nums[0]}">Ver en el mapa</a>`;
        const boton3d = e.modelo3d ?
            `<a class="boton boton--chico boton--naranja" href="${P.url('/animales-3d')}?animal=${encodeURIComponent(slug)}">Ver en 3D</a>` : '';

        return `
        <article class="ficha">
            <span class="etiqueta" style="background:${cat.color};color:#1c211d">${esc(cat.nombre)}</span>
            <h2>${esc(e.nombre)}</h2>
            <div class="ficha__cientifico">${esc(e.cientifico)} · ${esc(e.alias)}</div>
            <div class="ficha__etiquetas">
                <span class="etiqueta uicn uicn--${esc(e.uicn)}" title="Lista Roja de la UICN">${esc(P.uicn[e.uicn] || e.uicn)}</span>
                ${nums.length ? `<span class="etiqueta">Recinto ${nums.join(' y ')}</span>` : ''}
            </div>
            <p>${esc(e.descripcion)}</p>
            <dl class="ficha__datos">
                <div><dt>Dieta</dt><dd>${esc(e.dieta)}</dd></div>
                <div><dt>Origen</dt><dd>${esc(e.origen)}</dd></div>
                <div><dt>Tamaño</dt><dd>${esc(e.peso)}</dd></div>
                <div><dt>Longevidad</dt><dd>${esc(e.longevidad)}</dd></div>
            </dl>
            <div class="ficha__curiosidad"><strong>Dato curioso</strong>${esc(e.curiosidad)}</div>
            <div class="ficha__acciones">${botonMapa}${boton3d}${e.cientifico === 'Varias especies' ? '' : `<a class="boton boton--chico boton--claro" href="${P.url('/donar')}?animal=${encodeURIComponent(slug)}">Apadrinar</a>`}</div>
        </article>`;
    }
};
