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
$("#marc-maker").submit(function(event) {
	console.log('Archives form submission started');
	var words = [];
	var fast_array = [];
	for (var i = 0; i < counter; i++) {
		if(checkExists($("#fastID" + i).val()) && checkExists($("#keyword" + i).val())) {
			if ($("#keyword" + i).val().substring($("#keyword" + i).val().length - 1) == ']') {
				var endpoint = $("#keyword" + i).val().lastIndexOf('[');
				fast_array.push([$("#keyword" + i).val().substring(0,endpoint-1),$("#fastID" + i).val(),$("#fastType" + i).val(),$("#fastInd" + i).val()]);
			}
			else {
				fast_array.push([$("#keyword" + i).val(),$("#fastID" + i).val(),$("#fastType" + i).val(),$("#fastInd" + i).val()]);
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
		complete_names_list.push([{ "family": $("#family_name" + i).val(), "given": $("#given_name" + i).val(), "role": $("#role" + i).val()},{ "family": $("#translit_family_name" + i).val(), "given": $("#translit_given_name" + i).val()}]);
	}
	//Find the first listed author or artist
	var entry100 = find100(complete_names_list);

	var complete_corporate_names_list = [
		{
			corporate: $("#corporate_name").val(),
			role:  $("#corporate_role").val()
		}
	];
	for (var i = 0; i < cCounter; i++) {
		complete_corporate_names_list.push({"corporate": $("#corporate_name" + i).val(), "role": $("#corporate_role" + i).val()});
	}

	var entry110 = find110(complete_corporate_names_list);

	var repositoryAddresses = Array.prototype.slice.call(document.querySelectorAll('.repository-address-input'))
		.map(function(input) {
			return (input.value || '').trim();
		})
		.filter(function(value) {
			return value !== '';
		});

	var originatorComponent = document.querySelector('originator-input');
	var originatorData = originatorComponent && typeof originatorComponent.getValue === 'function'
		? originatorComponent.getValue()
		: { personalOriginators: [], corporateOriginators: [] };

	if (originatorComponent && typeof originatorComponent.validate === 'function') {
		if (!originatorComponent.validate()) {
			console.warn('Originator validation failed; blocking submission');
			event.preventDefault();
			return;
		}
	}

var languageEntries = Array.from(document.querySelectorAll('.language-input'))
	.map(function(input) {
		return (input.value || '').trim();
	})
	.filter(function(value) {
		return value !== '';
	});

var bibliographyEntries = Array.from(document.querySelectorAll('.bibliography-input'))
	.map(function(input) {
		return (input.value || '').trim();
	})
	.filter(function(value) {
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
		repository_name: $("#repository_name").val(),
		repository_location: $("#repository_location").val(),
		repository_address: repositoryAddresses,
		identifier: $("#identifier").val(),
		coverage_start: $("#coverage_start").val(),
		coverage_end: $("#coverage_end").val(),
		coverage_type: $("#coverage_type").val(),
		description: {
			type: $("#description_type").val(),
			text: $("#description_text").val()
		},
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
		corporate_author: entry110[0],
		publisher: $("#publisher").val(),
		publication_year: $("#year").val(),
		publication_place: $("#place").val(),
		publication_country: $("#country").val(),
		copyright_year: $("#cyear").val(),
		languages: languageEntries,
		volume_or_page: $("#vorp").val(),
		pages: $("#pages").val(),
		unpaged: $("#pages_listed").is(':checked'),
		illustrations_yes: $("#illustrations-yes").is(':checked'),
		dimensions: $("#dimensions").val(),
		keywords: words,
		fast: fast_array,
		additional_authors: complete_names_list,
		additional_corporate_names: complete_corporate_names_list,
		originators_personal: originatorData.personalOriginators,
		originators_corporate: originatorData.corporateOriginators,
	extent: extentEntries,
		dimensions: {
			value: $("#dimensions_text").val(),
			units: $("#dimensions_units").val()
		},
		bibliography: bibliographyEntries,
		subjects: subjectEntries
	};

	var institution_info = generateInstitutionInfo();

	if ($("#MARC").is(':checked')) {
		downloadMARC(recordObject,institution_info);
	}

	if ($("#MARCXML").is(':checked')) {
		downloadXML(recordObject,institution_info);
	}

	if ($("#MODS").is(':checked')) {
		downloadMODS(recordObject,institution_info);
	}

	if ($("#HTML").is(':checked')) {
		downloadHTML(recordObject,institution_info);
	}

	if (typeof downloadEAD === 'function') {
		downloadEAD(recordObject, institution_info);
	} else {
		console.warn('downloadEAD function is not available; unable to download EAD.');
	}

	console.log('Archives form submission handled, preventing default');
	event.preventDefault();
});
