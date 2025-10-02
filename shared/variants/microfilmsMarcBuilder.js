import { MarcBuilder } from '../marcBuilder.js';

const FREQUENCY_MAPPINGS = {
  '#': 'No determinable frequency',
  a: 'Annual',
  b: 'Bimonthly',
  c: 'Semiweekly',
  d: 'Daily',
  e: 'Biweekly',
  f: 'Semiannual',
  g: 'Biennial',
  h: 'Triennial',
  i: 'Three times a week',
  j: 'Three times a month',
  k: 'Continuously updated',
  m: 'Monthly',
  q: 'Quarterly',
  s: 'Semimonthly',
  t: 'Three times a year',
  u: 'Unknown',
  w: 'Weekly',
  z: 'Other',
  n: 'Normalized irregular',
  r: 'Regular',
  x: 'Completely irregular',
  '|': 'No attempt to code'
};

export class MicrofilmsMarcBuilder extends MarcBuilder {
  constructor(options = {}) {
    super({
      marcLeaderType: 'nas',
      xmlLeaderType: 'nas',
      ...options
    });
  }

  create006Field(record) {
    const field = new Array(18).fill(' ');
    field[0] = 's';

    if (checkExists(record.current_publication_frequency)) {
      field[1] = record.current_publication_frequency;
    }

    if (checkExists(record.regularity)) {
      field[2] = record.regularity;
    }

    field[12] = '0';
    field[17] = '0';

    return field.join('');
  }

  create008Field(record) {
    const field = new Array(40).fill(' ');
    let timestamp = getTimestamp();
    timestamp = timestamp.substring(2, 8);

    for (let i = 0; i < 6; i++) {
      field[i] = timestamp[i];
    }

    if (checkExists(record.publication_status)) {
      field[6] = record.publication_status;
    }

    let yearOne = 'uuuu';
    if (checkExists(record.starting_year)) {
      yearOne = record.starting_year;
      while (yearOne.length < 4) {
        yearOne += 'u';
      }
    }

    let yearTwo = 'uuuu';
    if (checkExists(record.publication_status) && record.publication_status === 'c') {
      yearTwo = '9999';
    } else if (checkExists(record.ending_year)) {
      yearTwo = record.ending_year;
      while (yearTwo.length < 4) {
        yearTwo += 'u';
      }
    }

    for (let i = 7; i < 11; i++) {
      field[i] = yearOne[i - 7];
    }

    for (let i = 11; i < 15; i++) {
      field[i] = yearTwo[i - 11];
    }

    if (checkExists(record.publication_country)) {
      for (let i = 15; i < 15 + record.publication_country.length; i++) {
        field[i] = record.publication_country[i - 15];
      }
    } else {
      field[15] = 'x';
      field[16] = 'x';
    }

    if (checkExists(record.current_publication_frequency)) {
      field[18] = record.current_publication_frequency;
    }

    if (checkExists(record.regularity)) {
      field[19] = record.regularity;
    }

    if (checkExists(record.resource_type)) {
      field[21] = record.resource_type;
    }

    if (checkExists(record.government_publication_yes) && record.government_publication_yes === true) {
      field[28] = 'f';
    }

    field[29] = '0';
    field[30] = '0';
    field[31] = '0';
    field[34] = '0';

    if (checkExists(record.language)) {
      for (let i = 35; i < 38 && record.language.length === 3; i++) {
        field[i] = record.language[i - 35];
      }
    }
    field[39] = 'd';

    return field.join('');
  }

  fillISSN(record, head, fieldFunc, subfieldFunc) {
    if (checkExists(record.issn)) {
      const issn = fieldFunc('022', ' ', ' ', [subfieldFunc('a', record.issn)]);
      return this.returnSingleEntry('022', issn, head);
    }
    return head !== null ? ['', ''] : '';
  }

