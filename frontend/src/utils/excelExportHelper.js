/**
 * Excel Export Helper with JCKL Academy Theme
 * Provides true Excel formatting with:
 * - Actual bold/larger titles (not just uppercase)
 * - JCKL theme colors (blue, purple, gold, white)
 * - Complete word display with proper cell widths
 * - Professional Excel styling with real formatting
 */

// JCKL Academy theme colors
const JCKL_THEME = {
  primary: '#1e40af',      // Deep blue
  secondary: '#7c3aed',   // Purple
  accent: '#f59e0b',       // Gold
  white: '#ffffff',        // White
  lightBlue: '#3b82f6',   // Light blue
  darkBlue: '#1e3a8a',     // Dark blue
  lightGold: '#fef3c7'     // Light gold background
};

/**
 * Create Excel-compatible HTML with JCKL theme formatting
 * @param {Object} config - Export configuration
 * @returns {string} HTML content for Excel
 */
export const generateExcelHTML = (config) => {
  const {
    title,
    subtitle,
    sections = [],
    includeTimestamp = true,
    includeMetadata = true
  } = config;

  let html = `
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          margin: 20px;
          background-color: ${JCKL_THEME.lightGold};
        }
        
        .section-header {
          background-color: ${JCKL_THEME.primary};
          color: ${JCKL_THEME.darkBlue};
          padding: 15px;
          font-size: 20px;
          font-weight: bold;
          margin: 25px 0 15px 0;
          border-radius: 8px;
          text-align: center;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          text-shadow: 
            -1px -1px 0 #000,  
             1px -1px 0 #000,
            -1px  1px 0 #000,
             1px  1px 0 #000,
             2px 2px 4px rgba(0,0,0,0.5);
        }
        
        .summary-table {
          width: 100%;
          border-collapse: collapse;
          margin: 20px 0;
          background-color: ${JCKL_THEME.white};
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }
        
        .summary-table td {
          padding: 12px 15px;
          border-bottom: 1px solid #e5e7eb;
          font-size: 14px;
        }
        
        .summary-table td:first-child {
          background-color: ${JCKL_THEME.lightBlue};
          color: ${JCKL_THEME.white};
          font-weight: bold;
          width: 40%;
        }
        
        .data-table {
          width: 100%;
          border-collapse: collapse;
          margin: 20px 0;
          background-color: ${JCKL_THEME.white};
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }
        
        .data-table th {
          background-color: ${JCKL_THEME.secondary};
          color: ${JCKL_THEME.white};
          padding: 15px 12px;
          text-align: left;
          font-size: 16px;
          font-weight: bold;
          border: none;
          white-space: nowrap;
          text-shadow: 
            -1px -1px 0 #000,  
             1px -1px 0 #000,
            -1px  1px 0 #000,
             1px  1px 0 #000,
             2px 2px 4px rgba(0,0,0,0.5);
        }
        
        .data-table td {
          padding: 12px 15px;
          border-bottom: 1px solid #e5e7eb;
          font-size: 14px;
          line-height: 1.5;
          min-width: 200px;
          max-width: 500px;
          word-wrap: break-word;
          white-space: normal;
        }
        
        .data-table tr:nth-child(even) {
          background-color: #f9fafb;
        }
        
        .data-table tr:hover {
          background-color: ${JCKL_THEME.lightGold};
        }
        
        .status-success {
          background-color: #10b981;
          color: white;
          padding: 4px 8px;
          border-radius: 4px;
          font-weight: bold;
          font-size: 12px;
        }
        
        .status-pending {
          background-color: #f59e0b;
          color: white;
          padding: 4px 8px;
          border-radius: 4px;
          font-weight: bold;
          font-size: 12px;
        }
        
        .status-failed {
          background-color: #ef4444;
          color: white;
          padding: 4px 8px;
          border-radius: 4px;
          font-weight: bold;
          font-size: 12px;
        }
        
        .footer {
          text-align: center;
          margin-top: 40px;
          padding: 20px;
          background-color: ${JCKL_THEME.darkBlue};
          color: ${JCKL_THEME.white};
          border-radius: 8px;
          font-size: 14px;
          text-shadow: 
            -1px -1px 0 #000,  
             1px -1px 0 #000,
            -1px  1px 0 #000,
             1px  1px 0 #000,
             2px 2px 4px rgba(0,0,0,0.5);
        }
        
        .metadata {
          background-color: ${JCKL_THEME.white};
          padding: 15px;
          border-radius: 8px;
          margin: 15px 0;
          border-left: 4px solid ${JCKL_THEME.accent};
        }
        
        .currency {
          font-weight: bold;
          color: ${JCKL_THEME.primary};
        }
        
        .highlight {
          background-color: ${JCKL_THEME.accent};
          color: ${JCKL_THEME.darkBlue};
          padding: 2px 6px;
          border-radius: 4px;
          font-weight: bold;
        }
      </style>
    </head>
    <body>
  `;

  
  // Main title
  html += `
    <div class="section-header">
      ${title}
    </div>
  `;

  // Subtitle
  if (subtitle) {
    html += `
      <div class="metadata">
        <strong>Report Details:</strong> ${subtitle}
      </div>
    `;
  }

  // Metadata
  if (includeTimestamp || includeMetadata) {
    html += '<div class="metadata">';
    if (includeTimestamp) {
      html += `<strong>Generated on:</strong> ${new Date().toLocaleString('en-PH')}`;
    }
    if (includeMetadata) {
      html += `<br><strong>Exported by:</strong> Food Reservation System`;
    }
    html += '</div>';
  }

  // Process sections
  sections.forEach(section => {
    if (section.type === 'summary') {
      html += createSummaryTable(section.data);
    } else if (section.type === 'table') {
      html += createDataTable(section);
    }
  });

  // Footer
  html += `
    <div class="footer">
      <strong>END OF REPORT</strong>
    </div>
  `;

  html += `
    </body>
    </html>
  `;

  return html;
};

