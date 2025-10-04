import { MarcBuilder } from '../marcBuilder.js';

const FREQUENCY_LABELS = {
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

function hasTransliteration(entry) {
  return checkExists(entry) && (checkExists(entry.family) || checkExists(entry.given) || checkExists(entry.corporate));
}

function normalizeUrl(url) {
  if (!checkExists(url)) {
    return '';
  }
  if (/^https?:\/\//i.test(url)) {
    return url;
  }
  return `http://${url}`;
}

export class SerialsMarcBuilder extends MarcBuilder {
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
    field[2] = record.regularity || ' ';
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
      yearOne = record.starting_year.padEnd(4, 'u');
    }

    let yearTwo = 'uuuu';
    if (checkExists(record.publication_status) && record.publication_status === 'c') {
      yearTwo = '9999';
    } else if (checkExists(record.ending_year)) {
      yearTwo = record.ending_year.padEnd(4, 'u');
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

    const physicalFormCode = typeof record.physical_form_code === 'string' ? record.physical_form_code : '|';
    field[23] = physicalFormCode;

    if (checkExists(record.current_publication_frequency)) {
      field[18] = record.current_publication_frequency;
    }

    field[19] = record.regularity || ' ';

    if (checkExists(record.resource_type)) {
      field[21] = record.resource_type;
    }

    if (checkExists(record.government_publication_yes) && record.government_publication_yes === true) {
      field[28] = 'f';
    }

    field[29] = '0';
    field[30] = '|';
    field[31] = ' ';
    field[32] = ' ';
    field[33] = ' ';
    field[34] = '0';

    if (checkExists(record.language)) {
      for (let i = 35; i < 38; i++) {
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
    if (!checkExists(record.corporate_author) || !checkExists(record.corporate_author[0])) {
      return head !== null ? ['', ''] : '';
    }

    const roleIndex = { cre: 'creator', ctb: 'contributor' };
    const latinIndex = hasTransliteration(record.corporate_author[1]) ? 1 : 0;
    const primary = record.corporate_author[latinIndex];

    if (!checkExists(primary) || !checkExists(primary.corporate)) {
      return head !== null ? ['', ''] : '';
    }

    const role = record.corporate_author[0]['role'] || 'cre';
    const subfields = [
      subfieldFunc('a', primary.corporate),
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
    if (!checkExists(record.title) || !checkExists(record.title[0]) || !checkExists(record.title[0]['title'])) {
      return head !== null ? ['', ''] : '';
    }

    const latinIndex = (checkExists(record.title[1]) && (checkExists(record.title[1]['title']) || checkExists(record.title[1]['subtitle']))) ? 1 : 0;

    let titleInd2 = '0';
    if ((record.language === 'eng' || record.language === 'fre') && checkExists(record.title[latinIndex]['title'])) {
      titleInd2 = this.getNonfilingCount(record.title[latinIndex]['title'], record.language);
    }

    const subfields = [];
    if (checkExists(record.title[0]['subtitle'])) {
      subfields.push(
        subfieldFunc('a', `${record.title[latinIndex]['title']} :`),
        subfieldFunc('b', `${record.title[latinIndex]['subtitle']}.`)
      );
    } else {
      subfields.push(subfieldFunc('a', `${record.title[latinIndex]['title']}.`));
    }

    if (latinIndex === 1) {
      subfields.push(subfieldFunc('6', '880-01'));
    }

    const title = fieldFunc('245', '0', titleInd2, subfields);
    return this.returnSingleEntry('245', title, head);
  }

  fillVaryingTitle(record, head, fieldFunc, subfieldFunc) {
    if (!checkExists(record.varying_title_type) || !checkExists(record.varying_title)) {
      return head !== null ? ['', ''] : '';
    }

    let ind1;
    let ind2;
    if (record.varying_title_type === 'other') {
      ind1 = '1';
      ind2 = '3';
    } else {
      ind1 = '3';
      ind2 = '1';
    }

    const varyingTitle = fieldFunc('246', ind1, ind2, [subfieldFunc('a', record.varying_title)]);
    return this.returnSingleEntry('246', varyingTitle, head);
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
    let pagesString = 'volumes';
    if (checkExists(record.publication_status)) {
      if (record.publication_status !== 'current' && checkExists(record.volumes)) {
        pagesString = `${record.volumes} volumes`;
      }
    }

    const subfields = [subfieldFunc('a', `${pagesString} ;`), subfieldFunc('c', `${record.dimensions} cm`)];
    const physical = fieldFunc('300', ' ', ' ', subfields);
    return this.returnSingleEntry('300', physical, head);
  }

  fillPublicationFrequency(record, head, fieldFunc, subfieldFunc) {
    if (!checkExists(record.current_publication_frequency)) {
      return head !== null ? ['', ''] : '';
    }

    const label = FREQUENCY_LABELS[record.current_publication_frequency];
    if (!label) {
      return head !== null ? ['', ''] : '';
    }

    const frequency = fieldFunc('310', ' ', ' ', [subfieldFunc('a', label)]);
    return this.returnSingleEntry('310', frequency, head);
  }

  fillDatesOfPublication(record, head, fieldFunc, subfieldFunc) {
    if (!checkExists(record.starting_year) && !checkExists(record.ending_year)) {
      return head !== null ? ['', ''] : '';
    }

    let range = '';
    if (checkExists(record.starting_year)) {
      range += record.starting_year;
    }
    range += '-';
    if (checkExists(record.ending_year)) {
      range += `${record.ending_year}.`;
    }

    const dates = fieldFunc('362', '0', ' ', [subfieldFunc('a', range)]);
    return this.returnSingleEntry('362', dates, head);
  }

  fillDescription(record, head, fieldFunc, subfieldFunc) {
    if (checkExists(record.description)) {
      const description = fieldFunc('500', ' ', ' ', [subfieldFunc('a', record.description)]);
      return this.returnSingleEntry('500', description, head);
    }
    return head !== null ? ['', ''] : '';
  }

  fillAdditionalCorporateNames(record, head, fieldFunc, subfieldFunc) {
    if (!checkExists(record.additional_corporate_names)) {
      return head !== null ? ['', '', head] : '';
    }

    let content = '';
    let directory = '';
    let currentHead = head;
    let translitCounter = 5;
    if (checkExists(record.additional_authors)) {
      translitCounter += record.additional_authors.length;
    }
    const roleIndex = { cre: 'creator', ctb: 'contributor' };

    for (let i = 0; i < record.additional_corporate_names.length; i++) {
      const entry = record.additional_corporate_names[i];
      if (!checkExists(entry) || !checkExists(entry[0]) || !checkExists(entry[0]['corporate'])) {
        continue;
      }

      const latinIndex = hasTransliteration(entry[1]) ? 1 : 0;
      const role = entry[0]['role'] || 'cre';
      const subfields = [
        subfieldFunc('a', entry[latinIndex]['corporate']),
        subfieldFunc('e', `${roleIndex[role] || 'creator'}.`),
        subfieldFunc('4', role)
      ];

      if (latinIndex === 1) {
        const translitIndex = translitCounter < 10 ? `0${translitCounter}` : `${translitCounter}`;
        subfields.push(subfieldFunc('6', `880-${translitIndex}`));
        translitCounter++;
      }

      const newContent = fieldFunc('710', '1', ' ', subfields);
      content += newContent;

      if (currentHead !== null) {
        const newDirectory = this.createDirectory('710', newContent, currentHead);
        currentHead += this.getByteLength(newContent);
        directory += newDirectory;
      }
    }

    return this.returnMultipleEntries(directory, content, currentHead);
  }

  fillPrecedingTitle(record, head, fieldFunc, subfieldFunc) {
    if (checkExists(record.preceding_title) && checkExists(record.relationship_with_preceding_title)) {
      const preceding = fieldFunc('780', '0', record.relationship_with_preceding_title, [subfieldFunc('t', record.preceding_title)]);
      return this.returnSingleEntry('780', preceding, head);
    }
    return head !== null ? ['', ''] : '';
  }

  fillSucceedingTitle(record, head, fieldFunc, subfieldFunc) {
    if (checkExists(record.succeeding_title) && checkExists(record.relationship_with_succeeding_title)) {
      const succeeding = fieldFunc('785', '0', record.relationship_with_succeeding_title, [subfieldFunc('t', record.succeeding_title)]);
      return this.returnSingleEntry('785', succeeding, head);
    }
    return head !== null ? ['', ''] : '';
  }

  fillWebURL(record, head, fieldFunc, subfieldFunc) {
    if (checkExists(record.web_url)) {
      const web = fieldFunc('856', '4', '1', [subfieldFunc('u', normalizeUrl(record.web_url))]);
      return this.returnSingleEntry('856', web, head);
    }
    return head !== null ? ['', ''] : '';
  }

  fillTranslitTitle(record, head, fieldFunc, subfieldFunc) {
    if (!checkExists(record.title) || !checkExists(record.title[1]) || !checkExists(record.title[1]['title'])) {
      return head !== null ? ['', ''] : '';
    }

    const subfields = [subfieldFunc('6', '245-01')];
    if (checkExists(record.title[1]['subtitle']) && checkExists(record.title[0]['subtitle'])) {
      subfields.push(
        subfieldFunc('a', `${record.title[0]['title']} :`),
        subfieldFunc('b', `${record.title[0]['subtitle']}.`)
      );
    } else {
      subfields.push(subfieldFunc('a', `${record.title[0]['title']}.`));
    }

    const title880 = fieldFunc('880', '0', '0', subfields);
    return this.returnSingleEntry('880', title880, head);
  }

  fillTranslitEdition(record, head, fieldFunc, subfieldFunc) {
    if (checkExists(record.translit_edition)) {
      const edition880 = fieldFunc('880', ' ', ' ', [subfieldFunc('6', '250-04'), subfieldFunc('a', `${record.edition}.`)]);
      return this.returnSingleEntry('880', edition880, head);
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
      const author880 = fieldFunc('880', '1', ' ', [subfieldFunc('6', '110-04'), subfieldFunc('a', record.corporate_author[1]['corporate'])]);
      return this.returnSingleEntry('880', author880, head);
    }
    return head !== null ? ['', ''] : '';
  }

  fillTranslitAdditionalCorporateAuthors(record, head, fieldFunc, subfieldFunc) {
    if (!checkExists(record.additional_corporate_names)) {
      return head !== null ? ['', '', head] : '';
    }

    let content = '';
    let directory = '';
    let currentHead = head;
    let translitCounter = 5;
    if (checkExists(record.additional_authors)) {
      translitCounter += record.additional_authors.length;
    }

    for (let i = 0; i < record.additional_corporate_names.length; i++) {
      const entry = record.additional_corporate_names[i];
      if (!checkExists(entry) || !checkExists(entry[1]) || !checkExists(entry[1]['corporate'])) {
        continue;
      }

      const translitIndex = translitCounter < 10 ? `0${translitCounter}` : `${translitCounter}`;
      translitCounter++;

      const newContent = fieldFunc('880', '1', ' ', [
        subfieldFunc('6', `710-${translitIndex}`),
        subfieldFunc('a', entry[0]['corporate'])
      ]);
      content += newContent;

      if (currentHead !== null) {
        const newDirectory = this.createDirectory('880', newContent, currentHead);
        currentHead += this.getByteLength(newContent);
        directory += newDirectory;
      }
    }

    return this.returnMultipleEntries(directory, content, currentHead);
  }

  downloadMARC(record, institutionInfo) {
    let head = 0;

    const timestampContent = String.fromCharCode(30) + getTimestamp();
    const timestampDirectory = this.createDirectory('005', timestampContent, head);
    head += timestampContent.length;

    const controlfield006Content = String.fromCharCode(30) + this.create006Field(record);
    const controlfield006Directory = this.createDirectory('006', controlfield006Content, head);
    head += controlfield006Content.length;

    const controlfield008Content = String.fromCharCode(30) + this.create008Field(record);
    const controlfield008Directory = this.createDirectory('008', controlfield008Content, head);
    head += controlfield008Content.length;

    const issn = this.fillISSN(record, head, this.createContentFill.bind(this), this.createSubfield.bind(this));
    head += issn[1].length;

    const default1Content = this.createContent('  ', [
      this.createSubfield('a', institutionInfo['marc']),
      this.createSubfield('b', 'eng'),
      this.createSubfield('e', 'rda'),
      this.createSubfield('c', institutionInfo['marc'])
    ]);
    const default1Directory = this.createDirectory('040', default1Content, head);
    head += default1Content.length;

    const corporateAuthor = this.fillCorporateAuthor(record, head, this.createContentFill.bind(this), this.createSubfield.bind(this));
    head += this.getByteLength(corporateAuthor[1]);

    const title = this.fillTitle(record, head, this.createContentFill.bind(this), this.createSubfield.bind(this));
    head += this.getByteLength(title[1]);

    const varyingTitle = this.fillVaryingTitle(record, head, this.createContentFill.bind(this), this.createSubfield.bind(this));
    head += this.getByteLength(varyingTitle[1]);

    const publication = this.fillPublication(record, head, this.createContentFill.bind(this), this.createSubfield.bind(this));
    head += this.getByteLength(publication[1]);

    const physical = this.fillPhysical(record, head, this.createContentFill.bind(this), this.createSubfield.bind(this));
    head += this.getByteLength(physical[1]);

    const frequency = this.fillPublicationFrequency(record, head, this.createContentFill.bind(this), this.createSubfield.bind(this));
    head += this.getByteLength(frequency[1]);

    const default2Content = this.createContent('  ', [
      this.createSubfield('a', 'text'),
      this.createSubfield('b', 'txt'),
      this.createSubfield('2', 'rdacontent')
    ]);
    const default2Directory = this.createDirectory('336', default2Content, head);
    head += default2Content.length;

    const default3Content = this.createContent('  ', [
      this.createSubfield('a', 'unmediated'),
      this.createSubfield('b', 'n'),
      this.createSubfield('2', 'rdamedia')
    ]);
    const default3Directory = this.createDirectory('337', default3Content, head);
    head += default3Content.length;

    const default4Content = this.createContent('  ', [
      this.createSubfield('a', 'volume'),
      this.createSubfield('b', 'nc'),
      this.createSubfield('2', 'rdacarrier')
    ]);
    const default4Directory = this.createDirectory('338', default4Content, head);
    head += default4Content.length;

    const dates = this.fillDatesOfPublication(record, head, this.createContentFill.bind(this), this.createSubfield.bind(this));
    head += this.getByteLength(dates[1]);

    const notes = this.fillNotes(record, head, this.createContentFill.bind(this), this.createSubfield.bind(this));
    head += this.getByteLength(notes[1]);

    const description = this.fillDescription(record, head, this.createContentFill.bind(this), this.createSubfield.bind(this));
    head += this.getByteLength(description[1]);

    const keywords = this.fillKeywords(record, head, this.createContentFill.bind(this), this.createSubfield.bind(this));
    head = keywords[2];

    const fast = this.fillFAST(record, head, this.createContentFill.bind(this), this.createSubfield.bind(this));
    head = fast[2];

    const additionalCorporate = this.fillAdditionalCorporateNames(record, head, this.createContentFill.bind(this), this.createSubfield.bind(this));
    head = additionalCorporate[2];

    const precedingTitle = this.fillPrecedingTitle(record, head, this.createContentFill.bind(this), this.createSubfield.bind(this));
    head += this.getByteLength(precedingTitle[1]);

    const succeedingTitle = this.fillSucceedingTitle(record, head, this.createContentFill.bind(this), this.createSubfield.bind(this));
    head += this.getByteLength(succeedingTitle[1]);

    const webUrl = this.fillWebURL(record, head, this.createContentFill.bind(this), this.createSubfield.bind(this));
    head += this.getByteLength(webUrl[1]);

    const title880 = this.fillTranslitTitle(record, head, this.createContentFill.bind(this), this.createSubfield.bind(this));
    head += this.getByteLength(title880[1]);

    const edition880 = this.fillTranslitEdition(record, head, this.createContentFill.bind(this), this.createSubfield.bind(this));
    head += this.getByteLength(edition880[1]);

    const publisher880 = this.fillTranslitPublisher(record, head, this.createContentFill.bind(this), this.createSubfield.bind(this));
    head += this.getByteLength(publisher880[1]);

    const corporate880 = this.fillTranslitCorporateAuthor(record, head, this.createContentFill.bind(this), this.createSubfield.bind(this));
    head += this.getByteLength(corporate880[1]);

  const corporations880 = this.fillTranslitAdditionalCorporateAuthors(record, head, this.createContentFill.bind(this), this.createSubfield.bind(this));
    head = corporations880[2];

    const end = String.fromCharCode(30) + String.fromCharCode(29);

    const textParts = [
      timestampDirectory,
      controlfield006Directory,
      controlfield008Directory,
      issn[0],
      default1Directory,
      corporateAuthor[0],
      title[0],
      varyingTitle[0],
      publication[0],
      physical[0],
      frequency[0],
      default2Directory,
      default3Directory,
      default4Directory,
      dates[0],
      notes[0],
      description[0],
      keywords[0],
      fast[0],
      additionalCorporate[0],
      precedingTitle[0],
      succeedingTitle[0],
      webUrl[0],
      title880[0],
      edition880[0],
      publisher880[0],
      corporate880[0],
      corporations880[0],
      timestampContent,
      controlfield006Content,
      controlfield008Content,
      issn[1],
      default1Content,
      corporateAuthor[1],
      title[1],
      varyingTitle[1],
      publication[1],
      physical[1],
      frequency[1],
      default2Content,
      default3Content,
      default4Content,
      dates[1],
      notes[1],
      description[1],
      keywords[1],
      fast[1],
      additionalCorporate[1],
      precedingTitle[1],
      succeedingTitle[1],
      webUrl[1],
      title880[1],
      edition880[1],
      publisher880[1],
      corporate880[1],
      corporations880[1],
      end
    ];

    const finalizedTextParts = this.beforeFinalizeMarcText(textParts, record, institutionInfo, { head });
    const text = finalizedTextParts.join('');

    const leaderLen = this.getByteLength(text) + 24;
    const directoryLen = 25 +
      timestampDirectory.length +
      controlfield006Directory.length +
      controlfield008Directory.length +
      issn[0].length +
      default1Directory.length +
      corporateAuthor[0].length +
      title[0].length +
      varyingTitle[0].length +
      publication[0].length +
      physical[0].length +
      frequency[0].length +
      default2Directory.length +
      default3Directory.length +
      default4Directory.length +
      dates[0].length +
      notes[0].length +
      description[0].length +
      keywords[0].length +
      fast[0].length +
      additionalCorporate[0].length +
      precedingTitle[0].length +
      succeedingTitle[0].length +
      webUrl[0].length +
      title880[0].length +
      edition880[0].length +
      publisher880[0].length +
      corporate880[0].length +
      corporations880[0].length;

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
    text += this.fillTranslitAdditionalCorporateAuthors(record, null, this.createMARCXMLField.bind(this), this.createMARCXMLSubfield.bind(this));
    text += '</record>\n';

    downloadFile(text, 'xml');
  }
}
