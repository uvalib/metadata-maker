import { ThesesMarcBuilder } from '../shared/variants/thesesMarcBuilder.js';

describe('ThesesMarcBuilder', () => {
  let builder;

  beforeEach(() => {
    builder = new ThesesMarcBuilder();

    global.getTimestamp = jest.fn(() => '20240101123456');
    global.checkExists = (value) => {
      if (Array.isArray(value)) {
        return value.length > 0;
      }
      return value !== undefined && value !== null && value !== '';
    };
    global.downloadFile = jest.fn();
    global.escapeXML = (value) => value;
  });

  afterEach(() => {
    delete global.getTimestamp;
    delete global.checkExists;
    delete global.downloadFile;
    delete global.escapeXML;
  });

  test('create008Field assembles theses-specific control data', () => {
    const record = {
      publication_year: '2023',
      copyright_year: '2024',
      illustrations_yes: true,
      literature_yes: true,
      literature_dropdown: '1',
      language: 'eng'
    };

    const field = builder.create008Field(record);

    expect(field).toHaveLength(40);
    expect(field.slice(0, 6)).toBe('240101');
    expect(field[6]).toBe('t');
    expect(field.slice(7, 11)).toBe('2023');
    expect(field.slice(11, 15)).toBe('2024');
    expect(field[18]).toBe('a');
    expect(field[33]).toBe('1');
    expect(field.slice(35, 38)).toBe('eng');
    expect(field[39]).toBe('d');
  });

  test('fillTitle uses nonfiling indicator for English leading articles', () => {
    const record = {
      title: 'The Testing Manual',
      language: 'eng',
      author: {
        family: 'Doe'
      }
    };

    const titleField = builder.fillTitle(
      record,
      null,
      builder.createMARCXMLField.bind(builder),
      builder.createMARCXMLSubfield.bind(builder)
    );

    expect(titleField).toContain('datafield tag="245" ind1="1" ind2="4"');
    expect(titleField).toContain('The Testing Manual.');
  });

  test('fillBibliography pluralizes label when range is provided', () => {
    const record = {
      bibliographies: '10-12'
    };

    const bibliographyField = builder.fillBibliography(
      record,
      null,
      builder.createMARCXMLField.bind(builder),
      builder.createMARCXMLSubfield.bind(builder)
    );

    expect(bibliographyField).toContain('Includes bibliographical references (pages 10-12).');
  });

  test('fillAbstract emits a MARC 520 field with the provided summary', () => {
    const record = {
      abstract: 'Concise summary of research findings.'
    };

    const abstractField = builder.fillAbstract(
      record,
      null,
      builder.createMARCXMLField.bind(builder),
      builder.createMARCXMLSubfield.bind(builder)
    );

    expect(abstractField).toContain('datafield tag="520" ind1=" " ind2=" "');
    expect(abstractField).toContain('<subfield code="a">Concise summary of research findings.</subfield>');
  });
});
