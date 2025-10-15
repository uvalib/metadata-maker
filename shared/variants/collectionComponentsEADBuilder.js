export class CollectionComponentsEADBuilder {
	buildEAD(record, institutionInfo = {}) {
		const now = new Date().toISOString();
		const title = this.getTitle(record);
		const subtitle = this.getSubtitle(record);
		const repositoryName = this.getRepositoryName(record, institutionInfo);
		const addressLines = this.getAddressLines(record);
		const physloc = this.getPhysicalLocation(record);
		const unitDate = this.getUnitDate(record);
		const identifier = this.getIdentifier(record);
		const originationEntries = this.getOriginationEntries(record);
		const languages = this.getLanguages(record);
		const extents = this.getExtents(record);
		const dimensions = this.getDimensions(record);
		const descriptions = this.getDescriptions(record);
		const bibliography = this.getBibliography(record);
		const subjects = this.getSubjects(record);

		let ead = `<?xml version="1.0" encoding="UTF-8"?>\n`;
		ead += `<ead xmlns="urn:isbn:1-931666-22-9" xmlns:xlink="http://www.w3.org/1999/xlink" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="urn:isbn:1-931666-22-9 https://www.loc.gov/ead/ead.xsd">\n`;
		ead += `  <eadheader>\n`;
		ead += `    <eadid/>\n`;
		ead += `    <filedesc>\n`;
		ead += `      <titlestmt>\n`;
		ead += `        <titleproper>Guide to the ${this.escapeXML(title)}</titleproper>\n`;
		if (subtitle) {
			ead += `        <subtitle>${this.escapeXML(subtitle)}</subtitle>\n`;
		}
		ead += `      </titlestmt>\n`;
		ead += `      <publicationstmt>\n`;
		ead += `        <publisher>${this.escapeXML(repositoryName)}</publisher>\n`;
		ead += `        <date>${this.escapeXML(now)}</date>\n`;
		if (addressLines.length > 0) {
			ead += `        <address>\n`;
			addressLines.forEach((line) => {
				ead += `          <addressline>${this.escapeXML(line)}</addressline>\n`;
			});
			ead += `        </address>\n`;
		}
		ead += `      </publicationstmt>\n`;
		ead += `    </filedesc>\n`;
		ead += `  </eadheader>\n`;
		ead += `  <archdesc level="collection">\n`;
		ead += `    <did>\n`;
		ead += `      <unittitle>${this.escapeXML(title)}</unittitle>\n`;
		ead += `      <repository>\n`;
		ead += `        <corpname>${this.escapeXML(repositoryName)}</corpname>\n`;
		if (addressLines.length > 0) {
			ead += `        <address>\n`;
			addressLines.forEach((line) => {
				ead += `          <addressline>${this.escapeXML(line)}</addressline>\n`;
			});
			ead += `        </address>\n`;
		}
		ead += `      </repository>\n`;
		if (physloc) {
			ead += `      <physloc>${this.escapeXML(physloc)}</physloc>\n`;
		}
		if (unitDate) {
			ead += `      <unitdate type="${this.escapeXML(unitDate.type)}">${this.escapeXML(unitDate.value)}</unitdate>\n`;
		}
		if (identifier) {
			ead += `      <unitid>${this.escapeXML(identifier)}</unitid>\n`;
		}
		originationEntries.forEach((entry) => {
			ead += `      <origination>${this.escapeXML(entry)}</origination>\n`;
		});
		languages.forEach((language) => {
			ead += `      <langmaterial>${this.escapeXML(language)}</langmaterial>\n`;
		});
		if (extents.length > 0 || dimensions) {
			ead += `      <physdesc>\n`;
			extents.forEach((extent) => {
				if (!extent.text) {
					return;
				}
				const unitsAttr = extent.units ? ` unit="${this.escapeXML(extent.units)}"` : '';
				ead += `        <extent${unitsAttr}>${this.escapeXML(extent.text)}</extent>\n`;
			});
			if (dimensions && dimensions.value) {
				const unitsAttr = dimensions.units ? ` unit="${this.escapeXML(dimensions.units)}"` : '';
				ead += `        <dimensions${unitsAttr}>${this.escapeXML(dimensions.value)}</dimensions>\n`;
			}
			ead += `      </physdesc>\n`;
		}
		ead += `    </did>\n`;
		descriptions.forEach((description) => {
			if (!description.type || !description.text) {
				return;
			}
			const tagName = this.sanitiseTagName(description.type);
			ead += `    <${tagName}><p>${this.escapeXML(description.text)}</p></${tagName}>\n`;
		});
		if (bibliography.length > 0) {
			ead += `    <bibliography>\n`;
			bibliography.forEach((entry) => {
				ead += `      <bibref>${this.escapeXML(entry)}</bibref>\n`;
			});
			ead += `    </bibliography>\n`;
		}
		if (subjects.length > 0) {
			ead += `    <controlaccess>\n`;
			subjects.forEach((subject) => {
				const elementName = this.getSubjectElementName(subject.type);
				const sourceAttr = subject.source ? ` source="${this.escapeXML(subject.source)}"` : '';
				ead += `      <${elementName}${sourceAttr}>${this.escapeXML(subject.term)}</${elementName}>\n`;
			});
			ead += `    </controlaccess>\n`;
		}
		ead += `  </archdesc>\n`;
		ead += `</ead>\n`;

		return ead;
	}

	escapeXML(content) {
		if (typeof escapeXML === 'function') {
			return escapeXML(content || '');
		}
		return String(content || '')
			.replace(/&/g, '&amp;')
			.replace(/</g, '&lt;')
			.replace(/>/g, '&gt;')
			.replace(/"/g, '&quot;')
			.replace(/'/g, '&apos;');
	}

	downloadEAD(record, institutionInfo) {
		const ead = this.buildEAD(record, institutionInfo);
		if (typeof downloadFile === 'function') {
			downloadFile(ead, 'ead');
			return ead;
		}
		if (typeof window !== 'undefined' && typeof window.downloadFile === 'function') {
			window.downloadFile(ead, 'ead');
			return ead;
		}
		if (typeof console !== 'undefined') {
			console.warn('downloadFile helper not available; returning EAD string');
		}
		return ead;
	}

	getTitle(record) {
		const title = record && record.title && record.title[0] && record.title[0].title;
		const normalised = this.normaliseString(title);
		return normalised || 'Untitled collection';
	}

	getSubtitle(record) {
		return this.normaliseString(record && record.title && record.title[0] && record.title[0].subtitle);
	}

	getRepositoryName(record, institutionInfo) {
		if (record && record.repository_name) {
			const normalised = this.normaliseString(record.repository_name);
			if (normalised) {
				return normalised;
			}
		}
		if (institutionInfo && institutionInfo.mods && institutionInfo.mods.physicalLocation) {
			const normalised = this.normaliseString(institutionInfo.mods.physicalLocation);
			if (normalised) {
				return normalised;
			}
		}
		return 'Repository';
	}

	getAddressLines(record) {
		if (!record || !Array.isArray(record.repository_address)) {
			return [];
		}
		return record.repository_address
			.map((line) => this.normaliseString(line))
			.filter((line) => line !== '');
	}

	getPhysicalLocation(record) {
		return this.normaliseString(record && record.repository_location);
	}

	getUnitDate(record) {
		if (!record) {
			return null;
		}
		const start = this.normaliseString(record.coverage_start);
		const end = this.normaliseString(record.coverage_end);
		if (!start && !end) {
			return null;
		}
		let value = '';
		if (start && end) {
			value = `${start}/${end}`;
		} else if (start) {
			value = start;
		} else {
			value = end;
		}
		const type = this.normaliseString(record.coverage_type) || 'inclusive';
		return { type, value };
	}

	getIdentifier(record) {
		return this.normaliseString(record && record.identifier);
	}

	getOriginationEntries(record) {
		const entries = [];
		if (record && Array.isArray(record.originators_personal)) {
			record.originators_personal.forEach((originator) => {
				const family = this.normaliseString(originator && originator.family);
				const given = this.normaliseString(originator && originator.given);
				if (!family && !given) {
					return;
				}
				let value = family;
				if (given) {
					value = `${value}, ${given}`;
				}
				const birth = this.normaliseString(originator && originator.birth_date);
				const death = this.normaliseString(originator && originator.death_date);
				if (birth || death) {
					const datePortion = `${birth || ''}-${death || ''}`.replace(/-$/, '').replace(/^-/, '');
					if (datePortion) {
						value = `${value} (${datePortion})`;
					}
				}
				entries.push(value);
			});
		}
		if (record && Array.isArray(record.originators_corporate)) {
			record.originators_corporate.forEach((originator) => {
				const name = this.normaliseString(originator && originator.name);
				if (!name) {
					return;
				}
				const start = this.normaliseString(originator && originator.start_date);
				const end = this.normaliseString(originator && originator.end_date);
				let value = name;
				if (start || end) {
					const datePortion = `${start || ''}-${end || ''}`.replace(/-$/, '').replace(/^-/, '');
					if (datePortion) {
						value = `${value} (${datePortion})`;
					}
				}
				entries.push(value);
			});
		}
		if (entries.length === 0 && record && record.corporate_author && record.corporate_author.corporate) {
			const fallback = this.normaliseString(record.corporate_author.corporate);
			if (fallback) {
				entries.push(fallback);
			}
		}
		return entries;
	}

	getLanguages(record) {
		if (!record || !Array.isArray(record.languages)) {
			return [];
		}
		return record.languages
			.map((lang) => this.normaliseString(lang))
			.filter((lang) => lang !== '');
	}

	getExtents(record) {
		if (!record || !Array.isArray(record.extent)) {
			return [];
		}
		return record.extent
			.filter((entry) => entry && (entry.text || entry.units))
			.map((entry) => ({
				text: this.normaliseString(entry && entry.text),
				units: this.normaliseString(entry && entry.units)
			}))
			.filter((entry) => entry.text !== '' || entry.units !== '');
	}

	getDimensions(record) {
		if (!record || !record.dimensions) {
			return null;
		}
		const value = this.normaliseString(record.dimensions.value);
		const units = this.normaliseString(record.dimensions.units);
		if (!value && !units) {
			return null;
		}
		return { value, units };
	}

	getDescriptions(record) {
		const descriptions = [];
		if (record) {
			if (Array.isArray(record.descriptions)) {
				record.descriptions.forEach((description) => {
					if (description && description.type && this.normaliseString(description.text)) {
						descriptions.push({
							type: description.type,
							text: this.normaliseString(description.text)
						});
					}
				});
			} else if (record.description && record.description.type && this.normaliseString(record.description.text)) {
				descriptions.push({
					type: record.description.type,
					text: this.normaliseString(record.description.text)
				});
			}
		}
		return descriptions;
	}

	getBibliography(record) {
		if (!record || !Array.isArray(record.bibliography)) {
			return [];
		}
		return record.bibliography
			.map((entry) => this.normaliseString(entry))
			.filter((entry) => entry !== '');
	}

	getSubjects(record) {
		if (!record || !Array.isArray(record.subjects)) {
			return [];
		}
		return record.subjects
			.filter((subject) => subject && (subject.term || subject.source))
			.map((subject) => ({
				term: this.normaliseString(subject && subject.term),
				type: subject && subject.type ? subject.type : 'topic',
				source: this.normaliseString(subject && subject.source)
			}))
			.filter((subject) => subject.term !== '');
	}

	getSubjectElementName(subjectType) {
		const map = {
			corpName: 'corpname',
			famName: 'famname',
			persName: 'persname',
			geogName: 'geogname',
			occupation: 'occupation',
			genreForm: 'genreform',
			function: 'function',
			topic: 'subject'
		};
		return map[subjectType] || 'subject';
	}

	sanitiseTagName(tagName) {
		if (!tagName) {
			return 'note';
		}
		return tagName.replace(/[^a-zA-Z0-9_-]/g, '') || 'note';
	}

	normaliseString(value) {
		if (typeof value === 'string') {
			return value.trim();
		}
		if (value === null || value === undefined) {
			return '';
		}
		return String(value).trim();
	}
}
