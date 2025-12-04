
// Mock browser globals
global.window = {};
global.document = {
    createElement: () => ({ click: () => { }, setAttribute: () => { } }),
    body: { appendChild: () => { }, removeChild: () => { } }
};
global.URL = { createObjectURL: () => 'blob:url', revokeObjectURL: () => { } };

// Mock downloadFile to just log the content
global.downloadFile = (content, type, filename) => {
    console.log('--- GENERATED XML START ---');
    console.log(content);
    console.log('--- GENERATED XML END ---');
};

global.getTimestamp = () => '20250101';

// Load the function
const fs = require('fs');
const path = require('path');
const downloadEADPath = path.join(__dirname, 'metadatamaker/downloadEAD.js');
const downloadEADContent = fs.readFileSync(downloadEADPath, 'utf8');
eval(downloadEADContent);

// Test Data
const record = {
    identifier: 'MS 123',
    level: 'series',
    collection_title: 'The Great Collection',
    collection_identifier: 'Coll-001',
    parent_identifier: 'Parent-99',
    title: [{ title: 'Series 1: Correspondence' }],
    coverage_start: '1900',
    coverage_end: '1950',
    coverage_type: 'inclusive',
    location_within_collection: 'Box 1',
    languages: ['eng'],
    extent: [{ text: '50', units: 'letters' }],
    dimensions: { value: '1.5', units: 'linear ft.' },
    containers: [{ type: 'box', label: '1' }, { type: 'folder', label: '1-10' }],
    descriptions: [
        { type: 'bioghist', text: 'Born in 1880.' },
        { type: 'scopecontent', text: 'Contains letters.' }
    ],
    references: ['Ref 1'],
    notes: ['General note.'],
    subjects: [
        { term: 'History', type: 'topic', source: 'lcsh' },
        { term: 'Smith, John', type: 'persName', source: 'naf' }
    ],
    originators_personal: [
        { family: 'Doe', given: 'Jane', birth: '1890', death: '1960' }
    ],
    originators_corporate: [
        { name: 'Acme Corp', start: '1920', end: '1980' }
    ]
};

const institution_info = {
    html: { name: 'University of Virginia' },
    mods: { physicalLocation: 'Albert and Shirley Small Special Collections Library' }
};

// Run
downloadEAD(record, institution_info);
