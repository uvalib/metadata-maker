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

			var additional_names = [];
			var translit_additional_names = [];
			var complete_names_list = [
				[
					{
						family: getValue("family_name"),
						given: getValue("given_name"),
						role: getValue("role")
					},
					{
						family: getValue("translit_family_name"),
						given: getValue("translit_given_name")
					}
				]
			];

			var authorLoopCounter = (typeof window.aCounter !== 'undefined') ? window.aCounter : 0;
			for (var i = 0; i < authorLoopCounter; i++) {
				var fName = document.getElementById("family_name" + i);
				var gName = document.getElementById("given_name" + i);
				var r = document.getElementById("role" + i);
				var tfName = document.getElementById("translit_family_name" + i);
				var tgName = document.getElementById("translit_given_name" + i);

				complete_names_list.push([
					{
						"family": fName ? fName.value : '',
						"given": gName ? gName.value : '',
						"role": r ? r.value : ''
					},
					{
						"family": tfName ? tfName.value : '',
						"given": tgName ? tgName.value : ''
					}
				]);
			}
			//Find the first listed author or artist
			var entry100 = find100(complete_names_list);

			var corporate_entries = [
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

				corporate_entries.push([
					{
						corporate: cName ? cName.value : '',
						role: cRole ? cRole.value : ''
					},
					{
						corporate: tcName ? tcName.value : ''
					}
				]);
			}

			var filtered_corporate_entries = [];
			for (var i = 0; i < corporate_entries.length; i++) {
				if (checkExists(corporate_entries[i][0]['corporate']) || checkExists(corporate_entries[i][1]['corporate'])) {
					filtered_corporate_entries.push(corporate_entries[i]);
				}
			}

			var hasPersonalAuthor = checkExists(entry100[0]) && checkExists(entry100[0][0]) && (checkExists(entry100[0][0]['family']) || checkExists(entry100[0][0]['given']));
			var corporate_author = [{ 'corporate': '', 'role': '' }, { 'corporate': '' }];
			if (!hasPersonalAuthor && filtered_corporate_entries.length > 0) {
				var selectedCorporate = find110(filtered_corporate_entries);
				if (Array.isArray(selectedCorporate) && selectedCorporate.length === 1 && Array.isArray(selectedCorporate[0])) {
					selectedCorporate = selectedCorporate[0];
				}
				if (Array.isArray(selectedCorporate) && selectedCorporate.length >= 2) {
					corporate_author = [
						{ corporate: selectedCorporate[0]['corporate'] || '', role: selectedCorporate[0]['role'] || '' },
						{ corporate: (selectedCorporate[1] && selectedCorporate[1]['corporate']) || '' }
					];
				}
			}

			var additional_corporate_authors = [];
			for (var i = 0; i < filtered_corporate_entries.length; i++) {
				additional_corporate_authors.push(filtered_corporate_entries[i]);
			}

			var accompanying_matter_selections = [];
			for (var i = 0; i <= 13; i++) {
				if (isChecked("accompanying-matter" + i.toString())) {
					var elem = document.getElementById("accompanying-matter" + i.toString());
					if (elem) {
						accompanying_matter_selections.push(elem.value);
					}
				}
			}

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
				uniform_title: getValue("uniform_title"),
				author: entry100[0],
				publisher: getValue("publisher"),
				publication_year: getValue("year"),
				publication_place: getValue("place"),
				publication_country: getValue("country"),
				copyright_year: getValue("cyear"),
				language: getValue("language"),
				isbn: getValue("isbn"),
				ismn: getValue("ismn"),
				volume_or_page: getValue("vorp"),
				pages: getValue("pages"),
				unpaged: isChecked("pages_listed"),
				literature_yes: isChecked("literature-yes"),
				literature_dropdown: getValue("literature-dropdown"),
				illustrations_yes: isChecked("illustrations-yes"),
				physical_form_code: physicalFormCode,
				dimensions: getValue("dimensions"),
				edition: getValue("edition"),
				composition_form: getValue("composition-form-dropdown"),
				score_format: getValue("score-format-dropdown"),
				music_parts: getValue("music-parts-dropdown"),
				transposition_arrangement: getValue("transposition-arrangement-dropdown"),
				accompanying_matters: accompanying_matter_selections,
				translit_edition: getValue("translit_edition"),
				translit_publisher: getValue("translit_publisher"),
				translit_place: getValue("translit_place"),
				contents: getValue("contents"),
				notes: getValue("notes"),
				formatted_contents_note: getValue("formatted-contents-note"),
				keywords: words,
				fast: fast_array,
				additional_authors: complete_names_list,
				corporate_author: corporate_author,
				additional_corporate_authors: additional_corporate_authors
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
