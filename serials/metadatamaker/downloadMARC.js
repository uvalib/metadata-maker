import { SerialsMarcBuilder } from '../../shared/variants/serialsMarcBuilder.js';

const builder = new SerialsMarcBuilder();

window.downloadMARC = builder.downloadMARC.bind(builder);
window.downloadXML = builder.downloadXML.bind(builder);