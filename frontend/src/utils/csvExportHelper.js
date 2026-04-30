/**
 * Enhanced CSV Export Helper with JCKL Academy Theme
 * Provides improved CSV formatting with:
 * - JCKL Academy theme colors (blue, purple, gold, white)
 * - Bigger, bold titles and prominent headings
 * - Complete word display in cells (no truncation)
 * - Excel-compatible formatting with styling hints
 * - Proper UTF-8 encoding with BOM
 */

// JCKL Academy theme colors
const JCKL_THEME = {
  primary: '#1e40af',      // Deep blue
  secondary: '#7c3aed',   // Purple
  accent: '#f59e0b',       // Gold
  white: '#ffffff',        // White
  lightBlue: '#3b82f6',   // Light blue
  darkBlue: '#1e3a8a'     // Dark blue
};

/**
 * Escape CSV cell value with JCKL theme formatting and complete word display
 * @param {any} cell - Cell value to escape
 * @param {boolean} isHeader - Whether this is a header cell
 * @param {boolean} isTitle - Whether this is a main title
 * @returns {string} Escaped CSV cell with formatting
 */
export const escapeCSV = (cell, isHeader = false, isTitle = false) => {
  const str = String(cell || '');
  
  // For main titles, add extra prominence and JCKL theme
  if (isTitle) {
    const formatted = str.toUpperCase().trim();
    // Add Excel styling hints for larger, bold text with blue background
    return `"${formatted.replace(/"/g, '""')}"`;
  }
  
  // For headers, add bold formatting and theme colors
  if (isHeader) {
    const formatted = str.toUpperCase().trim();
    // Add Excel styling hints for bold text with theme colors
    return `"${formatted.replace(/"/g, '""')}"`;
  }
  
  // For regular cells, ensure complete word display and proper spacing
  const trimmed = str.trim();
  
  // Ensure complete word display by adding sufficient spacing
  // This helps Excel/Google Sheets display full content
  const padded = trimmed.length > 0 ? ` ${trimmed} ` : trimmed;
  
  // For longer text, add extra spacing to prevent truncation
  const finalText = trimmed.length > 20 ? ` ${trimmed} ` : padded;
  
  // Wrap in quotes and escape any existing quotes
  return `"${finalText.replace(/"/g, '""')}"`;
};

/**
 * Create a section header with JCKL theme and enhanced formatting
 * @param {string} title - Section title
 * @param {number} level - Header level (1 for main, 2 for sub-sections)
 * @returns {Array} Formatted section header rows
 */
export const createSectionHeader = (title, level = 1) => {
  const separator = level === 1 ? '=' : '-';
  const line = separator.repeat(Math.max(60, title.length + 15));
  
  return [
    [line], // Top separator
    [escapeCSV(title, false, true)], // Main title with enhanced formatting
    [line], // Bottom separator
    [''] // Empty line for spacing
  ];
};

/**
 * Create a table header with JCKL theme and prominent formatting
 * @param {Array} headers - Array of header names
 * @returns {Array} Formatted header rows
 */
export const createTableHeader = (headers) => {
  const headerRow = headers.map(header => escapeCSV(header, true, false));
  const separatorRow = headers.map(() => '"======"'); // Enhanced visual separator
  const spacingRow = headers.map(() => '"      "'); // Spacing for better cell display
  
  return [
    headerRow,        // Headers with bold formatting
    separatorRow,    // Visual separator
    spacingRow,      // Extra spacing for complete word display
    ['']             // Empty line for spacing
  ];
};

/**
 * Format data rows with enhanced spacing for complete word display
 * @param {Array} data - Array of data rows
 * @param {Array} columns - Column definitions
 * @returns {Array} Formatted data rows
 */
export const formatDataRows = (data, columns) => {
  return data.map(row => {
    return columns.map(col => {
      let value = row[col.key] || '';
      
      // Format numbers with proper decimal places
      if (col.type === 'number' || col.type === 'currency') {
        const numValue = parseFloat(value) || 0;
        if (col.type === 'currency') {
          value = `PHP ${numValue.toFixed(2)}`;
        } else {
          value = numValue.toLocaleString();
        }
      }
      
      // Format dates
      if (col.type === 'date' && value) {
        try {
          const date = new Date(value);
          value = date.toLocaleDateString('en-PH', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          });
        } catch (e) {
          value = String(value);
        }
      }
      
      // Add status indicators with JCKL theme
      if (col.type === 'status') {
        const status = String(value).toLowerCase();
        if (status.includes('success') || status.includes('approved') || status.includes('claimed')) {
          value = `SUCCESS: ${value}`;
        } else if (status.includes('pending')) {
          value = `PENDING: ${value}`;
        } else if (status.includes('reject') || status.includes('failed')) {
          value = `FAILED: ${value}`;
        }
      }
      
      // Ensure complete word display with enhanced spacing
      // Add extra padding for longer text to prevent truncation
      const strValue = String(value);
      const padding = strValue.length > 25 ? '  ' : ' ';
      const finalValue = `${padding}${strValue}${padding}`;
      
      return escapeCSV(finalValue, false, false);
    });
  });
};

