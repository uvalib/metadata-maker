import { GovdocsMarcBuilder } from '../../shared/variants/govdocsMarcBuilder.js';

const builder = new GovdocsMarcBuilder();

window.downloadMARC = builder.downloadMARC.bind(builder);
window.downloadXML = builder.downloadXML.bind(builder);