import { DatasetMarcBuilder } from '../../shared/variants/datasetMarcBuilder.js';

const builder = new DatasetMarcBuilder();

window.downloadMARC = builder.downloadMARC.bind(builder);
window.downloadXML = builder.downloadXML.bind(builder);