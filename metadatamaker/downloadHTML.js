/*
 * HTML download for main metadatamaker module
 * Uses shared HtmlBuilder with default configuration
 */
(function () {
  'use strict';

  // Wait for HtmlBuilder to be available
  if (typeof HtmlBuilder === 'undefined') {
    console.error('HtmlBuilder not found. Make sure htmlBuilder.js is loaded first.');
    return;
  }

  const builder = new HtmlBuilder({
    itemType: 'http://schema.org/Book',
    moduleType: 'metadatamaker'
  });

  window.downloadHTML = builder.downloadHTML.bind(builder);
})();
