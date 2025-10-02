import { ThesesMarcBuilder } from '../../shared/variants/thesesMarcBuilder.js';

const builder = new ThesesMarcBuilder();

window.downloadMARC = builder.downloadMARC.bind(builder);
window.downloadXML = builder.downloadXML.bind(builder);