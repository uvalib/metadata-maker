/*
 * Utility functions (get, generateInstitutionInfo, find100, find110, checkExists) 
 * are now loaded from ../shared/sharedUtils.js
 * See that file for documentation.
 */

/*
 * When the form is submitted, create an object with all user-submitted data. Pass that object to functions that
 * build a record around the data.
 *
 * The first listed author or artist is placed in recordObject.author, while all other credited individuals are
 * placed into recordObject.additional_authors.
 *
 * No information should be submitted to the server, so the default behavior of the button is blocked.
 */
document.addEventListener('DOMContentLoaded', function () {
	const form = document.getElementById("marc-maker");
	if (form) {
		form.addEventListener("submit", function (event) {
			event.preventDefault();

			var words = [];
			var fast_array = [];
			var loopCounter = (typeof window.counter !== 'undefined') ? window.counter : 0;

			for (var i = 0; i < loopCounter; i++) {
				var fastIdElem = document.getElementById("fastID" + i);
				var keywordElem = document.getElementById("keyword" + i);
				var fastTypeElem = document.getElementById("fastType" + i);
				var fastIndElem = document.getElementById("fastInd" + i);

				if (fastIdElem && keywordElem && checkExists(fastIdElem.value) && checkExists(keywordElem.value)) {
					if (keywordElem.value.substring(keywordElem.value.length - 1) == ']') {
						var endpoint = keywordElem.value.lastIndexOf('[');
						fast_array.push([keywordElem.value.substring(0, endpoint - 1), fastIdElem.value, fastTypeElem ? fastTypeElem.value : '', fastIndElem ? fastIndElem.value : '']);
					}
					else {
						fast_array.push([keywordElem.value, fastIdElem.value, fastTypeElem ? fastTypeElem.value : '', fastIndElem ? fastIndElem.value : '']);
					}
				}
				else if (keywordElem) {
					words.push(keywordElem.value);
				}
			};

			// Helper to safely get value
			const getValue = (id) => {
				const el = document.getElementById(id);
				return el ? el.value : '';
			};

			// Helper to check if checkbox is checked
			const isChecked = (id) => {
				const el = document.getElementById(id);
				return el ? el.checked : false;
			};

			var complete_corporate_names_list = [
				[
					{
						corporate: getValue("corporate_name"),
						role: getValue("corporate_role")
					},
					{
						corporate: getValue("translit_corporate_name")
					}
				]
			];

			var corporateLoopCounter = (typeof window.cCounter !== 'undefined') ? window.cCounter : 0;
			for (var i = 0; i < corporateLoopCounter; i++) {
				var cName = document.getElementById("corporate_name" + i);
				var cRole = document.getElementById("corporate_role" + i);
				var tcName = document.getElementById("translit_corporate_name" + i);

				complete_corporate_names_list.push([
					{
						"corporate": cName ? cName.value : '',
						"role": cRole ? cRole.value : ''
					},
					{
						"corporate": tcName ? tcName.value : ''
					}
				]);
			}
			var entry110 = find110(complete_corporate_names_list);

			const physicalFormRaw = getValue("physical-form");
			const physicalFormCode = (physicalFormRaw === null || physicalFormRaw === '') ? '|' : physicalFormRaw;

			var recordObject = {
				title: [
					{
						title: getValue("title"),
						subtitle: getValue("subtitle")
					},
					{
						title: getValue("translit_title"),
						subtitle: getValue("translit_subtitle")
					}
				],
				varying_title_type: getValue("varying-title-dropdown"),
				varying_title: getValue("varying_title"),
				corporate_author: entry110[0],
				publisher: getValue("publisher"),
				publication_year: getValue("publication_year"),
				starting_year: getValue("year"),
				publication_place: getValue("place"),
				publication_country: getValue("country"),
				ending_year: getValue("edate"),
				language: getValue("language"),
				issn: getValue("issn"),
				publication_status: getValue("publication-status-dropdown"),
				volumes: getValue("volumes"),
				volume_or_page: 'volumes',
				literature_yes: isChecked("literature-yes"),
				literature_dropdown: getValue("literature-dropdown"),
				resource_type: getValue("resource_type"),
				government_publication_yes: isChecked("government_publication-yes"),
				physical_form_code: physicalFormCode,
				current_publication_frequency: getValue("current_publication_frequency"),
				regularity: getValue("regularity_dropdown"),
				description: getValue("description"),
				web_url: getValue("web-url"),
				preceding_title: getValue("preceding_title"),
				relationship_with_preceding_title: getValue("relationship_with_preceding_title"),
				succeeding_title: getValue("succeeding_title"),
				relationship_with_succeeding_title: getValue("relationship_with_succeeding_title"),
				dimensions: getValue("dimensions"),
				translit_publisher: getValue("translit_publisher"),
				translit_place: getValue("translit_place"),
				notes: getValue("notes"),
				keywords: words,
				fast: fast_array,
				additional_corporate_names: complete_corporate_names_list
			};

			var institution_info = generateInstitutionInfo();

			if (isChecked("MARC")) {
				downloadMARC(recordObject, institution_info);
			}

			if (isChecked("MARCXML")) {
				downloadXML(recordObject, institution_info);
			}

			if (isChecked("MODS")) {
				downloadMODS(recordObject, institution_info);
			}

			if (isChecked("HTML")) {
				downloadHTML(recordObject, institution_info);
			}
		});
	}
});
