/*
 * MODS download for theses module
 * Uses shared ModsBuilder with theses-specific configuration
 */
(function () {
	'use strict';

	if (typeof ModsBuilder === 'undefined') {
		console.error('ModsBuilder not found. Make sure modsBuilder.js is loaded first.');
		return;
	}

	const builder = new ModsBuilder({
		moduleType: 'theses',
		includeTypeOfResource: true,
		includeLiterature: false,  // Theses don't have literature genre
		includeFAST: false,  // Theses don't use FAST subjects
		includeISBN: false  // Theses don't have ISBN
	});

	window.downloadMODS = builder.downloadMODS.bind(builder);
})();
