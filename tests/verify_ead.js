
const fs = require('fs');

// Mock window and document
global.window = {};
global.document = {
    getElementById: () => null,
    createElement: () => ({ style: {} }),
    body: { appendChild: () => { } }
};

// Mock downloadFile
global.downloadFile = (content, type, filename) => {
    console.log('--- GENERATED XML ---');
    console.log(content);
    console.log('---------------------');
};

// Mock getTimestamp
global.getTimestamp = () => '20231027';

// Load the function
const downloadEADContent = fs.readFileSync('/Users/dhc4z/workspace/metadata-maker/collections/metadatamaker/downloadEAD.js', 'utf8');
eval(downloadEADContent);

// Mock Data
const record = {
    identifier: '12345',
    level: 'series',
    collection_title: 'My Collection',
    collection_identifier: 'C001',
    parent_identifier: 'P001',
    title: [{ title: 'Series Title' }],
    coverage_start: '2000',
    coverage_end: '2020',
    coverage_type: 'inclusive',
    dimensions: { value: '1.5', units: 'linear ft.' },
    extent: [{ text: '100 letters', units: 'letters' }],
    languages: ['English'],
    originators_personal: [{ family: 'Doe', given: 'John', birth: '1900', death: '1980' }],
    originators_corporate: [{ name: 'Corp Inc.', start: '1950', end: '2000' }],
    containers: [{ type: 'Box', label: '1' }],
    descriptions: [{ type: 'bioghist', text: 'Bio info here.' }],
    subjects: [{ term: 'Art', type: 'topic', source: 'lcsh' }],
    notes: ['General note.']
};

const institution_info = {
    html: { name: 'My Repository' },
    mods: { physicalLocation: 'My Location' }
};

// Run
window.downloadEAD(record, institution_info);
