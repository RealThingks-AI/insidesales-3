/**
 * Robust CSV parser that handles quoted fields, escaped quotes, and complex data
 */
export class CSVParser {
  /**
   * Parse a CSV line into an array of fields
   * Handles quoted fields, escaped quotes, and commas within fields
   */
  static parseLine(line: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    let i = 0;
    
    while (i < line.length) {
      const char = line[i];
      const nextChar = line[i + 1];
      
      if (char === '"') {
        if (inQuotes && nextChar === '"') {
          // Escaped quote within quoted field
          current += '"';
          i += 2; // Skip both quotes
        } else {
          // Start or end of quoted field
          inQuotes = !inQuotes;
          i++;
        }
      } else if (char === ',' && !inQuotes) {
        // Field separator outside quotes
        result.push(current.trim());
        current = '';
        i++;
      } else {
        current += char;
        i++;
      }
    }
    
    // Add the last field
    result.push(current.trim());
    
    return result;
  }
  
  /**
   * Parse a complete CSV string into headers and data rows
   */
  static parseCSV(csvText: string): { headers: string[]; rows: string[][] } {
    const lines = csvText.split('\n').filter(line => line.trim());
    
    if (lines.length < 2) {
      throw new Error('CSV file must have at least a header row and one data row');
    }
    
    const headers = this.parseLine(lines[0]);
    const rows = lines.slice(1).map(line => this.parseLine(line));
    
    return { headers, rows };
  }
  
  /**
   * Convert data to CSV format with proper escaping
   */
  static toCSV(data: any[], headers: string[]): string {
    const escapedHeaders = headers.map(header => this.escapeField(header));
    
    const rows = data.map(row => 
      headers.map(header => {
        let value = row[header];
        
        // Handle null/undefined
        if (value === null || value === undefined) {
          return '';
        }
        
        // Handle arrays
        if (Array.isArray(value)) {
          value = value.join(', ');
        }
        
        // Handle booleans
        if (typeof value === 'boolean') {
          value = value ? 'true' : 'false';
        }
        
        // Handle dates
        if (value instanceof Date) {
          value = value.toISOString();
        }
        
        // Convert to string and escape
        return this.escapeField(String(value));
      }).join(',')
    );
    
    return [escapedHeaders.join(','), ...rows].join('\n');
  }
  
  /**
   * Escape a field for CSV output
   */
  private static escapeField(field: string): string {
    // If field contains comma, quote, or newline, wrap in quotes and escape internal quotes
    if (field.includes(',') || field.includes('"') || field.includes('\n')) {
      return `"${field.replace(/"/g, '""')}"`;
    }
    return field;
  }
}