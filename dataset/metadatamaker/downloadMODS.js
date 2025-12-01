/*
 * MODS download for dataset module
 * Uses shared ModsBuilder with default configuration
 */
(function () {
	'use strict';

	if (typeof ModsBuilder === 'undefined') {
		console.error('ModsBuilder not found. Make sure modsBuilder.js is loaded first.');
		return;
	}

	const builder = new ModsBuilder({
		moduleType: 'dataset',
		includeTypeOfResource: true,
		includeLiterature: false,
		includeFAST: true,
		includeISBN: false
	});

	window.downloadMODS = builder.downloadMODS.bind(builder);
})();
