/* Panel de administración: resumen por campaña y tabla de donativos */
(async function () {
    const P = window.Parque;
    const filas = document.getElementById('filas');
    const resumen = document.getElementById('resumen');
    const buscar = document.getElementById('buscar');
    const pesos = n => '$' + Number(n || 0).toLocaleString('es-MX');
    const normal = t => (t || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

    let datos, especies = {};
    try {
        const r = await fetch(P.url('/api/admin/donaciones'));
        if (r.status === 401) { location.href = P.url('/admin/entrar'); return; }
        datos = await r.json();
        especies = await P.api('especies').catch(() => ({}));
    } catch (e) {
        filas.innerHTML = '<tr><td colspan="8">No se pudieron cargar los datos.</td></tr>';
        return;
    }

    const total = datos.donaciones.reduce((s, d) => s + Number(d.monto), 0);
    resumen.innerHTML = `
        <div class="kpi"><span>Total recaudado</span><strong>${pesos(total)}</strong></div>
        <div class="kpi"><span>Donativos</span><strong>${datos.donaciones.length}</strong></div>
        ${datos.campanas.map(c => `
            <div class="kpi">
                <span>${P.escapar(c.titulo)}</span>
                <strong>${pesos(c.recaudado)}</strong>
                <span class="barra"><span class="barra__relleno" style="--avance:${c.porcentaje}%"></span></span>
                <small>${c.porcentaje}% de ${pesos(c.meta)}</small>
            </div>`).join('')}`;

    function pintar() {
        const q = normal(buscar.value.trim());
        const lista = datos.donaciones.filter(d => !q || normal(`${d.folio} ${d.nombre} ${d.correo}`).includes(q));
        filas.innerHTML = lista.length ? lista.map(d => `
            <tr>
                <td><code>${P.escapar(d.folio)}</code></td>
                <td>${P.escapar(d.creado_en)}</td>
                <td>${P.escapar(d.nombre)}${Number(d.anonimo) ? ' <span class="etiqueta">anónimo</span>' : ''}</td>
                <td>${P.escapar(d.correo)}</td>
                <td>${P.escapar(d.campana)}</td>
                <td>${P.escapar(d.especie ? (especies[d.especie]?.nombre || d.especie) : '—')}</td>
                <td class="num">${pesos(d.monto)}</td>
                <td>${P.escapar(d.mensaje || '')}</td>
            </tr>`).join('') : '<tr><td colspan="8">Sin donativos.</td></tr>';
    }
    buscar.addEventListener('input', pintar);
    pintar();
})();
