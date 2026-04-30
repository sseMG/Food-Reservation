/**
 * Test script for enhanced CSV export functionality
 * Run this in browser console to test the CSV export features
 */

import { generateEnhancedCSV, downloadEnhancedCSV, exportSimpleTable } from './csvExportHelper';

// Test data
const testData = {
  items: [
    { name: 'Burger', category: 'Main Course', stock: 25, price: 150.00 },
    { name: 'Fries', category: 'Side Dish', stock: 3, price: 75.50 },
    { name: 'Soda', category: 'Beverage', stock: 0, price: 45.00 }
  ],
  reports: [
    { name: 'Burger', category: 'Main Course', qty: 15, revenue: 2250.00 },
    { name: 'Fries', category: 'Side Dish', qty: 8, revenue: 604.00 }
  ]
};

// Test function 1: Simple table export
export const testSimpleTableExport = () => {
  console.log('Testing simple table export...');
  try {
    exportSimpleTable(
      testData.items,
      ['Item Name', 'Category', 'Stock', 'Price'],
      'Test Inventory',
      'test_inventory.csv'
    );
    console.log('Simple table export test passed!');
  } catch (error) {
    console.error('Simple table export test failed:', error);
  }
};

// Test function 2: Enhanced CSV generation
export const testEnhancedCSV = () => {
  console.log('Testing enhanced CSV generation...');
  try {
    const config = {
      title: 'TEST REPORT',
      subtitle: 'This is a test report',
      sections: [
        {
          type: 'summary',
          data: {
            'Total Items': testData.items.length,
            'Total Value': testData.items.reduce((sum, item) => sum + (item.stock * item.price), 0),
            'Low Stock': testData.items.filter(item => item.stock <= 5).length
          }
        },
        {
          type: 'table',
          title: 'INVENTORY ITEMS',
          headers: ['Item', 'Category', 'Stock', 'Price', 'Status'],
          data: testData.items.map(item => ({
            item: item.name,
            category: item.category,
            stock: item.stock,
            price: item.price,
            status: item.stock === 0 ? 'OUT OF STOCK' : item.stock <= 5 ? 'LOW STOCK' : 'IN STOCK'
          })),
          columns: [
            { key: 'item', type: 'text' },
            { key: 'category', type: 'text' },
            { key: 'stock', type: 'number' },
            { key: 'price', type: 'currency' },
            { key: 'status', type: 'status' }
          ]
        }
      ]
    };

    const csvContent = generateEnhancedCSV(config);
    console.log('Generated CSV content length:', csvContent.length);
    console.log('CSV preview:', csvContent.substring(0, 500) + '...');
    
    // Test download
    downloadEnhancedCSV(csvContent, 'test_enhanced_report.csv');
    console.log('Enhanced CSV test passed!');
  } catch (error) {
    console.error('Enhanced CSV test failed:', error);
  }
};

// Test function 3: Edge cases
export const testEdgeCases = () => {
  console.log('Testing edge cases...');
  try {
    // Test empty data
    const emptyConfig = {
      title: 'EMPTY TEST',
      sections: [
        {
          type: 'table',
          title: 'EMPTY TABLE',
          headers: ['Column 1', 'Column 2'],
          data: [],
          columns: [{ key: 'col1', type: 'text' }, { key: 'col2', type: 'text' }]
        }
      ]
    };

    const emptyCSV = generateEnhancedCSV(emptyConfig);
    console.log('Empty data test passed! Length:', emptyCSV.length);

    // Test special characters
    const specialConfig = {
      title: 'SPECIAL CHARACTERS TEST',
      sections: [
        {
          type: 'table',
          title: 'SPECIAL CHARS',
          headers: ['Text with "quotes"', 'Text with, commas', 'Text with\nnewlines'],
          data: [{
            'Text with "quotes"': 'Value with "quotes"',
            'Text with, commas': 'Value with, commas',
            'Text with\nnewlines': 'Value with\nnewlines'
          }],
          columns: [
            { key: 'Text with "quotes"', type: 'text' },
            { key: 'Text with, commas', type: 'text' },
            { key: 'Text with\nnewlines', type: 'text' }
          ]
        }
      ]
    };

    const specialCSV = generateEnhancedCSV(specialConfig);
    console.log('Special characters test passed! Length:', specialCSV.length);

  } catch (error) {
    console.error('Edge cases test failed:', error);
  }
};

// Run all tests
export const runAllTests = () => {
  console.log('Starting CSV export tests...');
  testSimpleTableExport();
  testEnhancedCSV();
  testEdgeCases();
  console.log('All CSV export tests completed!');
};

// Make tests available globally for easy testing in browser console
if (typeof window !== 'undefined') {
  window.testCSVExports = {
    testSimpleTableExport,
    testEnhancedCSV,
    testEdgeCases,
    runAllTests
  };
  console.log('CSV export tests available as window.testCSVExports');
}
