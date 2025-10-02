$(document).ready(function() {
	setUpInstitution();
	setUpPage(0);
	scheduleInsertLabelUpgrade(document);
});

/*
 * If there are non-Latin characters, show transliteration field
 * 	id: The HTML id of the input field that has lost focus (suggesting a change in content)
 *
 *	Most input fields are simply checked for non-roman characters, and their corresponding
 *		transliteration field is shown if non-roman characters are detected and hidden if
 *		no non-roman characters are detected. The exception is name fields, which are a 
 *		little more complicated because two inputs are linked. As long as one of the two 
 *		associated name fields has non-roman characters, both the name transliteration 
 *		fields remain visible.
 */
function toggleTranslit(id) {
	//Regex for everything outside the standard character set
	var nonroman = /[^\u0000-\u024F\u0263\u02B9\u02BA\u02DD\u0300\u0301\u0302\u0303\u0304\u0306\u0308\u0309\u030A\u030C\u0310\u0313\u0315\u0321\u0322\u0323\u0324\u0325\u0327\u0328\u032E\u0332\u0333\u0351\u0357\u0366\u03B1\u04D4\u04D5\u2020\u2070\u2074\u2075\u2076\u2077\u2078\u2079\u207A\u207B\u207D\u207E\u2080\u2081\u2082\u2083\u2084\u2085\u2086\u2087\u2088\u2089\u20AC\u220E\u2113\u01C2\u2117\u266D\u266F\uFE20\uFE21\uFE22\uFE23\u02C7\u0307\u208E\u208D\u208B\u208A]/;
	//True if any of the characters in title is from a different alphabet
	var needsTranslit = nonroman.test($("#"+id).val());

	//The given name needed to be detected, but the visual changes are named after the family_name#
	if (id.substring(0,5) === 'given') {
		id = 'family' + id.substring(5);

		//The given field has been removed, but the family field still needs transliteration
		if (!needsTranslit && nonroman.test($("#"+id).val())) {
			return;
		}
	}

	if (needsTranslit) {
		$(".translit-" + id).show();
		$("#translit-" + id + "-block").show();
		$(".translit-" + id + "-block").css("padding","3px");
	}
	else {
		if (id.substring(0,6) === 'family') {
			//If the family field has been removed, but the given field still needs transliteration
			if (nonroman.test($("#given" + id.substring(6)).val())) {
				return;
			}
		}

		$(".translit-" + id).hide();
		$("#translit-" + id + "-block").hide();
		$(".translit-" + id + "-block").css("padding","0px");
	}
}

/*
 * If a listening field has been changed, send the id to the toggler.
 */
$("#marc-maker").on('blur','.translit-listen',function() {
	toggleTranslit($(this).attr("id"));
});

/*
 * If a keyword input being deleted or modified, clear the fastID recorded in case the user is inputing
 * a term not in fast
 */
$("#marc-maker").on('keyup', function(e) {
	if (e.keyCode === 8 || e.keyCode === 46) {
		if ($(':focus')[0] && $(':focus')[0].id.indexOf('keyword') == 0) {
			$('#fastID' + $(':focus')[0].id.substring(7)).val('');
		}
	}
});

function buildDiacriticsPicker(target, className, menuClass) {
	var classAttr = '';
	var menuAttr = '';
	if (className && className.length > 0) {
		classAttr = ' class="' + className + '"';
	}
	if (menuClass && menuClass.length > 0) {
		menuAttr = ' menu-classes="' + menuClass + '"';
	}
	return '<insert-diacritics target="' + target + '"' + classAttr + menuAttr + '></insert-diacritics>';
}

function scheduleInsertLabelUpgrade(root) {
	var scope = root || document;
	if (window.customElements && typeof window.customElements.whenDefined === 'function') {
		window.customElements.whenDefined('insert-diacritics').then(function() {
			upgradeInsertLabels(scope);
		}).catch(function(error) {
			console.warn('[insert-diacritics] Failed waiting for component definition; applying upgrade immediately.', error);
			upgradeInsertLabels(scope);
		});
	} else {
		upgradeInsertLabels(scope);
	}
}