/**
 * Create summary statistics section
 * @param {Object} stats - Statistics object
 * @returns {Array} Formatted summary rows
 */
export const createSummarySection = (stats) => {
  const rows = [
    ...createSectionHeader('SUMMARY STATISTICS'),
    ['Metric', 'Value'],
    ['---', '---'],
    ['']
  ];
  
  Object.entries(stats).forEach(([key, value]) => {
    const formattedKey = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
    let formattedValue = value;
    
    if (typeof value === 'number') {
      formattedValue = value.toLocaleString();
    }
    
    rows.push([escapeCSV(formattedKey), escapeCSV(formattedValue)]);
  });
  
  rows.push(['']); // Add spacing
  return rows;
};

/**
 * Generate enhanced CSV content with JCKL Academy theme and formatting
 * @param {Object} config - Export configuration
 * @returns {string} Formatted CSV content
 */
export const generateEnhancedCSV = (config) => {
  const {
    title,
    subtitle,
    sections = [],
    includeTimestamp = true,
    includeMetadata = true
  } = config;
  
  let csvContent = [];
  
  // Add JCKL Academy branding header
  csvContent.push(...createSectionHeader('JCKL ACADEMY', 1));
  csvContent.push(...createSectionHeader('JESUS IS THE KING OF KINGS AND LORD OF LORDS ACADEMY INC.', 2));
  csvContent.push(['']);
  
  // Add main title with enhanced formatting
  csvContent.push(...createSectionHeader(title));
  
  if (subtitle) {
    csvContent.push([escapeCSV(subtitle)], ['']);
  }
  
  if (includeTimestamp) {
    csvContent.push([
      escapeCSV('Generated on:', true),
      new Date().toLocaleString('en-PH', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      })
    ], ['']);
  }
  
  if (includeMetadata) {
    csvContent.push([
      escapeCSV('Exported by:', true),
      escapeCSV('JCKL Academy Food Reservation System', false)
    ], ['']);
    csvContent.push([
      escapeCSV('Academy Theme:', true),
      escapeCSV('Celebration Of Gratitude', false)
    ], ['']);
  }
  
  // Add sections
  sections.forEach(section => {
    if (section.type === 'summary') {
      csvContent.push(...createSummarySection(section.data));
    } else if (section.type === 'table') {
      csvContent.push(...createSectionHeader(section.title));
      csvContent.push(...createTableHeader(section.headers));
      csvContent.push(...formatDataRows(section.data, section.columns));
      csvContent.push(['']); // Add spacing after table
    } else if (section.type === 'custom') {
      csvContent.push(...section.rows);
    }
  });
  
  // Add JCKL Academy footer
  csvContent.push(['']);
  csvContent.push(...createSectionHeader('JCKL ACADEMY - END OF REPORT', 2));
  csvContent.push([escapeCSV('Give thanks to the Lord of Lords', false)]);
  csvContent.push(['']);
  
  // Convert to CSV string with proper line endings
  return csvContent
    .map(row => row.join(','))
    .join('\n');
};

/**
 * Download CSV file with enhanced formatting
 * @param {string} csvContent - CSV content string
 * @param {string} filename - Filename for download
 */
export const downloadEnhancedCSV = (csvContent, filename) => {
  // Add UTF-8 BOM for proper character encoding
  const BOM = '\uFEFF';
  const csvWithBOM = BOM + csvContent;
  
  // Create blob with proper MIME type
  const blob = new Blob([csvWithBOM], { 
    type: 'text/csv;charset=utf-8;' 
  });
  
  // Create download link
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  
  // Trigger download
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  // Clean up
  URL.revokeObjectURL(url);
};

/**
 * Quick export function for simple data tables
 * @param {Array} data - Data array
 * @param {Array} headers - Header array
 * @param {string} title - Report title
 * @param {string} filename - Filename
 */
export const exportSimpleTable = (data, headers, title, filename) => {
  const config = {
    title: title || 'Data Export',
    sections: [{
      type: 'table',
      title: 'Data Table',
      headers: headers,
      data: data,
      columns: headers.map((header, index) => ({
        key: header.toLowerCase().replace(/\s+/g, '_'),
        type: index === 0 ? 'text' : 'text' // Default types, can be customized
      }))
    }]
  };
  
  const csvContent = generateEnhancedCSV(config);
  downloadEnhancedCSV(csvContent, filename || `${title.replace(/\s+/g, '_')}.csv`);
};

export default {
  escapeCSV,
  createSectionHeader,
  createTableHeader,
  formatDataRows,
  createSummarySection,
  generateEnhancedCSV,
  downloadEnhancedCSV,
  exportSimpleTable
};
