/**
 * Shared utility functions used across all MetadataMaker modules.
 * These functions are extracted from duplicated submitForm.js files.
 * 
 * This module works both as an ES6 module (for tests) and as a browser global (for HTML script tags).
 */

(function (root, factory) {
  // UMD pattern: works as ES6 module, AMD, CommonJS, or browser global
  if (typeof exports === 'object' && typeof module !== 'undefined') {
    // CommonJS/Node.js
    factory(exports);
  } else if (typeof define === 'function' && define.amd) {
    // AMD
    define(['exports'], factory);
  } else {
    // Browser globals
    factory((root.SharedUtils = {}));
  }
}(typeof self !== 'undefined' ? self : this, function (exports) {
  'use strict';

  /**
   * Reads a URL parameter by name and returns its value.
   * Used for passing custom institution info via URL.
   * 
   * @param {string} name - The name of the URL parameter to retrieve
   * @returns {string|undefined} The decoded parameter value, or undefined if not found
   * 
   * @example
   * // URL: ?marc=ViU&physicalLocation=University%20of%20Virginia
   * get('marc') // returns 'ViU'
   * get('missing') // returns undefined
   */
  function get(name) {
    if (name = (new RegExp('[?&]' + encodeURIComponent(name) + '=([^&]*)').exec(location.search))) {
      return decodeURIComponent(name[1]);
    }
  }

  /**
   * Generates institution information with default values for University of Virginia.
   * Checks URL parameters for custom institution values and overrides defaults if found.
   * 
   * @returns {Object} Institution info with marc, mods, and html properties
   * 
   * URL parameters supported:
   * - marc: MARC organization code (040 $a, 040 $c)
   * - physicalLocation: Physical location string for MODS
   * - recordContentSource: Record content source for MODS
   * - lcn: LC authority number (constructs URL)
   * - n: Institution name for HTML
   * 
   * @example
   * generateInstitutionInfo()
   * // Returns: { marc: 'ViU', mods: {...}, html: {...} }
   */
  function generateInstitutionInfo() {
    const output = {
      // 040 $a, 040 $c
      marc: 'ViU',
      mods: {
        physicalLocation: 'University of Virginia. Library',
        recordContentSource: 'ViU'
      },
      // "seller" info
      html: {
        url: 'https://id.loc.gov/authorities/names/n79127895',
        name: 'University of Virginia'
      }
    };

    const marc = get('marc');
    if (typeof marc !== 'undefined') {
      output['marc'] = marc;
    }

    const physicalLocation = get('physicalLocation');
    if (typeof physicalLocation !== 'undefined') {
      output['mods']['physicalLocation'] = physicalLocation;
    }

    const recordContentSource = get('recordContentSource');
    if (typeof recordContentSource !== 'undefined') {
      output['mods']['recordContentSource'] = recordContentSource;
    }

    const lcn = get('lcn');
    if (typeof lcn !== 'undefined') {
      output['html']['url'] = 'https://id.loc.gov/authorities/names/' + lcn;
    }

    const n = get('n');
    if (typeof n !== 'undefined') {
      output['html']['name'] = n;
    }

    return output;
  }

  /**
   * Finds and extracts the first author or artist from a list for MARC field 100.
   * Priority: author (aut) > artist (art)
   * 
   * @param {Array} list - List of people, each containing [name_data, translit_data]
   * @returns {Array} The selected entry (removed from list), or empty entry if none found
   * 
   * Each person entry structure:
   * [
   *   { family: 'Doe', given: 'John', role: 'aut' },
   *   { family: '', given: '' } // transliterated (optional)
   * ]
   */
  function find100(list) {
    // First, look for an author
    for (let iterator = 0; iterator < list.length; iterator++) {
      if (list[iterator][0]['role'] === 'aut') {
        return list.splice(iterator, 1);
      }
    }

    // If no author, look for an artist
    for (let iterator = 0; iterator < list.length; iterator++) {
      if (list[iterator][0]['role'] === 'art') {
        return list.splice(iterator, 1);
      }
    }

    // Return empty entry if no author or artist found
    return [[{ 'family': '', 'given': '', 'role': '' }, { 'family': '', 'given': '' }]];
  }

  /**
   * Finds and extracts the first corporate creator from a list for MARC field 110.
   * Priority: creator (cre) with corporate name > any entry with corporate name
   * 
   * @param {Array} list - List of corporate entries
   * @returns {Array} The selected corporate entry, or empty entry if none found
   * 
   * Corporate entry structure:
   * [
   *   { corporate: 'Organization Name', role: 'cre' },
   *   { corporate: '' } // transliterated (optional)
   * ]
   */
  function find110(list) {
    // First, look for a creator with corporate name
    for (let iterator = 0; iterator < list.length; iterator++) {
      if (checkExists(list[iterator]) &&
        checkExists(list[iterator][0]) &&
        list[iterator][0]['role'] === 'cre' &&
        checkExists(list[iterator][0]['corporate'])) {
        return list.splice(iterator, 1);
      }
    }

    // If no creator, look for any corporate entry
    for (let iterator = 0; iterator < list.length; iterator++) {
      if (checkExists(list[iterator]) &&
        checkExists(list[iterator][0]) &&
        checkExists(list[iterator][0]['corporate'])) {
        return list.splice(iterator, 1);
      }
    }

    // Return empty entry if no corporate author found
    return [{ 'corporate': '', 'role': '' }, { 'corporate': '' }];
  }

  /**
   * Checks if a value exists and is not empty.
   * 
   * @param {*} attr - The value to check
   * @returns {boolean} True if value exists and is not empty, false otherwise
   * 
   * @example
   * checkExists('hello') // true
   * checkExists('') // false
   * checkExists(null) // false
   * checkExists(undefined) // false
   * checkExists([1, 2, 3]) // true (arrays are truthy)
   */
  function checkExists(attr) {
    return typeof attr !== 'undefined' && attr !== '' && attr !== null;
  }

  // Export for ES6 modules (tests)
  exports.get = get;
  exports.generateInstitutionInfo = generateInstitutionInfo;
  exports.find100 = find100;
  exports.find110 = find110;
  exports.checkExists = checkExists;

  // Also make available globally for backward compatibility
  if (typeof window !== 'undefined') {
    window.get = get;
    window.generateInstitutionInfo = generateInstitutionInfo;
    window.find100 = find100;
    window.find110 = find110;
    window.checkExists = checkExists;
  }
}));
