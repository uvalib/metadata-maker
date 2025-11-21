/*
 * HTML generation now uses shared HtmlBuilder
 * Language and country lookup functions are loaded from shared modules
 * 
 * HtmlBuilder is loaded as a UMD global from htmlBuilder.js
 */

const builder = new window.HtmlBuilder({
  itemType: 'http://schema.org/Book',
  moduleType: 'collections'
});

window.downloadHTML = builder.downloadHTML.bind(builder);
