import { MarcBuilder } from '../marcBuilder.js';

const ROLE_LABELS = {
  arr: 'arranger',
  art: 'artist',
  aut: 'author',
  cmp: 'composer',
  ctb: 'contributor',
  edt: 'editor',
  ill: 'illustrator',
  lbt: 'librettist',
  lyr: 'lyricist',
  trl: 'translator'
};

function getRoleLabel(role) {
  return ROLE_LABELS[role] || 'creator';
}

function buildPersonalName(entry) {
  if (checkExists(entry.family) && checkExists(entry.given)) {
    return `${entry.family}, ${entry.given},`;
  }
  if (checkExists(entry.family)) {
    return `${entry.family},`;
  }
  if (checkExists(entry.given)) {
    return `${entry.given},`;
  }
  return '';
}

export class ScoresMarcBuilder extends MarcBuilder {
  constructor(options = {}) {
    super({
      marcLeaderType: 'ncm',
      xmlLeaderType: 'ncm',
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

    let yearOne = 'uuuu';
    let yearTwo = 'uuuu';

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
    }

    for (let i = 7; i < 11; i++) {
      field[i] = yearOne[i - 7] || 'u';
    }

    for (let i = 11; i < 15; i++) {
      field[i] = yearTwo[i - 11] || 'u';
    }

    if (checkExists(record.publication_country)) {
      for (let i = 15; i < 15 + record.publication_country.length; i++) {
        field[i] = record.publication_country[i - 15];
      }
    } else {
      field[15] = 'x';
      field[16] = 'x';
    }

    if (checkExists(record.composition_form)) {
      field[18] = record.composition_form[0] || ' ';
      field[19] = record.composition_form[1] || ' ';
    }

    field[20] = 'l';

    if (checkExists(record.music_parts)) {
      field[21] = record.music_parts;
    }

    if (Array.isArray(record.accompanying_matters) && record.accompanying_matters.length > 0) {
      for (let i = 0; i < record.accompanying_matters.length; i++) {
        field[24 + i] = record.accompanying_matters[i];
      }
    } else {
      field[24] = '#';
    }

    field[30] = 'n';

    if (checkExists(record.transposition_arrangement)) {
      const code = record.transposition_arrangement === '#' ? ' ' : record.transposition_arrangement;
      field[33] = code;
    }

    if (checkExists(record.language)) {
      for (let i = 35; i < 38; i++) {
        field[i] = record.language[i - 35];
      }
    }

    field[39] = 'd';

    return field.join('');
  }

  fillAuthor(record, head, fieldFunc, subfieldFunc) {
    if (!checkExists(record.author) || !Array.isArray(record.author) || !checkExists(record.author[0])) {
      return head !== null ? ['', ''] : '';
    }

    const primaryEntry = record.author[0] || {};
    const translitEntry = record.author[1] || {};
    const latinIndex = (checkExists(translitEntry.family) || checkExists(translitEntry.given)) ? 1 : 0;
    const displayEntry = record.author[latinIndex] || primaryEntry;

    const authorContent = buildPersonalName(displayEntry || {});
    if (!authorContent) {
      return head !== null ? ['', ''] : '';
    }

    const roleCode = primaryEntry.role || 'cmp';
    const subfields = [
      subfieldFunc('a', authorContent),
      subfieldFunc('e', `${getRoleLabel(roleCode)}.`),
      subfieldFunc('4', roleCode)
    ];

    if (latinIndex === 1) {
      subfields.push(subfieldFunc('6', '880-03'));
    }

    const author = fieldFunc('100', '1', ' ', subfields);
    return this.returnSingleEntry('100', author, head);
  }

  fillAdditionalAuthors(record, head, fieldFunc, subfieldFunc) {
    if (!checkExists(record.additional_authors)) {
      return head !== null ? ['', '', head] : '';
    }

    let authors = '';
    let directory = '';
    let currentHead = head;
    let translitCounter = 5;

    for (let i = 0; i < record.additional_authors.length; i++) {
      const authorSet = record.additional_authors[i];
      if (!checkExists(authorSet) || !Array.isArray(authorSet) || !checkExists(authorSet[0])) {
        continue;
      }

      const primaryEntry = authorSet[0] || {};
      const translitEntry = authorSet[1] || {};
      const latinIndex = (checkExists(translitEntry.family) || checkExists(translitEntry.given)) ? 1 : 0;
      const displayEntry = authorSet[latinIndex] || primaryEntry;

      const authorContent = buildPersonalName(displayEntry || {});
      if (!authorContent) {
        continue;
      }

      const roleCode = primaryEntry.role || 'ctb';
      const subfields = [
        subfieldFunc('a', authorContent),
        subfieldFunc('e', `${getRoleLabel(roleCode)}.`),
        subfieldFunc('4', roleCode)
      ];

      if (latinIndex === 1) {
        const translitIndex = translitCounter < 10 ? `0${translitCounter}` : `${translitCounter}`;
        subfields.push(subfieldFunc('6', `880-${translitIndex}`));
        translitCounter++;
      }

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

  fillISMN(record, head, fieldFunc, subfieldFunc) {
    if (checkExists(record.ismn)) {
      const ismn = fieldFunc('024', '2', ' ', [subfieldFunc('a', record.ismn)]);
      return this.returnSingleEntry('024', ismn, head);
    }
    return head !== null ? ['', ''] : '';
  }

  fillUniformTitle(record, head, fieldFunc, subfieldFunc) {
    if (checkExists(record.uniform_title)) {
      let ind2 = '0';
      if (checkExists(record.language) && (record.language === 'eng' || record.language === 'fre')) {
        ind2 = this.getNonfilingCount(record.uniform_title, record.language);
      }
      const uniformTitle = fieldFunc('240', '1', ind2, [subfieldFunc('a', record.uniform_title)]);
      return this.returnSingleEntry('240', uniformTitle, head);
    }
    return head !== null ? ['', ''] : '';
  }

  fillFormattedContentNote(record, head, fieldFunc, subfieldFunc) {
    if (checkExists(record.formatted_contents_note)) {
      const note = fieldFunc('505', '0', ' ', [subfieldFunc('a', record.formatted_contents_note)]);
      return this.returnSingleEntry('505', note, head);
    }
    return head !== null ? ['', ''] : '';
  }

  downloadMARC(record, institutionInfo) {
    let head = 0;

    const timestampContent = String.fromCharCode(30) + getTimestamp();
    const timestampDirectory = this.createDirectory('005', timestampContent, head);
    head += timestampContent.length;

    const controlfield008Content = String.fromCharCode(30) + this.create008Field(record);
    const controlfield008Directory = this.createDirectory('008', controlfield008Content, head);
    head += controlfield008Content.length;

    const isbn = this.fillISBN(record, head, this.createContentFill.bind(this), this.createSubfield.bind(this));
    head += isbn[1].length;

    const ismn = this.fillISMN(record, head, this.createContentFill.bind(this), this.createSubfield.bind(this));
    head += ismn[1].length;

    const default1Content = this.createContent('  ', [
      this.createSubfield('a', institutionInfo['marc']),
      this.createSubfield('b', 'eng'),
      this.createSubfield('e', 'rda'),
      this.createSubfield('c', institutionInfo['marc'])
    ]);
    const default1Directory = this.createDirectory('040', default1Content, head);
    head += default1Content.length;

    const author = this.fillAuthor(record, head, this.createContentFill.bind(this), this.createSubfield.bind(this));
    head += this.getByteLength(author[1]);

    const uniformTitle = this.fillUniformTitle(record, head, this.createContentFill.bind(this), this.createSubfield.bind(this));
    head += this.getByteLength(uniformTitle[1]);

    const title = this.fillTitle(record, head, this.createContentFill.bind(this), this.createSubfield.bind(this));
    head += this.getByteLength(title[1]);

    const edition = this.fillEdition(record, head, this.createContentFill.bind(this), this.createSubfield.bind(this));
    head += this.getByteLength(edition[1]);

    const publication = this.fillPublication(record, head, this.createContentFill.bind(this), this.createSubfield.bind(this));
    head += this.getByteLength(publication[1]);

    const copyright = this.fillCopyright(record, head, this.createContentFill.bind(this), this.createSubfield.bind(this));
    head += this.getByteLength(copyright[1]);

    const physical = this.fillPhysical(record, head, this.createContentFill.bind(this), this.createSubfield.bind(this));
    head += this.getByteLength(physical[1]);

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

    const notes = this.fillNotes(record, head, this.createContentFill.bind(this), this.createSubfield.bind(this));
    head += this.getByteLength(notes[1]);

    const formattedContentNote = this.fillFormattedContentNote(record, head, this.createContentFill.bind(this), this.createSubfield.bind(this));
    head += this.getByteLength(formattedContentNote[1]);

    const keywords = this.fillKeywords(record, head, this.createContentFill.bind(this), this.createSubfield.bind(this));
    head = keywords[2];

    const fast = this.fillFAST(record, head, this.createContentFill.bind(this), this.createSubfield.bind(this));
    head = fast[2];

    const additionalAuthors = this.fillAdditionalAuthors(record, head, this.createContentFill.bind(this), this.createSubfield.bind(this));
    head = additionalAuthors[2];

    const title880 = this.fillTranslitTitle(record, head, this.createContentFill.bind(this), this.createSubfield.bind(this));
    head += this.getByteLength(title880[1]);

    const edition880 = this.fillTranslitEdition(record, head, this.createContentFill.bind(this), this.createSubfield.bind(this));
    head += this.getByteLength(edition880[1]);

    const publisher880 = this.fillTranslitPublisher(record, head, this.createContentFill.bind(this), this.createSubfield.bind(this));
    head += this.getByteLength(publisher880[1]);

    const author880 = this.fillTranslitAuthor(record, head, this.createContentFill.bind(this), this.createSubfield.bind(this));
    head += this.getByteLength(author880[1]);

    const authors880 = this.fillTranslitAdditionalAuthors(record, head, this.createContentFill.bind(this), this.createSubfield.bind(this));
    head = authors880[2];

    const end = String.fromCharCode(30) + String.fromCharCode(29);

    const textParts = [
      timestampDirectory,
      controlfield008Directory,
      isbn[0],
      ismn[0],
      default1Directory,
      author[0],
      uniformTitle[0],
      title[0],
      edition[0],
      publication[0],
      copyright[0],
      physical[0],
      default2Directory,
      default3Directory,
      default4Directory,
      notes[0],
      formattedContentNote[0],
      keywords[0],
      fast[0],
      additionalAuthors[0],
      title880[0],
      edition880[0],
      publisher880[0],
      author880[0],
      authors880[0],
      timestampContent,
      controlfield008Content,
      isbn[1],
      ismn[1],
      default1Content,
      author[1],
      uniformTitle[1],
      title[1],
      edition[1],
      publication[1],
      copyright[1],
      physical[1],
      default2Content,
      default3Content,
      default4Content,
      notes[1],
      formattedContentNote[1],
      keywords[1],
      fast[1],
      additionalAuthors[1],
      title880[1],
      edition880[1],
      publisher880[1],
      author880[1],
      authors880[1],
      end
    ];

    const finalizedTextParts = this.beforeFinalizeMarcText(textParts, record, institutionInfo, { head });
    const text = finalizedTextParts.join('');

    const leaderLen = this.getByteLength(text) + 24;
    const directoryLen = 25 +
      timestampDirectory.length +
      controlfield008Directory.length +
      isbn[0].length +
      ismn[0].length +
      default1Directory.length +
      author[0].length +
      uniformTitle[0].length +
      title[0].length +
      edition[0].length +
      publication[0].length +
      copyright[0].length +
      physical[0].length +
      default2Directory.length +
      default3Directory.length +
      default4Directory.length +
      notes[0].length +
      formattedContentNote[0].length +
      keywords[0].length +
      fast[0].length +
      additionalAuthors[0].length +
      title880[0].length +
      edition880[0].length +
      publisher880[0].length +
      author880[0].length +
      authors880[0].length;

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

    const controlfield008 = this.create008Field(record);
    text += `  <controlfield tag="008">${controlfield008}</controlfield>\n`;

    text += this.createMARCXMLField('040', ' ', ' ', [
      this.createMARCXMLSubfield('a', institutionInfo['marc']),
      this.createMARCXMLSubfield('b', 'eng'),
      this.createMARCXMLSubfield('e', 'rda'),
      this.createMARCXMLSubfield('c', institutionInfo['marc'])
    ]);
    text += this.fillISBN(record, null, this.createMARCXMLField.bind(this), this.createMARCXMLSubfield.bind(this));
    text += this.fillISMN(record, null, this.createMARCXMLField.bind(this), this.createMARCXMLSubfield.bind(this));
    text += this.fillAuthor(record, null, this.createMARCXMLField.bind(this), this.createMARCXMLSubfield.bind(this));
    text += this.fillUniformTitle(record, null, this.createMARCXMLField.bind(this), this.createMARCXMLSubfield.bind(this));
    text += this.fillTitle(record, null, this.createMARCXMLField.bind(this), this.createMARCXMLSubfield.bind(this));
    text += this.fillEdition(record, null, this.createMARCXMLField.bind(this), this.createMARCXMLSubfield.bind(this));
    text += this.fillPublication(record, null, this.createMARCXMLField.bind(this), this.createMARCXMLSubfield.bind(this));
    text += this.fillCopyright(record, null, this.createMARCXMLField.bind(this), this.createMARCXMLSubfield.bind(this));
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
    text += this.fillNotes(record, null, this.createMARCXMLField.bind(this), this.createMARCXMLSubfield.bind(this));
    text += this.fillFormattedContentNote(record, null, this.createMARCXMLField.bind(this), this.createMARCXMLSubfield.bind(this));
    text += this.fillKeywords(record, null, this.createMARCXMLField.bind(this), this.createMARCXMLSubfield.bind(this));
    text += this.fillFAST(record, null, this.createMARCXMLField.bind(this), this.createMARCXMLSubfield.bind(this));
    text += this.fillAdditionalAuthors(record, null, this.createMARCXMLField.bind(this), this.createMARCXMLSubfield.bind(this));
    text += this.fillTranslitTitle(record, null, this.createMARCXMLField.bind(this), this.createMARCXMLSubfield.bind(this));
    text += this.fillTranslitEdition(record, null, this.createMARCXMLField.bind(this), this.createMARCXMLSubfield.bind(this));
    text += this.fillTranslitPublisher(record, null, this.createMARCXMLField.bind(this), this.createMARCXMLSubfield.bind(this));
    text += this.fillTranslitAuthor(record, null, this.createMARCXMLField.bind(this), this.createMARCXMLSubfield.bind(this));
    text += this.fillTranslitAdditionalAuthors(record, null, this.createMARCXMLField.bind(this), this.createMARCXMLSubfield.bind(this));
    text += '</record>\n';

    downloadFile(text, 'xml');
  }
}
