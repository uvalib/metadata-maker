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
$("#marc-maker").submit(function (event) {
	var additionalAuthorCount = typeof aCounter === 'number' ? aCounter : 0;
	var authorEntries = [
		{
			family: $("#family_name").val(),
			given: $("#given_name").val(),
			role: $("#role").val() || 'dis'
		}
	];
	for (var i = 0; i < additionalAuthorCount; i++) {
		authorEntries.push({
			family: $("#family_name" + i).val(),
			given: $("#given_name" + i).val(),
			role: $("#role" + i).val()
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
				corporate: $("#corporate_name").val(),
				role: $("#corporate_role").val()
			},
			{
				corporate: $("#translit_corporate_name").val()
			}
		]
	];
	for (var i = 0; i < cCounter; i++) {
		corporate_entries.push([
			{ corporate: $("#corporate_name" + i).val(), role: $("#corporate_role" + i).val() },
			{ corporate: $("#translit_corporate_name" + i).val() }
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

	const physicalFormRaw = $("#physical-form").val();
	const physicalFormCode = (physicalFormRaw === null || physicalFormRaw === '') ? '|' : physicalFormRaw;

	var recordObject = {
		title: $("#title").val(),
		author: primaryAuthor,
		authors: filteredAuthors,
		publication_year: $("#year").val(),
		language: $("#language").val(),
		dissertation_type: $("#dissertation_type").val(),
		leaf_or_page: $("#lorp").val(),
		number_of_pages: $("#pages").val(),
		illustrations_yes: $("#illustrations-yes").is(':checked'),
		abstract: $("#abstract").val(),
		contents: $("#contents").val(),
		physical_form_code: physicalFormCode,
		bibliographies: $("#bib").val(),
		major: $("#major").val(),
		corporate_author: corporate_author,
		additional_corporate_authors: additional_corporate_authors,
		additional_authors: additionalPersonalAuthors
	};

	var institution_info = generateInstitutionInfo();

	if ($("#MARC").is(':checked')) {
		downloadMARC(recordObject, institution_info);
	}

	if ($("#MARCXML").is(':checked')) {
		downloadXML(recordObject, institution_info);
	}

	if ($("#MODS").is(':checked')) {
		downloadMODS(recordObject, institution_info);
	}

	if ($("#HTML").is(':checked')) {
		downloadHTML(recordObject, institution_info);
	}

	event.preventDefault();
});
