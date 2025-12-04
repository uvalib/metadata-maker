/*
 * Utility functions (get, generateInstitutionInfo, find100, find110, checkExists) 
 * are now loaded from ../shared/sharedUtils.js
 * See that file for documentation.
 */

/**
 * Vanilla JS helper functions to replace jQuery
 */
function getValue(id) {
	const element = document.getElementById(id);
	return element ? (element.value || '').trim() : '';
}

function isChecked(id) {
	const element = document.getElementById(id);
	return element ? element.checked : false;
}

/*
 * When the form is submitted, create an object with all user-submitted data. Pass that object to functions that
 * build a record around the data.
 *
 * The first listed author or artist is placed in recordObject.author, while all other credited individuals are
 * placed into recordObject.additional_authors.
 *
 * No information should be submitted to the server, so the default behavior of the button is blocked.
 */
document.getElementById("marc-maker").addEventListener("submit", function (event) {
	event.preventDefault(); // Prevent default immediately
	console.log('Collection Components form submission started');

	try {
		var words = [];
		var fast_array = [];
		// Ensure counters are defined
		var counter = window.counter || 0;
		var aCounter = window.aCounter || 0;
		var cCounter = window.cCounter || 0;

		for (var i = 0; i < counter; i++) {
			var keywordVal = getValue("keyword" + i);
			var fastIDVal = getValue("fastID" + i);
			if (checkExists(fastIDVal) && checkExists(keywordVal)) {
				if (keywordVal.substring(keywordVal.length - 1) == ']') {
					var endpoint = keywordVal.lastIndexOf('[');
					fast_array.push([keywordVal.substring(0, endpoint - 1), fastIDVal, getValue("fastType" + i), getValue("fastInd" + i)]);
				}
				else {
					fast_array.push([keywordVal, fastIDVal, getValue("fastType" + i), getValue("fastInd" + i)]);
				}
			}
			else {
				words.push(keywordVal);
			}
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
		for (var i = 0; i < aCounter; i++) {
			complete_names_list.push([{ "family": getValue("family_name" + i), "given": getValue("given_name" + i), "role": getValue("role" + i) }, { "family": getValue("translit_family_name" + i), "given": getValue("translit_given_name" + i) }]);
		}
		//Find the first listed author or artist
		var entry100 = find100(complete_names_list);

		var complete_corporate_names_list = [
			{
				corporate: getValue("corporate_name"),
				role: getValue("corporate_role")
			}
		];
		for (var i = 0; i < cCounter; i++) {
			complete_corporate_names_list.push({ "corporate": getValue("corporate_name" + i), "role": getValue("corporate_role" + i) });
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

		// Collect subjects
		const subjectInputs = document.querySelector('repeatable-subject-input');
		let subjects = [];
		if (subjectInputs && typeof subjectInputs.getEntries === 'function') {
			subjects = subjectInputs.getEntries();
		}
		// subjects.forEach((subject, index) => {
		// 	console.log(`Subject ${index}:`, subject);
		// });

		// Collect notes
		const noteInputs = Array.from(document.querySelectorAll('.note-input'))
			.map(input => (input.value || '').trim())
			.filter(value => value !== '');
		// console.log('Notes:', noteInputs);

		var containerComponent = document.querySelector('repeatable-container-input');
		var containerEntries = containerComponent && typeof containerComponent.getEntries === 'function'
			? containerComponent.getEntries()
			: [];

		var descriptionComponent = document.querySelector('repeatable-description-input');
		var descriptionEntries = descriptionComponent && typeof descriptionComponent.getEntries === 'function'
			? descriptionComponent.getEntries()
			: [];

		var referenceEntries = Array.from(document.querySelectorAll('.reference-input'))
			.map(function (input) {
				return (input.value || '').trim();
			})
			.filter(function (value) {
				return value !== '';
			});

		// Ensure subjectEntries is defined (it was missing in original code?)
		// It seems subjectEntries was used in recordObject but not defined in the snippet I saw.
		// Ah, 'subjects' variable was defined above. I should use 'subjects'.
		var subjectEntries = subjects;

		var recordObject = {
			repository_name: getValue("repository_name"),
			repository_location: getValue("repository_location"),
			repository_address: repositoryAddresses,
			identifier: getValue("identifier"),
			parent_identifier: getValue("parent_identifier"),
			collection_title: getValue("collection_title"),
			collection_identifier: getValue("collection_identifier"),
			location_within_collection: getValue("location_within_collection"),
			level: getValue("level"),
			other_level: getValue("other_level"),
			coverage_start: getValue("coverage_start"),
			coverage_end: getValue("coverage_end"),
			coverage_type: getValue("coverage_type"),
			descriptions: descriptionEntries,
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
			notes: noteInputs,
			volume_or_page: getValue("vorp"),
			pages: getValue("pages"),
			unpaged: isChecked("pages_listed"),
			illustrations_yes: isChecked("illustrations-yes"),
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
			references: referenceEntries,
			containers: containerEntries,
			subjects: subjectEntries
		};

		var institution_info = generateInstitutionInfo();
		console.log('Institution info generated:', institution_info);

		console.log('Attempting EAD download...');
		if (typeof downloadEAD === 'function') {
			downloadEAD(recordObject, institution_info);
		} else {
			console.error('downloadEAD function not found!');
		}

		console.log('Collection Components form submission completed successfully');
	} catch (e) {
		console.error('Error during form submission:', e);
		alert('An error occurred during submission. Please check the console for details.');
	}
});
