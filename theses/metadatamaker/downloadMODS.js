/*
 * MODS download for theses module
 * Uses shared ModsBuilder with theses-specific configuration
 */
import { ModsBuilder } from '../../shared/modsBuilder.js';

const builder = new ModsBuilder({
	moduleType: 'theses',
	includeTypeOfResource: true,
	includeLiterature: false,  // Theses don't have literature genre
	includeFAST: false,  // Theses don't use FAST subjects
	includeISBN: false  // Theses don't have ISBN
});

window.downloadMODS = builder.downloadMODS.bind(builder);