function upgradeInsertLabels(root) {
	var scope = root && typeof root.querySelectorAll === 'function' ? root : document;
	var labels = scope.querySelectorAll('label.insert');
	for (var i = 0; i < labels.length; i++) {
		var label = labels[i];
		var target = label.getAttribute('for');
		if (!target) {
			var onClick = label.getAttribute('onClick') || label.getAttribute('onclick');
			if (onClick) {
				var match = onClick.match(/insertMenu\("([^\"]+)"\)/);
				if (match && match[1]) {
					target = match[1];
				}
			}
		}
		if (!target) {
			continue;
		}

		var menuContainer = document.getElementById('insert-' + target);
		var menuClasses = menuContainer ? (menuContainer.getAttribute('class') || '') : '';
		var pickerMarkup = buildDiacriticsPicker(target, label.getAttribute('class') || '', menuClasses);
		label.insertAdjacentHTML('beforebegin', pickerMarkup);

		if (menuContainer && menuContainer.parentNode) {
			menuContainer.parentNode.removeChild(menuContainer);
		}

		if (label.parentNode) {
			label.parentNode.removeChild(label);
		}
	}
}

/*
 * When one of the author fields has been filled in, the other is no longer required
 */
$(".author").change(function() {
	var field = $(this).attr("id");
	if (field === 'family_name') {
		var other = '#given_name';
	}
	else {
		var other = '#family_name';
	}

	if ($(this).val() === '') {
		$(other).attr("required","true");
	}
	else {
		$(other).removeAttr("required");
	}
});

/*
 * Set highest allowed year
 */
$(".date").attr("max",1000000);

/*
 * Add additional keyword fields
 */
var counter = 1;
function addKeyword() {
	if (counter < 50) {
		var newdiv = document.createElement('div');
		newdiv.className = 'added added-keyword';
		newdiv.innerHTML = '	<br><input type="text" class="fastID hidden" id="fastID' + counter + '"><input type="text" class="fastType hidden" id="fastType' + counter + '"><input type="text" class="fastInd hidden" id="fastInd' + counter + '"><input type="text" class="keyword" id="keyword' + counter +'">';
		$("#keywords").append(newdiv);
		counter++;
		setUpPage(counter-1);
	}
};

/*
 * Adds additional input fields so multiple authors or other contributors can be added. Each input field behaves
 * just like the initial names field, including transliteration capabilities.
 */
var aCounter = 0;
function addAuthor() {
	if (aCounter < 50) {
		var newdiv = document.createElement('div');
		newdiv.className = 'added';
		newdiv.setAttribute('id','family_name' + aCounter + '-block');
		newdiv.innerHTML = '<label for="family_name' + aCounter + '" class="insert insert_family_name additional_insert" onClick=\'insertMenu("family_name' + aCounter + '");\'>Insert Special Characters</label><label for="given_name' + aCounter + '" class="insert insert_given_name additional_insert" onClick=\'insertMenu("given_name' + aCounter + '");\'>Insert Special Characters</label><br>';
		newdiv.innerHTML += '<div id="insert-family_name' + aCounter + '" class="additional_menu"></div><div id="insert-given_name' + aCounter + '" class="insert-given_name additional_menu"></div>';
		newdiv.innerHTML += '<span class="added-author"><input type="text" class="author translit-listen" id="family_name' + aCounter + '" placeholder="Family Name">, <input type="text" class="author translit-listen" id="given_name' + aCounter + '" placeholder="Given Name"> <select name="role' + aCounter + '" id="role'  + aCounter + '"><option value="art">artist</option><option selected value="aut">author</option><option value="ctb">contributor</option><option value="edt">editor</option><option value="ill">illustrator</option><option value="trl">translator</option></select></span>';
		$("#author-block").append(newdiv);
		scheduleInsertLabelUpgrade(newdiv);
		var translit_div = document.createElement('div');
		translit_div.className = 'translit-family_name' + aCounter + '-block translit-block translit-author hidden';
		translit_div.setAttribute('id','translit-family_name' + aCounter + '-block');
		translit_div.innerHTML = '<label for="translit_family_name' + aCounter + '" class="insert insert_family_name hidden translit translit-family_name' + aCounter + '" onClick=\'insertMenu("translit_family_name' + aCounter + '");\'>Insert Special Characters</label><label for="translit_given_name' + aCounter + '" class="insert insert_given_name hidden translit translit-family_name' + aCounter + '" onClick=\'insertMenu("translit_given_name' + aCounter + '");\'>Insert Special Characters</label><br>';
		translit_div.innerHTML += '<div id="insert-translit_family_name' + aCounter + '"></div><div id="insert-translit_given_name' + aCounter + '"  class="insert-given_name"></div>';
		translit_div.innerHTML += '<input type="text" id="translit_family_name' + aCounter + '" class="hidden translit translit-family_name' + aCounter + '" placeholder="Transliterated Family Name"><span class="hidden translit-family_name' + aCounter + '">, </span><input type="text" id="translit_given_name' + aCounter + '" class="hidden translit translit-family_name' + aCounter + '" placeholder="Transliterated Given Name">';
		$("#family_name" + aCounter + '-block').append(translit_div);
		scheduleInsertLabelUpgrade(translit_div);
		aCounter++;
	}
}