/**
 * Create summary table with JCKL theme
 * @param {Object} data - Summary data
 * @returns {string} HTML table
 */
const createSummaryTable = (data) => {
  let html = '<table class="summary-table">';
  
  Object.entries(data).forEach(([key, value]) => {
    html += `
      <tr>
        <td>${key}</td>
        <td>${formatValue(value)}</td>
      </tr>
    `;
  });
  
  html += '</table>';
  return html;
};

/**
 * Create data table with JCKL theme
 * @param {Object} section - Table section
 * @returns {string} HTML table
 */
const createDataTable = (section) => {
  let html = `
    <div class="section-header">
      ${section.title}
    </div>
    <table class="data-table">
      <thead>
        <tr>
  `;

  // Headers
  section.headers.forEach(header => {
    html += `<th>${header}</th>`;
  });

  html += `
        </tr>
      </thead>
      <tbody>
  `;

  // Data rows
  section.data.forEach(row => {
    html += '<tr>';
    section.columns.forEach(col => {
      let value = row[col.key] || '';
      
      // Format based on column type
      if (col.type === 'currency') {
        value = `<span class="currency">PHP ${parseFloat(value || 0).toFixed(2)}</span>`;
      } else if (col.type === 'status') {
        const status = String(value).toLowerCase();
        if (status.includes('success') || status.includes('approved') || status.includes('claimed')) {
          value = `<span class="status-success">SUCCESS</span>`;
        } else if (status.includes('pending')) {
          value = `<span class="status-pending">PENDING</span>`;
        } else if (status.includes('reject') || status.includes('failed')) {
          value = `<span class="status-failed">FAILED</span>`;
        }
      } else {
        value = formatValue(value);
      }
      
      html += `<td>${value}</td>`;
    });
    html += '</tr>';
  });

  html += `
      </tbody>
    </table>
  `;

  return html;
};

/**
 * Format value for display
 * @param {any} value - Value to format
 * @returns {string} Formatted value
 */
const formatValue = (value) => {
  if (value === null || value === undefined) return '';
  return String(value);
};

/**
 * Download Excel file with JCKL theme formatting
 * @param {string} htmlContent - HTML content
 * @param {string} filename - Filename
 */
export const downloadExcelFile = (htmlContent, filename) => {
  // Create blob with HTML content
  const blob = new Blob([htmlContent], { 
    type: 'application/vnd.ms-excel;charset=utf-8' 
  });
  
  // Create download link
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', filename.endsWith('.xls') ? filename : `${filename}.xls`);
  link.style.visibility = 'hidden';
  
  // Trigger download
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  // Clean up
  URL.revokeObjectURL(url);
};

/**
 * Quick export function for simple data tables with JCKL theme
 * @param {Array} data - Data array
 * @param {Array} headers - Header array
 * @param {string} title - Report title
 * @param {string} filename - Filename
 */
export const exportSimpleTableExcel = (data, headers, title, filename) => {
  const config = {
    title: title || 'DATA EXPORT',
    sections: [{
      type: 'table',
      title: 'DATA TABLE',
      headers: headers,
      data: data,
      columns: headers.map((header, index) => ({
        key: header.toLowerCase().replace(/\s+/g, '_'),
        type: index === 0 ? 'text' : 'text'
      }))
    }]
  };

  const htmlContent = generateExcelHTML(config);
  downloadExcelFile(htmlContent, filename || `${title.replace(/\s+/g, '_')}.xls`);
};

export default {
  generateExcelHTML,
  downloadExcelFile,
  exportSimpleTableExcel,
  JCKL_THEME
};