  fillCorporateAuthor(record, head, fieldFunc, subfieldFunc) {
    if (!checkExists(record.corporate_author)) {
      return head !== null ? ['', ''] : '';
    }

    const corporateArray = Array.isArray(record.corporate_author)
      ? record.corporate_author
      : [record.corporate_author];

    const primary = corporateArray[0] || {};
    const translitEntry = corporateArray[1];
    const latinIndex = checkExists(translitEntry) && checkExists(translitEntry['corporate']) ? 1 : 0;
    const entry = corporateArray[latinIndex] || primary;

    if (!checkExists(entry) || !checkExists(entry['corporate'])) {
      return head !== null ? ['', ''] : '';
    }

    const roleIndex = { cre: 'creator', ctb: 'contributor' };
    const role = primary['role'] || 'cre';

    const subfields = [
      subfieldFunc('a', entry['corporate']),
      subfieldFunc('e', `${roleIndex[role] || 'creator'}.`),
      subfieldFunc('4', role)
    ];

    if (latinIndex === 1) {
      subfields.push(subfieldFunc('6', '880-04'));
    }

    const author = fieldFunc('110', '1', ' ', subfields);
    return this.returnSingleEntry('110', author, head);
  }

  fillTitle(record, head, fieldFunc, subfieldFunc) {
    if (!checkExists(record.title) || !Array.isArray(record.title) || !checkExists(record.title[0])) {
      return head !== null ? ['', ''] : '';
    }

    const latinIndex = checkExists(record.title[1]) &&
      (checkExists(record.title[1]['title']) || checkExists(record.title[1]['subtitle'])) ? 1 : 0;

    const baseEntry = record.title[latinIndex] || record.title[0];
    if (!checkExists(baseEntry['title'])) {
      return head !== null ? ['', ''] : '';
    }

    let titleInd2 = '0';
    if ((record.language === 'eng' || record.language === 'fre') && checkExists(baseEntry['title'])) {
      titleInd2 = this.getNonfilingCount(baseEntry['title'], record.language);
    }

    const subfields = [];
    if (checkExists(record.title[0]['subtitle'])) {
      const subtitleEntry = checkExists(record.title[latinIndex]['subtitle'])
        ? record.title[latinIndex]['subtitle']
        : record.title[0]['subtitle'];
      subfields.push(subfieldFunc('a', `${baseEntry['title']} :`));
      subfields.push(subfieldFunc('b', `${subtitleEntry}.`));
    } else {
      subfields.push(subfieldFunc('a', `${baseEntry['title']}.`));
    }

    if (latinIndex === 1) {
      subfields.push(subfieldFunc('6', '880-01'));
    }

    const title = fieldFunc('245', '0', titleInd2, subfields);
    return this.returnSingleEntry('245', title, head);
  }

  fillVaryingTitle(record, head, fieldFunc, subfieldFunc) {
    if (checkExists(record.varying_title_type) && record.varying_title_type !== '' && checkExists(record.varying_title)) {
      const ind1 = record.varying_title_type === 'other' ? '1' : '3';
      const ind2 = record.varying_title_type === 'other' ? '3' : '1';
      const varyingTitle = fieldFunc('246', ind1, ind2, [subfieldFunc('a', record.varying_title)]);
      return this.returnSingleEntry('246', varyingTitle, head);
    }
    return head !== null ? ['', ''] : '';
  }

  fillPublication(record, head, fieldFunc, subfieldFunc) {
    const subfields = [];

    if (checkExists(record.publication_place)) {
      if (checkExists(record.translit_place)) {
        subfields.push(subfieldFunc('a', `${record.translit_place} :`));
      } else {
        subfields.push(subfieldFunc('a', `${record.publication_place} :`));
      }
    } else {
      subfields.push(subfieldFunc('a', '[Place of publication not identified] :'));
    }

    if (checkExists(record.publisher)) {
      if (checkExists(record.translit_publisher)) {
        subfields.push(subfieldFunc('b', `${record.translit_publisher},`));
      } else {
        subfields.push(subfieldFunc('b', `${record.publisher},`));
      }
    } else {
      subfields.push(subfieldFunc('b', '[publisher not identified],'));
    }

    if (checkExists(record.publication_year)) {
      subfields.push(subfieldFunc('c', `${record.publication_year}-`));
    } else {
      subfields.push(subfieldFunc('c', '[date of publication not identified]'));
    }

    if (checkExists(record.translit_publisher) || checkExists(record.translit_place)) {
      subfields.push(subfieldFunc('6', '880-02'));
    }

    const publication = fieldFunc('264', ' ', '1', subfields);
    return this.returnSingleEntry('264', publication, head);
  }

