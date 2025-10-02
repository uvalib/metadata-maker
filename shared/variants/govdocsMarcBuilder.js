import { MarcBuilder } from '../marcBuilder.js';

export class GovdocsMarcBuilder extends MarcBuilder {
  create008Field(record) {
    const base = super.create008Field(record).split('');
    base[28] = 'f';
    base[33] = '0';
    base[35] = 'e';
    base[36] = 'n';
    base[37] = 'g';
    return base.join('');
  }

  fillItemNumber(record, head, fieldFunc, subfieldFunc) {
    if (checkExists(record.item_number)) {
      const itemNumber = fieldFunc('074', ' ', ' ', [subfieldFunc('a', record.item_number)]);
      return this.returnSingleEntry('074', itemNumber, head);
    }
    return head !== null ? ['', ''] : '';
  }

  fillSuDoc(record, head, fieldFunc, subfieldFunc) {
    if (checkExists(record.sudoc)) {
      const sudoc = fieldFunc('086', '0', ' ', [subfieldFunc('a', record.sudoc)]);
      return this.returnSingleEntry('086', sudoc, head);
    }
    return head !== null ? ['', ''] : '';
  }

  fillReportNumber(record, head, fieldFunc, subfieldFunc) {
    if (checkExists(record.report_number)) {
      const reportNumber = fieldFunc('088', ' ', ' ', [subfieldFunc('a', record.report_number)]);
      return this.returnSingleEntry('088', reportNumber, head);
    }
    return head !== null ? ['', ''] : '';
  }

  fillCorporateAuthor(record, head, fieldFunc, subfieldFunc) {
    const roleIndex = { cre: 'creator', ctb: 'contributor' };
    const corpValue = Array.isArray(record.corporate_author)
      ? record.corporate_author[0]
      : record.corporate_author;

    if (!checkExists(corpValue) || !checkExists(corpValue['corporate'])) {
      return head !== null ? ['', ''] : '';
    }

    const role = corpValue['role'] || 'cre';
    const subfields = [
      subfieldFunc('a', corpValue['corporate']),
      subfieldFunc('e', `${roleIndex[role] || 'creator'}.`),
      subfieldFunc('4', role)
    ];

    const author = fieldFunc('110', '1', ' ', subfields);
    return this.returnSingleEntry('110', author, head);
  }

  fillAdditionalCorporateNames(record, head, fieldFunc, subfieldFunc) {
    if (!checkExists(record.additional_corporate_names)) {
      return head !== null ? ['', '', head] : '';
    }

    let authors = '';
    let directory = '';

    const roleIndex = { cre: 'creator', ctb: 'contributor' };

    for (let i = 0; i < record.additional_corporate_names.length; i++) {
      const corp = record.additional_corporate_names[i];
      if (!checkExists(corp) || !checkExists(corp['corporate'])) {
        continue;
      }

      const role = corp['role'] || 'cre';
      const subfields = [
        subfieldFunc('a', corp['corporate']),
        subfieldFunc('e', `${roleIndex[role] || 'creator'}.`),
        subfieldFunc('4', role)
      ];

      const content = fieldFunc('710', '1', ' ', subfields);
      authors += content;

      if (head !== null) {
        const entry = this.createDirectory('710', content, head);
        head += this.getByteLength(content);
        directory += entry;
      }
    }

    return this.returnMultipleEntries(directory, authors, head);
  }

