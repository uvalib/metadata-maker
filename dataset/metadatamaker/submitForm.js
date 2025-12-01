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
			// Use global counter if available, otherwise default to 0 or handle gracefully
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

			var additional_names = [];
			var translit_additional_names = [];

			var familyName = document.getElementById("family_name");
			var givenName = document.getElementById("given_name");
			var role = document.getElementById("role");
			var translitFamilyName = document.getElementById("translit_family_name");
			var translitGivenName = document.getElementById("translit_given_name");

			var complete_names_list = [
				[
					{
						family: familyName ? familyName.value : '',
						given: givenName ? givenName.value : '',
						role: role ? role.value : ''
					},
					{
						family: translitFamilyName ? translitFamilyName.value : '',
						given: translitGivenName ? translitGivenName.value : ''
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

			var corporateName = document.getElementById("corporate_name");
			var corporateRole = document.getElementById("corporate_role");
			var translitCorporateName = document.getElementById("translit_corporate_name");

			var complete_corporate_names_list = [
				[
					{
						corporate: corporateName ? corporateName.value : '',
						role: corporateRole ? corporateRole.value : ''
					},
					{
						corporate: translitCorporateName ? translitCorporateName.value : ''
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
			var entry110 = [[{ 'corporate': '', 'role': '' }, { 'corporate': '' }]];
			if (!entry100[0]) {
				entry110 = find110(complete_corporate_names_list);
			}

			// Helper to safely get value
			const getValue = (id) => {
				const el = document.getElementById(id);
				return el ? el.value : '';
			};

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
				author: entry100[0],
				corporate_author: entry110[0],
				publisher: getValue("publisher"),
				publication_year: getValue("year"),
				publication_place: getValue("place"),
				publication_country: getValue("country"),
				copyright_year: getValue("cyear"),
				web_url: 'http://' + getValue("web-url"),
				language: getValue("language"),
				translit_publisher: getValue("translit_publisher"),
				translit_place: getValue("translit_place"),
				contents: getValue("contents"),
				notes: getValue("notes"),
				keywords: words,
				fast: fast_array,
				additional_authors: complete_names_list,
				additional_corporate_names: complete_corporate_names_list,
				format: getValue("format"),
				size: getValue("size"),
				daterange: getValue("daterange"),
				datecollected: getValue("datecollected"),
				gcoverage: getValue("gcoverage"),
				access_terms: getValue("access_terms"),
				use_terms: getValue("use_terms")
			};

			var institution_info = generateInstitutionInfo();

			if (document.getElementById("MARC") && document.getElementById("MARC").checked) {
				downloadMARC(recordObject, institution_info);
			}

			if (document.getElementById("MARCXML") && document.getElementById("MARCXML").checked) {
				downloadXML(recordObject, institution_info);
			}

			if (document.getElementById("MODS") && document.getElementById("MODS").checked) {
				downloadMODS(recordObject, institution_info);
			}

			if (document.getElementById("HTML") && document.getElementById("HTML").checked) {
				downloadHTML(recordObject, institution_info);
			}
		});
	}
});