  fillPhysical(record, head, fieldFunc, subfieldFunc) {
    const subfields = [];
    let pagesString = 'volumes';

    if (checkExists(record.publication_status)) {
      if (record.publication_status !== 'current' && checkExists(record.volumes)) {
        pagesString = `${record.volumes} volumes`;
      }
    } else if (checkExists(record.volumes)) {
      pagesString = `${record.volumes} volumes`;
    }

    subfields.push(subfieldFunc('a', `${pagesString} ;`));

    if (checkExists(record.dimensions)) {
      subfields.push(subfieldFunc('c', `${record.dimensions} cm`));
    }

    const physical = fieldFunc('300', ' ', ' ', subfields);
    return this.returnSingleEntry('300', physical, head);
  }

  fillPublicationFrequency(record, head, fieldFunc, subfieldFunc) {
    if (checkExists(record.current_publication_frequency)) {
      const code = record.current_publication_frequency;
      const label = FREQUENCY_MAPPINGS[code];
      if (checkExists(label)) {
        const frequency = fieldFunc('310', ' ', ' ', [subfieldFunc('a', label)]);
        return this.returnSingleEntry('310', frequency, head);
      }
    }
    return head !== null ? ['', ''] : '';
  }

  fillDatesOfPublication(record, head, fieldFunc, subfieldFunc) {
    if (checkExists(record.starting_year) || checkExists(record.ending_year)) {
      let dateRange = '';
      if (checkExists(record.starting_year)) {
        dateRange += record.starting_year;
      }
      dateRange += '-';
      if (checkExists(record.ending_year)) {
        dateRange += `${record.ending_year}.`;
      }

      const dates = fieldFunc('362', '0', ' ', [subfieldFunc('a', dateRange)]);
      return this.returnSingleEntry('362', dates, head);
    }
    return head !== null ? ['', ''] : '';
  }

  fillDescription(record, head, fieldFunc, subfieldFunc) {
    if (checkExists(record.description)) {
      const description = fieldFunc('500', ' ', ' ', [subfieldFunc('a', record.description)]);
      return this.returnSingleEntry('500', description, head);
    }
    return head !== null ? ['', ''] : '';
  }

  fillAdditionalCorporateNames(record, head, fieldFunc, subfieldFunc) {
    if (checkExists(record.additional_corporate_names)) {
      let authors = '';
      let directory = '';
      let translitCounter = 5;

      if (checkExists(record.additional_authors)) {
        translitCounter += record.additional_authors.length;
      }

      const roleIndex = { cre: 'creator', ctb: 'contributor' };

      for (let i = 0; i < record.additional_corporate_names.length; i++) {
        const corpEntry = record.additional_corporate_names[i];
        if (!checkExists(corpEntry) || !checkExists(corpEntry[0]) || !checkExists(corpEntry[0]['corporate'])) {
          continue;
        }

        const latinIndex = checkExists(corpEntry[1]) && checkExists(corpEntry[1]['corporate']) ? 1 : 0;
        const role = corpEntry[0]['role'] || 'cre';
        const subfields = [
          subfieldFunc('a', corpEntry[latinIndex]['corporate']),
          subfieldFunc('e', `${roleIndex[role] || 'creator'}.`),
          subfieldFunc('4', role)
        ];

        if (latinIndex === 1) {
          const translitIndex = translitCounter < 10 ? `0${translitCounter}` : `${translitCounter}`;
          subfields.push(subfieldFunc('6', `880-${translitIndex}`));
          translitCounter++;
        }

        const newContent = fieldFunc('710', '1', ' ', subfields);
        authors += newContent;

        if (head !== null) {
          const newDirectory = this.createDirectory('710', newContent, head);
          head += this.getByteLength(newContent);
          directory += newDirectory;
        }
      }

      return this.returnMultipleEntries(directory, authors, head);
    }

    return head !== null ? ['', '', head] : '';
  }

