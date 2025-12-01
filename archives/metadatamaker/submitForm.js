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
			console.log('Archives form submission started');

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

			var complete_corporate_names_list = [
				{
					corporate: getValue("corporate_name"),
					role: getValue("corporate_role")
				}
			];

			var corporateLoopCounter = (typeof window.cCounter !== 'undefined') ? window.cCounter : 0;
			for (var i = 0; i < corporateLoopCounter; i++) {
				var cName = document.getElementById("corporate_name" + i);
				var cRole = document.getElementById("corporate_role" + i);

				complete_corporate_names_list.push({
					"corporate": cName ? cName.value : '',
					"role": cRole ? cRole.value : ''
				});
			}

			var entry110 = find110(complete_corporate_names_list);

			var repositoryAddresses = Array.prototype.slice.call(document.querySelectorAll('.repository-address-input'))
				.map(function (input) {
					return (input.value || '').trim();
				})
				.filter(function (value) {
					return value !== '';
				});

			var originatorComponent = document.querySelector('originator-input');
			var originatorData = originatorComponent && typeof originatorComponent.getValue === 'function'
				? originatorComponent.getValue()
				: { personalOriginators: [], corporateOriginators: [] };

			if (originatorComponent && typeof originatorComponent.validate === 'function') {
				if (!originatorComponent.validate()) {
					console.warn('Originator validation failed; blocking submission');
					return;
				}
			}

			var languageEntries = Array.from(document.querySelectorAll('.language-input'))
				.map(function (input) {
					return (input.value || '').trim();
				})
				.filter(function (value) {
					return value !== '';
				});

			var bibliographyEntries = Array.from(document.querySelectorAll('.bibliography-input'))
				.map(function (input) {
					return (input.value || '').trim();
				})
				.filter(function (value) {
					return value !== '';
				});

			var extentComponent = document.querySelector('repeatable-extent-input');
			var extentEntries = extentComponent && typeof extentComponent.getEntries === 'function'
				? extentComponent.getEntries()
				: [];

			var subjectComponent = document.querySelector('repeatable-subject-input');
			var subjectEntries = subjectComponent && typeof subjectComponent.getEntries === 'function'
				? subjectComponent.getEntries()
				: [];

			var recordObject = {
				repository_name: getValue("repository_name"),
				repository_location: getValue("repository_location"),
				repository_address: repositoryAddresses,
				identifier: getValue("identifier"),
				coverage_start: getValue("coverage_start"),
				coverage_end: getValue("coverage_end"),
				coverage_type: getValue("coverage_type"),
				description: {
					type: getValue("description_type"),
					text: getValue("description_text")
				},
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
				languages: languageEntries,
				volume_or_page: getValue("vorp"),
				pages: getValue("pages"),
				unpaged: isChecked("pages_listed"),
				illustrations_yes: isChecked("illustrations-yes"),
				dimensions: getValue("dimensions"),
				keywords: words,
				fast: fast_array,
				additional_authors: complete_names_list,
				additional_corporate_names: complete_corporate_names_list,
				originators_personal: originatorData.personalOriginators,
				originators_corporate: originatorData.corporateOriginators,
				extent: extentEntries,
				dimensions: {
					value: getValue("dimensions_text"),
					units: getValue("dimensions_units")
				},
				bibliography: bibliographyEntries,
				subjects: subjectEntries
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

			if (typeof downloadEAD === 'function') {
				downloadEAD(recordObject, institution_info);
			} else {
				console.warn('downloadEAD function is not available; unable to download EAD.');
			}

			console.log('Archives form submission handled, preventing default');
		});
	}
});
