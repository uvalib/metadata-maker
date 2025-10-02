import { MarcBuilder } from '../marcBuilder.js';

const CORPORATE_ROLE_LABELS = {
  cre: 'creator',
  ctb: 'contributor'
};

export class MixedMediaMarcBuilder extends MarcBuilder {
  constructor(options = {}) {
    super({
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

    if (checkExists(record.illustrations_yes) && record.illustrations_yes === true) {
      field[18] = ' ';
    }

    field[28] = ' ';
    field[29] = '0';
    field[30] = '0';
    field[31] = '0';
    field[33] = '0';
    field[35] = 'z';
    field[36] = 'x';
    field[37] = 'x';
    field[39] = 'd';

    return field.join('');
  }

  fillItemNumber(record, head, fieldFunc, subfieldFunc) {
    if (!checkExists(record.item_number)) {
      return head !== null ? ['', ''] : '';
    }

    const content = fieldFunc('074', ' ', ' ', [subfieldFunc('a', record.item_number)]);
    return this.returnSingleEntry('074', content, head);
  }

  fillSuDoc(record, head, fieldFunc, subfieldFunc) {
    if (!checkExists(record.sudoc)) {
      return head !== null ? ['', ''] : '';
    }

    const content = fieldFunc('086', '0', ' ', [subfieldFunc('a', record.sudoc)]);
    return this.returnSingleEntry('086', content, head);
  }

  fillReportNumber(record, head, fieldFunc, subfieldFunc) {
    if (!checkExists(record.report_number)) {
      return head !== null ? ['', ''] : '';
    }

    const content = fieldFunc('088', ' ', ' ', [subfieldFunc('a', record.report_number)]);
    return this.returnSingleEntry('088', content, head);
  }

  fillCorporateAuthor(record, head, fieldFunc, subfieldFunc) {
    if (!checkExists(record.corporate_author)) {
      return head !== null ? ['', ''] : '';
    }

    const corporate = Array.isArray(record.corporate_author)
      ? record.corporate_author[0]
      : record.corporate_author;

    if (!checkExists(corporate) || !checkExists(corporate['corporate'])) {
      return head !== null ? ['', ''] : '';
    }

    const role = corporate['role'] || 'cre';
    const subfields = [
      subfieldFunc('a', corporate['corporate']),
      subfieldFunc('e', `${CORPORATE_ROLE_LABELS[role] || 'creator'}.`),
      subfieldFunc('4', role)
    ];

    const content = fieldFunc('110', '1', ' ', subfields);
    return this.returnSingleEntry('110', content, head);
  }

  fillPhysical(record, head, fieldFunc, subfieldFunc) {
    const subfields = [];
    let description;

    if (record.pages === '0' || record.unpaged || (record.volume_or_item === 'volumes' && record.items === '1')) {
      description = '1 volume (unpaged)';
    } else if (record.pages === '1') {
      description = '1 item';
    } else {
      description = `${record.pages} ${record.volume_or_item}`;
    }

    if (checkExists(record.illustrations_yes) && record.illustrations_yes === true) {
      subfields.push(subfieldFunc('a', `${description} :`));
      subfields.push(subfieldFunc('b', 'illustrations ;'));
    } else {
      subfields.push(subfieldFunc('a', `${description} ;`));
    }

    if (checkExists(record.dimensions)) {
      subfields.push(subfieldFunc('c', `${record.dimensions} cm`));
    }

    const content = fieldFunc('300', ' ', ' ', subfields);
    return this.returnSingleEntry('300', content, head);
  }

  fillAdditionalCorporateNames(record, head, fieldFunc, subfieldFunc) {
    if (!checkExists(record.additional_corporate_names)) {
      return head !== null ? ['', '', head] : '';
    }

    let authors = '';
    let directory = '';
    let currentHead = head;

    for (let i = 0; i < record.additional_corporate_names.length; i++) {
      const corpEntry = record.additional_corporate_names[i];
      if (!checkExists(corpEntry) || !checkExists(corpEntry['corporate'])) {
        continue;
      }

      const role = corpEntry['role'] || 'cre';
      const subfields = [
        subfieldFunc('a', corpEntry['corporate']),
        subfieldFunc('e', `${CORPORATE_ROLE_LABELS[role] || 'creator'}.`),
        subfieldFunc('4', role)
      ];

      const newContent = fieldFunc('710', '1', ' ', subfields);
      authors += newContent;

      if (currentHead !== null) {
        const newDirectory = this.createDirectory('710', newContent, currentHead);
        currentHead += this.getByteLength(newContent);
        directory += newDirectory;
      }
    }

    return this.returnMultipleEntries(directory, authors, currentHead);
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

    const controlfield008Content = String.fromCharCode(30) + this.create008Field(record);
    const controlfield008Directory = this.createDirectory('008', controlfield008Content, head);
    head += this.getByteLength(controlfield008Content);
    directoryParts.push(controlfield008Directory);
    contentParts.push(controlfield008Content);

    const isbn = this.fillISBN(record, head, this.createContentFill.bind(this), this.createSubfield.bind(this));
    pushEntry(isbn);

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

    const itemNumber = this.fillItemNumber(record, head, this.createContentFill.bind(this), this.createSubfield.bind(this));
    pushEntry(itemNumber);

    const suDoc = this.fillSuDoc(record, head, this.createContentFill.bind(this), this.createSubfield.bind(this));
    pushEntry(suDoc);

    const reportNumber = this.fillReportNumber(record, head, this.createContentFill.bind(this), this.createSubfield.bind(this));
    pushEntry(reportNumber);

    const author = this.fillAuthor(record, head, this.createContentFill.bind(this), this.createSubfield.bind(this));
    pushEntry(author);

    const corporateAuthor = this.fillCorporateAuthor(record, head, this.createContentFill.bind(this), this.createSubfield.bind(this));
    pushEntry(corporateAuthor);

    const title = this.fillTitle(record, head, this.createContentFill.bind(this), this.createSubfield.bind(this));
    pushEntry(title);

    const edition = this.fillEdition(record, head, this.createContentFill.bind(this), this.createSubfield.bind(this));
    pushEntry(edition);

    const publication = this.fillPublication(record, head, this.createContentFill.bind(this), this.createSubfield.bind(this));
    pushEntry(publication);

    const copyright = this.fillCopyright(record, head, this.createContentFill.bind(this), this.createSubfield.bind(this));
    pushEntry(copyright);

    const physical = this.fillPhysical(record, head, this.createContentFill.bind(this), this.createSubfield.bind(this));
    pushEntry(physical);

    const default336Content = this.createContent('  ', [
      this.createSubfield('a', 'three-dimensional form'),
      this.createSubfield('b', 'tdf'),
      this.createSubfield('2', 'rdacontent')
    ]);
    const default336Directory = this.createDirectory('336', default336Content, head);
    head += this.getByteLength(default336Content);
    directoryParts.push(default336Directory);
    contentParts.push(default336Content);

    const default337Content = this.createContent('  ', [
      this.createSubfield('a', 'computer'),
      this.createSubfield('b', 'c'),
      this.createSubfield('2', 'rdamedia')
    ]);
    const default337Directory = this.createDirectory('337', default337Content, head);
    head += this.getByteLength(default337Content);
    directoryParts.push(default337Directory);
    contentParts.push(default337Content);

    const default338Content = this.createContent('  ', [
      this.createSubfield('a', 'other'),
      this.createSubfield('b', 'cz'),
      this.createSubfield('2', 'rdacarrier')
    ]);
    const default338Directory = this.createDirectory('338', default338Content, head);
    head += this.getByteLength(default338Content);
    directoryParts.push(default338Directory);
    contentParts.push(default338Content);

    const notes = this.fillNotes(record, head, this.createContentFill.bind(this), this.createSubfield.bind(this));
    pushEntry(notes);

    const keywords = this.fillKeywords(record, head, this.createContentFill.bind(this), this.createSubfield.bind(this));
    pushEntry(keywords);

    const fast = this.fillFAST(record, head, this.createContentFill.bind(this), this.createSubfield.bind(this));
    pushEntry(fast);

    const additionalAuthors = this.fillAdditionalAuthors(record, head, this.createContentFill.bind(this), this.createSubfield.bind(this));
    pushEntry(additionalAuthors);

    const additionalCorporateNames = this.fillAdditionalCorporateNames(record, head, this.createContentFill.bind(this), this.createSubfield.bind(this));
    pushEntry(additionalCorporateNames);

    const title880 = this.fillTranslitTitle(record, head, this.createContentFill.bind(this), this.createSubfield.bind(this));
    pushEntry(title880);

    const edition880 = this.fillTranslitEdition(record, head, this.createContentFill.bind(this), this.createSubfield.bind(this));
    pushEntry(edition880);

    const publisher880 = this.fillTranslitPublisher(record, head, this.createContentFill.bind(this), this.createSubfield.bind(this));
    pushEntry(publisher880);

    const author880 = this.fillTranslitAuthor(record, head, this.createContentFill.bind(this), this.createSubfield.bind(this));
    pushEntry(author880);

    const authors880 = this.fillTranslitAdditionalAuthors(record, head, this.createContentFill.bind(this), this.createSubfield.bind(this));
    pushEntry(authors880);

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
    text += '<record xmlns="http://www.loc.gov/MARC21/slim" xsi:schemaLocation="http://www.loc.gov/MARC21/slim http://www.loc.gov/standards/marcxml/schema/MARC21slim.xsd" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">\n';
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
    text += this.fillISBN(record, null, this.createMARCXMLField.bind(this), this.createMARCXMLSubfield.bind(this));
    text += this.fillItemNumber(record, null, this.createMARCXMLField.bind(this), this.createMARCXMLSubfield.bind(this));
    text += this.fillSuDoc(record, null, this.createMARCXMLField.bind(this), this.createMARCXMLSubfield.bind(this));
    text += this.fillReportNumber(record, null, this.createMARCXMLField.bind(this), this.createMARCXMLSubfield.bind(this));
    text += this.fillAuthor(record, null, this.createMARCXMLField.bind(this), this.createMARCXMLSubfield.bind(this));
    text += this.fillCorporateAuthor(record, null, this.createMARCXMLField.bind(this), this.createMARCXMLSubfield.bind(this));
    text += this.fillTitle(record, null, this.createMARCXMLField.bind(this), this.createMARCXMLSubfield.bind(this));
    text += this.fillEdition(record, null, this.createMARCXMLField.bind(this), this.createMARCXMLSubfield.bind(this));
    text += this.fillPublication(record, null, this.createMARCXMLField.bind(this), this.createMARCXMLSubfield.bind(this));
    text += this.fillCopyright(record, null, this.createMARCXMLField.bind(this), this.createMARCXMLSubfield.bind(this));
    text += this.fillPhysical(record, null, this.createMARCXMLField.bind(this), this.createMARCXMLSubfield.bind(this));
    text += this.createMARCXMLField('336', ' ', ' ', [
      this.createMARCXMLSubfield('a', 'three-dimensional form'),
      this.createMARCXMLSubfield('b', 'tdf'),
      this.createMARCXMLSubfield('2', 'rdacontent')
    ]);
    text += this.createMARCXMLField('337', ' ', ' ', [
      this.createMARCXMLSubfield('a', 'computer'),
      this.createMARCXMLSubfield('b', 'c'),
      this.createMARCXMLSubfield('2', 'rdamedia')
    ]);
    text += this.createMARCXMLField('338', ' ', ' ', [
      this.createMARCXMLSubfield('a', 'other'),
      this.createMARCXMLSubfield('b', 'cz'),
      this.createMARCXMLSubfield('2', 'rdacarrier')
    ]);
    text += this.fillNotes(record, null, this.createMARCXMLField.bind(this), this.createMARCXMLSubfield.bind(this));
    text += this.fillKeywords(record, null, this.createMARCXMLField.bind(this), this.createMARCXMLSubfield.bind(this));
    text += this.fillFAST(record, null, this.createMARCXMLField.bind(this), this.createMARCXMLSubfield.bind(this));
    text += this.fillAdditionalAuthors(record, null, this.createMARCXMLField.bind(this), this.createMARCXMLSubfield.bind(this));
    text += this.fillAdditionalCorporateNames(record, null, this.createMARCXMLField.bind(this), this.createMARCXMLSubfield.bind(this));
    text += this.fillTranslitTitle(record, null, this.createMARCXMLField.bind(this), this.createMARCXMLSubfield.bind(this));
    text += this.fillTranslitEdition(record, null, this.createMARCXMLField.bind(this), this.createMARCXMLSubfield.bind(this));
    text += this.fillTranslitPublisher(record, null, this.createMARCXMLField.bind(this), this.createMARCXMLSubfield.bind(this));
    text += this.fillTranslitAuthor(record, null, this.createMARCXMLField.bind(this), this.createMARCXMLSubfield.bind(this));
    text += this.fillTranslitAdditionalAuthors(record, null, this.createMARCXMLField.bind(this), this.createMARCXMLSubfield.bind(this));
    text += '</record>\n';

    downloadFile(text, 'xml');
  }
}