  downloadMARC(record, institutionInfo) {
    let head = 0;
    const contentFill = this.createContentFill.bind(this);
    const subfield = this.createSubfield.bind(this);

    const timestampContent = String.fromCharCode(30) + getTimestamp();
    const timestampDirectory = this.createDirectory('005', timestampContent, head);
    head += timestampContent.length;

    const controlfield008Content = String.fromCharCode(30) + this.create008Field(record);
    const controlfield008Directory = this.createDirectory('008', controlfield008Content, head);
    head += controlfield008Content.length;

    const isbn = this.fillISBN(record, head, contentFill, subfield);
    head += isbn[1].length;

    const default1Content = this.createContent('  ', [
      subfield('a', institutionInfo['marc']),
      subfield('b', 'eng'),
      subfield('e', 'rda'),
      subfield('c', institutionInfo['marc'])
    ]);
    const default1Directory = this.createDirectory('040', default1Content, head);
    head += default1Content.length;

    const itemNumber = this.fillItemNumber(record, head, contentFill, subfield);
    head += this.getByteLength(itemNumber[1]);

    const sudoc = this.fillSuDoc(record, head, contentFill, subfield);
    head += this.getByteLength(sudoc[1]);

    const reportNumber = this.fillReportNumber(record, head, contentFill, subfield);
    head += this.getByteLength(reportNumber[1]);

    const author = this.fillAuthor(record, head, contentFill, subfield);
    head += this.getByteLength(author[1]);

    const corporateAuthor = this.fillCorporateAuthor(record, head, contentFill, subfield);
    head += this.getByteLength(corporateAuthor[1]);

    const title = this.fillTitle(record, head, contentFill, subfield);
    head += this.getByteLength(title[1]);

    const edition = this.fillEdition(record, head, contentFill, subfield);
    head += this.getByteLength(edition[1]);

    const pub = this.fillPublication(record, head, contentFill, subfield);
    head += this.getByteLength(pub[1]);

    const copyright = this.fillCopyright(record, head, contentFill, subfield);
    head += this.getByteLength(copyright[1]);

    const physical = this.fillPhysical(record, head, contentFill, subfield);
    head += this.getByteLength(physical[1]);

    const default2Content = this.createContent('  ', [
      subfield('a', 'text'),
      subfield('b', 'txt'),
      subfield('2', 'rdacontent')
    ]);
    const default2Directory = this.createDirectory('336', default2Content, head);
    head += default2Content.length;

    const default3Content = this.createContent('  ', [
      subfield('a', 'unmediated'),
      subfield('b', 'n'),
      subfield('2', 'rdamedia')
    ]);
    const default3Directory = this.createDirectory('337', default3Content, head);
    head += default3Content.length;

    const default4Content = this.createContent('  ', [
      subfield('a', 'volume'),
      subfield('b', 'nc'),
      subfield('2', 'rdacarrier')
    ]);
    const default4Directory = this.createDirectory('338', default4Content, head);
    head += default4Content.length;

    const notes = this.fillNotes(record, head, contentFill, subfield);
    head += this.getByteLength(notes[1]);

    const keywords = this.fillKeywords(record, head, contentFill, subfield);
    head = keywords[2];

    const fast = this.fillFAST(record, head, contentFill, subfield);
    head = fast[2];

    const additionalAuthors = this.fillAdditionalAuthors(record, head, contentFill, subfield);
    head = additionalAuthors[2];

    const additionalCorporateAuthors = this.fillAdditionalCorporateNames(record, head, contentFill, subfield);
    head = additionalCorporateAuthors[2];

    const title880 = this.fillTranslitTitle(record, head, contentFill, subfield);
    head += this.getByteLength(title880[1]);

    const edition880 = this.fillTranslitEdition(record, head, contentFill, subfield);
    head += this.getByteLength(edition880[1]);

    const publisher880 = this.fillTranslitPublisher(record, head, contentFill, subfield);
    head += this.getByteLength(publisher880[1]);

    const author880 = this.fillTranslitAuthor(record, head, contentFill, subfield);
    head += this.getByteLength(author880[1]);

    const authors880 = this.fillTranslitAdditionalAuthors(record, head, contentFill, subfield);
    head = authors880[2];

    const end = String.fromCharCode(30) + String.fromCharCode(29);

    const directoryParts = [
      timestampDirectory,
      controlfield008Directory,
      isbn[0],
      default1Directory,
      itemNumber[0],
      sudoc[0],
      reportNumber[0],
      author[0],
      corporateAuthor[0],
      title[0],
      edition[0],
      pub[0],
      copyright[0],
      physical[0],
      default2Directory,
      default3Directory,
      default4Directory,
      notes[0],
      keywords[0],
      fast[0],
      additionalAuthors[0],
      additionalCorporateAuthors[0],
      title880[0],
      edition880[0],
      publisher880[0],
      author880[0],
      authors880[0]
    ];

    const contentParts = [
      timestampContent,
      controlfield008Content,
      isbn[1],
      default1Content,
      itemNumber[1],
      sudoc[1],
      reportNumber[1],
      author[1],
      corporateAuthor[1],
      title[1],
      edition[1],
      pub[1],
      copyright[1],
      physical[1],
      default2Content,
      default3Content,
      default4Content,
      notes[1],
      keywords[1],
      fast[1],
      additionalAuthors[1],
      additionalCorporateAuthors[1],
      title880[1],
      edition880[1],
      publisher880[1],
      author880[1],
      authors880[1],
      end
    ];

    const textParts = [...directoryParts, ...contentParts];
    const finalizedTextParts = this.beforeFinalizeMarcText(textParts, record, institutionInfo, { head });
    const text = finalizedTextParts.join('');

    const directoryLen = 25 + directoryParts.reduce((sum, part) => sum + part.length, 0);
    const leaderLen = this.getByteLength(text) + 24;
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
