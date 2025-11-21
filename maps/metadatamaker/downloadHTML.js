/*
 * Language and country lookups now in shared modules
 * This reduces duplication across all modules
 */

// Import lookup functions from shared modules
// These will be loaded via script tags, making functions globally available
// (See shared/languageLookups.js and shared/countryLookups.js)

	return countries[code];
}

/*
 * HTML generation now uses shared HtmlBuilder
 * Language and country lookup functions are defined above
 */
import { HtmlBuilder } from '../../shared/htmlBuilder.js';

const builder = new HtmlBuilder({
  itemType: 'http://schema.org/Book',
  moduleType: 'maps'
});

window.downloadHTML = builder.downloadHTML.bind(builder);
