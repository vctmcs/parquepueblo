/* Comprobante de la donación (demostración) */
(async function () {
    const P = window.Parque;
    const caja = document.getElementById('recibo');
    const folio = new URLSearchParams(location.search).get('folio') || '';
    const pesos = n => '$' + Number(n || 0).toLocaleString('es-MX') + ' MXN';

    document.getElementById('imprimir').addEventListener('click', () => window.print());

    let d, especies = {};
    try {
        const [r, esp] = await Promise.all([
            fetch(P.url('/api/recibo') + '?folio=' + encodeURIComponent(folio)),
            P.api('especies')
        ]);
        d = await r.json();
        especies = esp;
        if (!r.ok) throw new Error(d.error);
    } catch (e) {
        caja.innerHTML = `<h1>No encontramos ese donativo</h1><p>${P.escapar(e.message || 'Revisa el folio.')}</p>`;
        return;
    }

    const fecha = new Date(d.creado_en.replace(' ', 'T'));
    caja.innerHTML = `
        <div class="recibo__cabeza">
            <img src="${P.url('/public/img/icono.svg')}" alt="" width="48" height="48">
            <div>
                <span class="etiqueta">Comprobante de demostración</span>
                <h1>¡Gracias, ${P.escapar(d.nombre.split(' ')[0])}!</h1>
            </div>
        </div>
        <p>Registramos tu donativo. Guarda este folio por si quieres consultarlo después.</p>
        <dl class="recibo__datos">
            <div><dt>Folio</dt><dd class="recibo__folio">${P.escapar(d.folio)}</dd></div>
            <div><dt>Fecha</dt><dd>${fecha.toLocaleString('es-MX', { dateStyle: 'long', timeStyle: 'short' })}</dd></div>
            <div><dt>Nombre</dt><dd>${P.escapar(d.nombre)}</dd></div>
            <div><dt>Correo</dt><dd>${P.escapar(d.correo)}</dd></div>
            <div><dt>Destino</dt><dd>${P.escapar(d.campana)}${d.especie && especies[d.especie] ? ' · ' + P.escapar(especies[d.especie].nombre) : ''}</dd></div>
            <div><dt>En el muro</dt><dd>${d.anonimo ? 'Como donante anónimo' : 'Con tu nombre'}</dd></div>
        </dl>
        ${d.mensaje ? `<p class="recibo__mensaje">“${P.escapar(d.mensaje)}”</p>` : ''}
        <div class="recibo__total"><span>Total</span><strong>${pesos(d.monto)}</strong></div>
        <p class="recibo__nota">Sitio no oficial con fines educativos: no se realizó ningún cobro y este comprobante no tiene validez fiscal.</p>
    `;
})();