  fillPrecedingTitle(record, head, fieldFunc, subfieldFunc) {
    if (checkExists(record.preceding_title) && checkExists(record.relationship_with_preceding_title)) {
      const preceding = fieldFunc('780', '0', record.relationship_with_preceding_title, [
        subfieldFunc('t', record.preceding_title)
      ]);
      return this.returnSingleEntry('780', preceding, head);
    }
    return head !== null ? ['', ''] : '';
  }

  fillSucceedingTitle(record, head, fieldFunc, subfieldFunc) {
    if (checkExists(record.succeeding_title) && checkExists(record.relationship_with_succeeding_title)) {
      const succeeding = fieldFunc('785', '0', record.relationship_with_succeeding_title, [
        subfieldFunc('t', record.succeeding_title)
      ]);
      return this.returnSingleEntry('785', succeeding, head);
    }
    return head !== null ? ['', ''] : '';
  }

  fillWebURL(record, head, fieldFunc, subfieldFunc) {
    if (checkExists(record.web_url)) {
      const formattedUrl = record.web_url.startsWith('http') ? record.web_url : `http://${record.web_url}`;
      const urlField = fieldFunc('856', '4', '1', [subfieldFunc('u', formattedUrl)]);
      return this.returnSingleEntry('856', urlField, head);
    }
    return head !== null ? ['', ''] : '';
  }

  fillTranslitTitle(record, head, fieldFunc, subfieldFunc) {
    if (checkExists(record.title) && checkExists(record.title[1]) && checkExists(record.title[1]['title'])) {
      const subfields = [subfieldFunc('6', '245-01')];
      if (checkExists(record.title[1]['subtitle'])) {
        subfields.push(subfieldFunc('a', `${record.title[0]['title']} :`));
        subfields.push(subfieldFunc('b', `${record.title[0]['subtitle']}.`));
      } else {
        subfields.push(subfieldFunc('a', `${record.title[0]['title']}.`));
      }

      const title880 = fieldFunc('880', '0', '0', subfields);
      return this.returnSingleEntry('880', title880, head);
    }
    return head !== null ? ['', ''] : '';
  }

  fillTranslitPublisher(record, head, fieldFunc, subfieldFunc) {
    if (checkExists(record.translit_publisher) || checkExists(record.translit_place)) {
      const subfields = [subfieldFunc('6', '264-02')];

      if (checkExists(record.translit_place)) {
        subfields.push(subfieldFunc('a', `${record.publication_place} :`));
      }

      if (checkExists(record.translit_publisher)) {
        subfields.push(subfieldFunc('b', `${record.publisher},`));
      }

      if (checkExists(record.starting_year)) {
        subfields.push(subfieldFunc('c', `${record.starting_year}.`));
      } else {
        subfields.push(subfieldFunc('c', '[date of publication not identified]'));
      }

      const publisher880 = fieldFunc('880', ' ', '1', subfields);
      return this.returnSingleEntry('880', publisher880, head);
    }
    return head !== null ? ['', ''] : '';
  }

  fillTranslitCorporateAuthor(record, head, fieldFunc, subfieldFunc) {
    if (checkExists(record.corporate_author) && checkExists(record.corporate_author[1]) && checkExists(record.corporate_author[1]['corporate'])) {
      const corporate880 = fieldFunc('880', '1', ' ', [
        subfieldFunc('6', '110-04'),
        subfieldFunc('a', record.corporate_author[1]['corporate'])
      ]);
      return this.returnSingleEntry('880', corporate880, head);
    }
    return head !== null ? ['', ''] : '';
  }

