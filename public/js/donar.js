/* Página de donaciones: campañas, monto, validación y envío */
(async function () {
    const P = window.Parque;
    const $ = s => document.querySelector(s);
    const form = $('#form-donar');
    const cont = $('#campanas');
    const selEspecie = $('#especie');
    const campoEspecie = $('#campo-especie');
    const montos = $('#montos');
    const otro = $('#monto-otro');
    const boton = $('#enviar');
    const pesos = n => '$' + Number(n || 0).toLocaleString('es-MX');

    const ICONOS = {
        alimento: '<path d="M4 11h16a8 8 0 0 1-16 0z"/><path d="M8 7c0-2 2-2 2-4M12 7c0-2 2-2 2-4M16 7c0-2 2-2 2-4"/>',
        enriquecimiento: '<circle cx="12" cy="12" r="8"/><path d="M4 12h16M12 4c3 3 3 13 0 16M12 4c-3 3-3 13 0 16"/>',
        veterinaria: '<path d="M10 3h4v7h7v4h-7v7h-4v-7H3v-4h7z"/>',
        apadrina: '<ellipse cx="12" cy="15" rx="5" ry="4"/><ellipse cx="6" cy="9" rx="2" ry="2.6"/><ellipse cx="10" cy="5.5" rx="2" ry="2.6"/><ellipse cx="14" cy="5.5" rx="2" ry="2.6"/><ellipse cx="18" cy="9" rx="2" ry="2.6"/>'
    };
    // Qué cubre aproximadamente cada monto (texto ilustrativo)
    const IMPACTO = {
        alimento: m => `Ayuda a cubrir la alimentación de ${m >= 500 ? 'varios días' : 'un día'} para un animal.`,
        enriquecimiento: () => 'Ayuda a comprar juguetes y materiales para que los animales exploren y jueguen.',
        veterinaria: () => 'Ayuda a reunir medicamentos y material para sus revisiones.',
        apadrina: () => 'Tu apoyo se suma al cuidado de la especie que elegiste.'
    };

    const estado = { campana: null, monto: 100 };
    let campanas = [], especies = {};

    try {
        [campanas, especies] = await Promise.all([P.api('campanas'), P.api('especies')]);
    } catch (e) {
        cont.innerHTML = '<p>No se pudieron cargar las campañas. Recarga la página.</p>';
        return;
    }

    /* ---------- Campañas ---------- */
    cont.innerHTML = campanas.map(c => `
        <label class="campana">
            <input type="radio" name="campana" value="${c.clave}">
            <span class="campana__cuerpo">
                <span class="campana__icono"><svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${ICONOS[c.icono] || ''}</svg></span>
                <strong>${P.escapar(c.titulo)}</strong>
                <span class="campana__desc">${P.escapar(c.descripcion)}</span>
                <span class="barra" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${c.porcentaje}" aria-label="Avance de ${P.escapar(c.titulo)}">
                    <span class="barra__relleno" style="--avance:${c.porcentaje}%"></span>
                </span>
                <span class="campana__cifras"><b>${pesos(c.recaudado)}</b> de ${pesos(c.meta)} · ${c.donativos} ${c.donativos === 1 ? 'donativo' : 'donativos'}</span>
            </span>
        </label>`).join('');

    // Animales para apadrinar: primero los que tienen 3D
    const lista = Object.entries(especies)
        .filter(([, e]) => e.cientifico !== 'Varias especies')
        .sort((a, b) => (!!b[1].modelo3d - !!a[1].modelo3d) || a[1].nombre.localeCompare(b[1].nombre, 'es'));
    selEspecie.insertAdjacentHTML('beforeend', lista.map(([slug, e]) => `<option value="${slug}">${P.escapar(e.nombre)}</option>`).join(''));

    const params = new URLSearchParams(location.search);
    if (params.get('animal') && especies[params.get('animal')]) {
        elegirCampana('apadrina');
        selEspecie.value = params.get('animal');
    } else {
        elegirCampana(campanas[0]?.clave);
    }

    cont.addEventListener('change', ev => {
        if (ev.target.name === 'campana') elegirCampana(ev.target.value);
    });
    selEspecie.addEventListener('change', actualizar);

    function elegirCampana(clave) {
        estado.campana = clave;
        const radio = cont.querySelector(`input[value="${clave}"]`);
        if (radio) radio.checked = true;
        campoEspecie.hidden = clave !== 'apadrina';
        actualizar();
    }

    /* ---------- Monto ---------- */
    montos.addEventListener('click', ev => {
        const b = ev.target.closest('button[data-monto]');
        if (!b) return;
        otro.value = '';
        estado.monto = Number(b.dataset.monto);
        marcarMonto(b);
        actualizar();
    });
    otro.addEventListener('input', () => {
        estado.monto = Math.floor(Number(otro.value) || 0);
        marcarMonto(null);
        actualizar();
    });
    function marcarMonto(activo) {
        montos.querySelectorAll('button[data-monto]').forEach(b => b.setAttribute('aria-pressed', String(b === activo)));
        otro.closest('.monto--otro').classList.toggle('activo', !activo);
    }

    /* ---------- Resumen ---------- */
    const mensaje = $('#mensaje');
    mensaje.addEventListener('input', () => { $('#contador').textContent = mensaje.value.length; });

    function actualizar() {
        const c = campanas.find(x => x.clave === estado.campana);
        $('#r-campana').textContent = c ? c.titulo : '—';
        const esp = estado.campana === 'apadrina' && selEspecie.value ? especies[selEspecie.value]?.nombre : null;
        $('#r-especie-fila').hidden = estado.campana !== 'apadrina';
        $('#r-especie').textContent = esp || 'Sin elegir';
        $('#r-monto').textContent = pesos(estado.monto);
        $('#r-boton').textContent = pesos(estado.monto);
        $('#r-impacto').textContent = c && estado.monto ? IMPACTO[c.clave]?.(estado.monto) || '' : '';
    }

    /* ---------- Envío ---------- */
    form.addEventListener('submit', async ev => {
        ev.preventDefault();
        limpiarErrores();

        const datos = {
            campana: estado.campana,
            especie: estado.campana === 'apadrina' ? selEspecie.value : '',
            monto: estado.monto,
            nombre: $('#nombre').value.trim(),
            correo: $('#correo').value.trim(),
            mensaje: mensaje.value.trim(),
            anonimo: $('#anonimo').checked,
            sitio_web: form.elements.sitio_web.value
        };

        // Validación rápida en el navegador (el servidor vuelve a validar todo)
        const errores = {};
        if (datos.nombre.length < 2) errores.nombre = 'Escribe tu nombre.';
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(datos.correo)) errores.correo = 'Escribe un correo válido.';
        if (!(datos.monto >= Number(otro.min) && datos.monto <= Number(otro.max))) errores.monto = `El monto debe ser entre ${pesos(otro.min)} y ${pesos(otro.max)}.`;
        if (datos.campana === 'apadrina' && !datos.especie) errores.especie = 'Elige el animal que quieres apadrinar.';
        if (Object.keys(errores).length) return mostrarErrores(errores);

        boton.disabled = true;
        boton.classList.add('enviando');
        try {
            const r = await fetch(P.url('/api/donaciones'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': window.CSRF },
                body: JSON.stringify(datos)
            });
            const j = await r.json();
            if (r.ok && j.folio) {
                location.href = P.url('/donar/gracias') + '?folio=' + encodeURIComponent(j.folio);
                return;
            }
            if (j.errores) mostrarErrores(j.errores);
            else $('#error-general').textContent = j.error || 'No se pudo registrar el donativo.';
        } catch (e) {
            $('#error-general').textContent = 'No hay conexión con el servidor. Intenta de nuevo.';
        }
        boton.disabled = false;
        boton.classList.remove('enviando');
    });

    function limpiarErrores() {
        form.querySelectorAll('[data-error]').forEach(e => { e.textContent = ''; });
        form.querySelectorAll('[aria-invalid]').forEach(e => e.removeAttribute('aria-invalid'));
        $('#error-general').textContent = '';
    }
    function mostrarErrores(errores) {
        let primero = null;
        for (const [campo, texto] of Object.entries(errores)) {
            const p = form.querySelector(`[data-error="${campo}"]`);
            if (p) p.textContent = texto;
            const input = campo === 'monto' ? otro : form.querySelector(`#${campo}`);
            if (input) { input.setAttribute('aria-invalid', 'true'); primero ??= input; }
        }
        (primero || form).scrollIntoView({ block: 'center', behavior: 'smooth' });
        primero?.focus({ preventScroll: true });
    }

    /* ---------- Muro ---------- */
    try {
        const muro = await P.api('donadores');
        const cont = $('#muro');
        if (!muro.length) {
            cont.innerHTML = '<p class="muro__vacio">Aún no hay donativos. ¡Sé la primera persona en aparecer aquí!</p>';
        } else {
            cont.innerHTML = muro.map(d => `
                <article class="nota">
                    <header><strong>${P.escapar(d.nombre)}</strong><span>${pesos(d.monto)}</span></header>
                    <p class="nota__destino">${P.escapar(d.campana)}${d.especie && especies[d.especie] ? ' · ' + P.escapar(especies[d.especie].nombre) : ''}</p>
                    ${d.mensaje ? `<p class="nota__mensaje">“${P.escapar(d.mensaje)}”</p>` : ''}
                    <time>${new Date(d.creado_en.replace(' ', 'T')).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' })}</time>
                </article>`).join('');
        }
    } catch (e) { /* el muro es opcional */ }

    actualizar();
})();
