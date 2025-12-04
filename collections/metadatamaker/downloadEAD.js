/**
 * Generate EAD (Encoded Archival Description) XML for collection components
 * 
 * Creates a <c> component element with all metadata fields formatted as EAD XML.
 * This follows the EAD standard for archival finding aids.
 */

function downloadEAD(record, institution_info) {
    console.log('downloadEAD called with record:', record);

    // Helper function to escape XML special characters
    function escapeXML(text) {
        if (typeof text !== 'string') return '';
        return text
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&apos;');
    }

    // Collect data from record object
    const identifier = record.identifier || '';
    const level = record.level || '';
    const otherLevel = record.other_level || '';
    const parentIdentifier = record.parent_identifier || '';
    const collectionTitle = record.collection_title || '';
    const collectionIdentifier = record.collection_identifier || '';
    const locationWithinCollection = record.location_within_collection || '';
    const title = record.title && record.title[0] ? record.title[0].title : '';
    const coverageStart = record.coverage_start || '';
    const coverageEnd = record.coverage_end || '';
    const coverageType = record.coverage_type || 'inclusive';

    // Get dimensions
    const dimensionsValue = record.dimensions ? record.dimensions.value : '';
    const dimensionsUnits = record.dimensions ? record.dimensions.units : '';

    // Get repeatable fields
    const containers = record.containers || [];
    const descriptions = record.descriptions || [];
    const references = record.references || [];
    const extentEntries = record.extent || [];
    const languages = record.languages || [];
    const subjects = record.subjects || [];
    const notes = record.notes || [];

    // Get originators from record object
    const personalOriginators = record.originators_personal || [];
    const corporateOriginators = record.originators_corporate || [];

    // Build XML
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<!DOCTYPE c SYSTEM "https://raw.githubusercontent.com/SAA-SDT/EAD2002/refs/heads/main/ead.dtd">\n';
    xml += '<!-- c/@level attribute comes from Level field -->\n';

    // Start <c> element with attributes
    xml += `<c level="${escapeXML(level)}"`;
    if (level === 'otherlevel' && otherLevel) {
        xml += ` otherlevel="${escapeXML(otherLevel)}"`;
    }
    xml += '>\n';

    // <did> section
    xml += '  <did>\n';
    xml += '    <!-- @altrender attributes are needed to flag some elements for exclusion by downstream processing -->\n';

    // Repository (Placeholder as per requirements, but using institution info if available could be an option. 
    // However, the requirement says "Organization's Name" and "Physical Location". 
    // We'll use the institution_info provided.)
    xml += '    <repository altrender="display:none">\n';
    // Use institution info for corpname if available, otherwise placeholder
    const repoName = institution_info && institution_info.html && institution_info.html.name ? institution_info.html.name : "Organization's Name";
    xml += `      <corpname>${escapeXML(repoName)}</corpname>\n`;

    // Use institution info for address if available
    const repoAddress = institution_info && institution_info.mods && institution_info.mods.physicalLocation ? institution_info.mods.physicalLocation : "Physical Location";
    xml += `      <address><addressline>${escapeXML(repoAddress)}</addressline></address>\n`;
    xml += '    </repository>\n';

    // Collection Title
    if (collectionTitle) {
        xml += `    <unittitle type="collection title" altrender="display:none">${escapeXML(collectionTitle)}</unittitle>\n`;
    }

    // Collection Identifier
    if (collectionIdentifier) {
        xml += `    <unitid type="collection id" altrender="display:none">${escapeXML(collectionIdentifier)}</unitid>\n`;
    }

    // Parent Identifier
    if (parentIdentifier) {
        xml += `    <unitid type="parent id" altrender="display:none">${escapeXML(parentIdentifier)}</unitid>\n`;
    }

    // Title
    if (title) {
        xml += `    <unittitle>${escapeXML(title)}</unittitle>\n`;
    }

    // Unit date
    xml += '    <!-- @type = inclusive|bulk -->\n';
    xml += '    <!-- Coverage start and coverage end must be separated by "/" even if one or the other is blank -->\n';
    if (coverageStart || coverageEnd) {
        const dateRange = `${coverageStart}/${coverageEnd}`;
        xml += `    <unitdate type="${escapeXML(coverageType)}">${escapeXML(dateRange)}</unitdate>\n`;
    }

    // Identifier
    if (identifier) {
        xml += `    <unitid>${escapeXML(identifier)}</unitid>\n`;
    }

    // Origination (personal and corporate names)
    if (personalOriginators.length > 0 || corporateOriginators.length > 0) {
        xml += '    <!-- Birth and death dates for personal names must be separated by "/" even if one or the \n';
        xml += '      other is blank. If both are blank, don\'t display the parentheses or slash. -->\n';

        personalOriginators.forEach(person => {
            const familyName = person.family || '';
            const givenName = person.given || '';
            const birthDate = person.birth || '';
            const deathDate = person.death || '';

            let namePart = '';
            if (familyName && givenName) {
                namePart = `${familyName}, ${givenName}`;
            } else {
                namePart = familyName || givenName;
            }

            if (birthDate || deathDate) {
                const dateRange = `${birthDate}/${deathDate}`;
                namePart += ` (${dateRange})`;
            }

            if (namePart) {
                xml += `    <origination>${escapeXML(namePart)}</origination>\n`;
            }
        });

        xml += '    <!-- Start and end dates for corporate names must be separated by "/" even if one or the \n';
        xml += '      other is blank. If both are blank, don\'t display the parentheses or slash. -->\n';

        corporateOriginators.forEach(corp => {
            const corpName = corp.name || '';
            const startDate = corp.start || '';
            const endDate = corp.end || '';

            let namePart = corpName;
            if (startDate || endDate) {
                const dateRange = `${startDate}/${endDate}`;
                namePart += ` (${dateRange})`;
            }

            if (namePart) {
                xml += `    <origination>${escapeXML(namePart)}</origination>\n`;
            }
        });
    }

    // Languages
    languages.forEach(lang => {
        if (lang) {
            xml += `    <langmaterial>${escapeXML(lang)}</langmaterial>\n`;
        }
    });

    // Physical description
    if (extentEntries.length > 0 || (dimensionsValue && dimensionsUnits)) {
        xml += '    <physdesc>\n';

        // Extents
        extentEntries.forEach(extent => {
            if (extent.text && extent.units) {
                xml += `      <extent unit="${escapeXML(extent.units)}">${escapeXML(extent.text)}</extent>\n`;
            }
        });

        // Dimensions
        if (dimensionsValue && dimensionsUnits) {
            xml += `      <dimensions unit="${escapeXML(dimensionsUnits)}">${escapeXML(dimensionsValue)}</dimensions>\n`;
        }

        xml += '    </physdesc>\n';
    }

    // Material spec placeholder
    xml += '    <materialspec>_materialspec_</materialspec>\n';

    // Physical location
    if (locationWithinCollection) {
        xml += `    <physloc>${escapeXML(locationWithinCollection)}</physloc>\n`;
    }

    // Containers
    if (containers.length > 0) {
        containers.forEach(container => {
            if (container.type && container.label) {
                xml += '    <container>\n';
                xml += `      <!-- ${escapeXML(container.type)} -->\n`;
                xml += `      ${escapeXML(container.label)}\n`;
                xml += '    </container>\n';
            }
        });
    }

    xml += '  </did>\n';

    // Notes
    if (notes.length > 0) {
        xml += '  <note>\n';
        notes.forEach(note => {
            if (note) {
                xml += `    <p>${escapeXML(note)}</p>\n`;
            }
        });
        xml += '  </note>\n';
    }

    // Description elements (based on type)
    // Map element name to <head> text
    const headMap = {
        'accessrestrict': 'Access Restrictions',
        'accruals': 'Accruals',
        'acqinfo': 'Acquisition',
        'altformavail': 'Alternative Form',
        'appraisal': 'Appraisal',
        'arrangement': 'Arrangement',
        'bibliography': 'Bibliography',
        'bioghist': 'Biographical Information', // Updated to match requirement
        'custodhist': 'Custodial History',
        'originalsloc': 'Location of Originals',
        'phystech': 'Physical/Technical Info',
        'prefercite': 'Preferred Citation',
        'relatedmaterial': 'Related Material',
        'scopecontent': 'Scope and Content',
        'separatedmaterial': 'Separated Material',
        'userestrict': 'Use Restrictions'
    };

    descriptions.forEach(desc => {
        if (desc.type && desc.text) {
            const headText = headMap[desc.type] || desc.type;
            xml += `  <${escapeXML(desc.type)}>\n`;
            xml += `    <head>${escapeXML(headText)}</head>\n`;
            xml += `    <p>${escapeXML(desc.text)}</p>\n`;
            xml += `  </${escapeXML(desc.type)}>\n`;
        }
    });

    // Bibliography (Separate field in form)
    if (references.length > 0) {
        xml += '  <bibliography>\n';
        xml += '    <head>Bibliography</head>\n';
        references.forEach(ref => {
            if (ref) {
                xml += `    <bibref>${escapeXML(ref)}</bibref>\n`;
            }
        });
        xml += '  </bibliography>\n';
    }

    // Control access (keywords/subjects)
    if (subjects.length > 0) {
        xml += '  <controlaccess>\n';
        xml += '    <head>Controlled Access Terms</head>\n';
        xml += '    <!-- @source must be a NMTOKEN, so replace illegal chars with underscore -->\n';

        subjects.forEach(subject => {
            if (subject.term && subject.type) {
                // Map subject types to EAD elements
                const typeMap = {
                    'corpName': 'corpname',
                    'famName': 'famname',
                    'persName': 'persname',
                    'geogname': 'geogname',
                    'occupation': 'occupation',
                    'genreForm': 'genreform',
                    'function': 'function',
                    'topic': 'subject'
                };

                const elementName = typeMap[subject.type] || 'subject';
                let source = subject.source || '';

                // Sanitize source for NMTOKEN (replace illegal chars with underscore)
                source = source.replace(/[^a-zA-Z0-9._:-]/g, '_');

                if (source) {
                    xml += `    <${elementName} source="${escapeXML(source)}">${escapeXML(subject.term)}</${elementName}>\n`;
                } else {
                    xml += `    <${elementName}>${escapeXML(subject.term)}</${elementName}>\n`;
                }
            }
        });

        xml += '  </controlaccess>\n';
    }

    xml += '</c>\n';

    // Download the XML file
    const timestamp = getTimestamp();
    const filename = identifier ? `${identifier}_ead` : `collection_component_${timestamp}_ead`;
    // downloadFile(xml, 'xml', filename);

    // TEMPORARY: Display XML on page for verification
    let pre = document.getElementById('debug-xml-output');
    if (!pre) {
        pre = document.createElement('pre');
        pre.id = 'debug-xml-output';
        pre.style.whiteSpace = 'pre-wrap';
        pre.style.border = '1px solid black';
        pre.style.padding = '10px';
        pre.style.margin = '20px';
        pre.style.backgroundColor = '#f0f0f0';
        document.body.appendChild(pre);
    }
    pre.textContent = xml;
    pre.scrollIntoView();

    console.log('EAD XML generated and displayed');
}

// Make function available globally
if (typeof window !== 'undefined') {
    window.downloadEAD = downloadEAD;
}