  fillTranslitAdditionalCorporateNames(record, head, fieldFunc, subfieldFunc) {
    if (checkExists(record.additional_corporate_names)) {
      let content = '';
      let directory = '';
      let translitCounter = 5;

      if (checkExists(record.additional_authors)) {
        translitCounter += record.additional_authors.length;
      }

      for (let i = 0; i < record.additional_corporate_names.length; i++) {
        const corpEntry = record.additional_corporate_names[i];
        if (!checkExists(corpEntry) || !checkExists(corpEntry[1]) || !checkExists(corpEntry[1]['corporate'])) {
          continue;
        }

        if (!checkExists(corpEntry[0]) || !checkExists(corpEntry[0]['corporate'])) {
          continue;
        }

        const translitIndex = translitCounter < 10 ? `0${translitCounter}` : `${translitCounter}`;
        translitCounter++;

        const newContent = fieldFunc('880', '1', ' ', [
          subfieldFunc('6', `710-${translitIndex}`),
          subfieldFunc('a', corpEntry[0]['corporate'])
        ]);

        content += newContent;

        if (head !== null) {
          const newDirectory = this.createDirectory('880', newContent, head);
          head += this.getByteLength(newContent);
          directory += newDirectory;
        }
      }

      return this.returnMultipleEntries(directory, content, head);
    }
    return head !== null ? ['', '', head] : '';
  }

