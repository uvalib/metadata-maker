#!/bin/bash
# Script to migrate all modules to use shared utilities

# This script automates the migration of remaining modules to use shared/sharedUtils.js
# It updates each index.html and submitForm.js file

set -e  # Exit on error

MODULES="archives collections ebooks govdocs maps mixedMedia scores serials theses"
MODIFIED_COUNT=0

echo "=== MetadataMaker Module Migration Script ==="
echo "This will migrate the following modules to use shared utilities:"
echo "$MODULES"
echo ""

for module in $MODULES; do
    echo "Processing: $module"
    
    # Check if module directory exists
    if [ ! -d "$module" ]; then
        echo "  ⚠️  Module directory not found: $module"
        continue
    fi
    
    # Check if submitForm.js exists
    if [ ! -f "$module/metadatamaker/submitForm.js" ]; then
        echo "  ⚠️  submitForm.js not found in $module"
        continue
    fi
    
    # Check if already migrated by looking for the comment
    if grep -q "are now loaded from ../shared/sharedUtils.js" "$module/metadatamaker/submitForm.js" 2>/dev/null; then
        echo "  ✓  Already migrated, skipping"
        continue
    fi
    
    # Count lines before
    BEFORE=$(wc -l < "$module/metadatamaker/submitForm.js")
    
    echo "  → Updating submitForm.js ($BEFORE lines)"
    
    # Note: The actual replacement needs to be done carefully per module
    # This script just identifies what needs to be done
    echo "  ⏸  Manual migration required (each module has slight differences)"
    
    ((MODIFIED_COUNT++))
done

echo ""
echo "=== Summary ==="
echo "Modules needing migration: $MODIFIED_COUNT"
echo ""
echo "Next steps:"
echo "1. Each module needs careful inspection for variations"
echo "2. Update index.html to load ../shared/sharedUtils.js"
echo "3. Remove duplicated functions from submitForm.js"
echo "4. Test each module in browser"
echo ""
