/*
 * MODS download for main metadatamaker module
 * Uses shared ModsBuilder with default configuration
 */
(function () {
	'use strict';

	// Wait for ModsBuilder to be available
	if (typeof ModsBuilder === 'undefined') {
		console.error('ModsBuilder not found. Make sure modsBuilder.js is loaded first.');
		return;
	}

	const builder = new ModsBuilder({
		moduleType: 'metadatamaker',
		includeTypeOfResource: true,
		includeLiterature: true,
		includeFAST: true,
		includeISBN: true
	});

	window.downloadMODS = builder.downloadMODS.bind(builder);
})();