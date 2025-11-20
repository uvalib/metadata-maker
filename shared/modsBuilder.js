/**
 * MODS Builder - Shared MODS XML generation for all modules
 * 
 * This builder creates MODS (Metadata Object Description Schema) XML records
 * with support for module-specific variations via configuration.
 * 
 * Usage:
 *   const builder = new ModsBuilder({ moduleType: 'dataset' });
 *   builder.downloadMODS(recordObject, institutionInfo);
 */

(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        // AMD
        define([], factory);
    } else if (typeof module === 'object' && module.exports) {
        // Node/CommonJS
        module.exports = factory();
    } else {
        // Browser globals
        root.ModsBuilder = factory();
    }
}(typeof self !== 'undefined' ? self : this, function () {
    'use strict';

    /**
     * Role code to label mappings for MARC relator terms
     */
    const ROLE_LABELS = {
        'art': 'artist',
        'aut': 'author',
        'ctb': 'contributor',
        'edt': 'editor',
        'ill': 'illustrator',
        'trl': 'translator',
        'cre': 'creator',
        // Thesis-specific roles
        'dis': 'dissertant',
        'csp': 'consultant to a project',
        'dtc': 'data contributor',
        'dte': 'dedicatee',
        'dgc': 'degree committee member',
        'dgs': 'degree supervisor',
        'fnd': 'funder',
        'rtm': 'research team member',
        'spn': 'sponsor',
        'tad': 'technical advisor'
    };

    /**
     * Literature type codes for genre classification
     */
    const LITERATURE_TYPES = {
        '0': 'Not fiction (not further specified)',
        '1': 'Fiction (not further specified)',
        'd': 'Dramas',
        'e': 'Essays',
        'f': 'Novels',
        'h': 'Humor, satires, etc.',
        'i': 'Letters',
        'j': 'Short stories',
        'm': 'Mixed forms',
        'p': 'Poetry',
        's': 'Speeches',
        'u': 'Unknown',
        '|': 'No attempt to code'
    };

    /**
     * FAST subject types mapping
     */
    const FAST_TYPES = {
        '00': 'name type="personal"',
        '10': 'name type="corporate"',
        '11': 'name type="conference"',
        '30': 'titleInfo',
        '50': 'topic',
        '51': 'geographic',
        '55': 'genre'
    };

    /**
     * ModsBuilder class
     */
    class ModsBuilder {
        constructor(config = {}) {
            this.config = Object.assign({
                moduleType: 'default',
                includeTypeOfResource: true,
                includeGenre: false,
                genreType: null,
                genreValue: null,
                includeLiterature: true,
                includeFAST: true,
                includeISBN: true
            }, config);

            // Bind methods
            this.downloadMODS = this.downloadMODS.bind(this);
            this.fillAuthorMODS = this.fillAuthorMODS.bind(this);
            this.fillCorporateMODS = this.fillCorporateMODS.bind(this);
        }

        /**
         * Generate MODS XML for a personal author/contributor
         */
        fillAuthorMODS(family, given, role) {
            if (!checkExists(given) && !checkExists(family)) {
                return '';
            }

            const roleCode = checkExists(role) ? role : 'ctb';
            const roleText = ROLE_LABELS[roleCode] || 'contributor';

            let authorText = '    <name type="personal">\n';

            if (checkExists(family)) {
                authorText += '        <namePart type="family">' + escapeXML(family) + '</namePart>\n';
            }

            if (checkExists(given)) {
                authorText += '        <namePart type="given">' + escapeXML(given) + '</namePart>\n';
            }

            authorText += '        <role>\n';
            authorText += '            <roleTerm authority="marcrelator" type="text">' + roleText + '</roleTerm>\n';
            authorText += '            <roleTerm authority="marcrelator" type="code">' + roleCode + '</roleTerm>\n';
            authorText += '        </role>\n';
            authorText += '    </name>\n';

            return authorText;
        }

        /**
         * Generate MODS XML for a corporate author/contributor
         */
        fillCorporateMODS(corporateEntry) {
            // Handle both array and object formats
            let corporate, role;

            if (Array.isArray(corporateEntry)) {
                if (!checkExists(corporateEntry) || !checkExists(corporateEntry[0]) || !checkExists(corporateEntry[0]['corporate'])) {
                    return '';
                }
                corporate = corporateEntry[0]['corporate'];
                role = corporateEntry[0]['role'] || 'cre';
            } else if (typeof corporateEntry === 'object' && corporateEntry !== null) {
                if (!checkExists(corporateEntry['corporate'])) {
                    return '';
                }
                corporate = corporateEntry['corporate'];
                role = corporateEntry['role'] || 'cre';
            } else {
                return '';
            }

            const roleText = ROLE_LABELS[role] || 'creator';

            let authorText = '    <name type="corporate">\n';
            authorText += '        <namePart>' + escapeXML(corporate) + '</namePart>\n';
            authorText += '        <role>\n';
            authorText += '            <roleTerm authority="marcrelator" type="text">' + roleText + '</roleTerm>\n';
            authorText += '            <roleTerm authority="marcrelator" type="code">' + role + '</roleTerm>\n';
            authorText += '        </role>\n';
            authorText += '    </name>\n';

            return authorText;
        }

        /**
         * Main MODS generation function
         */
        downloadMODS(record, institution_info) {
            // Start document
            let text = '<?xml version="1.0" encoding="UTF-8"?>\n';
            text += '<mods:mods xmlns:mods="http://www.loc.gov/mods/v3"\n';
            text += '    xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns="http://www.loc.gov/mods/v3"\n';
            text += '    xmlns:xlink="http://www.w3.org/1999/xlink"\n';
            text += '    xsi:schemaLocation="http://www.loc.gov/mods/v3 http://www.loc.gov/standards/mods/v3/mods-3-5.xsd"\n';
            text += '    version="3.5">\n';

            // Title
            text += this.buildTitle(record);

            // Authors
            text += this.buildAuthors(record);

            // Type of resource
            if (this.config.includeTypeOfResource) {
                text += '    <typeOfResource>text</typeOfResource>\n';
            }

            // Genre (module-specific)
            if (this.config.includeGenre && this.config.genreValue) {
                if (this.config.genreType) {
                    text += '    <genre type="' + this.config.genreType + '">' + this.config.genreValue + '</genre>\n';
                } else {
                    text += '    <genre>' + this.config.genreValue + '</genre>\n';
                }
            }

            // ISBN
            if (this.config.includeISBN && checkExists(record.isbn)) {
                text += '    <identifier type="isbn">' + record.isbn + '</identifier>\n';
            }

            // URL (if present)
            if (checkExists(record.web_url)) {
                text += '    <location>\n        <url>' + escapeXML(record.web_url) + '</url>\n    </location>\n';
            }

            // Origin info
            text += this.buildOriginInfo(record);

            // Language
            text += '    <language>\n        <languageTerm authority="iso639-2b" type="code">' + record.language + '</languageTerm>\n    </language>\n';

            // Physical description
            text += this.buildPhysicalDescription(record);

            // Location
            text += '    <location>\n        <physicalLocation>' + escapeXML(institution_info['mods']['physicalLocation']) + '</physicalLocation>\n    </location>\n';

            // Module-specific fields
            text += this.buildModuleSpecificFields(record);

            // Keywords
            text += this.buildKeywords(record);

            // FAST subjects
            if (this.config.includeFAST) {
                text += this.buildFASTSubjects(record);
            }

            // Literature genre
            if (this.config.includeLiterature && checkExists(record.literature_yes) && checkExists(record.literature_dropdown)) {
                text += '    <genre authority="marcgt">' + LITERATURE_TYPES[record.literature_dropdown] + '</genre>\n';
            }

            // Record info
            text += this.buildRecordInfo(institution_info);

            // End document
            text += '</mods:mods>\n';

            downloadFile(text, 'mods');
        }

        buildTitle(record) {
            let title = record.title;
            // Handle both string and object formats
            if (typeof title === 'object' && title !== null) {
                if (Array.isArray(title) && title.length > 0) {
                    title = title[0];
                }
            }

            let text = '    <titleInfo>\n        <title>';

            if (typeof title === 'object' && title !== null) {
                text += escapeXML(title['title'] || title);
            } else {
                text += escapeXML(title);
            }

            text += '</title>\n';

            // Subtitle if present
            if (typeof title === 'object' && checkExists(title['subtitle'])) {
                text += '        <subTitle>' + escapeXML(title['subtitle']) + '</subTitle>\n';
            }

            text += '    </titleInfo>\n';
            return text;
        }

        buildAuthors(record) {
            let text = '';

            // Primary author - handle both formats
            if (record.author) {
                if (Array.isArray(record.author) && record.author.length > 0) {
                    const author = record.author[0];
                    if (typeof author === 'object' && author !== null) {
                        text += this.fillAuthorMODS(author['family'], author['given'], author['role']);
                    }
                } else if (typeof record.author === 'object') {
                    text += this.fillAuthorMODS(record.author['family'], record.author['given'], record.author['role']);
                }
            }

            // Additional authors
            if (checkExists(record.additional_authors)) {
                for (let i = 0; i < record.additional_authors.length; i++) {
                    const author = record.additional_authors[i];
                    if (Array.isArray(author) && author.length > 0) {
                        text += this.fillAuthorMODS(author[0]['family'], author[0]['given'], author[0]['role']);
                    } else if (typeof author === 'object') {
                        text += this.fillAuthorMODS(author['family'], author['given'], author['role']);
                    }
                }
            }

            // Corporate authors
            if (record.corporate_author) {
                text += this.fillCorporateMODS(record.corporate_author);
            }

            // Additional corporate authors
            const additionalCorp = record.additional_corporate_authors || record.additional_corporate_names;
            if (checkExists(additionalCorp)) {
                for (let i = 0; i < additionalCorp.length; i++) {
                    text += this.fillCorporateMODS(additionalCorp[i]);
                }
            }

            return text;
        }

        buildOriginInfo(record) {
            if (!checkExists(record.publication_country) && !checkExists(record.publication_place) &&
                !checkExists(record.publisher) && !checkExists(record.publication_year) &&
                !checkExists(record.copyright_year) && !checkExists(record.edition)) {
                return '';
            }

            let text = '    <originInfo>\n';

            if (checkExists(record.publication_country)) {
                text += '        <place>\n            <placeTerm type="code" authority="marccountry">' + record.publication_country + '</placeTerm>\n        </place>\n';
            }

            if (checkExists(record.publication_place)) {
                text += '        <place>\n            <placeTerm type="text">' + escapeXML(record.publication_place) + '</placeTerm>\n        </place>\n';
            }

            if (checkExists(record.publisher)) {
                text += '        <publisher>' + escapeXML(record.publisher) + '</publisher>\n';
            }

            if (checkExists(record.publication_year)) {
                text += '        <dateIssued>' + record.publication_year + '</dateIssued>\n';
            }

            if (checkExists(record.copyright_year)) {
                text += '        <copyrightDate>' + record.copyright_year + '</copyrightDate>\n';
            }

            if (checkExists(record.edition)) {
                text += '        <edition>' + escapeXML(record.edition) + '</edition>\n';
            }

            text += '    </originInfo>\n';
            return text;
        }

        buildPhysicalDescription(record) {
            let text = '';

            // Pages/extent
            if (checkExists(record.pages)) {
                text += '    <physicalDescription>\n        <form authority="marcform">print</form>\n';
                text += '        <extent>' + record.pages + ' ' + (record.volume_or_page || 'pages') + '</extent>\n';
                text += '    </physicalDescription>\n';
            } else if (checkExists(record.number_of_pages)) {
                // Theses variant
                text += '    <physicalDescription>\n        <form authority="marcform">print</form>\n';
                text += '        <extent>' + record.number_of_pages + ' ' + (record.leaf_or_page || 'pages') + '</extent>\n';
                text += '    </physicalDescription>\n';
            }

            // Dimensions
            if (checkExists(record.dimensions)) {
                text += '    <physicalDescription>\n        <form authority="marcform">print</form>\n';
                text += '        <extent>' + record.dimensions + ' cm</extent>\n';
                text += '    </physicalDescription>\n';
            }

            return text;
        }

        buildModuleSpecificFields(record) {
            let text = '';

            // Dataset-specific fields
            if (checkExists(record.datecollected)) {
                text += '    <originInfo>\n        <dateCaptured>' + escapeXML(record.datecollected) + '</dateCaptured>\n    </originInfo>\n';
            }

            if (checkExists(record.access_terms)) {
                text += '    <accessCondition displayLabel="Restricted">' + escapeXML(record.access_terms) + '</accessCondition>\n';
            }

            if (checkExists(record.gcoverage)) {
                text += '    <subject>\n        <geographic>' + escapeXML(record.gcoverage) + '</geographic>\n    </subject>\n';
            }

            if (checkExists(record.format)) {
                text += '    <note>' + escapeXML(record.format) + '</note>\n';
            }

            if (checkExists(record.use_terms)) {
                text += '    <accessCondition type="use and reproduction" displayLabel="Restricted">' + escapeXML(record.use_terms) + '</accessCondition>\n';
            }

            if (checkExists(record.daterange)) {
                text += '    <subject>\n        <temporal>' + escapeXML(record.daterange) + '</temporal>\n    </subject>\n';
            }

            // Theses-specific fields
            if (checkExists(record.major)) {
                text += '    <note type="thesis">Thesis (' + escapeXML(record.major) + ')-- University of Illinois at Urbana-Champaign, ' + record.publication_year + '.</note>\n';
            }

            if (checkExists(record.bibliographies)) {
                text += '    <note type="bibliography">' + escapeXML(record.bibliographies) + '.</note>\n';
            }

            return text;
        }

        buildKeywords(record) {
            if (!checkExists(record.keywords) || !Array.isArray(record.keywords)) {
                return '';
            }

            let text = '';
            for (let c = 0; c < record.keywords.length; c++) {
                if (record.keywords[c] !== '') {
                    text += '    <subject>\n        <topic>' + escapeXML(record.keywords[c]) + '</topic>\n    </subject>\n';
                }
            }
            return text;
        }

        buildFASTSubjects(record) {
            if (!checkExists(record.fast) || !Array.isArray(record.fast)) {
                return '';
            }

            let text = '';
            for (let c = 0; c < record.fast.length; c++) {
                const fastEntry = record.fast[c];
                if (Array.isArray(fastEntry) && fastEntry.length >= 3) {
                    const typeCode = fastEntry[2].substring(1);
                    text += '    <subject>\n        <' + FAST_TYPES[typeCode] + ' authority="FAST" authorityURI="http://fast.oclc.org/" valueURI="http://id.worldcat.org/fast/' + escapeXML(fastEntry[1]) + '"/>\n    </subject>\n';
                }
            }
            return text;
        }

        buildRecordInfo(institution_info) {
            const timestamp = getTimestamp();
            const formatted_date = timestamp.substring(2, 8);

            let text = '    <recordInfo>\n';
            text += '        <descriptionStandard>rda</descriptionStandard>\n';
            text += '        <recordContentSource authority="marcorg">' + escapeXML(institution_info['mods']['recordContentSource']) + '</recordContentSource>\n';
            text += '        <recordCreationDate encoding="marc">' + formatted_date + '</recordCreationDate>\n';
            text += '    </recordInfo>\n';

            return text;
        }
    }

    return ModsBuilder;
}));
