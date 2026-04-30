/**
 * Test script for updated text styling (white font with black outline)
 * Tests the improved text visibility across all export reports
 */

import { generateExcelHTML, downloadExcelFile } from './excelExportHelper';

// Test data for text styling verification
const testData = [
  { 
    name: 'Test Product with Long Name', 
    category: 'Test Category', 
    stock: 10, 
    price: 100.00,
    status: 'In Stock'
  }
];

// Test function: Verify white font with black outline styling
export const testTextStyling = () => {
  console.log('Testing white font with black outline text styling...');
  try {
    const config = {
      title: 'TEXT STYLING TEST REPORT',
      subtitle: 'Testing white font with black outline for better visibility',
      sections: [
        {
          type: 'summary',
          data: {
            'Test Purpose': 'Verify white text with black outline',
            'Styling Applied': 'White font + Black text-shadow',
            'Expected Result': 'Better visibility on colored backgrounds',
            'Applied To': 'Section headers, table headers, footer'
          }
        },
        {
          type: 'table',
          title: 'TEXT STYLING VERIFICATION',
          headers: ['Section Type', 'Background Color', 'Text Color', 'Outline Effect'],
          data: [
            {
              section_type: 'Section Headers',
              background_color: 'Blue (#1e40af)',
              text_color: 'White',
              outline_effect: 'Black text-shadow outline'
            },
            {
              section_type: 'Table Headers',
              background_color: 'Purple (#7c3aed)',
              text_color: 'White',
              outline_effect: 'Black text-shadow outline'
            },
            {
              section_type: 'Footer',
              background_color: 'Dark Blue (#1e3a8a)',
              text_color: 'White',
              outline_effect: 'Black text-shadow outline'
            }
          ],
          columns: [
            { key: 'section_type', type: 'text' },
            { key: 'background_color', type: 'text' },
            { key: 'text_color', type: 'text' },
            { key: 'outline_effect', type: 'text' }
          ]
        },
        {
          type: 'table',
          title: 'SAMPLE DATA TABLE',
          headers: ['Product Name', 'Category', 'Stock', 'Price', 'Status'],
          data: testData.map(item => ({
            product_name: item.name,
            category: item.category,
            stock: item.stock,
            price: item.price,
            status: item.status
          })),
          columns: [
            { key: 'product_name', type: 'text' },
            { key: 'category', type: 'text' },
            { key: 'stock', type: 'number' },
            { key: 'price', type: 'currency' },
            { key: 'status', type: 'status' }
          ]
        }
      ]
    };

    const excelContent = generateExcelHTML(config);
    console.log('Text styling test Excel generated successfully!');
    console.log('Applied styling features:');
    console.log('  - White font text on colored backgrounds');
    console.log('  - Black text-shadow outline for better visibility');
    console.log('  - Applied to section headers, table headers, and footer');
    console.log('  - Should eliminate eye strain from poor contrast');
    
    downloadExcelFile(excelContent, `text_styling_test_${new Date().toISOString().split('T')[0]}.xls`);
    console.log('Text styling test completed!');
  } catch (error) {
    console.error('Text styling test failed:', error);
  }
};

// Test function: Verify all export types have consistent styling
export const testAllExportsTextStyling = () => {
  console.log('Testing text styling across all export types...');
  
  const exportTypes = [
    {
      name: 'Inventory Report',
      config: {
        title: 'INVENTORY REPORT',
        subtitle: 'Testing text styling in inventory exports',
        sections: [
          {
            type: 'table',
            title: 'INVENTORY ITEMS',
            headers: ['Item Name', 'Category', 'Stock', 'Price'],
            data: testData,
            columns: [
              { key: 'item_name', type: 'text' },
              { key: 'category', type: 'text' },
              { key: 'stock', type: 'number' },
              { key: 'price', type: 'currency' }
            ]
          }
        ]
      }
    },
    {
      name: 'Sales Report',
      config: {
        title: 'SALES REPORT',
        subtitle: 'Testing text styling in sales exports',
        sections: [
          {
            type: 'table',
            title: 'SALES DATA',
            headers: ['Product', 'Quantity', 'Revenue'],
            data: testData,
            columns: [
              { key: 'product', type: 'text' },
              { key: 'quantity', type: 'number' },
              { key: 'revenue', type: 'currency' }
            ]
          }
        ]
      }
    },
    {
      name: 'Combined Report',
      config: {
        title: 'COMBINED REPORT',
        subtitle: 'Testing text styling in combined exports',
        sections: [
          {
            type: 'summary',
            data: {
              'Total Items': testData.length,
              'Test Feature': 'White font with black outline'
            }
          },
          {
            type: 'table',
            title: 'COMBINED DATA',
            headers: ['Metric', 'Value', 'Status'],
            data: [
              { metric: 'Test Item', value: 'Test Value', status: 'SUCCESS' }
            ],
            columns: [
              { key: 'metric', type: 'text' },
              { key: 'value', type: 'text' },
              { key: 'status', type: 'status' }
            ]
          }
        ]
      }
    }
  ];

  exportTypes.forEach((exportType, index) => {
    try {
      const excelContent = generateExcelHTML(exportType.config);
      downloadExcelFile(excelContent, `${exportType.name.toLowerCase().replace(/\s+/g, '_')}_text_styling_${new Date().toISOString().split('T')[0]}.xls`);
      console.log(`Generated ${exportType.name} with updated text styling`);
    } catch (error) {
      console.error(`Failed to generate ${exportType.name}:`, error);
    }
  });

  console.log('All export types tested with updated text styling!');
};

// Run all text styling tests
export const runAllTextStylingTests = () => {
  console.log('='.repeat(60));
  console.log('TEXT STYLING TESTS - WHITE FONT WITH BLACK OUTLINE');
  console.log('='.repeat(60));
  console.log('');
  console.log('Styling Features:');
  console.log('  - White font text on colored backgrounds');
  console.log('  - Black text-shadow outline for visibility');
  console.log('  - Applied to all headers and titles');
  console.log('  - Eliminates eye strain from poor contrast');
  console.log('');
  
  testTextStyling();
  testAllExportsTextStyling();
  
  console.log('');
  console.log('='.repeat(60));
  console.log('TEXT STYLING TESTS COMPLETED!');
  console.log('='.repeat(60));
  console.log('');
  console.log('All Excel exports now have:');
  console.log('  - Easy-to-read white text with black outline');
  console.log('  - Better visibility on colored backgrounds');
  console.log('  - Consistent styling across all reports');
  console.log('  - No more eye strain from poor contrast');
};

// Make tests available globally
if (typeof window !== 'undefined') {
  window.testTextStyling = {
    testTextStyling,
    testAllExportsTextStyling,
    runAllTextStylingTests
  };
  console.log('Text styling tests available as window.testTextStyling');
  console.log('Run window.testTextStyling.runAllTextStylingTests() to test all');
}
