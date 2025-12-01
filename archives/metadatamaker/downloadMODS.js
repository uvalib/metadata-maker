/*
 * MODS download for archives module
 * Uses shared ModsBuilder with default configuration
 */
(function () {
	'use strict';

	if (typeof ModsBuilder === 'undefined') {
		console.error('ModsBuilder not found. Make sure modsBuilder.js is loaded first.');
		return;
	}

	const builder = new ModsBuilder({
		moduleType: 'archives',
		includeTypeOfResource: true,
		includeLiterature: true,
		includeFAST: true,
		includeISBN: true
	});

	window.downloadMODS = builder.downloadMODS.bind(builder);
})();
