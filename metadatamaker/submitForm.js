/*
 * Utility functions (get, generateInstitutionInfo, find100, find110, checkExists) 
 * are now loaded from shared/sharedUtils.js
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
	var words = [];
	var fast_array = [];
	for (var i = 0; i < counter; i++) {
		if (checkExists($("#fastID" + i).val()) && checkExists($("#keyword" + i).val())) {
			if ($("#keyword" + i).val().substring($("#keyword" + i).val().length - 1) == ']') {
				var endpoint = $("#keyword" + i).val().lastIndexOf('[');
				fast_array.push([$("#keyword" + i).val().substring(0, endpoint - 1), $("#fastID" + i).val(), $("#fastType" + i).val(), $("#fastInd" + i).val()]);
			}
			else {
				fast_array.push([$("#keyword" + i).val(), $("#fastID" + i).val(), $("#fastType" + i).val(), $("#fastInd" + i).val()]);
			}
		}
		else {
			words.push($("#keyword" + i).val());
		}
	};

	var additional_names = [];
	var translit_additional_names = [];
	var complete_names_list = [
		[
			{
				family: $("#family_name").val(),
				given: $("#given_name").val(),
				role: $("#role").val()
			},
			{
				family: $("#translit_family_name").val(),
				given: $("#translit_given_name").val()
			}
		]
	];
	for (var i = 0; i < aCounter; i++) {
		complete_names_list.push([{ "family": $("#family_name" + i).val(), "given": $("#given_name" + i).val(), "role": $("#role" + i).val() }, { "family": $("#translit_family_name" + i).val(), "given": $("#translit_given_name" + i).val() }]);
	}
	//Find the first listed author or artist
	var entry100 = find100(complete_names_list);

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

	const illustrationsSelected = $("#illustrations-yes").is(':checked');
	const rawIllustrationCodes = illustrationsSelected ? ($("#illustrations-types").val() || []) : [];
	const illustrationCodes = rawIllustrationCodes.slice(0, 4);
	const illustrationLabels = illustrationsSelected ? $("#illustrations-types option:selected").filter(function () {
		return illustrationCodes.indexOf($(this).val()) !== -1;
	}).map(function () {
		return $(this).text();
	}).get() : [];
	const hasIllustrations = illustrationCodes.length > 0;
	const physicalFormRaw = $("#physical-form").val();
	const physicalFormCode = (physicalFormRaw === null || physicalFormRaw === '') ? '|' : physicalFormRaw;

	var recordObject = {
		title: [
			{
				title: $("#title").val(),
				subtitle: $("#subtitle").val()
			},
			{
				title: $("#translit_title").val(),
				subtitle: $("#translit_subtitle").val()
			}
		],
		author: entry100[0],
		publisher: $("#publisher").val(),
		publication_year: $("#year").val(),
		publication_place: $("#place").val(),
		publication_country: $("#country").val(),
		copyright_year: $("#cyear").val(),
		language: $("#language").val(),
		isbn: $("#isbn").val(),
		volume_or_page: $("#vorp").val(),
		pages: $("#pages").val(),
		unpaged: $("#pages_listed").is(':checked'),
		literature_yes: $("#literature-yes").is(':checked'),
		literature_dropdown: $("#literature-dropdown").val(),
		illustrations_yes: hasIllustrations,
		illustrations_codes: illustrationCodes,
		illustrations_terms: illustrationLabels,
		physical_form_code: physicalFormCode,
		dimensions: $("#dimensions").val(),
		edition: $("#edition").val(),
		translit_edition: $("#translit_edition").val(),
		translit_publisher: $("#translit_publisher").val(),
		translit_place: $("#translit_place").val(),
		contents: $("#contents").val(),
		notes: $("#notes").val(),
		keywords: words,
		fast: fast_array,
		additional_authors: complete_names_list,
		corporate_author: corporate_author,
		additional_corporate_authors: additional_corporate_authors
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

	if ($("#BIBFRAME").is(':checked')) {
		downloadBIBFRAME(recordObject, institution_info);
	}

	event.preventDefault();
});
