import { ScoresMarcBuilder } from '../../shared/variants/scoresMarcBuilder.js';

const builder = new ScoresMarcBuilder();

window.downloadMARC = builder.downloadMARC.bind(builder);
window.downloadXML = builder.downloadXML.bind(builder);


// legacy function stubs removed; functionality is provided by ScoresMarcBuilder.

// additional legacy helpers removed

// remaining legacy logic removed; shared builder handles MARC generation