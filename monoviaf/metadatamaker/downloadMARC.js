import { MonoviafMarcBuilder } from '../../shared/variants/monoviafMarcBuilder.js';

const builder = new MonoviafMarcBuilder();

window.downloadMARC = builder.downloadMARC.bind(builder);
window.downloadXML = builder.downloadXML.bind(builder);
