#!/usr/bin/env python3
"""
Migrate downloadHTML.js files to use shared HtmlBuilder
Keeps language/country lookups in place, replaces HTML generation
"""

import os
import re

modules = [
    'archives/metadatamaker',
    'collections/metadatamaker',
    'dataset/metadatamaker',
    'ebooks/metadatamaker',
    'govdocs/metadatamaker',
    'maps/metadatamaker',
    'metadatamaker',
    'mixedMedia/metadatamaker',
    'serials/metadatamaker',
    'theses/metadatamaker'
]

for module in modules:
    filepath = f'{module}/downloadHTML.js'
    
    if not os.path.exists(filepath):
        continue
    
    with open(filepath, 'r') as f:
        content = f.read()
    
    # Find where the downloadHTML function starts (around line 912)
    # We'll replace everything from /*\n * Build an HTML page... to the end
    
    # Keep everything up to and including getCountry function
    # This preserves the lookup tables
    match = re.search(r'(.*function getCountry.*?\n\})', content, re.DOTALL)
    if not match:
        print(f"Could not find getCountry in {filepath}")
        continue
    
    lookup_section = match.group(1)
    
    # Determine the import path
    if module == 'metadatamaker':
        import_path = '../shared/htmlBuilder.js'
    else:
        import_path = '../../shared/htmlBuilder.js'
    
    # Create new content
    new_content = lookup_section + '''

/*
 * HTML generation now uses shared HtmlBuilder
 * Language and country lookup functions are defined above
 */
import { HtmlBuilder } from '___IMPORT_PATH___';

const builder = new HtmlBuilder({
  itemType: 'http://schema.org/Book',
  moduleType: '___MODULE_NAME___'
});

window.downloadHTML = builder.downloadHTML.bind(builder);
'''
    
    new_content = new_content.replace('___IMPORT_PATH___', import_path)
    new_content = new_content.replace('___MODULE_NAME___', module.split('/')[0])
    
    with open(filepath, 'w') as f:
        f.write(new_content)
    
    print(f"✓ Migrated {filepath}")

print("\\nHTML migration complete!")
