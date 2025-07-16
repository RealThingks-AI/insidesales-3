
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { CSVParser } from '@/utils/csvParser';

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
          // Basic fields
          'deal_name', 'amount', 'closing_date', 'stage', 'probability', 'description', 'currency',
          // Discussions stage
          'customer_need_identified', 'need_summary', 'decision_maker_present', 'customer_agreed_on_need',
          // Qualified stage
          'nda_signed', 'budget_confirmed', 'supplier_portal_access', 'expected_deal_timeline_start', 'expected_deal_timeline_end', 'budget_holder', 'decision_makers', 'timeline',
          // RFQ stage
          'rfq_value', 'rfq_document_url', 'product_service_scope', 'rfq_confirmation_note',
          // Offered stage
          'proposal_sent_date', 'negotiation_status', 'decision_expected_date', 'negotiation_notes',
          // Final stages
          'win_reason', 'loss_reason', 'drop_reason',
          // Execution
          'execution_started', 'begin_execution_date',
          // General
          'internal_notes', 'related_lead_id', 'related_meeting_id'
        ],
        required: ['deal_name'],
        enums: {
          stage: ['Discussions', 'Qualified', 'RFQ', 'Offered', 'Won', 'Lost', 'Dropped'],
          currency: ['USD', 'EUR', 'GBP', 'CAD', 'AUD'],
          budget_confirmed: ['Yes', 'No', 'Estimate Only'],
          customer_agreed_on_need: ['Yes', 'No', 'Partial'],
          supplier_portal_access: ['Invited', 'Approved', 'Not Invited'],
          negotiation_status: ['Ongoing', 'Finalized', 'Rejected', 'Accepted', 'Dropped', 'No Response'],
          loss_reason: ['Budget', 'Competitor', 'Timeline', 'Other']
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
      // Try exact match first
      if (enumValues && enumValues.includes(value)) {
        return value;
      }
      // Try case-insensitive match
      const normalizedValue = value.trim();
      const matchedValue = enumValues.find(enumVal => enumVal.toLowerCase() === normalizedValue.toLowerCase());
      if (matchedValue) {
        return matchedValue;
      }
      // For critical fields like stage, try to find a close match before failing
      if (key === 'stage') {
        console.warn(`Invalid stage value: ${value}, available values: ${enumValues.join(', ')}`);
        // Try to find a partial match for common variations
        const partialMatch = enumValues.find(enumVal => 
          enumVal.toLowerCase().includes(value.toLowerCase()) || 
          value.toLowerCase().includes(enumVal.toLowerCase())
        );
        if (partialMatch) {
          console.log(`Found partial match for stage: "${value}" -> "${partialMatch}"`);
          return partialMatch;
        }
        return null; // Don't default to first enum value for stage
      }
      // For other enums, still default to first value
      if (enumValues && enumValues.length > 0) {
        return enumValues[0];
      }
    }

    // Handle UUID fields - be more strict about what we consider UUID fields
    if ((key === 'related_lead_id' || key === 'related_meeting_id' || key === 'created_by' || key === 'modified_by') && tableName === 'deals') {
      // UUID validation - check if it's a valid UUID format
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      if (uuidRegex.test(value)) {
        return value;
      } else {
        return null; // Don't set invalid UUIDs
      }
    }

    // Handle specific field types
    switch (key) {
      case 'no_of_employees':
        const employees = parseInt(value);
        return isNaN(employees) ? null : employees;
      
      case 'annual_revenue':
      case 'amount':
      case 'rfq_value':
        const revenue = parseFloat(value.replace(/[$,]/g, ''));
        return isNaN(revenue) ? null : revenue;
      
      case 'email':
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(value) ? value : null;
      
      // Date fields for deals
      case 'closing_date':
      case 'expected_deal_timeline_start':
      case 'expected_deal_timeline_end':
      case 'proposal_sent_date':
      case 'decision_expected_date':
      case 'begin_execution_date':
        if (tableName === 'deals') {
          const date = new Date(value);
          return isNaN(date.getTime()) ? null : date.toISOString().split('T')[0]; // Return date only (YYYY-MM-DD)
        }
        return value.trim();
      
      // Time fields for meetings
      case 'start_time':
      case 'end_time':
        if (tableName === 'meetings') {
          const date = new Date(value);
          return isNaN(date.getTime()) ? null : date.toISOString();
        }
        return value.trim();
      
      case 'probability':
        const prob = parseInt(value);
        return isNaN(prob) ? null : Math.max(0, Math.min(100, prob));
      
      // Boolean fields for deals
      case 'customer_need_identified':
      case 'decision_maker_present':
      case 'nda_signed':
      case 'execution_started':
        if (tableName === 'deals') {
          return ['yes', 'true', '1', 'on'].includes(value.toLowerCase());
        }
        return value.trim();
      
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
      
      // Use the robust CSV parser
      const { headers, rows: dataRows } = CSVParser.parseCSV(text);
      
      console.log('Parsed CSV - Headers:', headers);
      console.log('Parsed CSV - Data rows:', dataRows.length);
      
      // For deals, use the enhanced import via edge function
      if (tableName === 'deals') {
        return handleDealsImport(headers, dataRows);
      }
      
      // Debug: Show first few rows
      if (dataRows.length > 0) {
        console.log('First data row:', dataRows[0]);
        console.log('First data row length:', dataRows[0].length);
        console.log('Headers length:', headers.length);
      }

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
              if (headerMap.mapped && index < row.length) {
                const rawValue = row[index];
                // Only process non-empty values
                if (rawValue && rawValue.trim() !== '') {
                  const validatedValue = validateAndConvertValue(headerMap.mapped, rawValue);
                  if (validatedValue !== null) {
                    record[headerMap.mapped] = validatedValue;
                    // Log stage values specifically for debugging
                    if (headerMap.mapped === 'stage') {
                      console.log(`Stage mapping: "${rawValue}" -> "${validatedValue}"`);
                    }
                  } else if (headerMap.mapped === 'stage') {
                    console.log(`Stage validation failed: "${rawValue}" returned null`);
                  }
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

            // Set default enum values with simplified approach (skip for critical fields like stage)
            Object.keys(config.enums).forEach(enumField => {
              if (!record[enumField] && enumField !== 'stage') {
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

            // Always check for duplicates in deals to prevent data corruption
            const isDuplicate = await checkDuplicate(record);
            if (isDuplicate) {
              console.log(`Skipping duplicate record: ${record.deal_name || record.contact_name || 'Unknown'}`);
              duplicateCount++;
              continue;
            }

            // Log the final record before insertion for debugging
            if (tableName === 'deals') {
              console.log(`Inserting deal: "${record.deal_name}" with stage: "${record.stage}"`);
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

  const exportToCSV = async (data: any[], filename: string) => {
    if (data.length === 0) {
      toast({
        variant: "destructive",
        title: "Export failed",
        description: "No data to export",
      });
      return;
    }

    // For deals, use the enhanced export via edge function to ensure all fields are included
    if (tableName === 'deals') {
      try {
        const { data: exportData, error } = await supabase.functions.invoke('deals-import-export', {
          body: { action: 'export' }
        });

        if (error) throw error;

        const allColumns = exportData.fields || Object.keys(exportData.data[0] || {});
        const csvContent = CSVParser.toCSV(exportData.data, allColumns);
        
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        
        toast({
          title: "Export completed",
          description: `Successfully exported ${exportData.data.length} deals with all pipeline data to ${filename}`,
        });
        return;
      } catch (error: any) {
        console.error('Deals export error:', error);
        toast({
          variant: "destructive",
          title: "Export Failed",
          description: error.message,
        });
        return;
      }
    }

    // Use exact column names for perfect roundtrip compatibility
    const headers = config.allowedColumns;

    console.log('Exporting with headers:', headers);
    console.log('Sample data:', data[0]);

    // Process data for export
    const processedData = data.map(row => {
      const processedRow: any = {};
      
      headers.forEach(header => {
        let value = row[header];
        
        // Handle null/undefined
        if (value === null || value === undefined) {
          processedRow[header] = '';
          return;
        }
        
        // Format dates properly with validation
        if ((header.includes('time') || header.includes('date')) && !header.includes('_id')) {
          if (value) {
            const date = new Date(value);
            // Check if the date is valid before converting to ISO string
            if (!isNaN(date.getTime())) {
              // For deals table, format dates as YYYY-MM-DD for date fields
              if (tableName === 'deals' && (header.includes('date') || header.includes('timeline'))) {
                processedRow[header] = date.toISOString().split('T')[0];
              } else {
                processedRow[header] = date.toISOString();
              }
            } else {
              processedRow[header] = '';
            }
          } else {
            processedRow[header] = '';
          }
        } else if (Array.isArray(value)) {
          // Handle arrays (participants, tags)
          processedRow[header] = value.join(', ');
        } else if (typeof value === 'boolean') {
          // Handle boolean values
          processedRow[header] = value ? 'true' : 'false';
        } else {
          // Convert to string
          processedRow[header] = String(value);
        }
      });
      
      return processedRow;
    });

    // Use the CSVParser to generate proper CSV
    const csvContent = CSVParser.toCSV(processedData, headers);

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

  // Enhanced deals import using edge function
  const handleDealsImport = async (headers: string[], dataRows: string[][]) => {
    try {
      // Map headers to database columns
      const mappedHeaders = headers.map(header => ({
        original: header,
        mapped: mapHeader(header)
      }));

      // Build deals array from CSV data
      const deals = dataRows.map((row, index) => {
        const deal: any = {};
        
        mappedHeaders.forEach((headerMap, headerIndex) => {
          if (headerMap.mapped && headerIndex < row.length) {
            const rawValue = row[headerIndex];
            if (rawValue && rawValue.trim() !== '') {
              deal[headerMap.mapped] = rawValue.trim();
            }
          }
        });

        // Ensure deal_name is present
        if (!deal.deal_name) {
          deal.deal_name = `Deal ${index + 1}`;
        }

        return deal;
      });

      // Call edge function for import
      const { data: result, error } = await supabase.functions.invoke('deals-import-export', {
        body: { 
          action: 'import', 
          data: { 
            deals,
            userId: user?.id
          }
        }
      });

      if (error) throw error;

      const { results } = result;
      
      toast({
        title: "Import Completed",
        description: `Created: ${results.created}, Updated: ${results.updated}, Errors: ${results.errors.length}`,
      });

      if (results.errors.length > 0) {
        console.error('Import errors:', results.errors);
      }

      onRefresh();
    } catch (error: any) {
      console.error('Deals import error:', error);
      toast({
        variant: "destructive",
        title: "Import Failed",
        description: error.message,
      });
    }
  };

  return {
    handleImport,
    handleExportAll,
    handleExportSelected,
    handleExportFiltered
  };
};
