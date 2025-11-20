/*
 * MODS download for archives module
 * Uses shared ModsBuilder with default configuration
 */
import { ModsBuilder } from '../../shared/modsBuilder.js';

const builder = new ModsBuilder({
	moduleType: 'archives',
	includeTypeOfResource: true,
	includeLiterature: true,
	includeFAST: true,
	includeISBN: true
});

window.downloadMODS = builder.downloadMODS.bind(builder);