  downloadMARC(record, institutionInfo) {
    let head = 0;

    const directoryParts = [];
    const contentParts = [];

    const pushEntry = (entry) => {
      if (Array.isArray(entry)) {
        directoryParts.push(entry[0] || '');
        contentParts.push(entry[1] || '');
        if (entry.length > 2 && typeof entry[2] === 'number') {
          head = entry[2];
        } else {
          head += this.getByteLength(entry[1] || '');
        }
      } else {
        directoryParts.push('');
        contentParts.push('');
      }
    };

    const timestampContent = String.fromCharCode(30) + getTimestamp();
    const timestampDirectory = this.createDirectory('005', timestampContent, head);
    head += this.getByteLength(timestampContent);
    directoryParts.push(timestampDirectory);
    contentParts.push(timestampContent);

    const control006Content = String.fromCharCode(30) + this.create006Field(record);
    const control006Directory = this.createDirectory('006', control006Content, head);
    head += this.getByteLength(control006Content);
    directoryParts.push(control006Directory);
    contentParts.push(control006Content);

    const control008Content = String.fromCharCode(30) + this.create008Field(record);
    const control008Directory = this.createDirectory('008', control008Content, head);
    head += this.getByteLength(control008Content);
    directoryParts.push(control008Directory);
    contentParts.push(control008Content);

    const issn = this.fillISSN(record, head, this.createContentFill.bind(this), this.createSubfield.bind(this));
    pushEntry(issn);

    const default040Content = this.createContent('  ', [
      this.createSubfield('a', institutionInfo['marc']),
      this.createSubfield('b', 'eng'),
      this.createSubfield('e', 'rda'),
      this.createSubfield('c', institutionInfo['marc'])
    ]);
    const default040Directory = this.createDirectory('040', default040Content, head);
    head += this.getByteLength(default040Content);
    directoryParts.push(default040Directory);
    contentParts.push(default040Content);

    const corporateAuthor = this.fillCorporateAuthor(record, head, this.createContentFill.bind(this), this.createSubfield.bind(this));
    pushEntry(corporateAuthor);

    const title = this.fillTitle(record, head, this.createContentFill.bind(this), this.createSubfield.bind(this));
    pushEntry(title);

    const varyingTitle = this.fillVaryingTitle(record, head, this.createContentFill.bind(this), this.createSubfield.bind(this));
    pushEntry(varyingTitle);

    const publication = this.fillPublication(record, head, this.createContentFill.bind(this), this.createSubfield.bind(this));
    pushEntry(publication);

    const physical = this.fillPhysical(record, head, this.createContentFill.bind(this), this.createSubfield.bind(this));
    pushEntry(physical);

    const frequency = this.fillPublicationFrequency(record, head, this.createContentFill.bind(this), this.createSubfield.bind(this));
    pushEntry(frequency);

    const default336Content = this.createContent('  ', [
      this.createSubfield('a', 'text'),
      this.createSubfield('b', 'txt'),
      this.createSubfield('2', 'rdacontent')
    ]);
    const default336Directory = this.createDirectory('336', default336Content, head);
    head += this.getByteLength(default336Content);
    directoryParts.push(default336Directory);
    contentParts.push(default336Content);

    const default337Content = this.createContent('  ', [
      this.createSubfield('a', 'unmediated'),
      this.createSubfield('b', 'n'),
      this.createSubfield('2', 'rdamedia')
    ]);
    const default337Directory = this.createDirectory('337', default337Content, head);
    head += this.getByteLength(default337Content);
    directoryParts.push(default337Directory);
    contentParts.push(default337Content);

    const default338Content = this.createContent('  ', [
      this.createSubfield('a', 'volume'),
      this.createSubfield('b', 'nc'),
      this.createSubfield('2', 'rdacarrier')
    ]);
    const default338Directory = this.createDirectory('338', default338Content, head);
    head += this.getByteLength(default338Content);
    directoryParts.push(default338Directory);
    contentParts.push(default338Content);

    const dates = this.fillDatesOfPublication(record, head, this.createContentFill.bind(this), this.createSubfield.bind(this));
    pushEntry(dates);

    const notes = this.fillNotes(record, head, this.createContentFill.bind(this), this.createSubfield.bind(this));
    pushEntry(notes);

    const description = this.fillDescription(record, head, this.createContentFill.bind(this), this.createSubfield.bind(this));
    pushEntry(description);

    const keywords = this.fillKeywords(record, head, this.createContentFill.bind(this), this.createSubfield.bind(this));
    pushEntry(keywords);

    const fast = this.fillFAST(record, head, this.createContentFill.bind(this), this.createSubfield.bind(this));
    pushEntry(fast);

    const additionalCorporateNames = this.fillAdditionalCorporateNames(record, head, this.createContentFill.bind(this), this.createSubfield.bind(this));
    pushEntry(additionalCorporateNames);

    const precedingTitle = this.fillPrecedingTitle(record, head, this.createContentFill.bind(this), this.createSubfield.bind(this));
    pushEntry(precedingTitle);

    const succeedingTitle = this.fillSucceedingTitle(record, head, this.createContentFill.bind(this), this.createSubfield.bind(this));
    pushEntry(succeedingTitle);

    const webUrl = this.fillWebURL(record, head, this.createContentFill.bind(this), this.createSubfield.bind(this));
    pushEntry(webUrl);

    const title880 = this.fillTranslitTitle(record, head, this.createContentFill.bind(this), this.createSubfield.bind(this));
    pushEntry(title880);

    const edition880 = this.fillTranslitEdition(record, head, this.createContentFill.bind(this), this.createSubfield.bind(this));
    pushEntry(edition880);

    const publisher880 = this.fillTranslitPublisher(record, head, this.createContentFill.bind(this), this.createSubfield.bind(this));
    pushEntry(publisher880);

    const corporate880 = this.fillTranslitCorporateAuthor(record, head, this.createContentFill.bind(this), this.createSubfield.bind(this));
    pushEntry(corporate880);

    const corporations880 = this.fillTranslitAdditionalCorporateNames(record, head, this.createContentFill.bind(this), this.createSubfield.bind(this));
    pushEntry(corporations880);

    const end = String.fromCharCode(30) + String.fromCharCode(29);
    contentParts.push(end);

    const textParts = this.beforeFinalizeMarcText([...directoryParts, ...contentParts], record, institutionInfo, { head });
    const text = textParts.join('');

    const leaderLen = this.getByteLength(text) + 24;
    const directoryLen = 25 + directoryParts.reduce((sum, part) => sum + part.length, 0);
    const leader = this.buildMarcLeader(leaderLen, directoryLen);

    this.afterBuildMarc(record, institutionInfo, { leader, text });
    downloadFile(leader + text, 'mrc');
  }

