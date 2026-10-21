/**
 * Safe CSV Exporter.
 * Strictly prevents CSV/Spreadsheet Formula Injection by prepending a single quote (')
 * to any cell beginning with '=', '+', '-', '@', '\t', or '\r'.
 */
export const exportToCSV = (rows, filename = 'analytical_results.csv') => {
  if (!rows || rows.length === 0) {
    alert('No data rows available to export.');
    return;
  }

  const columns = Object.keys(rows[0]);

  // Sanitize header row
  const headerLine = columns.map((col) => `"${col.replace(/"/g, '""')}"`).join(',');

  // Format and sanitize data rows
  const dataLines = rows.map((row) => {
    return columns
      .map((col) => {
        let val = row[col];
        if (val === null || val === undefined) {
          return '""';
        }

        let strVal = String(val);

        // Security check for CSV Formula Injection (CWE-1236)
        if (/^[=+\-@\t\r]/.test(strVal)) {
          strVal = `'${strVal}`;
        }

        // Escape embedded double quotes
        return `"${strVal.replace(/"/g, '""')}"`;
      })
      .join(',');
  });

  const csvContent = [headerLine, ...dataLines].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

/**
 * Exports data to formatted JSON file.
 */
export const exportToJSON = (data, filename = 'analytical_results.json') => {
  const jsonContent = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
