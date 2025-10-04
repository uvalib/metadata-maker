import { ScoresMarcBuilder } from '../shared/variants/scoresMarcBuilder.js';

describe('ScoresMarcBuilder 336 field', () => {
  let builder;

  beforeEach(() => {
    builder = new ScoresMarcBuilder();

    global.getTimestamp = jest.fn(() => '20250101123456');
    global.checkExists = (value) => {
      if (Array.isArray(value)) {
        return value.length > 0;
      }
      return value !== undefined && value !== null && value !== '';
    };
    global.downloadFile = jest.fn();
  });

  afterEach(() => {
    delete global.getTimestamp;
    delete global.checkExists;
    delete global.downloadFile;
  });

  test('downloadXML emits notated music 336 field', () => {
    const record = {
      title: [
        { title: 'Sample score', subtitle: '' },
        {}
      ],
      author: [
        { family: 'Doe', given: 'Jane', role: 'cmp' },
        {}
      ],
      additional_authors: [],
      additional_corporate_authors: [],
      corporate_author: [],
      publication_year: '2024',
      copyright_year: '2024',
      publication_country: 'vau',
      publisher: 'Example Press',
      publication_place: 'Charlottesville',
      language: 'eng',
      composition_form: 'an',
      score_format: 'a',
      accompanying_matters: [],
      transposition_arrangement: '#',
      dimensions: '30',
      pages: '10',
      volume_or_page: 'pages',
      literature_yes: false,
      literature_dropdown: '0',
      physical_form_code: '|',
      contents: '',
      notes: '',
      formatted_contents_note: '',
      keywords: [],
      fast: [],
      additional_corporate_names: [],
      illustrations_yes: false
    };

    builder.downloadXML(record, { marc: 'ViU' });

    const output = global.downloadFile.mock.calls[0][0];
    expect(output).toContain('<datafield tag="336" ind1=" " ind2=" ">' );
    expect(output).toContain('<subfield code="a">notated music</subfield>');
    expect(output).toContain('<subfield code="b">ntm</subfield>');
  });
});
