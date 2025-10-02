import { MixedMediaMarcBuilder } from '../../shared/variants/mixedMediaMarcBuilder.js';

const builder = new MixedMediaMarcBuilder();

window.downloadMARC = builder.downloadMARC.bind(builder);
window.downloadXML = builder.downloadXML.bind(builder);
