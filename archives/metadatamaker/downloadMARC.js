import { ArchivesEADBuilder } from '../../shared/variants/archivesEADBuilder.js';

const builder = new ArchivesEADBuilder();

window.downloadMARC = function downloadMARCPlaceholder(record, institutionInfo) {
	if (typeof console !== 'undefined') {
		console.warn('downloadMARC is not supported for Archival Collections. Generating placeholder EAD record instead.');
	}
	return builder.downloadEAD(record, institutionInfo);
};

window.downloadXML = function downloadXMLPlaceholder(record, institutionInfo) {
	return builder.downloadEAD(record, institutionInfo);
};

window.downloadEAD = builder.downloadEAD.bind(builder);
