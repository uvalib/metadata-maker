/*
 * MODS download for dataset module
 * Uses shared ModsBuilder with dataset-specific configuration
 */
import { ModsBuilder } from '../../shared/modsBuilder.js';

const builder = new ModsBuilder({
	moduleType: 'dataset',
	includeTypeOfResource: false,  // Dataset doesn't include typeOfResource
	includeGenre: true,
	genreType: 'dct',
	genreValue: 'dataset',
	includeLiterature: true,
	includeFAST: true,
	includeISBN: true
});

window.downloadMODS = builder.downloadMODS.bind(builder);
