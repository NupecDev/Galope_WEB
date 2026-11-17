/* Fondo de la calculadora según el alimento recomendado.
   No modifica racion-calculo.js ni racion-ui.js: observa el nombre del producto
   que escribe la calculadora (#r-name) y aplica la textura y la ilustración
   de ese producto (campos "texture" y "watermark" de data/products.json),
   con las mismas clases que usan las páginas de producto. */
(function () {
    var section = document.getElementById('racion');
    var nameEl = document.getElementById('r-name');
    if (!section || !nameEl) return;

    /* Nombre que muestra la calculadora → slug de products.json */
    var SLUGS = {
        'Galope Balance': 'balance',
        'Galope Alto Rendimiento': 'alto-rendimiento',
        'Galope Zen': 'zen',
        'Galope Reproductoras': 'reproductoras'
    };
    var art = {};
    var current = null;

    function apply() {
        var slug = SLUGS[nameEl.textContent.trim()];
        if (!slug || slug === current || !art[slug]) return;
        current = slug;
        var a = art[slug];
        if (a.texture) {
            section.style.setProperty('--product-texture', 'url("' + new URL(a.texture, document.baseURI).href + '")');
            section.classList.add('product-textured');
        }
        if (a.watermark) {
            section.style.setProperty('--product-watermark', 'url("' + new URL(a.watermark, document.baseURI).href + '")');
            section.classList.add('product-watermarked');
        }
        section.setAttribute('data-producto', slug);
    }

    fetch('data/products.json')
        .then(function (r) { return r.json(); })
        .then(function (products) {
            products.forEach(function (p) { art[p.product] = { texture: p.texture, watermark: p.watermark }; });
            apply();
            new MutationObserver(apply).observe(nameEl, { childList: true, characterData: true, subtree: true });
        })
        .catch(function (e) { console.error('No se pudo cargar el fondo de la calculadora:', e); });
})();
