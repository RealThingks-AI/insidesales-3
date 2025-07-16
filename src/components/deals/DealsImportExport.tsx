
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { Upload, Download, ChevronDown } from 'lucide-react';
import { Deal } from '@/hooks/useDeals';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import ImportDialog from '@/components/ImportDialog';

interface DealsImportExportProps {
  deals: Deal[];
  onImportSuccess: () => void;
}

const DealsImportExport = ({ deals, onImportSuccess }: DealsImportExportProps) => {
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  const handleExportAll = () => {
    exportDealsToCSV(deals, 'all_deals.csv');
  };

  const exportDealsToCSV = (dealsToExport: Deal[], filename: string) => {
    if (dealsToExport.length === 0) {
      toast({
        variant: "destructive",
        title: "No data to export",
        description: "There are no deals to export.",
      });
      return;
    }

    // Define all available columns from the list view for export (based on actual DB schema)
    const headers = [
      'Deal Name',
      'Stage',
      'Amount',
      'Currency',
      'Probability',
      'Closing Date',
      'Description',
      'Modified At',
      
      // Lead information
      'Lead Name',
      'Lead Owner',
      'Company Name',
      
      // Discussions stage fields
      'Customer Need Identified',
      'Need Summary',
      'Decision Maker Present',
      'Customer Agreed on Need',
      
      // Qualified stage fields
      'NDA Signed',
      'Budget Confirmed',
      'Supplier Portal Access',
      'Timeline Start',
      'Timeline End',
      'Budget Holder',
      'Decision Makers',
      'Timeline Notes',
      
      // RFQ stage fields
      'RFQ Value',
      'RFQ Document URL',
      'Product Service Scope',
      'RFQ Confirmation Note',
      
      // Offered stage fields
      'Proposal Sent Date',
      'Negotiation Status',
      'Decision Expected Date',
      'Negotiation Notes',
      
      // Final stage fields
      'Win Reason',
      'Loss Reason',
      'Drop Reason',
      
      // Execution fields
      'Execution Started',
      'Begin Execution Date',
      
      // General fields
      'Internal Notes',
      'Related Lead ID',
      'Related Meeting ID',
      'Created At'
    ];

    // Convert deals to CSV rows with all available fields (matching actual DB schema)
    const csvRows = dealsToExport.map(deal => [
      deal.deal_name || '',
      deal.stage || '',
      deal.amount?.toString() || '',
      deal.currency || '',
      deal.probability?.toString() || '',
      deal.closing_date || '',
      deal.description || '',
      deal.modified_at || '',
      
      // Lead information (placeholder - will be populated from lead lookup)
      '', // Lead Name
      '', // Lead Owner 
      '', // Company Name
      
      // Discussions stage fields
      deal.customer_need_identified ? 'Yes' : 'No',
      deal.need_summary || '',
      deal.decision_maker_present ? 'Yes' : 'No',
      deal.customer_agreed_on_need || '',
      
      // Qualified stage fields
      deal.nda_signed ? 'Yes' : 'No',
      deal.budget_confirmed || '',
      deal.supplier_portal_access || '',
      deal.expected_deal_timeline_start || '',
      deal.expected_deal_timeline_end || '',
      deal.budget_holder || '',
      deal.decision_makers || '',
      deal.timeline || '',
      
      // RFQ stage fields
      deal.rfq_value?.toString() || '',
      deal.rfq_document_url || '',
      deal.product_service_scope || '',
      deal.rfq_confirmation_note || '',
      
      // Offered stage fields
      deal.proposal_sent_date || '',
      deal.negotiation_status || '',
      deal.decision_expected_date || '',
      deal.negotiation_notes || '',
      
      // Final stage fields
      deal.win_reason || '',
      deal.loss_reason || '',
      deal.drop_reason || '',
      
      // Execution fields
      deal.execution_started ? 'Yes' : 'No',
      deal.begin_execution_date || '',
      
      // General fields
      deal.internal_notes || '',
      deal.related_lead_id || '',
      deal.related_meeting_id || '',
      deal.created_at || ''
    ]);

    // Create CSV content
    const csvContent = [headers, ...csvRows]
      .map(row => row.map(field => `"${field.replace(/"/g, '""')}"`).join(','))
      .join('\n');

    // Download the file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "Export successful",
      description: `${dealsToExport.length} deals exported to ${filename}`,
    });
  };

  const handleImport = async (file: File) => {
    setIsImporting(true);
    
    try {
      const text = await file.text();
      const lines = text.split('\n').filter(line => line.trim());
      
      if (lines.length < 2) {
        throw new Error('CSV file must have at least a header row and one data row');
      }

      // Parse CSV properly handling quoted fields
      const parseCSVLine = (line: string): string[] => {
        const result: string[] = [];
        let current = '';
        let inQuotes = false;
        
        for (let i = 0; i < line.length; i++) {
          const char = line[i];
          
          if (char === '"') {
            if (inQuotes && line[i + 1] === '"') {
              // Handle escaped quotes
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

      const headers = parseCSVLine(lines[0]);
      const rows = lines.slice(1);

      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('User not authenticated');
      }

      const dealsToImport = rows.map((row, index) => {
        try {
          const values = parseCSVLine(row);
          
          // Helper functions for data parsing
          const parseBoolean = (value: string) => {
            if (!value || value.toLowerCase() === 'no' || value === '0' || value === 'false') return false;
            if (value.toLowerCase() === 'yes' || value === '1' || value === 'true') return true;
            return false;
          };
          
          const parseNumber = (value: string) => {
            if (!value || value.trim() === '') return null;
            const num = parseFloat(value);
            return isNaN(num) ? null : num;
          };
          
          const parseInt = (value: string) => {
            if (!value || value.trim() === '') return null;
            const num = Number.parseInt(value);
            return isNaN(num) ? null : num;
          };
          
          const parseDate = (value: string) => {
            if (!value || value.trim() === '') return null;
            // Check if it's a valid date format
            const date = new Date(value);
            return isNaN(date.getTime()) ? null : value;
          };

          const dealData: any = {
            deal_name: values[0] || 'Imported Deal',
            stage: values[1] || null, // Don't default to Discussions - let the validation handle it
            amount: parseNumber(values[2]),
            currency: values[3] || 'USD',
            probability: parseInt(values[4]),
            closing_date: parseDate(values[5]),
            description: values[6] || null,
            modified_at: parseDate(values[7]) || new Date().toISOString(),
            
            // Lead information
            lead_name: values[8] || null,
            lead_owner: values[9] || null,
            company_name: values[10] || null,
            
            // Discussions stage fields
            customer_need_identified: parseBoolean(values[11]),
            need_summary: values[12] || null,
            decision_maker_present: parseBoolean(values[13]),
            customer_agreed_on_need: values[14] || null,
            
            // Qualified stage fields
            nda_signed: parseBoolean(values[15]),
            budget_confirmed: values[16] || null,
            supplier_portal_access: values[17] || null,
            expected_deal_timeline_start: parseDate(values[18]),
            expected_deal_timeline_end: parseDate(values[19]),
            budget_holder: values[20] || null,
            decision_makers: values[21] || null,
            timeline: values[22] || null,
            
            // RFQ stage fields
            rfq_value: parseNumber(values[23]),
            rfq_document_url: values[24] || null,
            product_service_scope: values[25] || null,
            rfq_confirmation_note: values[26] || null,
            
            // Offered stage fields
            proposal_sent_date: parseDate(values[27]),
            negotiation_status: values[28] || null,
            decision_expected_date: parseDate(values[29]),
            negotiation_notes: values[30] || null,
            
            // Final stage fields
            win_reason: values[31] || null,
            loss_reason: values[32] || null,
            drop_reason: values[33] || null,
            
            // Execution fields
            execution_started: parseBoolean(values[34]),
            begin_execution_date: parseDate(values[35]),
            
            // General fields
            internal_notes: values[36] || null,
            related_lead_id: values[37] || null,
            related_meeting_id: values[38] || null,
            created_at: parseDate(values[39]) || new Date().toISOString(),
            
            created_by: user.id,
            modified_by: user.id
          };

          return dealData;
        } catch (rowError) {
          console.error(`Error parsing row ${index + 1}:`, rowError);
          throw new Error(`Error parsing row ${index + 1}: ${rowError.message}`);
        }
      });

      // Use the edge function for import with duplicate checking
      const { data, error } = await supabase.functions.invoke('deals-import-export', {
        body: {
          action: 'import',
          data: {
            deals: dealsToImport,
            userId: user.id
          }
        }
      });

      if (error) throw error;

      if (data?.success) {
        const { results } = data;
        toast({
          title: "Import completed",
          description: `Created: ${results.created}, Updated: ${results.updated}${results.errors.length > 0 ? `, Errors: ${results.errors.length}` : ''}`,
        });
        
        if (results.errors.length > 0) {
          console.error('Import errors:', results.errors);
        }
      } else {
        throw new Error('Import failed');
      }

      onImportSuccess();
      setShowImportDialog(false);
    } catch (error: any) {
      console.error('Import error:', error);
      toast({
        variant: "destructive",
        title: "Import failed",
        description: error.message,
      });
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <>
      <div className="flex space-x-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowImportDialog(true)}
          disabled={isImporting}
        >
          <Upload className="h-4 w-4 mr-2" />
          {isImporting ? 'Importing...' : 'Import'}
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export
              <ChevronDown className="h-4 w-4 ml-2" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={handleExportAll}>
              Export All Deals
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <ImportDialog
        open={showImportDialog}
        onOpenChange={setShowImportDialog}
        onFileSelect={handleImport}
        moduleName="Deals"
      />
    </>
  );
};

export default DealsImportExport;
