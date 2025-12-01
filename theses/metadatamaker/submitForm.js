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

			var additionalAuthorCount = typeof aCounter === 'number' ? aCounter : 0;
			var authorEntries = [
				{
					family: getValue("family_name"),
					given: getValue("given_name"),
					role: getValue("role") || 'dis'
				}
			];
			for (var i = 0; i < additionalAuthorCount; i++) {
				authorEntries.push({
					family: getValue("family_name" + i),
					given: getValue("given_name" + i),
					role: getValue("role" + i)
				});
			}

			var filteredAuthors = [];
			for (var i = 0; i < authorEntries.length; i++) {
				var entry = authorEntries[i];
				if (checkExists(entry.family) || checkExists(entry.given)) {
					var roleCode = checkExists(entry.role) ? entry.role : (i === 0 ? 'dis' : 'ctb');
					filteredAuthors.push({
						family: entry.family,
						given: entry.given,
						role: roleCode
					});
				}
			}

			var primaryAuthor = filteredAuthors.length > 0 ? filteredAuthors[0] : { family: '', given: '', role: 'dis' };
			var additionalPersonalAuthors = filteredAuthors.slice(1);
			var hasPersonalAuthor = checkExists(primaryAuthor.family) || checkExists(primaryAuthor.given);

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

			const physicalFormRaw = getValue("physical-form");
			const physicalFormCode = (physicalFormRaw === null || physicalFormRaw === '') ? '|' : physicalFormRaw;

			var recordObject = {
				title: getValue("title"),
				author: primaryAuthor,
				authors: filteredAuthors,
				publication_year: getValue("year"),
				language: getValue("language"),
				dissertation_type: getValue("dissertation_type"),
				leaf_or_page: getValue("lorp"),
				number_of_pages: getValue("pages"),
				illustrations_yes: isChecked("illustrations-yes"),
				abstract: getValue("abstract"),
				contents: getValue("contents"),
				physical_form_code: physicalFormCode,
				bibliographies: getValue("bib"),
				major: getValue("major"),
				corporate_author: corporate_author,
				additional_corporate_authors: additional_corporate_authors,
				additional_authors: additionalPersonalAuthors
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
