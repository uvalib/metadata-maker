/*
 * MODS download for mixedMedia module
 * Uses shared ModsBuilder with default configuration
 */
import { ModsBuilder } from '../../shared/modsBuilder.js';

const builder = new ModsBuilder({
	moduleType: 'mixedMedia',
	includeTypeOfResource: true,
	includeLiterature: true,
	includeFAST: true,
	includeISBN: true
});

window.downloadMODS = builder.downloadMODS.bind(builder);