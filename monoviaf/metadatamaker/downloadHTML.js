/*
 * HTML download for Monograph (VIAF) module
 * Uses shared HtmlBuilder with default configuration
 */
(function () {
    'use strict';

    if (typeof HtmlBuilder === 'undefined') {
        console.error('HtmlBuilder not found. Make sure htmlBuilder.js is loaded first.');
        return;
    }

    const builder = new HtmlBuilder({
        itemType: 'http://schema.org/Book',
        moduleType: 'monograph'
    });

    window.downloadHTML = builder.downloadHTML.bind(builder);
})();