  downloadXML(record, institutionInfo) {
    let text = '<?xml version="1.0" encoding="utf-8"?>\n';
    text += '<record xmlns="http://www.loc.gov/MARC21/slim">\n';
    text += `  <leader>${this.buildXmlLeader()}</leader>\n`;

    const formattedDate = getTimestamp();
    text += `  <controlfield tag="005">${formattedDate}</controlfield>\n`;
    text += `  <controlfield tag="006">${this.create006Field(record)}</controlfield>\n`;
    text += `  <controlfield tag="008">${this.create008Field(record)}</controlfield>\n`;

    text += this.createMARCXMLField('040', ' ', ' ', [
      this.createMARCXMLSubfield('a', institutionInfo['marc']),
      this.createMARCXMLSubfield('b', 'eng'),
      this.createMARCXMLSubfield('e', 'rda'),
      this.createMARCXMLSubfield('c', institutionInfo['marc'])
    ]);
    text += this.fillISSN(record, null, this.createMARCXMLField.bind(this), this.createMARCXMLSubfield.bind(this));
    text += this.fillCorporateAuthor(record, null, this.createMARCXMLField.bind(this), this.createMARCXMLSubfield.bind(this));
    text += this.fillTitle(record, null, this.createMARCXMLField.bind(this), this.createMARCXMLSubfield.bind(this));
    text += this.fillVaryingTitle(record, null, this.createMARCXMLField.bind(this), this.createMARCXMLSubfield.bind(this));
    text += this.fillPublication(record, null, this.createMARCXMLField.bind(this), this.createMARCXMLSubfield.bind(this));
    text += this.fillPhysical(record, null, this.createMARCXMLField.bind(this), this.createMARCXMLSubfield.bind(this));
    text += this.fillPublicationFrequency(record, null, this.createMARCXMLField.bind(this), this.createMARCXMLSubfield.bind(this));
    text += this.createMARCXMLField('336', ' ', ' ', [
      this.createMARCXMLSubfield('a', 'text'),
      this.createMARCXMLSubfield('b', 'txt'),
      this.createMARCXMLSubfield('2', 'rdacontent')
    ]);
    text += this.createMARCXMLField('337', ' ', ' ', [
      this.createMARCXMLSubfield('a', 'unmediated'),
      this.createMARCXMLSubfield('b', 'n'),
      this.createMARCXMLSubfield('2', 'rdamedia')
    ]);
    text += this.createMARCXMLField('338', ' ', ' ', [
      this.createMARCXMLSubfield('a', 'volume'),
      this.createMARCXMLSubfield('b', 'nc'),
      this.createMARCXMLSubfield('2', 'rdacarrier')
    ]);
    text += this.fillDatesOfPublication(record, null, this.createMARCXMLField.bind(this), this.createMARCXMLSubfield.bind(this));
    text += this.fillNotes(record, null, this.createMARCXMLField.bind(this), this.createMARCXMLSubfield.bind(this));
    text += this.fillDescription(record, null, this.createMARCXMLField.bind(this), this.createMARCXMLSubfield.bind(this));
    text += this.fillKeywords(record, null, this.createMARCXMLField.bind(this), this.createMARCXMLSubfield.bind(this));
    text += this.fillFAST(record, null, this.createMARCXMLField.bind(this), this.createMARCXMLSubfield.bind(this));
    text += this.fillAdditionalCorporateNames(record, null, this.createMARCXMLField.bind(this), this.createMARCXMLSubfield.bind(this));
    text += this.fillPrecedingTitle(record, null, this.createMARCXMLField.bind(this), this.createMARCXMLSubfield.bind(this));
    text += this.fillSucceedingTitle(record, null, this.createMARCXMLField.bind(this), this.createMARCXMLSubfield.bind(this));
    text += this.fillWebURL(record, null, this.createMARCXMLField.bind(this), this.createMARCXMLSubfield.bind(this));
    text += this.fillTranslitTitle(record, null, this.createMARCXMLField.bind(this), this.createMARCXMLSubfield.bind(this));
    text += this.fillTranslitEdition(record, null, this.createMARCXMLField.bind(this), this.createMARCXMLSubfield.bind(this));
    text += this.fillTranslitPublisher(record, null, this.createMARCXMLField.bind(this), this.createMARCXMLSubfield.bind(this));
    text += this.fillTranslitCorporateAuthor(record, null, this.createMARCXMLField.bind(this), this.createMARCXMLSubfield.bind(this));
    text += this.fillTranslitAdditionalCorporateNames(record, null, this.createMARCXMLField.bind(this), this.createMARCXMLSubfield.bind(this));
    text += '</record>\n';

    downloadFile(text, 'xml');
  }
}
