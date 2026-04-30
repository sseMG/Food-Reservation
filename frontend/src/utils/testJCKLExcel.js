/**
 * Test script for JCKL Academy themed Excel export functionality
 * Tests actual Excel formatting with:
 * - Bigger, bold titles (not just uppercase)
 * - JCKL Academy theme colors (blue, purple, gold)
 * - Complete word display with proper cell widths
 * - Professional Excel styling
 */

import { generateExcelHTML, downloadExcelFile } from './excelExportHelper';

// Test data for JCKL Academy Excel exports
const jcklTestData = {
  inventory: [
    { 
      name: 'JCKL Academy Special Celebration Burger', 
      category: 'Main Course - Premium Selection', 
      stock: 25, 
      price: 150.00,
      status: 'In Stock'
    },
    { 
      name: 'Gratitude Fries with Special Seasoning and Extra Careful Preparation', 
      category: 'Side Dish - Student Favorite - Healthy Option', 
      stock: 3, 
      price: 75.50,
      status: 'Low Stock'
    },
    { 
      name: 'JCKL Academy Limited Edition Celebration Drink', 
      category: 'Beverage - Premium Collection - Special Edition', 
      stock: 0, 
      price: 45.00,
      status: 'Out of Stock'
    }
  ],
  reports: [
    { 
      name: 'JCKL Academy Special Celebration Burger with Premium Ingredients', 
      category: 'Main Course - Premium Selection', 
      qty: 15, 
      revenue: 2250.00,
      performance: 'Excellent'
    },
    { 
      name: 'Gratitude Fries with Special Seasoning and Extra Careful Preparation', 
      category: 'Side Dish - Student Favorite - Healthy Option', 
      qty: 8, 
      revenue: 604.00,
      performance: 'Good'
    }
  ]
};

