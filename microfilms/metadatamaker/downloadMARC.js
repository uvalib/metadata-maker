import { MicrofilmsMarcBuilder } from '../../shared/variants/microfilmsMarcBuilder.js';

const builder = new MicrofilmsMarcBuilder();

window.downloadMARC = builder.downloadMARC.bind(builder);
window.downloadXML = builder.downloadXML.bind(builder);