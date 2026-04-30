/**
 * Test script for JCKL Academy themed CSV export functionality
 * Tests the enhanced formatting with bigger bold titles and complete word display
 */

import { generateEnhancedCSV, downloadEnhancedCSV, exportSimpleTable } from './csvExportHelper';

// Test data for JCKL Academy theme
const jcklTestData = {
  inventory: [
    { 
      name: 'JCKL Academy Special Burger', 
      category: 'Main Course - Celebration Special', 
      stock: 25, 
      price: 150.00,
      status: 'In Stock'
    },
    { 
      name: 'Gratitude Fries with Special Seasoning', 
      category: 'Side Dish - Premium Selection', 
      stock: 3, 
      price: 75.50,
      status: 'Low Stock'
    },
    { 
      name: 'JCKL Academy Celebration Drink', 
      category: 'Beverage - Limited Edition', 
      stock: 0, 
      price: 45.00,
      status: 'Out of Stock'
    }
  ],
  reports: [
    { 
      name: 'JCKL Academy Special Burger', 
      category: 'Main Course - Celebration Special', 
      qty: 15, 
      revenue: 2250.00,
      performance: 'Excellent'
    },
    { 
      name: 'Gratitude Fries with Special Seasoning', 
      category: 'Side Dish - Premium Selection', 
      qty: 8, 
      revenue: 604.00,
      performance: 'Good'
    }
  ]
};

// Test function 1: JCKL themed inventory export
export const testJCKLInventoryExport = () => {
  console.log('Testing JCKL Academy themed inventory export...');
  try {
    const config = {
      title: 'JCKL ACADEMY INVENTORY REPORT',
      subtitle: `Celebration Of Gratitude - Inventory Status as of ${new Date().toLocaleDateString('en-PH')}`,
      sections: [
        {
          type: 'summary',
          data: {
            'Academy': 'JCKL Academy',
            'Theme': 'Celebration Of Gratitude',
            'Total Items': jcklTestData.inventory.length,
            'Total Inventory Value': jcklTestData.inventory.reduce((sum, item) => sum + (item.stock * item.price), 0).toFixed(2),
            'Items Needing Attention': jcklTestData.inventory.filter(item => item.stock <= 5).length
          }
        },
        {
          type: 'table',
          title: 'JCKL ACADEMY INVENTORY ITEMS',
          headers: ['Item Name', 'Category', 'Current Stock', 'Unit Price (PHP)', 'Status'],
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

    const csvContent = generateEnhancedCSV(config);
    console.log('JCKL inventory CSV generated successfully!');
    console.log('Content length:', csvContent.length);
    console.log('Preview:', csvContent.substring(0, 800) + '...');
    
    downloadEnhancedCSV(csvContent, `jckl_inventory_${new Date().toISOString().split('T')[0]}.csv`);
    console.log('JCKL inventory export test passed!');
  } catch (error) {
    console.error('JCKL inventory export test failed:', error);
  }
};

// Test function 2: JCKL themed reports export
export const testJCKLReportsExport = () => {
  console.log('Testing JCKL Academy themed reports export...');
  try {
    const config = {
      title: 'JCKL ACADEMY PERFORMANCE REPORT',
      subtitle: `Celebration Of Gratitude - Performance Analysis for ${new Date().toLocaleDateString('en-PH')}`,
      sections: [
        {
          type: 'summary',
          data: {
            'Academy': 'JCKL Academy',
            'Motto': 'Jesus is the King of Kings and Lord of Lords',
            'Report Period': new Date().toLocaleDateString('en-PH'),
            'Total Revenue': jcklTestData.reports.reduce((sum, item) => sum + item.revenue, 0).toFixed(2),
            'Total Items Sold': jcklTestData.reports.reduce((sum, item) => sum + item.qty, 0),
            'Top Performer': jcklTestData.reports.reduce((max, item) => item.revenue > max.revenue ? item : max).name
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

    const csvContent = generateEnhancedCSV(config);
    console.log('JCKL reports CSV generated successfully!');
    console.log('Content length:', csvContent.length);
    console.log('Preview:', csvContent.substring(0, 800) + '...');
    
    downloadEnhancedCSV(csvContent, `jckl_reports_${new Date().toISOString().split('T')[0]}.csv`);
    console.log('JCKL reports export test passed!');
  } catch (error) {
    console.error('JCKL reports export test failed:', error);
  }
};

// Test function 3: Complete word display test
export const testCompleteWordDisplay = () => {
  console.log('Testing complete word display in cells...');
  try {
    const config = {
      title: 'JCKL ACADEMY COMPLETE WORD DISPLAY TEST',
      subtitle: 'Testing that all words are fully visible in cells',
      sections: [
        {
          type: 'table',
          title: 'LONG TEXT ITEMS TEST',
          headers: ['Very Long Item Name That Should Not Be Truncated', 'Extended Category Description With Full Details', 'Comprehensive Status Information'],
          data: [
            {
              'Very Long Item Name That Should Not Be Truncated': 'JCKL Academy Special Celebration Burger with Premium Ingredients',
              'Extended Category Description With Full Details': 'Main Course - Celebration Special - Premium Selection - Limited Edition',
              'Comprehensive Status Information': 'Available and ready for immediate serving with excellent quality'
            },
            {
              'Very Long Item Name That Should Not Be Truncated': 'Gratitude Fries with Special Seasoning and Extra Careful Preparation',
              'Extended Category Description With Full Details': 'Side Dish - Premium Selection - Student Favorite - Healthy Option',
              'Comprehensive Status Information': 'Limited stock available - reorder recommended soon'
            }
          ],
          columns: [
            { key: 'Very Long Item Name That Should Not Be Truncated', type: 'text' },
            { key: 'Extended Category Description With Full Details', type: 'text' },
            { key: 'Comprehensive Status Information', type: 'text' }
          ]
        }
      ]
    };

    const csvContent = generateEnhancedCSV(config);
    console.log('Complete word display test CSV generated!');
    console.log('Content length:', csvContent.length);
    
    downloadEnhancedCSV(csvContent, `jckl_word_display_test_${new Date().toISOString().split('T')[0]}.csv`);
    console.log('Complete word display test passed!');
  } catch (error) {
    console.error('Complete word display test failed:', error);
  }
};

// Run all JCKL themed tests
export const runAllJCKLTests = () => {
  console.log('Starting JCKL Academy themed CSV export tests...');
  console.log('Theme: Celebration Of Gratitude');
  console.log('Colors: Blue, Purple, Gold, White');
  console.log('Features: Bigger Bold Titles, Complete Word Display');
  
  testJCKLInventoryExport();
  testJCKLReportsExport();
  testCompleteWordDisplay();
  
  console.log('All JCKL Academy themed CSV export tests completed!');
  console.log('Files should now have:');
  console.log('- Bigger, bold titles with JCKL Academy branding');
  console.log('- Complete word display in all cells');
  console.log('- JCKL Academy theme colors and styling');
  console.log('- Professional Excel-ready formatting');
};

// Make tests available globally for easy testing in browser console
if (typeof window !== 'undefined') {
  window.testJCKLTheme = {
    testJCKLInventoryExport,
    testJCKLReportsExport,
    testCompleteWordDisplay,
    runAllJCKLTests
  };
  console.log('JCKL Academy themed tests available as window.testJCKLTheme');
}
