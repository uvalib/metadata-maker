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

    // Collect data from form
    const identifier = get('#identifier');
    const level = get('#level');
    const otherLevel = get('#other_level');
    const parentIdentifier = get('#parent_identifier');
    const collectionTitle = get('#collection_title');
    const collectionIdentifier = get('#collection_identifier');
    const locationWithinCollection = get('#location_within_collection');
    const title = get('#title');
    const coverageStart = get('#coverage_start');
    const coverageEnd = get('#coverage_end');
    const coverageType = get('#coverage_type') || 'inclusive';

    // Get dimensions
    const dimensionsValue = get('#dimensions_text');
    const dimensionsUnits = get('#dimensions_units');

    // Get repeatable fields
    const containerComponent = document.querySelector('repeatable-container-input');
    const containers = containerComponent && typeof containerComponent.getEntries === 'function'
        ? containerComponent.getEntries()
        : [];

    const descriptionComponent = document.querySelector('repeatable-description-input');
    const descriptions = descriptionComponent && typeof descriptionComponent.getEntries === 'function'
        ? descriptionComponent.getEntries()
        : [];

    const referenceInputs = Array.from(document.querySelectorAll('.reference-input'))
        .map(input => (input.value || '').trim())
        .filter(value => value !== '');

    // Get extents from record object
    const extentEntries = record.extent || [];

    // Get languages from record object
    const languages = record.languages || [];

    // Get subjects/keywords from record object
    const subjects = record.subjects || [];

    // Get originators from record object
    const personalOriginators = record.originators_personal || [];
    const corporateOriginators = record.originators_corporate || [];

    // Build XML
    let xml = '';

    // Start <c> element with attributes
    xml += `<c id="${escapeXML(identifier)}" level="${escapeXML(level)}"`;
    if (level === 'otherlevel' && otherLevel) {
        xml += ` otherlevel="${escapeXML(otherLevel)}"`;
    }
    xml += '>\n';

    // <did> section
    xml += '  <did>\n';

    // Physical location
    if (locationWithinCollection) {
        xml += `    <physloc>${escapeXML(locationWithinCollection)}</physloc>\n`;
    }

    // Title
    if (title) {
        xml += `    <unittitle>${escapeXML(title)}</unittitle>\n`;
    }

    // Unit date
    if (coverageStart || coverageEnd) {
        const dateRange = [coverageStart, coverageEnd].filter(d => d).join('/');
        xml += `    <unitdate type="${escapeXML(coverageType)}">${escapeXML(dateRange)}</unitdate>\n`;
    }

    // Origination (personal and corporate names)
    if (personalOriginators.length > 0 || corporateOriginators.length > 0) {

        const originationParts = [];

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
                const dateRange = [birthDate, deathDate].filter(d => d).join('-') || birthDate || deathDate;
                namePart += ` (${dateRange})`;
            }

            if (namePart) {
                originationParts.push(namePart);
            }
        });

        corporateOriginators.forEach(corp => {
            const corpName = corp.name || '';
            const startDate = corp.start || '';
            const endDate = corp.end || '';

            let namePart = corpName;
            if (startDate || endDate) {
                const dateRange = [startDate, endDate].filter(d => d).join('-') || startDate || endDate;
                namePart += ` (${dateRange})`;
            }

            if (namePart) {
                originationParts.push(namePart);
            }
        });

        if (originationParts.length > 0) {
            xml += `    <origination>${escapeXML(originationParts.join('; '))}</origination>\n`;
        }
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

    // Containers
    containers.forEach(container => {
        if (container.type && container.label) {
            xml += `    <container type="${escapeXML(container.type)}" label="${escapeXML(container.label)}"/>\n`;
        }
    });

    xml += '  </did>\n';

    // Description elements (based on type)
    descriptions.forEach(desc => {
        if (desc.type && desc.text) {
            xml += `  <${escapeXML(desc.type)}>\n`;
            xml += `    <p>${escapeXML(desc.text)}</p>\n`;
            xml += `  </${escapeXML(desc.type)}>\n`;
        }
    });

    // Bibliography
    if (referenceInputs.length > 0) {
        xml += '  <bibliography>\n';
        referenceInputs.forEach(ref => {
            if (ref) {
                xml += `    <bibref>${escapeXML(ref)}</bibref>\n`;
            }
        });
        xml += '  </bibliography>\n';
    }

    // Notes  
    const notes = record.notes || [];
    notes.forEach(note => {
        if (note) {
            xml += `  <odd>\n`;
            xml += `    <note>\n`;
            xml += `      <p>${escapeXML(note)}</p>\n`;
            xml += `    </note>\n`;
            xml += `  </odd>\n`;
        }
    });

    // Control access (keywords/subjects)
    if (subjects.length > 0) {
        xml += '  <controlaccess>\n';

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
                const source = subject.source || '';

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
    downloadFile(xml, 'xml', filename);

    console.log('EAD XML generated and downloaded');
}

// Make function available globally
if (typeof window !== 'undefined') {
    window.downloadEAD = downloadEAD;
}
