function get(name) {
	if(name=(new RegExp('[?&]'+encodeURIComponent(name)+'=([^&]*)')).exec(location.search)) {
		return decodeURIComponent(name[1]);
	}
}
/* 
 * Edit the strings in this function to attribute records to another institution
 */
function generateInstitutionInfo() {
	var output = {
		//040 $a, 040 $c
		marc: 'ViU',
		mods: {
			physicalLocation: 'University of Virginia. Library',
			recordContentSource: 'ViU'
		},
		//"seller" info
		html: {
			url: 'https://id.loc.gov/authorities/names/n79127895',
			name: 'University of Virginia'
		}
	};

	marc = get('marc');
	if (typeof marc !== 'undefined') {
		output['marc'] = marc;
	}
	physicalLocation = get('physicalLocation');
	if (typeof physicalLocation !== 'undefined') {
		output['mods']['physicalLocation'] = physicalLocation;
	}
	recordContentSource = get('recordContentSource');
	if (typeof recordContentSource !== 'undefined') {
		output['mods']['recordContentSource'] = recordContentSource;
	}
	lcn = get('lcn');
	if (typeof lcn !== 'undefined') {
		output['html']['url']  = 'https://id.loc.gov/authorities/names/' + lcn;
	}
	n = get('n');
	if (typeof n !== 'undefined') {
		output['html']['name'] = n;
	}

	return output;
}

$("#marc-maker").submit(function(event) {
	var recordObject = {
		title: $("#title").val(),
		author: {
			family: $("#family_name").val(),
			given: $("#given_name").val()
		},
		publication_year: $("#year").val(),
		language: $("#language").val(),
		dissertation_type: $("#dissertation_type").val(),
		leaf_or_page: $("#lorp").val(),
		number_of_pages: $("#pages").val(),
		illustrations_yes: $("#illustrations-yes").is(':checked'),
		bibliographies: $("#bib").val(),
		major: $("#major").val()
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

	event.preventDefault();
});