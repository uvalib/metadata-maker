#!/usr/bin/env python3
"""
Batch migration script to remove duplicated utility functions from submitForm.js files.
This script removes: get(), generateInstitutionInfo(), find100(), and find110()
"""

import re
import os
import sys

COMMENT_REPLACEMENT = '''/*
 * Utility functions (get, generateInstitutionInfo, find100, find110, checkExists) 
 * are now loaded from ../shared/sharedUtils.js
 * See that file for documentation.
 */

'''

def migrate_submit_form(filepath):
    """Remove duplicated utility functions from a submitForm.js file."""
    
    if not os.path.exists(filepath):
        return False, "File not found"
    
    with open(filepath, 'r') as f:
        content = f.read()
    
    # Check if already migrated
    if "are now loaded from ../shared/sharedUtils.js" in content:
        return False, "Already migrated"
    
    original_lines = len(content.split('\n'))
    
    # Pattern to match from start of file until the form submission handler
    # This includes get(), generateInstitutionInfo(), find100(), and find110()
    
    # Find where the jQuery form handler starts: $("#marc-maker").submit
    form_handler_match = re.search(r'\/\*\s*\n\s*\*\s*When the form is submitted', content, re.MULTILINE)
    
    if not form_handler_match:
        return False, "Could not find form handler comment"
    
    # Keep everything from the form handler onward
    content_to_keep = content[form_handler_match.start():]
    
    # Replace with comment + form handler
    new_content = COMMENT_REPLACEMENT + content_to_keep
    
    with open(filepath, 'w') as f:
        f.write(new_content)
    
    new_lines = len(new_content.split('\n'))
    lines_removed = original_lines - new_lines
    
    return True, f"Removed {lines_removed} lines ({original_lines} → {new_lines})"

if __name__ == "__main__":
    modules = [
        "metadatamaker",
        "archives",
        "collections",
        "ebooks",
        "govdocs",
        "maps",
        "mixedMedia",
        "scores",
        "serials",
        "theses"
    ]
    
    total_removed = 0
    migrated_count = 0
    
    print("=== Batch Migrating submitForm.js Files ===\n")
    
    for module in modules:
        filepath = f"{module}/metadatamaker/submitForm.js"
        success, message = migrate_submit_form(filepath)
        
        if success:
            print(f"✓ {module:15} {message}")
            migrated_count += 1
            # Extract lines removed from message
            if "Removed" in message:
                removed = int(message.split()[1])
                total_removed += removed
        else:
            print(f"⏭ {module:15} {message}")
    
    print(f"\n=== Summary ===")
    print(f"Modules migrated: {migrated_count}/{len(modules)}")
    print(f"Total lines removed: ~{total_removed}")
    print(f"\nNext: Test each module in browser and commit changes")
