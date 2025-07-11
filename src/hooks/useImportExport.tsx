
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface ImportExportOptions {
  moduleName: string;
  onRefresh: () => void;
  tableName?: string;
}

// Simplified interface for column configuration
interface ColumnConfig {
  allowedColumns: string[];
  required: string[];
  enums: Record<string, string[]>;
}

export const useImportExport = ({ moduleName, onRefresh, tableName = 'contacts_module' }: ImportExportOptions) => {
  const { user } = useAuth();

  // Define column mappings for different modules
  const getColumnConfig = (table: string): ColumnConfig => {
    const configs: Record<string, ColumnConfig> = {
      contacts_module: {
        allowedColumns: [
          'contact_name',
          'company_name',
          'position',
          'email',
          'phone_no',
          'mobile_no',
          'linkedin',
          'fax',
          'website',
          'contact_source',
          'lead_status',
          'industry',
          'no_of_employees',
          'annual_revenue',
          'city',
          'state',
          'country',
          'description'
        ],
        required: ['contact_name'],
        enums: {
          contact_source: ['Website', 'Referral', 'Cold Call', 'Email', 'Social Media', 'Trade Show', 'Other'],
          lead_status: ['New', 'Contacted', 'Qualified', 'Lost'],
          industry: ['Automotive', 'Technology', 'Healthcare', 'Finance', 'Manufacturing', 'Retail', 'Other']
        }
      },
      leads: {
        allowedColumns: [
          'contact_name',
          'company_name',
          'position',
          'email',
          'phone_no',
          'mobile_no',
          'linkedin',
          'fax',
          'website',
          'contact_source',
          'lead_status',
          'industry',
          'no_of_employees',
          'annual_revenue',
          'city',
          'state',
          'country',
          'description'
        ],
        required: ['contact_name'],
        enums: {
          contact_source: ['Website', 'Referral', 'Cold Call', 'Email', 'Social Media', 'Trade Show', 'Other'],
          lead_status: ['New', 'Contacted', 'Qualified', 'Lost'],
          industry: ['Automotive', 'Technology', 'Healthcare', 'Finance', 'Manufacturing', 'Retail', 'Other']
        }
      },
      meetings: {
        allowedColumns: [
          'title',
          'start_time',
          'end_time',
          'location',
          'agenda',
          'outcome',
          'next_action',
          'status',
          'priority',
          'participants',
          'teams_link',
          'lead_id',
          'contact_id',
          'deal_id',
          'tags',
          'follow_up_required',
          'host'
        ],
        required: ['title', 'start_time', 'end_time'],
        enums: {
          status: ['scheduled', 'in_progress', 'completed', 'cancelled'],
          priority: ['Low', 'Medium', 'High', 'Critical']
        }
      },
      deals: {
        allowedColumns: [
          'deal_name',
          'amount',
          'closing_date',
          'stage',
          'probability',
          'type',
          'next_step',
          'description',
          'currency',
          'pipeline'
        ],
        required: ['deal_name'],
        enums: {
          stage: ['Contact', 'Lead', 'Meeting', 'Qualified', 'RFQ', 'Offered', 'Won', 'Lost', 'Dropped']
        }
      }
    };
    return configs[table] || configs.contacts_module;
  };

  const config = getColumnConfig(tableName);

  // Enhanced header mapping with fuzzy matching
  const mapHeader = (header: string): string | null => {
    const normalized = header.toLowerCase().trim().replace(/[\s_-]+/g, '_');
    
    // Direct match
    if (config.allowedColumns.includes(normalized)) {
      return normalized;
    }
    
    // Fuzzy matching for common variations
    const mappings: Record<string, string> = {
      'name': 'contact_name',
      'full_name': 'contact_name',
      'contact': 'contact_name',
      'company': 'company_name',
      'organization': 'company_name',
      'job_title': 'position',
      'title': tableName === 'meetings' ? 'title' : 'position',
      'phone': 'phone_no',
      'telephone': 'phone_no',
      'mobile': 'mobile_no',
      'cell': 'mobile_no',
      'employees': 'no_of_employees',
      'revenue': 'annual_revenue',
      'source': 'contact_source',
      'status': tableName === 'meetings' ? 'status' : 'lead_status',
      'lead': 'lead_status',
      'meeting_title': 'title',
      'subject': 'title',
      'start': 'start_time',
      'end': 'end_time',
      'begin_time': 'start_time',
      'finish_time': 'end_time',
      'venue': 'location',
      'place': 'location',
      'discussion': 'agenda',
      'description': tableName === 'meetings' ? 'agenda' : 'description',
      'result': 'outcome',
      'conclusion': 'outcome',
      'follow_up': 'next_action',
      'action_items': 'next_action',
      'attendees': 'participants',
      'emails': 'participants',
      'meeting_link': 'teams_link',
      'video_link': 'teams_link',
      'join_link': 'teams_link',
    };
    
    return mappings[normalized] || null;
  };

  const validateAndConvertValue = (key: string, value: string) => {
    if (!value || value.trim() === '') return null;

    // Handle enum validations with simplified approach
    if (key in config.enums) {
      const enumValues = config.enums[key];
      if (enumValues && enumValues.includes(value)) {
        return value;
      } else if (enumValues && enumValues.length > 0) {
        return enumValues[0]; // Default to first value
      }
    }

    // Handle specific field types
    switch (key) {
      case 'no_of_employees':
        const employees = parseInt(value);
        return isNaN(employees) ? null : employees;
      
      case 'annual_revenue':
      case 'amount':
        const revenue = parseFloat(value.replace(/[$,]/g, ''));
        return isNaN(revenue) ? null : revenue;
      
      case 'email':
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(value) ? value : null;
      
      case 'start_time':
      case 'end_time':
      case 'closing_date':
        const date = new Date(value);
        return isNaN(date.getTime()) ? null : date.toISOString();
      
      case 'probability':
        const prob = parseInt(value);
        return isNaN(prob) ? null : Math.max(0, Math.min(100, prob));
      
      case 'participants':
        // Handle comma-separated email list
        if (tableName === 'meetings') {
          return value.split(',').map(email => email.trim()).filter(email => email);
        }
        return value.trim();
        
      case 'tags':
        // Handle comma-separated tags list
        if (tableName === 'meetings') {
          return value.split(',').map(tag => tag.trim()).filter(tag => tag);
        }
        return value.trim();
        
      case 'follow_up_required':
        if (tableName === 'meetings') {
          return ['yes', 'true', '1', 'on'].includes(value.toLowerCase());
        }
        return value.trim();
      
      default:
        return value.trim();
    }
  };

  // Check for duplicates based on key fields
  const checkDuplicate = async (record: any): Promise<boolean> => {
    try {
      const keyFields = tableName === 'contacts_module' || tableName === 'leads' 
        ? ['email', 'contact_name'] 
        : tableName === 'meetings'
        ? ['title', 'start_time']
        : ['deal_name'];

      // Use any type to avoid complex Supabase type inference
      let query = supabase.from(tableName as any).select('id');
      
      keyFields.forEach(field => {
        if (record[field]) {
          query = query.eq(field, record[field]);
        }
      });

      const { data, error } = await query;
      return !error && data && data.length > 0;
    } catch {
      return false;
    }
  };

  const handleImport = async (file: File) => {
    try {
      console.log(`Starting import of ${file.name} (${file.size} bytes) into ${tableName}`);
      
      const text = await file.text();
      const lines = text.split('\n').filter(line => line.trim());
      
      if (lines.length < 2) {
        throw new Error('CSV file must have at least a header row and one data row');
      }

      // Parse CSV with proper quote handling
      const parseCSVLine = (line: string): string[] => {
        const result: string[] = [];
        let current = '';
        let inQuotes = false;
        
        for (let i = 0; i < line.length; i++) {
          const char = line[i];
          if (char === '"') {
            if (inQuotes && line[i + 1] === '"') {
              current += '"';
              i++;
            } else {
              inQuotes = !inQuotes;
            }
          } else if (char === ',' && !inQuotes) {
            result.push(current.trim());
            current = '';
          } else {
            current += char;
          }
        }
        result.push(current.trim());
        return result;
      };

      const headers = parseCSVLine(lines[0]).map(h => h.replace(/"/g, ''));
      const dataRows = lines.slice(1).map(line => parseCSVLine(line).map(cell => cell.replace(/"/g, '')));

      // Map headers to database columns
      const mappedHeaders = headers.map(header => ({
        original: header,
        mapped: mapHeader(header)
      }));

      // Validate headers
      const validHeaders = mappedHeaders.filter(h => h.mapped !== null);
      const invalidHeaders = mappedHeaders.filter(h => h.mapped === null);
      
      if (validHeaders.length === 0) {
        throw new Error('No valid headers found. Please check your CSV column names.');
      }
      
      if (invalidHeaders.length > 0) {
        console.warn('Ignored columns:', invalidHeaders.map(h => h.original));
        toast({
          title: "Column Warning",
          description: `Ignoring ${invalidHeaders.length} unrecognized column(s): ${invalidHeaders.map(h => h.original).join(', ')}`,
        });
      }

      console.log('Header mappings:', mappedHeaders);
      console.log(`Processing ${dataRows.length} rows for ${tableName}`);

      let successCount = 0;
      let errorCount = 0;
      let duplicateCount = 0;
      const errors: string[] = [];

      // Reduce batch size for better reliability
      const BATCH_SIZE = 50;
      for (let batchStart = 0; batchStart < dataRows.length; batchStart += BATCH_SIZE) {
        const batch = dataRows.slice(batchStart, Math.min(batchStart + BATCH_SIZE, dataRows.length));
        const batchRecords: any[] = [];

        console.log(`Processing batch ${Math.floor(batchStart / BATCH_SIZE) + 1}/${Math.ceil(dataRows.length / BATCH_SIZE)}`);

        for (let i = 0; i < batch.length; i++) {
          try {
            const row = batch[i];
            const record: any = {};
            
            // Map data using header mappings
            mappedHeaders.forEach((headerMap, index) => {
              if (headerMap.mapped && row[index]) {
                const validatedValue = validateAndConvertValue(headerMap.mapped, row[index]);
                if (validatedValue !== null) {
                  record[headerMap.mapped] = validatedValue;
                }
              }
            });
            
            // Ensure required fields
            config.required.forEach(field => {
              if (!record[field]) {
                if (field === 'contact_name') {
                  record[field] = `Contact ${batchStart + i + 1}`;
                } else if (field === 'title') {
                  record[field] = `Meeting ${batchStart + i + 1}`;
                } else if (field === 'deal_name') {
                  record[field] = `Deal ${batchStart + i + 1}`;
                } else if (field === 'start_time' || field === 'end_time') {
                  // For meetings, if time is missing, skip this record
                  throw new Error(`Missing required field: ${field}`);
                }
              }
            });

            // Set default enum values with simplified approach
            Object.keys(config.enums).forEach(enumField => {
              if (!record[enumField]) {
                const enumValues = config.enums[enumField];
                if (enumValues && enumValues.length > 0) {
                  record[enumField] = enumValues[0];
                }
              }
            });
            
            // Add system fields
            record.created_by = user?.id || '00000000-0000-0000-0000-000000000000';
            if (tableName !== 'meetings') {
              record.modified_by = user?.id || null;
            }

            // Check for duplicates (skip for large imports to improve performance)
            if (dataRows.length < 1000) {
              const isDuplicate = await checkDuplicate(record);
              if (isDuplicate) {
                duplicateCount++;
                continue;
              }
            }

            batchRecords.push(record);

          } catch (rowError: any) {
            console.error(`Error processing row ${batchStart + i + 1}:`, rowError);
            errors.push(`Row ${batchStart + i + 1}: ${rowError.message}`);
            errorCount++;
          }
        }

        // Insert batch using any type to avoid type issues
        if (batchRecords.length > 0) {
          console.log(`Inserting batch of ${batchRecords.length} records...`);
          
          const { data, error } = await supabase
            .from(tableName as any)
            .insert(batchRecords)
            .select('id');

          if (error) {
            console.error(`Error inserting batch starting at row ${batchStart + 1}:`, error);
            errors.push(`Batch ${Math.floor(batchStart / BATCH_SIZE) + 1}: ${error.message}`);
            errorCount += batchRecords.length;
          } else {
            const insertedCount = data?.length || batchRecords.length;
            successCount += insertedCount;
            console.log(`Successfully inserted ${insertedCount} records in batch ${Math.floor(batchStart / BATCH_SIZE) + 1}`);
          }
        }

        // Small delay between batches to prevent overwhelming the database
        if (batchStart + BATCH_SIZE < dataRows.length) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }

      console.log(`Import completed - Success: ${successCount}, Errors: ${errorCount}, Duplicates: ${duplicateCount}`);

      // Show comprehensive import summary
      let message = `Import completed: ${successCount} records imported`;
      if (duplicateCount > 0) message += `, ${duplicateCount} duplicates skipped`;
      if (errorCount > 0) message += `, ${errorCount} errors`;

      if (successCount > 0) {
        toast({
          title: "Import successful",
          description: message,
        });
      }

      if (errorCount > 0 || duplicateCount > 0) {
        console.log('Import summary:', { successCount, duplicateCount, errorCount, errors: errors.slice(0, 10) });
        toast({
          variant: duplicateCount > 0 && errorCount === 0 ? "default" : "destructive",
          title: "Import completed with warnings",
          description: message,
        });
      }
      
      // Refresh data to ensure UI is updated
      console.log('Refreshing data after import...');
      onRefresh();

      // Verify final count
      setTimeout(async () => {
        try {
          const { count } = await supabase
            .from(tableName as any)
            .select('*', { count: 'exact', head: true });
          
          console.log(`Final count in ${tableName}: ${count} records`);
          if (count !== undefined && count < successCount) {
            console.warn(`Warning: Expected ${successCount} records but found ${count} in database`);
          }
        } catch (error) {
          console.error('Error verifying final count:', error);
        }
      }, 2000);

    } catch (error: any) {
      console.error('Import failed:', error);
      toast({
        variant: "destructive",
        title: "Import failed",
        description: error.message,
      });
    }
  };

  const handleExportAll = async (data: any[], filename: string) => {
    console.log(`Exporting all data for ${tableName}:`, data?.length || 0, 'records');
    
    // For meetings, fetch fresh data to ensure we have all fields
    if (tableName === 'meetings') {
      try {
        const { data: freshData, error } = await supabase
          .from('meetings')
          .select('*')
          .order('created_at', { ascending: false });
        
        if (error) {
          console.error('Error fetching fresh data for export:', error);
          toast({
            variant: "destructive",
            title: "Export Error",
            description: "Failed to fetch latest data for export",
          });
          return;
        }
        
        console.log('Fresh data fetched for export:', freshData?.length || 0, 'records');
        exportToCSV(freshData || [], `${filename}_all.csv`);
      } catch (error: any) {
        console.error('Error in handleExportAll:', error);
        toast({
          variant: "destructive",
          title: "Export Error",
          description: error.message,
        });
      }
    } else {
      exportToCSV(data, `${filename}_all.csv`);
    }
  };

  const handleExportSelected = (data: any[], selectedIds: string[], filename: string) => {
    const selectedData = data.filter(item => selectedIds.includes(item.id));
    console.log(`Exporting selected data:`, selectedData.length, 'records');
    exportToCSV(selectedData, `${filename}_selected.csv`);
  };

  const handleExportFiltered = (filteredData: any[], filename: string) => {
    console.log(`Exporting filtered data:`, filteredData.length, 'records');
    exportToCSV(filteredData, `${filename}_filtered.csv`);
  };

  const exportToCSV = (data: any[], filename: string) => {
    if (data.length === 0) {
      toast({
        variant: "destructive",
        title: "Export failed",
        description: "No data to export",
      });
      return;
    }

    // Use exact column names for perfect roundtrip compatibility
    const headers = config.allowedColumns;

    console.log('Exporting with headers:', headers);
    console.log('Sample data:', data[0]);

    // Generate CSV with proper escaping
    const csvContent = [
      headers.join(','),
      ...data.map(row => 
        headers.map(header => {
          let value = row[header] || '';
          
          // Format dates properly
          if (header.includes('time') || header.includes('date')) {
            if (value) {
              const date = new Date(value);
              value = date.toISOString();
            }
          }
          
          // Handle arrays (participants, tags)
          if (Array.isArray(value)) {
            value = value.join(', ');
          }
          
          // Handle boolean values
          if (typeof value === 'boolean') {
            value = value ? 'true' : 'false';
          }
          
          // Escape values containing commas, quotes, or newlines
          if (typeof value === 'string' && (value.includes(',') || value.includes('"') || value.includes('\n'))) {
            value = `"${value.replace(/"/g, '""')}"`;
          }
          
          return value;
        }).join(',')
      )
    ].join('\n');

    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);

    console.log(`Export completed: ${data.length} records exported to ${filename}`);
    toast({
      title: "Export completed",
      description: `Successfully exported ${data.length} records to ${filename}`,
    });
  };

  return {
    handleImport,
    handleExportAll,
    handleExportSelected,
    handleExportFiltered
  };
};
