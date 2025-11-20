/*
 * MODS download for main metadatamaker module
 * Uses shared ModsBuilder with default configuration
 */
import { ModsBuilder } from '../shared/modsBuilder.js';

const builder = new ModsBuilder({
	moduleType: 'metadatamaker',
	includeTypeOfResource: true,
	includeLiterature: true,
	includeFAST: true,
	includeISBN: true
});

window.downloadMODS = builder.downloadMODS.bind(builder);