#!/bin/bash
# Browser test verification script for shared utilities migration

echo "=== Shared Utilities Migration Test ==="
echo ""
echo "This script helps verify the migration is working correctly."
echo ""

# Check file sizes
echo "1. Checking file changes..."
echo "   Original dataset/submitForm.js: ~209 lines"
echo "   New dataset/submitForm.js: $(wc -l < dataset/metadatamaker/submitForm.js) lines" 
echo "   Lines removed: ~77 (duplicated utility functions)"
echo ""

# List what to test in browser
echo "2. Browser Testing Steps:"
echo "   ✓ Start dev server: npm run dev"
echo "   ✓ Open http://127.0.0.1:3000/dataset/"
echo "   ✓ Open browser console (F12)"
echo ""

echo "3. Console Tests to Run:"
echo "   Run these commands in browser console:"
echo ""
echo "   // Test checkExists"
echo "   checkExists('test')  // should return: true"
echo "   checkExists('')      // should return: false"
echo "   checkExists(null)    // should return: false"
echo ""
echo "   // Test get (if URL has params)"
echo "   // Visit: http://127.0.0.1:3000/dataset/?marc=TEST"
echo "   get('marc')          // should return: 'TEST'"
echo ""
echo "   // Test generateInstitutionInfo"
echo "   generateInstitutionInfo().marc  // should return: 'ViU' (or URL override)"
echo ""
echo "   // Test find100"
echo "   var testList = [[{family:'Doe', given:'John', role:'aut'}, {family:'', given:''}]]"
echo "   find100(testList)[0][0].family  // should return: 'Doe'"
echo ""

echo "4. Form Testing:"
echo "   ✓ Fill out the dataset form with test data"
echo "   ✓ Add a keyword, add an author"
echo "   ✓ Check at least one record format (MARC, MODS, or HTML)"
echo "   ✓ Click 'Make' button"
echo "   ✓ Verify record downloads successfully"
echo ""

echo "5. Expected Results:"
echo "   ✅ No console errors"
echo "   ✅ Form submits successfully"
echo "   ✅ Records download with correct content"
echo "   ✅ Utility functions work in console"
echo ""

echo "If all tests pass, the migration is successful!"
echo ""
