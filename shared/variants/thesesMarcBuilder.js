import { MarcBuilder } from '../marcBuilder.js';

const ROLE_LABELS = {
  dis: 'dissertant',
  csp: 'consultant to a project',
  ctb: 'contributor',
  dtc: 'data contributor',
  dte: 'dedicatee',
  dgc: 'degree committee member',
  dgs: 'degree supervisor',
  fnd: 'funder',
  rtm: 'research team member',
  spn: 'sponsor',
  tad: 'technical advisor'
};

export class ThesesMarcBuilder extends MarcBuilder {
  constructor(options = {}) {
    super({
      marcLeaderType: 'ntm',
      xmlLeaderType: 'ntm',
      ...options
    });
  }

  create008Field(record) {
    const field = new Array(40).fill(' ');
    let timestamp = getTimestamp();
    timestamp = timestamp.substring(2, 8);

    for (let i = 0; i < 6; i++) {
      field[i] = timestamp[i];
    }

    let yearOne;
    let yearTwo;
    if (checkExists(record.publication_year) && checkExists(record.copyright_year)) {
      field[6] = 't';
      yearOne = record.publication_year;
      yearTwo = record.copyright_year;
    } else if (checkExists(record.publication_year)) {
      field[6] = 's';
      yearOne = record.publication_year;
      yearTwo = '    ';
    } else if (checkExists(record.copyright_year)) {
      field[6] = 't';
      yearOne = record.copyright_year;
      yearTwo = record.copyright_year;
    } else {
      field[6] = 'n';
      yearOne = 'uuuu';
      yearTwo = 'uuuu';
    }

    for (let i = 7; i < 11; i++) {
      field[i] = yearOne[i - 7] || 'u';
    }

    for (let i = 11; i < 15; i++) {
      field[i] = yearTwo[i - 11] || 'u';
    }

    field[15] = 'v';
   field[16] = 'a';
   field[17] = 'u';

    const physicalFormCode = typeof record.physical_form_code === 'string' ? record.physical_form_code : '|';
    field[23] = physicalFormCode;

    if (checkExists(record.illustrations_yes) && record.illustrations_yes === true) {
      field[18] = 'a';
    }

    field[24] = 'b';
    field[29] = '0';
    field[30] = '0';
    field[31] = '0';

    if (checkExists(record.literature_yes) && checkExists(record.literature_dropdown)) {
      field[33] = record.literature_dropdown;
    } else {
      field[33] = '0';
    }

    if (checkExists(record.language)) {
      for (let i = 35; i < 38; i++) {
        field[i] = record.language[i - 35] || ' ';
      }
    }

    field[39] = 'd';

    return field.join('');
  }

  fillTitle(record, head, fieldFunc, subfieldFunc) {
    if (!checkExists(record.title)) {
      return head !== null ? ['', ''] : '';
    }

    const hasAuthor =
      checkExists(record.author) &&
      (checkExists(record.author.family) || checkExists(record.author.given));
    const hasCorporate = this.hasCorporateAuthor(record);
    const ind1 = (hasAuthor || hasCorporate) ? '1' : '0';

    let ind2 = '0';
    if ((record.language === 'eng' || record.language === 'fre') && checkExists(record.title)) {
      ind2 = this.getNonfilingCount(record.title, record.language);
    }

    const title = fieldFunc('245', ind1, ind2, [subfieldFunc('a', `${record.title}.`)]);
    return this.returnSingleEntry('245', title, head);
  }

  fillAuthor(record, head, fieldFunc, subfieldFunc) {
    if (!checkExists(record.author)) {
      return head !== null ? ['', ''] : '';
    }

    const family = record.author.family;
    const given = record.author.given;
    const roleCode = checkExists(record.author.role) ? record.author.role : 'dis';
    const roleLabel = this.getPersonalRoleLabel(roleCode);

    let authorContent = '';
    if (checkExists(family) && checkExists(given)) {
      authorContent = `${family}, ${given},`;
    } else if (checkExists(family)) {
      authorContent = `${family},`;
    } else if (checkExists(given)) {
      authorContent = `${given},`;
    } else {
      return head !== null ? ['', ''] : '';
    }

    const author = fieldFunc('100', '1', ' ', [
      subfieldFunc('a', authorContent),
      subfieldFunc('e', `${roleLabel}.`),
      subfieldFunc('4', roleCode)
    ]);

    return this.returnSingleEntry('100', author, head);
  }

