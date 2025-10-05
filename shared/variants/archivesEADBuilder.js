export class ArchivesEADBuilder {
	buildPlaceholderEAD(record, institutionInfo) {
		const title = (record && record.title && record.title[0] && record.title[0].title) || 'Untitled collection';
		const repository = record && record.repository_name ? record.repository_name : (institutionInfo && institutionInfo.mods && institutionInfo.mods.physicalLocation) || 'Repository';
		const now = typeof getTimestamp === 'function' ? getTimestamp() : new Date().toISOString().replace(/[-:]/g, '').slice(0, 14);
		return `<?xml version="1.0" encoding="UTF-8"?>\n` +
			`<ead xmlns="urn:isbn:1-931666-22-9" xmlns:xlink="http://www.w3.org/1999/xlink" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="urn:isbn:1-931666-22-9 https://www.loc.gov/ead/ead.xsd">\n` +
			`  <eadheader>\n` +
			`    <eadid identifier="temporary-id">temporary-id</eadid>\n` +
			`    <filedesc>\n` +
			`      <titlestmt>\n` +
			`        <titleproper>${this.escapeXML(title)}</titleproper>\n` +
			`      </titlestmt>\n` +
			`      <publicationstmt>\n` +
			`        <publisher>${this.escapeXML(repository)}</publisher>\n` +
			`      </publicationstmt>\n` +
			`    </filedesc>\n` +
			`    <profiledesc>\n` +
			`      <creation>${now}</creation>\n` +
			`    </profiledesc>\n` +
			`  </eadheader>\n` +
			`  <archdesc level="collection">\n` +
			`    <did>\n` +
			`      <unittitle>${this.escapeXML(title)}</unittitle>\n` +
			`    </did>\n` +
			`  </archdesc>\n` +
			`</ead>\n`;
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
		const ead = this.buildPlaceholderEAD(record, institutionInfo);
		if (typeof downloadFile === 'function') {
			downloadFile(ead, 'xml');
			return ead;
		}
		if (typeof console !== 'undefined') {
			console.warn('downloadFile helper not available; returning EAD string');
		}
		return ead;
	}
}