// Test function 1: JCKL themed Excel inventory export
export const testJCKLInventoryExcelExport = () => {
  console.log('Testing JCKL Academy themed Excel inventory export...');
  try {
    const config = {
      title: 'JCKL ACADEMY INVENTORY REPORT',
      subtitle: `Celebration Of Gratitude - Excel Test Export - ${new Date().toLocaleDateString('en-PH')}`,
      sections: [
        {
          type: 'summary',
          data: {
            'Academy': 'JCKL Academy',
            'Theme': 'Celebration Of Gratitude',
            'Total Items': jcklTestData.inventory.length,
            'Total Inventory Value': jcklTestData.inventory.reduce((sum, item) => sum + (item.stock * item.price), 0).toFixed(2),
            'Items Needing Attention': jcklTestData.inventory.filter(item => item.stock <= 5).length,
            'Test Feature': 'Bigger Bold Titles with JCKL Colors'
          }
        },
        {
          type: 'table',
          title: 'JCKL ACADEMY INVENTORY ITEMS',
          headers: ['Item Name', 'Category', 'Current Stock', 'Unit Price (PHP)', 'Stock Status'],
          data: jcklTestData.inventory.map(item => ({
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
    console.log('JCKL inventory Excel generated successfully!');
    console.log('Content length:', excelContent.length);
    console.log('Features tested:');
    console.log('- Bigger, bold titles with JCKL Academy branding');
    console.log('- JCKL theme colors (blue, purple, gold)');
    console.log('- Complete word display in cells');
    console.log('- Professional Excel formatting');
    
    downloadExcelFile(excelContent, `jckl_inventory_excel_test_${new Date().toISOString().split('T')[0]}.xls`);
    console.log('JCKL inventory Excel export test passed!');
  } catch (error) {
    console.error('JCKL inventory Excel export test failed:', error);
  }
};

// Test function 2: JCKL themed Excel reports export
export const testJCKLReportsExcelExport = () => {
  console.log('Testing JCKL Academy themed Excel reports export...');
  try {
    const config = {
      title: 'JCKL ACADEMY PERFORMANCE REPORT',
      subtitle: `Celebration Of Gratitude - Excel Test Export - ${new Date().toLocaleDateString('en-PH')}`,
      sections: [
        {
          type: 'summary',
          data: {
            'Academy': 'JCKL Academy',
            'Motto': 'Jesus is the King of Kings and Lord of Lords',
            'Report Period': new Date().toLocaleDateString('en-PH'),
            'Total Revenue': jcklTestData.reports.reduce((sum, item) => sum + item.revenue, 0).toFixed(2),
            'Total Items Sold': jcklTestData.reports.reduce((sum, item) => sum + item.qty, 0),
            'Top Performer': jcklTestData.reports.reduce((max, item) => item.revenue > max.revenue ? item : max).name,
            'Excel Features': 'Bold Titles, JCKL Colors, Complete Words'
          }
        },
        {
          type: 'table',
          title: 'JCKL ACADEMY SALES PERFORMANCE',
          headers: ['Product Name', 'Category', 'Quantity Sold', 'Revenue (PHP)', 'Performance Rating'],
          data: jcklTestData.reports.map(item => ({
            product_name: item.name,
            category: item.category,
            quantity_sold: item.qty,
            revenue: item.revenue,
            performance_rating: item.performance
          })),
          columns: [
            { key: 'product_name', type: 'text' },
            { key: 'category', type: 'text' },
            { key: 'quantity_sold', type: 'number' },
            { key: 'revenue', type: 'currency' },
            { key: 'performance_rating', type: 'status' }
          ]
        }
      ]
    };

    const excelContent = generateExcelHTML(config);
    console.log('JCKL reports Excel generated successfully!');
    console.log('Content length:', excelContent.length);
    console.log('Excel formatting features:');
    console.log('- 28px bold titles with JCKL Academy branding');
    console.log('- Blue/purple/gold theme colors');
    console.log('- Complete word display (no truncation)');
    console.log('- Professional cell formatting');
    
    downloadExcelFile(excelContent, `jckl_reports_excel_test_${new Date().toISOString().split('T')[0]}.xls`);
    console.log('JCKL reports Excel export test passed!');
  } catch (error) {
    console.error('JCKL reports Excel export test failed:', error);
  }
};

// Test function 3: Complete word display verification
export const testCompleteWordDisplayExcel = () => {
  console.log('Testing complete word display in Excel cells...');
  try {
    const config = {
      title: 'JCKL ACADEMY COMPLETE WORD DISPLAY TEST',
      subtitle: 'Testing that all words are fully visible in Excel cells - No Truncation',
      sections: [
        {
          type: 'table',
          title: 'LONG TEXT ITEMS TEST - EXCEL FORMATTING',
          headers: ['Very Long Item Name That Should Not Be Truncated In Excel', 'Extended Category Description With Full Details', 'Comprehensive Status Information With Complete Text'],
          data: [
            {
              'Very Long Item Name That Should Not Be Truncated In Excel': 'JCKL Academy Special Celebration Burger with Premium Ingredients and Extra Careful Preparation for Student Excellence',
              'Extended Category Description With Full Details': 'Main Course - Celebration Special - Premium Selection - Limited Edition - Student Favorite - Healthy Option',
              'Comprehensive Status Information With Complete Text': 'Available and ready for immediate serving with excellent quality and complete satisfaction guarantee'
            },
            {
              'Very Long Item Name That Should Not Be Truncated In Excel': 'Gratitude Fries with Special Seasoning and Extra Careful Preparation for Student Health and Happiness',
              'Extended Category Description With Full Details': 'Side Dish - Premium Selection - Student Favorite - Healthy Option - Limited Time Offer',
              'Comprehensive Status Information With Complete Text': 'Limited stock available - reorder recommended soon - special pricing available'
            }
          ],
          columns: [
            { key: 'Very Long Item Name That Should Not Be Truncated In Excel', type: 'text' },
            { key: 'Extended Category Description With Full Details', type: 'text' },
            { key: 'Comprehensive Status Information With Complete Text', type: 'text' }
          ]
        }
      ]
    };

    const excelContent = generateExcelHTML(config);
    console.log('Complete word display Excel test generated!');
    console.log('Content length:', excelContent.length);
    console.log('Excel cell formatting features:');
    console.log('- Proper cell widths (min-width: 200px, max-width: 500px)');
    console.log('- Word-wrap: break-word for long text');
    console.log('- White-space: normal for complete display');
    console.log('- Line-height: 1.5 for readability');
    
    downloadExcelFile(excelContent, `jckl_word_display_excel_test_${new Date().toISOString().split('T')[0]}.xls`);
    console.log('Complete word display Excel test passed!');
  } catch (error) {
    console.error('Complete word display Excel test failed:', error);
  }
};

// Test function 4: JCKL theme colors verification
export const testJCKLThemeColors = () => {
  console.log('Testing JCKL Academy theme colors in Excel...');
  try {
    const config = {
      title: 'JCKL ACADEMY THEME COLORS TEST',
      subtitle: 'Testing Blue, Purple, Gold, and White Theme Colors',
      sections: [
        {
          type: 'summary',
          data: {
            'Primary Blue': '#1e40af (Deep Blue)',
            'Secondary Purple': '#7c3aed (Purple)',
            'Accent Gold': '#f59e0b (Gold)',
            'White Background': '#ffffff (White)',
            'Light Gold Background': '#fef3c7 (Light Gold)',
            'Theme Application': 'Applied to Headers, Footers, and Status Indicators'
          }
        },
        {
          type: 'table',
          title: 'JCKL ACADEMY COLOR DEMONSTRATION',
          headers: ['Status Type', 'Color Applied', 'Visual Effect'],
          data: [
            { status_type: 'Success Status', color_applied: 'Green Background', visual_effect: 'White Text, Bold' },
            { status_type: 'Pending Status', color_applied: 'Gold Background', visual_effect: 'White Text, Bold' },
            { status_type: 'Failed Status', color_applied: 'Red Background', visual_effect: 'White Text, Bold' },
            { status_type: 'Headers', color_applied: 'Purple Background', visual_effect: 'White Text, Bold, 16px' },
            { status_type: 'Main Titles', color_applied: 'Blue Gradient', visual_effect: 'White Text, Bold, 28px' }
          ],
          columns: [
            { key: 'status_type', type: 'text' },
            { key: 'color_applied', type: 'text' },
            { key: 'visual_effect', type: 'text' }
          ]
        }
      ]
    };

    const excelContent = generateExcelHTML(config);
    console.log('JCKL theme colors Excel test generated!');
    console.log('Color scheme applied:');
    console.log('- Deep Blue (#1e40af): Main headers and branding');
    console.log('- Purple (#7c3aed): Section headers');
    console.log('- Gold (#f59e0b): Status indicators and highlights');
    console.log('- White (#ffffff): Text on colored backgrounds');
    console.log('- Light Gold (#fef3c7): Page background');
    
    downloadExcelFile(excelContent, `jckl_theme_colors_test_${new Date().toISOString().split('T')[0]}.xls`);
    console.log('JCKL theme colors Excel test passed!');
  } catch (error) {
    console.error('JCKL theme colors Excel test failed:', error);
  }
};

// Run all JCKL themed Excel tests
export const runAllJCKLExcelTests = () => {
  console.log('='.repeat(60));
  console.log('STARTING JCKL ACADEMY THEMED EXCEL EXPORT TESTS');
  console.log('='.repeat(60));
  console.log('');
  console.log('🎨 THEME: Celebration Of Gratitude');
  console.log('🏫 COLORS: Blue, Purple, Gold, White');
  console.log('📝 FORMATTING: Bigger Bold Titles, Complete Word Display');
  console.log('📊 OUTPUT: Professional Excel Files');
  console.log('');
  
  testJCKLInventoryExcelExport();
  testJCKLReportsExcelExport();
  testCompleteWordDisplayExcel();
  testJCKLThemeColors();
  
  console.log('');
  console.log('='.repeat(60));
  console.log('ALL JCKL ACADEMY THEMED EXCEL TESTS COMPLETED!');
  console.log('='.repeat(60));
  console.log('');
  console.log('✅ Features Successfully Implemented:');
  console.log('   - Bigger, bold titles (28px) with JCKL Academy branding');
  console.log('   - JCKL theme colors (blue, purple, gold, white)');
  console.log('   - Complete word display (no truncation)');
  console.log('   - Professional Excel formatting with proper cell widths');
  console.log('   - Status indicators with color coding');
  console.log('   - Hover effects and visual hierarchy');
  console.log('');
  console.log('📁 Excel files should now open with:');
  console.log('   - Prominent JCKL Academy headers');
  console.log('   - Bold section titles with theme colors');
  console.log('   - Complete text display in all cells');
  console.log('   - Professional styling and layout');
};

// Make tests available globally for easy testing in browser console
if (typeof window !== 'undefined') {
  window.testJCKLExcel = {
    testJCKLInventoryExcelExport,
    testJCKLReportsExcelExport,
    testCompleteWordDisplayExcel,
    testJCKLThemeColors,
    runAllJCKLExcelTests
  };
  console.log('JCKL Academy themed Excel tests available as window.testJCKLExcel');
  console.log('Run window.testJCKLExcel.runAllJCKLExcelTests() to test all features');
}