  fillPublication(record, head, fieldFunc, subfieldFunc) {
    if (!checkExists(record.publication_year)) {
      return head !== null ? ['', ''] : '';
    }

    const publication = fieldFunc('264', ' ', '1', [
      subfieldFunc('a', 'Charlottesville, Va. :'),
      subfieldFunc('b', 'University of Virginia,'),
      subfieldFunc('c', `${record.publication_year}.`)
    ]);

    return this.returnSingleEntry('264', publication, head);
  }

  fillAdditionalAuthors(record, head, fieldFunc, subfieldFunc) {
    if (!Array.isArray(record.additional_authors)) {
      return head !== null ? ['', '', head] : '';
    }

    let authors = '';
    let directory = '';
    let currentHead = head;

    for (let i = 0; i < record.additional_authors.length; i++) {
      const entry = record.additional_authors[i];
      if (!entry || (!checkExists(entry.family) && !checkExists(entry.given))) {
        continue;
      }

      const roleCode = checkExists(entry.role) ? entry.role : 'ctb';
      const roleLabel = this.getPersonalRoleLabel(roleCode);

      let authorContent;
      if (checkExists(entry.family) && checkExists(entry.given)) {
        authorContent = `${entry.family}, ${entry.given},`;
      } else if (checkExists(entry.family)) {
        authorContent = `${entry.family},`;
      } else {
        authorContent = `${entry.given},`;
      }

      const subfields = [
        subfieldFunc('a', authorContent),
        subfieldFunc('e', `${roleLabel}.`),
        subfieldFunc('4', roleCode)
      ];

      const newContent = fieldFunc('700', '1', ' ', subfields);
      authors += newContent;

      if (currentHead !== null) {
        const newDirectory = this.createDirectory('700', newContent, currentHead);
        currentHead += this.getByteLength(newContent);
        directory += newDirectory;
      }
    }

    return this.returnMultipleEntries(directory, authors, currentHead);
  }

  fillPhysical(record, head, fieldFunc, subfieldFunc) {
    if (!checkExists(record.number_of_pages) || !checkExists(record.leaf_or_page)) {
      return head !== null ? ['', ''] : '';
    }

    let pagesString;
    if (record.number_of_pages === '0') {
      pagesString = '1 leaf (unpaged)';
    } else if (record.number_of_pages === '1') {
      pagesString = record.leaf_or_page === 'leaves' ? '1 leaf' : '1 page';
    } else {
      pagesString = `${record.number_of_pages} ${record.leaf_or_page}`;
    }

    const subfields = [subfieldFunc('a', `${pagesString} ;`)];

    if (checkExists(record.illustrations_yes) && record.illustrations_yes === true) {
      subfields.push(subfieldFunc('b', 'illustrations ;'));
    }

    subfields.push(subfieldFunc('c', '28 cm.'));

    const physical = fieldFunc('300', ' ', ' ', subfields);
    return this.returnSingleEntry('300', physical, head);
  }

  fillDissertationType(record, head, fieldFunc, subfieldFunc) {
    if (!checkExists(record.dissertation_type) || !checkExists(record.publication_year)) {
      return head !== null ? ['', ''] : '';
    }

    const subfields = [
      subfieldFunc('b', `${record.dissertation_type}.`)
    ];

    if (checkExists(record.major)) {
      subfields.push(subfieldFunc('g', record.major));
    }

    subfields.push(subfieldFunc('c', 'University of Virginia'));
    subfields.push(subfieldFunc('d', `${record.publication_year}.`));

    const dissertation = fieldFunc('502', ' ', ' ', subfields);

    return this.returnSingleEntry('502', dissertation, head);
  }

  fillAbstract(record, head, fieldFunc, subfieldFunc) {
    if (!checkExists(record.abstract)) {
      return head !== null ? ['', ''] : '';
    }

    const abstractField = fieldFunc('520', ' ', ' ', [
      subfieldFunc('a', record.abstract)
    ]);

    return this.returnSingleEntry('520', abstractField, head);
  }

