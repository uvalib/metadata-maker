/**
 * HTML Builder - Shared HTML/Schema.org generation for all modules
 * 
 * Creates HTML pages with Schema.org semantic markup for SEO.
 * 
 * NOTE: Due to file size constraints, this file imports the language/country
 * lookup functions as globals. These must be loaded before this module.
 */

(function (root, factory) {
	if (typeof define === 'function' && define.amd) {
		define([], factory);
	} else if (typeof module === 'object' && module.exports) {
		module.exports = factory();
	} else {
		root.HtmlBuilder = factory();
	}
}(typeof self !== 'undefined' ? self : this, function () {
	'use strict';

	// Lookup functions are loaded globally from the original downloadHTML files
	// We expect getLanguage() and getCountry() to be available

	/**
	 * HtmlBuilder class for generating Schema.org HTML
	 */
	class HtmlBuilder {
		constructor(config = {}) {
			this.config = Object.assign({
				itemType: 'http://schema.org/Book',
				moduleType: 'default'
			}, config);

			this.downloadHTML = this.downloadHTML.bind(this);
			this.buildTag = this.buildTag.bind(this);
			this.buildItemscopeTag = this.buildItemscopeTag.bind(this);
			this.buildSpan = this.buildSpan.bind(this);
			this.listPerson = this.listPerson.bind(this);
			this.listOrganization = this.listOrganization.bind(this);
		}

		/**
		 * Basic tag layout for a single piece of data
		 */
		buildTag(prop, content, meta, label) {
			if (meta) {
				return '\\t\\t<meta itemprop="' + prop + '" content="' + content + '"/>\\n';
			} else {
				return '\\t\\t\\t<dt>' + label + ':</dt>\\n\\t\\t\\t<dd itemprop="' + prop + '"><b>' + content + '</b></dd>\\n';
			}
		}

		buildItemscopeTag(prop, type, content) {
			return '\\t\\t\\t<div itemprop="' + prop + '" itemscope itemtype="' + type + '">\\n' + content + '\\t\\t\\t</div>\\n';
		}

		buildSpan(prop, content) {
			return '<span itemprop="' + prop + '">' + content + '</span>';
		}

		/**
		 * Create a div for each person listed as a contributor
		 */
		listPerson(family, given, role) {
			const role_index = { 'art': 'contributor', 'aut': 'author', 'ctb': 'contributor', 'edt': 'editor', 'ill': 'illustrator', 'trl': 'contributor' };
			const prop = role_index[role];
			let output_string = '\\t\\t\\t<div itemprop="' + prop + '" itemscope itemtype="http://schema.org/Person">\\n';
			output_string += '\\t\\t\\t\\t<dt>' + role_index[role].charAt(0).toUpperCase() + role_index[role].slice(1) + ':</dt>\\n';
			output_string += '\\t\\t\\t\\t<dd><b>';

			if (checkExists(family) && checkExists(given)) {
				output_string += this.buildSpan('familyName', family) + ', ' + this.buildSpan('givenName', given);
			} else if (checkExists(family) || checkExists(given)) {
				if (checkExists(family)) {
					output_string += this.buildSpan('familyName', family);
				} else {
					output_string += this.buildSpan('givenName', given);
				}
			}

			output_string += '</b></dd>\\n';
			output_string += '\\t\\t\\t</div>\\n';
			return output_string;
		}

		listOrganization(entry) {
			if (!checkExists(entry) || !Array.isArray(entry) || !checkExists(entry[0]) || !checkExists(entry[0]['corporate'])) {
				return '';
			}

			const primary = entry[0];
			const role_index = { 'cre': { prop: 'creator', label: 'Corporate Creator' }, 'ctb': { prop: 'contributor', label: 'Corporate Contributor' } };
			const roleConfig = role_index[primary['role']] || { prop: 'contributor', label: 'Corporate Contributor' };

			let output_string = '\\t\\t\\t<div itemprop="' + roleConfig.prop + '" itemscope itemtype="http://schema.org/Organization">\\n';
			output_string += '\\t\\t\\t\\t<dt>' + roleConfig.label + ':</dt>\\n';
			output_string += '\\t\\t\\t\\t<dd><b>' + this.buildSpan('name', primary['corporate']) + '</b></dd>\\n';
			output_string += '\\t\\t\\t</div>\\n';

			return output_string;
		}

		/**
		 * Main HTML generation function
		 */
		downloadHTML(record, institution_info) {
			let metaTags = '';
			let displayTags = '';

			const illustrationCodeLabels = {
				'a': 'Illustrations', 'b': 'Maps', 'c': 'Portraits', 'd': 'Charts',
				'e': 'Plans', 'f': 'Plates', 'g': 'Music', 'h': 'Facsimiles',
				'i': 'Coats of arms', 'j': 'Genealogical tables', 'k': 'Forms',
				'l': 'Samples', 'm': 'Phonodiscs, etc.', 'o': 'Photographs', 'p': 'Illuminations'
			};

			metaTags += this.buildTag('inLanguage', record.language, true, '');

			let subtitleTag = '';
			if (checkExists(record.title[0]['subtitle'])) {
				subtitleTag = ': ' + record.title[0]['subtitle'];
			}

			displayTags += this.buildTag('name', record.title[0]['title'] + subtitleTag, false, 'Title');

			let translitSubTag = '';
			if (checkExists(record.title[1]['subtitle'])) {
				translitSubTag = ': ' + record.title[1]['subtitle'] + '.';
			}

			if (checkExists(record.title[1]['title'])) {
				displayTags += this.buildTag('alternateName', record.title[1]['title'] + translitSubTag, false, 'Transliterated Title');
			}

			if (checkExists(record.isbn)) {
				displayTags += this.buildTag('isbn', record.isbn, false, 'ISBN');
			}

			if (checkExists(record.author[0]['role']) && (checkExists(record.author[0]['given']) || checkExists(record.author[0]['family']))) {
				displayTags += this.listPerson(record.author[0]['family'], record.author[0]['given'], record.author[0]['role']);
			}

			if (checkExists(record.additional_authors)) {
				for (let i = 0; i < record.additional_authors.length; i++) {
					displayTags += this.listPerson(record.additional_authors[i][0]['family'], record.additional_authors[i][0]['given'], record.additional_authors[i][0]['role']);
				}
			}

			if (checkExists(record.corporate_author)) {
				displayTags += this.listOrganization(record.corporate_author);
			}

			if (checkExists(record.additional_corporate_authors)) {
				for (let i = 0; i < record.additional_corporate_authors.length; i++) {
					displayTags += this.listOrganization(record.additional_corporate_authors[i]);
				}
			}

			if (checkExists(record.edition)) {
				displayTags += this.buildTag('bookEdition', record.edition, false, 'Edition Statement');
			}

			if (checkExists(record.publisher)) {
				displayTags += this.buildTag('publisher', record.publisher, false, 'Publisher');
			}

			if (checkExists(record.publication_place) || checkExists(record.publication_country)) {
				let content = '';
				if (checkExists(record.publication_place)) {
					content += '<span itemprop="addressLocality">' + record.publication_place + '</span>';
					if (checkExists(record.publication_country)) {
						content += ', ';
					}
				}
				if (checkExists(record.publication_country)) {
					content += '<span itemprop="addressRegion">' + getCountry(record.publication_country) + '</span>';
				}
				const publication_location = this.buildItemscopeTag('publication', 'http://schema.org/PublicationEvent',
					this.buildItemscopeTag('location', 'http://schema.org/PostalAddress',
						'\\t\\t\\t\\t<dt>Publication Location:</dt>\\n\\t\\t\\t\\t<dd><b>' + content + '</b></dd>\\n'));
				displayTags += publication_location;
			}

			if (checkExists(record.publication_year)) {
				displayTags += this.buildTag('datePublished', record.publication_year, false, 'Date of Publication');
			}

			if (checkExists(record.copyright_year)) {
				displayTags += this.buildTag('copyrightYear', record.copyright_year, false, 'Date of Copyright');
			}

			let ill = '';
			const illustrationLabels = [];
			if (Array.isArray(record.illustrations_terms) && record.illustrations_terms.length > 0) {
				illustrationLabels.push(...record.illustrations_terms);
			} else if (Array.isArray(record.illustrations_codes) && record.illustrations_codes.length > 0) {
				for (let illustrationIndex = 0; illustrationIndex < record.illustrations_codes.length; illustrationIndex++) {
					const illustrationCode = record.illustrations_codes[illustrationIndex];
					if (illustrationCodeLabels[illustrationCode]) {
						illustrationLabels.push(illustrationCodeLabels[illustrationCode]);
					}
				}
			} else if (checkExists(record.illustrations_yes) && record.illustrations_yes === true) {
				illustrationLabels.push('illustrations');
			}
			if (illustrationLabels.length > 0) {
				ill = illustrationLabels.join('; ');
			}

			if (ill != '' || checkExists(record.pages)) {
				displayTags += '\\t\\t\\t<dt>Physical Description:</dt>\\n\\t\\t\\t<dd><b>';
				if (checkExists(record.pages)) {
					displayTags += this.buildSpan('numberOfPages', record.pages) + ' ' + record.volume_or_page;
				}
				if (ill != '' && checkExists(record.pages)) {
					displayTags += '; ';
				}
				if (ill != '') {
					displayTags += ill;
				}
				displayTags += '</b></dd>\\n';
			}

			displayTags += '\\t\\t\\t<dt>Language:</dt>\\n\\t\\t\\t<dd><b>' + getLanguage(record.language) + '</b></dd>\\n';

			if (record.keywords.length > 0) {
				console.log(record.keywords);
				let keywordsList = '\\t\\t\\t<dt>Keywords:</dt>\\n\\t\\t\\t<dd><b>\\n\\t\\t\\t\\t<ul>\\n\\t\\t\\t\\t\\t<li>' + this.buildSpan('keywords', record.keywords[0]) + '</li>\\n';
				for (let c = 1; c < record.keywords.length; c++) {
					if (record.keywords[c] !== '') {
						keywordsList += '\\t\\t\\t\\t\\t<li itemprop="keywords">' + record.keywords[c] + '</li>\\n';
					}
				}
				keywordsList += '\\t\\t\\t\\t</ul>\\n\\t\\t\\t</b></dd>\\n';
				displayTags += keywordsList;
			}

			if (checkExists(record.fast) && record.fast.length > 0) {
				let FASTList = '\\t\\t\\t<dt>FAST:</dt>\\n\\t\\t\\t<dd><b>\\n\\t\\t\\t\\t<ul>\\n';
				for (let c = 0; c < record.fast.length; c++) {
					if (record.fast[c][0] != '') {
						FASTList += '\\t\\t\\t\\t\\t<li itemprop="about" href="http://id.worldcat.org/fast/' + record.fast[c][1] + '">' + record.fast[c][0] + '</li>\\n';
					}
				}
				FASTList += '\\t\\t\\t\\t</ul>\\n\\t\\t\\t</b></dd>\\n';
				displayTags += FASTList;
			}

			displayTags += '\\t\\t\\t<div itemprop="offers" itemscope itemtype="http://schema.org/Offer">\\n\\t\\t\\t\\t<dt>Located At:</dt>\\n\\t\\t\\t\\t<dd><b><span itemprop="seller" href="' + institution_info['html']['url'] + '">' + institution_info['html']['name'] + '</span></b></dd>\\n\\t\\t\\t</div>\\n';

			const text = '<!DOCTYPE html>\\n<html>\\n<head>\\n\\t<meta charset="utf-8">\\n</head>\\n\\n<body>\\n\\t<div itemscope itemtype="' + this.config.itemType + '">\\n' + metaTags + '\\t\\t<dl>\\n' + displayTags + '\\t\\t</dl>\\n\\t</div>\\n</body>\\n</html>';
			downloadFile(text, 'html');
		}
	}

	return HtmlBuilder;
}));
