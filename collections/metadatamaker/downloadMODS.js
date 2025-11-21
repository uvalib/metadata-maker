/*
 * MODS download for collections module
 * Uses shared ModsBuilder with default configuration
 * 
 * ModsBuilder is loaded as a UMD global from modsBuilder.js
 */

// Wait for ModsBuilder to be available (loaded from shared/modsBuilder.js via script tag)
const builder = new window.ModsBuilder({
	moduleType: 'collections',
	includeTypeOfResource: true,
	includeLiterature: true,
	includeFAST: true,
	includeISBN: true
});

window.downloadMODS = builder.downloadMODS.bind(builder);
