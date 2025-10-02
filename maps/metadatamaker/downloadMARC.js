import { MapsMarcBuilder } from '../../shared/variants/mapsMarcBuilder.js';

const builder = new MapsMarcBuilder();

window.downloadMARC = builder.downloadMARC.bind(builder);
window.downloadXML = builder.downloadXML.bind(builder);