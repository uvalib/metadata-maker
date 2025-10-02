import { EbookMarcBuilder } from '../../shared/variants/ebookMarcBuilder.js';

const builder = new EbookMarcBuilder();

window.downloadMARC = builder.downloadMARC.bind(builder);
window.downloadXML = builder.downloadXML.bind(builder);