  fillBibliography(record, head, fieldFunc, subfieldFunc) {
    if (!checkExists(record.bibliographies) || record.bibliographies === '') {
      return head !== null ? ['', ''] : '';
    }

    let label = 'page';
    if (record.bibliographies.indexOf('-') !== -1) {
      label += 's';
    }

    const bibliography = fieldFunc('504', ' ', ' ', [
      subfieldFunc('a', `Includes bibliographical references (${label} ${record.bibliographies}).`)
    ]);

    return this.returnSingleEntry('504', bibliography, head);
  }

  getPersonalRoleLabel(code) {
    return ROLE_LABELS[code] || 'contributor';
  }

  downloadMARC(record, institutionInfo) {
    let head = 0;

    const timestampContent = String.fromCharCode(30) + getTimestamp();
    const timestampDirectory = this.createDirectory('005', timestampContent, head);
    head += timestampContent.length;

    const controlfield008Content = String.fromCharCode(30) + this.create008Field(record);
    const controlfield008Directory = this.createDirectory('008', controlfield008Content, head);
    head += controlfield008Content.length;

    const catalogingSourceContent = this.createContent('  ', [
      this.createSubfield('a', institutionInfo['marc']),
      this.createSubfield('b', 'eng'),
      this.createSubfield('e', 'rda'),
      this.createSubfield('c', institutionInfo['marc'])
    ]);
    const catalogingSourceDirectory = this.createDirectory('040', catalogingSourceContent, head);
    head += catalogingSourceContent.length;

    const title = this.fillTitle(record, head, this.createContentFill.bind(this), this.createSubfield.bind(this));
    head += this.getByteLength(title[1]);

    const author = this.fillAuthor(record, head, this.createContentFill.bind(this), this.createSubfield.bind(this));
    head += this.getByteLength(author[1]);

    const corporateAuthor = this.fillCorporateAuthor(record, head, this.createContentFill.bind(this), this.createSubfield.bind(this));
    head += this.getByteLength(corporateAuthor[1]);

    const publication = this.fillPublication(record, head, this.createContentFill.bind(this), this.createSubfield.bind(this));
    head += this.getByteLength(publication[1]);

    const physical = this.fillPhysical(record, head, this.createContentFill.bind(this), this.createSubfield.bind(this));
    head += this.getByteLength(physical[1]);

    const default1Content = this.createContent('  ', [
      this.createSubfield('a', 'text'),
      this.createSubfield('b', 'txt'),
      this.createSubfield('2', 'rdacontent')
    ]);
    const default1Directory = this.createDirectory('336', default1Content, head);
    head += default1Content.length;

    const default2Content = this.createContent('  ', [
      this.createSubfield('a', 'unmediated'),
      this.createSubfield('b', 'n'),
      this.createSubfield('2', 'rdamedia')
    ]);
    const default2Directory = this.createDirectory('337', default2Content, head);
    head += default2Content.length;

    const default3Content = this.createContent('  ', [
      this.createSubfield('a', 'volume'),
      this.createSubfield('b', 'nc'),
      this.createSubfield('2', 'rdacarrier')
    ]);
    const default3Directory = this.createDirectory('338', default3Content, head);
    head += default3Content.length;

    const dissertation = this.fillDissertationType(record, head, this.createContentFill.bind(this), this.createSubfield.bind(this));
    head += this.getByteLength(dissertation[1]);

    const abstractField = this.fillAbstract(record, head, this.createContentFill.bind(this), this.createSubfield.bind(this));
    head += this.getByteLength(abstractField[1]);

    const contents = this.fillContents(record, head, this.createContentFill.bind(this), this.createSubfield.bind(this));
    head += this.getByteLength(contents[1]);

    const bibliography = this.fillBibliography(record, head, this.createContentFill.bind(this), this.createSubfield.bind(this));
    head += this.getByteLength(bibliography[1]);

    const additionalAuthors = this.fillAdditionalAuthors(record, head, this.createContentFill.bind(this), this.createSubfield.bind(this));
    head = additionalAuthors[2];

    const additionalCorporateNames = this.fillAdditionalCorporateNames(record, head, this.createContentFill.bind(this), this.createSubfield.bind(this));
    head = additionalCorporateNames[2];

    const corporate880 = this.fillTranslitCorporateAuthor(record, head, this.createContentFill.bind(this), this.createSubfield.bind(this));
    head += this.getByteLength(corporate880[1]);

    const additionalCorporate880 = this.fillTranslitAdditionalCorporateNames(record, head, this.createContentFill.bind(this), this.createSubfield.bind(this));
    head = additionalCorporate880[2];

    const end = String.fromCharCode(30) + String.fromCharCode(29);

    const textParts = [
      timestampDirectory,
      controlfield008Directory,
      catalogingSourceDirectory,
      title[0],
      author[0],
      corporateAuthor[0],
      publication[0],
      physical[0],
      default1Directory,
      default2Directory,
      default3Directory,
      dissertation[0],
      abstractField[0],
      contents[0],
      bibliography[0],
      additionalAuthors[0],
      additionalCorporateNames[0],
      corporate880[0],
      additionalCorporate880[0],
      timestampContent,
      controlfield008Content,
      catalogingSourceContent,
      title[1],
      author[1],
      corporateAuthor[1],
      publication[1],
      physical[1],
      default1Content,
      default2Content,
      default3Content,
      dissertation[1],
      abstractField[1],
      contents[1],
      bibliography[1],
      additionalAuthors[1],
      additionalCorporateNames[1],
      corporate880[1],
      additionalCorporate880[1],
      end
    ];

    const finalizedTextParts = this.beforeFinalizeMarcText(textParts, record, institutionInfo, { head });
    const text = finalizedTextParts.join('');

    const leaderLen = this.getByteLength(text) + 24;
    const directoryLen = 25 +
      timestampDirectory.length +
      controlfield008Directory.length +
      catalogingSourceDirectory.length +
      title[0].length +
      author[0].length +
      corporateAuthor[0].length +
      publication[0].length +
      physical[0].length +
      default1Directory.length +
      default2Directory.length +
      default3Directory.length +
      dissertation[0].length +
      abstractField[0].length +
      contents[0].length +
      bibliography[0].length +
      additionalAuthors[0].length +
      additionalCorporateNames[0].length +
      corporate880[0].length +
      additionalCorporate880[0].length;

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
    text += `  <controlfield tag="008">${this.create008Field(record)}</controlfield>\n`;

    text += this.createMARCXMLField('040', ' ', ' ', [
      this.createMARCXMLSubfield('a', institutionInfo['marc']),
      this.createMARCXMLSubfield('b', 'eng'),
      this.createMARCXMLSubfield('e', 'rda'),
      this.createMARCXMLSubfield('c', institutionInfo['marc'])
    ]);
    text += this.fillTitle(record, null, this.createMARCXMLField.bind(this), this.createMARCXMLSubfield.bind(this));
    text += this.fillAuthor(record, null, this.createMARCXMLField.bind(this), this.createMARCXMLSubfield.bind(this));
    text += this.fillCorporateAuthor(record, null, this.createMARCXMLField.bind(this), this.createMARCXMLSubfield.bind(this));
    text += this.fillPublication(record, null, this.createMARCXMLField.bind(this), this.createMARCXMLSubfield.bind(this));
    text += this.fillPhysical(record, null, this.createMARCXMLField.bind(this), this.createMARCXMLSubfield.bind(this));
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
    text += this.fillDissertationType(record, null, this.createMARCXMLField.bind(this), this.createMARCXMLSubfield.bind(this));
    text += this.fillAbstract(record, null, this.createMARCXMLField.bind(this), this.createMARCXMLSubfield.bind(this));
    text += this.fillContents(record, null, this.createMARCXMLField.bind(this), this.createMARCXMLSubfield.bind(this));
    text += this.fillBibliography(record, null, this.createMARCXMLField.bind(this), this.createMARCXMLSubfield.bind(this));
    text += this.fillAdditionalAuthors(record, null, this.createMARCXMLField.bind(this), this.createMARCXMLSubfield.bind(this));
    text += this.fillAdditionalCorporateNames(record, null, this.createMARCXMLField.bind(this), this.createMARCXMLSubfield.bind(this));
    text += this.fillTranslitCorporateAuthor(record, null, this.createMARCXMLField.bind(this), this.createMARCXMLSubfield.bind(this));
    text += this.fillTranslitAdditionalCorporateNames(record, null, this.createMARCXMLField.bind(this), this.createMARCXMLSubfield.bind(this));
    text += '</record>\n';

    downloadFile(text, 'xml');
  }
}
