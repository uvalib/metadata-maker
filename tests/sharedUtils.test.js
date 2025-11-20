/**
 * Tests for shared utilities module
 */

import { get, generateInstitutionInfo, find100, find110, checkExists } from '../shared/sharedUtils.js';

describe('checkExists', () => {
    test('returns true for non-empty string', () => {
        expect(checkExists('hello')).toBe(true);
    });

    test('returns false for empty string', () => {
        expect(checkExists('')).toBe(false);
    });

    test('returns false for null', () => {
        expect(checkExists(null)).toBe(false);
    });

    test('returns false for undefined', () => {
        expect(checkExists(undefined)).toBe(false);
    });

    test('returns true for number', () => {
        expect(checkExists(0)).toBe(true);
        expect(checkExists(42)).toBe(true);
    });

    test('returns true for array', () => {
        expect(checkExists([1, 2, 3])).toBe(true);
    });

    test('returns true for object', () => {
        expect(checkExists({ key: 'value' })).toBe(true);
    });
});

describe('get', () => {
    beforeEach(() => {
        // Mock location.search
        delete global.location;
    });

    test('returns parameter value when present', () => {
        global.location = { search: '?marc=ViU&physicalLocation=UVA%20Library' };
        expect(get('marc')).toBe('ViU');
    });

    test('decodes URL-encoded values', () => {
        global.location = { search: '?physicalLocation=University%20of%20Virginia%20Library' };
        expect(get('physicalLocation')).toBe('University of Virginia Library');
    });

    test('returns undefined for missing parameter', () => {
        global.location = { search: '?marc=ViU' };
        expect(get('missing')).toBeUndefined();
    });

    test('returns undefined for empty query string', () => {
        global.location = { search: '' };
        expect(get('marc')).toBeUndefined();
    });

    test('handles ampersand-separated parameters', () => {
        global.location = { search: '?first=1&second=2&third=3' };
        expect(get('second')).toBe('2');
    });
});

describe('generateInstitutionInfo', () => {
    beforeEach(() => {
        delete global.location;
        global.location = { search: '' };
    });

    test('returns default UVA values when no URL params', () => {
        const info = generateInstitutionInfo();
        expect(info.marc).toBe('ViU');
        expect(info.mods.physicalLocation).toBe('University of Virginia. Library');
        expect(info.mods.recordContentSource).toBe('ViU');
        expect(info.html.url).toBe('https://id.loc.gov/authorities/names/n79127895');
        expect(info.html.name).toBe('University of Virginia');
    });

    test('overrides marc code from URL', () => {
        global.location = { search: '?marc=ABC' };
        const info = generateInstitutionInfo();
        expect(info.marc).toBe('ABC');
    });

    test('overrides physical location from URL', () => {
        global.location = { search: '?physicalLocation=Test%20Library' };
        const info = generateInstitutionInfo();
        expect(info.mods.physicalLocation).toBe('Test Library');
    });

    test('overrides record content source from URL', () => {
        global.location = { search: '?recordContentSource=XYZ' };
        const info = generateInstitutionInfo();
        expect(info.mods.recordContentSource).toBe('XYZ');
    });

    test('constructs LC URL from lcn parameter', () => {
        global.location = { search: '?lcn=n12345678' };
        const info = generateInstitutionInfo();
        expect(info.html.url).toBe('https://id.loc.gov/authorities/names/n12345678');
    });

    test('overrides institution name from URL', () => {
        global.location = { search: '?n=Test%20University' };
        const info = generateInstitutionInfo();
        expect(info.html.name).toBe('Test University');
    });

    test('handles multiple URL parameters', () => {
        global.location = { search: '?marc=ABC&physicalLocation=Test%20Library&n=Test%20Univ' };
        const info = generateInstitutionInfo();
        expect(info.marc).toBe('ABC');
        expect(info.mods.physicalLocation).toBe('Test Library');
        expect(info.html.name).toBe('Test Univ');
    });
});

describe('find100', () => {
    test('selects first author when present', () => {
        const list = [
            [{ family: 'Smith', given: 'John', role: 'aut' }, { family: '', given: '' }],
            [{ family: 'Doe', given: 'Jane', role: 'aut' }, { family: '', given: '' }],
            [{ family: 'Artist', given: 'Bob', role: 'art' }, { family: '', given: '' }]
        ];
        const result = find100(list);
        expect(result[0][0].family).toBe('Smith');
        expect(result[0][0].role).toBe('aut');
        expect(list.length).toBe(2); // Original list should have one item removed
    });

    test('selects first artist when no author', () => {
        const list = [
            [{ family: 'Smith', given: 'John', role: 'ctb' }, { family: '', given: '' }],
            [{ family: 'Artist', given: 'Bob', role: 'art' }, { family: '', given: '' }]
        ];
        const result = find100(list);
        expect(result[0][0].family).toBe('Artist');
        expect(result[0][0].role).toBe('art');
    });

    test('returns empty entry when no author or artist', () => {
        const list = [
            [{ family: 'Smith', given: 'John', role: 'ctb' }, { family: '', given: '' }],
            [{ family: 'Doe', given: 'Jane', role: 'edt' }, { family: '', given: '' }]
        ];
        const result = find100(list);
        expect(result[0][0].family).toBe('');
        expect(result[0][0].given).toBe('');
        expect(result[0][0].role).toBe('');
        expect(list.length).toBe(2); // Original list unchanged
    });

    test('prioritizes author over artist', () => {
        const list = [
            [{ family: 'Artist', given: 'Bob', role: 'art' }, { family: '', given: '' }],
            [{ family: 'Author', given: 'Alice', role: 'aut' }, { family: '', given: '' }]
        ];
        const result = find100(list);
        expect(result[0][0].family).toBe('Author');
        expect(result[0][0].role).toBe('aut');
    });

    test('handles empty list', () => {
        const list = [];
        const result = find100(list);
        expect(result[0][0].family).toBe('');
    });
});

describe('find110', () => {
    test('selects first creator with corporate name', () => {
        const list = [
            [{ corporate: 'Company A', role: 'ctb' }, { corporate: '' }],
            [{ corporate: 'Company B', role: 'cre' }, { corporate: '' }],
            [{ corporate: 'Company C', role: 'cre' }, { corporate: '' }]
        ];
        const result = find110(list);
        expect(result[0].corporate).toBe('Company B');
        expect(result[0].role).toBe('cre');
        expect(list.length).toBe(2);
    });

    test('selects any corporate entry when no creator', () => {
        const list = [
            [{ corporate: 'Company A', role: 'ctb' }, { corporate: '' }],
            [{ corporate: 'Company B', role: 'ctb' }, { corporate: '' }]
        ];
        const result = find110(list);
        expect(result[0].corporate).toBe('Company A');
    });

    test('returns empty entry when no corporate entries', () => {
        const list = [];
        const result = find110(list);
        expect(result.corporate).toBe('');
        expect(result.role).toBe('');
    });

    test('skips entries without corporate name', () => {
        const list = [
            [{ corporate: '', role: 'cre' }, { corporate: '' }],
            [{ corporate: 'Company A', role: 'cre' }, { corporate: '' }]
        ];
        const result = find110(list);
        expect(result[0].corporate).toBe('Company A');
    });

    test('prioritizes creator over contributor', () => {
        const list = [
            [{ corporate: 'Company A', role: 'ctb' }, { corporate: '' }],
            [{ corporate: 'Company B', role: 'cre' }, { corporate: '' }]
        ];
        const result = find110(list);
        expect(result[0].corporate).toBe('Company B');
        expect(result[0].role).toBe('cre');
    });
});
