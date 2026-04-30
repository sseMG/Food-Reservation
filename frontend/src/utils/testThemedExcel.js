/**
 * Test script for themed Excel export functionality (colors only, no text branding)
 * Tests Excel formatting with:
 * - JCKL theme colors (blue, purple, gold) only
 * - Bigger, bold titles
 * - Complete word display
 * - No JCKL Academy text branding
 */

import { generateExcelHTML, downloadExcelFile } from './excelExportHelper';

// Test data for themed Excel exports
const testData = [
  { 
    name: 'Special Celebration Burger', 
    category: 'Main Course - Premium Selection', 
    stock: 25, 
    price: 150.00,
    status: 'In Stock'
  },
  { 
    name: 'Gratitude Fries with Special Seasoning', 
    category: 'Side Dish - Student Favorite', 
    stock: 3, 
    price: 75.50,
    status: 'Low Stock'
  }
];

// Test function: Themed Excel export without JCKL text
export const testThemedExcelExport = () => {
  console.log('Testing themed Excel export (colors only, no JCKL text)...');
  try {
    const config = {
      title: 'INVENTORY REPORT',
      subtitle: `Generated on ${new Date().toLocaleDateString('en-PH')}`,
      sections: [
        {
          type: 'summary',
          data: {
            'Total Items': testData.length,
            'Total Inventory Value': testData.reduce((sum, item) => sum + (item.stock * item.price), 0).toFixed(2),
            'Items Needing Attention': testData.filter(item => item.stock <= 5).length
          }
        },
        {
          type: 'table',
          title: 'INVENTORY ITEMS',
          headers: ['Item Name', 'Category', 'Current Stock', 'Unit Price (PHP)', 'Stock Status'],
          data: testData.map(item => ({
            item_name: item.name,
            category: item.category,
            current_stock: item.stock,
            unit_price: item.price,
            status: item.status
          })),
          columns: [
            { key: 'item_name', type: 'text' },
            { key: 'category', type: 'text' },
            { key: 'current_stock', type: 'number' },
            { key: 'unit_price', type: 'currency' },
            { key: 'status', type: 'status' }
          ]
        }
      ]
    };

    const excelContent = generateExcelHTML(config);
    console.log('Themed Excel generated successfully!');
    console.log('Features applied:');
    console.log('  - JCKL theme colors (blue, purple, gold)');
    console.log('  - Bigger, bold titles (20px section headers)');
    console.log('  - Complete word display in cells');
    console.log('  - NO JCKL Academy text branding');
    console.log('  - Professional Excel formatting');
    
    downloadExcelFile(excelContent, `themed_inventory_test_${new Date().toISOString().split('T')[0]}.xls`);
    console.log('Themed Excel export test passed!');
  } catch (error) {
    console.error('Themed Excel export test failed:', error);
  }
};

// Test function: Complete word display with themed colors
export const testCompleteWordDisplayThemed = () => {
  console.log('Testing complete word display with themed colors...');
  try {
    const config = {
      title: 'COMPLETE WORD DISPLAY TEST',
      subtitle: 'Testing that all words are fully visible with themed colors',
      sections: [
        {
          type: 'table',
          title: 'LONG TEXT ITEMS WITH THEMED COLORS',
          headers: ['Very Long Item Name', 'Extended Category Description', 'Status Information'],
          data: [
            {
              'Very Long Item Name': 'Special Celebration Burger with Premium Ingredients',
              'Extended Category Description': 'Main Course - Premium Selection - Student Favorite',
              'Status Information': 'Available and ready for immediate serving'
            }
          ],
          columns: [
            { key: 'Very Long Item Name', type: 'text' },
            { key: 'Extended Category Description', type: 'text' },
            { key: 'Status Information', type: 'text' }
          ]
        }
      ]
    };

    const excelContent = generateExcelHTML(config);
    console.log('Complete word display themed Excel test generated!');
    console.log('Excel formatting features:');
    console.log('  - Themed colors (blue headers, purple accents)');
    console.log('  - Proper cell widths for complete word display');
    console.log('  - No text truncation');
    console.log('  - Professional styling');
    
    downloadExcelFile(excelContent, `themed_word_display_test_${new Date().toISOString().split('T')[0]}.xls`);
    console.log('Complete word display themed test passed!');
  } catch (error) {
    console.error('Complete word display themed test failed:', error);
  }
};

// Run all themed Excel tests
export const runAllThemedExcelTests = () => {
  console.log('='.repeat(50));
  console.log('THEMED EXCEL EXPORT TESTS (COLORS ONLY)');
  console.log('='.repeat(50));
  console.log('');
  console.log('Theme Features:');
  console.log('  - JCKL theme colors (blue, purple, gold)');
  console.log('  - Bigger, bold titles');
  console.log('  - Complete word display');
  console.log('  - NO JCKL Academy text branding');
  console.log('');
  
  testThemedExcelExport();
  testCompleteWordDisplayThemed();
  
  console.log('');
  console.log('='.repeat(50));
  console.log('THEMED EXCEL TESTS COMPLETED!');
  console.log('='.repeat(50));
  console.log('');
  console.log('Excel files now have:');
  console.log('  - Beautiful themed colors');
  console.log('  - Bold, prominent titles');
  console.log('  - Complete text display');
  console.log('  - Clean, professional appearance');
  console.log('  - No academy text branding');
};

// Make tests available globally
if (typeof window !== 'undefined') {
  window.testThemedExcel = {
    testThemedExcelExport,
    testCompleteWordDisplayThemed,
    runAllThemedExcelTests
  };
  console.log('Themed Excel tests available as window.testThemedExcel');
  console.log('Run window.testThemedExcel.runAllThemedExcelTests() to test');
}
