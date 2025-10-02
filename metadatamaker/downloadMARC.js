import { MarcBuilder } from '../shared/marcBuilder.js';

const builder = new MarcBuilder();

window.downloadMARC = builder.downloadMARC.bind(builder);
window.downloadXML = builder.downloadXML.bind(builder);
