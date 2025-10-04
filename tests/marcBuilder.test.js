import { MarcBuilder } from '../shared/marcBuilder.js';

describe('MarcBuilder create008Field illustration codes', () => {
  let builder;

  beforeEach(() => {
    builder = new MarcBuilder();

    global.getTimestamp = jest.fn(() => '20250101123456');
    global.checkExists = (value) => {
      if (Array.isArray(value)) {
        return value.length > 0;
      }
      return value !== undefined && value !== null && value !== '';
    };
  });

  afterEach(() => {
    delete global.getTimestamp;
    delete global.checkExists;
  });

  test('populates positions 18-21 with selected illustration codes', () => {
    const record = {
      publication_year: '2025',
      publication_country: 'vau',
      language: 'eng',
      illustrations_codes: ['a', 'b', 'c']
    };

    const field = builder.create008Field(record);

    expect(field.slice(18, 22)).toBe('abc ');
  });

  test('defaults to code a when legacy boolean flag is true', () => {
    const record = {
      publication_year: '2025',
      publication_country: 'vau',
      language: 'eng',
      illustrations_yes: true
    };

    const field = builder.create008Field(record);

    expect(field.slice(18, 22)).toBe('a   ');
  });
});
