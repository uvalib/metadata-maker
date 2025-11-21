#!/usr/bin/env python3
"""
Extract language/country lookups from downloadHTML.js files
Replace with imports to shared modules
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
    'serials/metadatamaker'
]

for module in modules:
    filepath = f'{module}/downloadHTML.js'
    
    if not os.path.exists(filepath):
        print(f"Skipping {filepath} - not found")
        continue
    
    with open(filepath, 'r') as f:
        lines = f.readlines()
    
    # Find where getCountry function ends (around line 830)
    # Keep everything after that
    remaining_lines = []
    found_end = False
    
    for i, line in enumerate(lines):
        # Look for the end of getCountry function
        if '}\n' in line and i > 800 and not found_end:
            # This should be the closing brace of getCountry
            found_end = True
            continue
        
        if found_end:
            remaining_lines.append(line)
    
    # Determine the import path
    if module == 'metadatamaker':
        lang_import = '../shared/languageLookups.js'
        country_import = '../shared/countryLookups.js'
    else:
        lang_import = '../../shared/languageLookups.js'
        country_import = '../../shared/countryLookups.js'
    
    # Create new content
    new_content = f'''/*
 * Language and country lookups now in shared modules
 * This reduces duplication across all modules
 */

// Import lookup functions from shared modules
// These will be loaded via script tags, making functions globally available
// (See shared/languageLookups.js and shared/countryLookups.js)

'''
    
    # Add the remaining content
    new_content += ''.join(remaining_lines)
    
    # Write back
    with open(filepath, 'w') as f:
        f.write(new_content)
    
    print(f"✓ Updated {filepath}")

print("\nLookup extraction complete!")