/*
 * Make all the conditionally required fields required, hide any fields that were revealed, remove fields that
 * were added
 */
$(":reset").click(function() {
	$(".conditional").attr("required","true");
	$(".conditional").removeAttr("disabled");
	$(".hidden").hide();
	$(".added").remove();
	$(".translit-block").css("padding","0px");

	//Clear subjects
	$("#level3-subject0").remove();
	$("#level2-subject0").remove();
	$("#level1-subject0").remove();

	$('#verification0').html('Invalid Subject Heading <span style="color: red;">&#x2717;</span>');
	$("#verification0").removeClass('verified');
	$("#verification0").addClass('unverified');
	$("#verification0").removeAttr('value');
	$("#subject0-block").removeClass('valid');
	
	counter = 1;
	aCounter = 0;
});

/*
 * The checkboxes that remove the required element from their associated field are all part of the class called listed, and
 *	all have an id with the form [associated input id]_listed. Once cliked, the associated field is no longer required, and
 *	is disabled until the box is unclicked. Both family name and given name will be disabled and not required if the name 
 *	checkbox is clicked, but will remain active if one of the fields is already filled in. If a box is unchecked, the field is
 *	reverted to normal.
 */
$(".listed").click(function() {
	var field = $(this).attr("id");
	field = field.substring(0,field.length-7);

	if (field !== "author") {
		field = '#' + field;
	}
	else {
		field = "." + field;
		if ($("#family_name").val() !== '' || $("#given_name").val() !== '') {
			return;
		}
	}

	if ($(this).is(':checked')) {
		$(field).removeAttr("required");
		$(field).attr("disabled","true");
	}
	else {
		$(field).attr("required","true");
		$(field).removeAttr("disabled");
	}
});

/*
 * Show or hide the literature dropdown based on response to radio button
 */
$("input:radio[name=literature]").click(function() {
	var value = $(this).val();
	if (value === "yes") {
		$("#literature-dropdown").show();
	}
	else {
		$("#literature-dropdown").hide();
	}
});

/*
 * Check that an optional field has been input
 *	attr: the field being checked
 *
 *	Return true if the field contains valid content, otherwise return false.
 */
function checkExists(attr) {
	if (typeof(attr) !== "undefined" && attr !== '' && attr !== null) {
		return true;
	}
	else {
		return false;
	}
}

/*
 * Once specific processing for a format has been done, create, and then download the resulting record
 *	text: One long string that will be written to the file
 *	filetype: What kind of file is being written (MARC,MARCXML,MODS,HTML)
 */
function downloadFile(text,filetype) {
	var download_file = document.createElement('a');

	if (filetype === 'mrc') {
		var header = 'data:application/marc;charset=utf-8,';
	}
	else if (filetype === 'html') {
		var header = 'data:text/html;charset=utf-8,';
	}
	else {
		var header = 'data:text/plain;charset=utf-8,';
	}

	download_file.setAttribute('href',header + encodeURIComponent(text));
	if (checkExists($("#filename").val())) {
		var filename = $("#filename").val();
	}
	else {
		var filename = 'record';
	}

	if (filetype === 'xml') {
		filename += '_MARCXML';
	}
	else if (filetype === 'mods') {
		filename += '_MODS';
		filetype = 'xml';
	}
	else if (filetype === 'onix') {
		filename += '_ONIX';
		filetype = 'xml';
	}

	download_file.setAttribute('download', filename + '.' + filetype);
	var clickReplacement = new MouseEvent('click', {
		'view': window,
		'bubbles': true,
		'cancleable': false
	});
	download_file.dispatchEvent(clickReplacement);
}

/*
 * Return the current time in the format yyyymmddhhmmss.s in GMT
 */
function getTimestamp() {
	var date = new Date();
	date = date.toISOString();
	return date.substring(0,4) + date.substring(5,7) + date.substring(8,10) + date.substring(11,13) + date.substring(14,16) + date.substring(17,21);
}

function escapeXML(content) {
	return content.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;')
}