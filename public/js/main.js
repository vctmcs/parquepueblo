/* Comportamiento común: menú móvil y utilidades compartidas */
(function () {
    const boton = document.querySelector('.menu-boton');
    const menu = document.getElementById('menu');

    if (boton && menu) {
        boton.addEventListener('click', () => {
            const abierto = boton.getAttribute('aria-expanded') === 'true';
            boton.setAttribute('aria-expanded', String(!abierto));
            menu.classList.toggle('abierto', !abierto);
        });
    }

    // Utilidades globales para los demás scripts
    window.Parque = {
        url(ruta) {
            return (window.BASE_URL || '') + ruta;
        },
        async api(ruta) {
            const r = await fetch(this.url('/api/' + ruta));
            if (!r.ok) throw new Error('Error al consultar ' + ruta);
            return r.json();
        },
        escapar(texto) {
            const d = document.createElement('div');
            d.textContent = texto ?? '';
            return d.innerHTML;
        },
        uicn: {
            LC: 'Preocupación menor',
            NT: 'Casi amenazada',
            VU: 'Vulnerable',
            EN: 'En peligro',
            CR: 'En peligro crítico',
            DOM: 'Especie doméstica',
            NE: 'Varias especies'
        }
    };
})();
