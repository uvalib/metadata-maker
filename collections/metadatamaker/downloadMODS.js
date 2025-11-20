/*
 * MODS download for collections module
 * Uses shared ModsBuilder with default configuration
 */
import { ModsBuilder } from '../../shared/modsBuilder.js';

const builder = new ModsBuilder({
	moduleType: 'collections',
	includeTypeOfResource: true,
	include

Literature: true,
	includeFAST: true,
	includeISBN: true
});

window.downloadMODS = builder.downloadMODS.bind(builder);
