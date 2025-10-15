import { CollectionComponentsEADBuilder } from '../../shared/variants/collectionComponentsEADBuilder.js';

const builder = new CollectionComponentsEADBuilder();

window.downloadMARC = function downloadMARCPlaceholder(record, institutionInfo) {
	if (typeof console !== 'undefined') {
		console.warn('downloadMARC is not supported for Collection Components. Generating placeholder EAD record instead.');
	}
	return builder.downloadEAD(record, institutionInfo);
};

window.downloadXML = function downloadXMLPlaceholder(record, institutionInfo) {
	return builder.downloadEAD(record, institutionInfo);
};

window.downloadEAD = builder.downloadEAD.bind(builder);
