import { useState, useMemo } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Edit, Trash2, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { format } from 'date-fns';
import DealsColumnCustomizer, { type DealColumn } from './DealsColumnCustomizer';
import type { Deal } from '@/hooks/useDeals';
import { isFieldVisibleForDeal } from '@/hooks/useDeals';
import { useStageBasedVisibility } from '@/hooks/useStageBasedVisibility';

interface DealsListViewProps {
  deals: Deal[];
  onEdit: (deal: Deal) => void;
  onDelete: (dealId: string) => void;
}

const DEFAULT_COLUMNS: DealColumn[] = [
  // Basic fields
  { key: 'deal_name', label: 'Deal Title', required: true, visible: true },
  { key: 'stage', label: 'Stage', required: false, visible: true },
  { key: 'amount', label: 'Value', required: false, visible: true },
  { key: 'probability', label: 'Probability', required: false, visible: true },
  { key: 'closing_date', label: 'Close Date', required: false, visible: true },
  { key: 'currency', label: 'Currency', required: false, visible: false },
  { key: 'description', label: 'Description', required: false, visible: false },
  { key: 'modified_at', label: 'Last Updated', required: false, visible: true },
  
  // Discussions stage fields
  { key: 'customer_need_identified', label: 'Customer Need Identified', required: false, visible: false },
  { key: 'need_summary', label: 'Need Summary', required: false, visible: false },
  { key: 'decision_maker_present', label: 'Decision Maker Present', required: false, visible: false },
  { key: 'customer_agreed_on_need', label: 'Customer Agreed on Need', required: false, visible: false },
  { key: 'discussion_notes', label: 'Discussion Notes', required: false, visible: false },
  
  // Qualified stage fields
  { key: 'nda_signed', label: 'NDA Signed', required: false, visible: false },
  { key: 'budget_confirmed', label: 'Budget Confirmed', required: false, visible: false },
  { key: 'supplier_portal_access', label: 'Supplier Portal Access', required: false, visible: false },
  { key: 'expected_deal_timeline_start', label: 'Timeline Start', required: false, visible: false },
  { key: 'expected_deal_timeline_end', label: 'Timeline End', required: false, visible: false },
  { key: 'budget_holder', label: 'Budget Holder', required: false, visible: false },
  { key: 'decision_makers', label: 'Decision Makers', required: false, visible: false },
  { key: 'timeline', label: 'Timeline Notes', required: false, visible: false },
  { key: 'supplier_portal_required', label: 'Supplier Portal Required', required: false, visible: false },
  
  // RFQ stage fields
  { key: 'rfq_value', label: 'RFQ Value', required: false, visible: false },
  { key: 'rfq_document_url', label: 'RFQ Document URL', required: false, visible: false },
  { key: 'rfq_document_link', label: 'RFQ Document Link', required: false, visible: false },
  { key: 'product_service_scope', label: 'Product/Service Scope', required: false, visible: false },
  { key: 'rfq_confirmation_note', label: 'RFQ Confirmation Note', required: false, visible: false },
  
  // Offered stage fields
  { key: 'proposal_sent_date', label: 'Proposal Sent Date', required: false, visible: false },
  { key: 'negotiation_status', label: 'Negotiation Status', required: false, visible: false },
  { key: 'decision_expected_date', label: 'Decision Expected Date', required: false, visible: false },
  { key: 'offer_sent_date', label: 'Offer Sent Date', required: false, visible: false },
  { key: 'revised_offer_notes', label: 'Revised Offer Notes', required: false, visible: false },
  { key: 'negotiation_notes', label: 'Negotiation Notes', required: false, visible: false },
  
  // Final stage fields
  { key: 'win_reason', label: 'Win Reason', required: false, visible: false },
  { key: 'loss_reason', label: 'Loss Reason', required: false, visible: false },
  { key: 'lost_to', label: 'Lost To', required: false, visible: false },
  { key: 'drop_reason', label: 'Drop Reason', required: false, visible: false },
  { key: 'drop_summary', label: 'Drop Summary', required: false, visible: false },
  { key: 'learning_summary', label: 'Learning Summary', required: false, visible: false },
  
  // Execution fields
  { key: 'execution_started', label: 'Execution Started', required: false, visible: false },
  { key: 'begin_execution_date', label: 'Begin Execution Date', required: false, visible: false },
  { key: 'confirmation_note', label: 'Confirmation Note', required: false, visible: false },
  
  // General fields
  { key: 'internal_notes', label: 'Internal Notes', required: false, visible: false },
  { key: 'related_lead_id', label: 'Related Lead ID', required: false, visible: false },
  { key: 'related_meeting_id', label: 'Related Meeting ID', required: false, visible: false },
  { key: 'created_at', label: 'Created At', required: false, visible: false },
];

const DealsListView = ({ deals, onEdit, onDelete }: DealsListViewProps) => {
  const [columns, setColumns] = useState<DealColumn[]>(DEFAULT_COLUMNS);
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' | null }>({
    key: '',
    direction: null
  });

  const visibleColumns = useMemo(() => {
    const baseVisibleColumns = columns.filter(col => col.visible);
    
    // For each deal, check if at least one deal can show each column based on stage visibility
    const filteredColumns = baseVisibleColumns.filter(col => 
      deals.some(deal => {
        // Use stage-based visibility logic for each deal
        const isBasicField = ['deal_name', 'stage', 'amount', 'probability', 'closing_date', 'currency', 'description', 'modified_at', 'created_at', 'internal_notes'].includes(col.key);
        
        if (isBasicField) return true;
        
        // Check if field is visible based on deal's current stage and progression
        return isFieldVisibleForDeal(deal, col.key);
      })
    );
    
    return filteredColumns;
  }, [columns, deals]);

  const sortedDeals = useMemo(() => {
    if (!sortConfig.key || !sortConfig.direction) return deals;

    return [...deals].sort((a, b) => {
      const aValue = a[sortConfig.key as keyof Deal];
      const bValue = b[sortConfig.key as keyof Deal];

      if (aValue === null && bValue === null) return 0;
      if (aValue === null) return sortConfig.direction === 'asc' ? 1 : -1;
      if (bValue === null) return sortConfig.direction === 'asc' ? -1 : 1;

      if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [deals, sortConfig]);

  const handleSort = (columnKey: string) => {
    setSortConfig(prev => ({
      key: columnKey,
      direction: prev.key === columnKey && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const getSortIcon = (columnKey: string) => {
    if (sortConfig.key !== columnKey) {
      return <ArrowUpDown className="h-4 w-4 text-gray-400" />;
    }
    return sortConfig.direction === 'asc' ? 
      <ArrowUp className="h-4 w-4 text-blue-600" /> : 
      <ArrowDown className="h-4 w-4 text-blue-600" />;
  };

  const formatCellValue = (deal: Deal, columnKey: string) => {
    const value = deal[columnKey as keyof Deal];

    switch (columnKey) {
      case 'stage':
        return (
          <Badge variant="outline" className="text-xs">
            {value as string}
          </Badge>
        );
      case 'probability':
        return value ? `${value}%` : '0%';
      case 'amount':
      case 'rfq_value':
        return value ? `$${Number(value).toLocaleString()}` : '-';
      case 'closing_date':
      case 'expected_deal_timeline_start':
      case 'expected_deal_timeline_end':
      case 'proposal_sent_date':
      case 'decision_expected_date':
      case 'offer_sent_date':
      case 'begin_execution_date':
        return value ? format(new Date(value as string), 'MMM d, yyyy') : '-';
      case 'modified_at':
      case 'created_at':
        return value ? format(new Date(value as string), 'MMM d, yyyy HH:mm') : '-';
      case 'customer_need_identified':
      case 'decision_maker_present':
      case 'nda_signed':
      case 'supplier_portal_required':
      case 'execution_started':
        return value === true ? 'Yes' : value === false ? 'No' : '-';
      case 'customer_agreed_on_need':
      case 'budget_confirmed':
      case 'supplier_portal_access':
      case 'negotiation_status':
      case 'loss_reason':
        return value || '-';
      case 'rfq_document_url':
      case 'rfq_document_link':
        return value ? (
          <a 
            href={value as string} 
            target="_blank" 
            rel="noopener noreferrer" 
            className="text-blue-600 hover:underline text-xs"
            onClick={(e) => e.stopPropagation()}
          >
            View Document
          </a>
        ) : '-';
      case 'description':
      case 'need_summary':
      case 'discussion_notes':
      case 'rfq_confirmation_note':
      case 'revised_offer_notes':
      case 'negotiation_notes':
      case 'internal_notes':
      case 'drop_summary':
      case 'learning_summary':
      case 'confirmation_note':
      case 'product_service_scope':
        return value ? (
          <div className="max-w-xs truncate" title={value as string}>
            {value as string}
          </div>
        ) : '-';
      default:
        return value as string || '-';
    }
  };

  if (deals.length === 0) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium text-gray-900 mb-2">No deals found</h3>
        <p className="text-gray-600">Create your first deal to get started.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Column Customizer */}
      <div className="flex justify-end">
        <DealsColumnCustomizer 
          columns={columns}
          onColumnsChange={setColumns}
        />
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              {visibleColumns.map((column) => (
                <TableHead 
                  key={column.key}
                  className="cursor-pointer hover:bg-gray-50 select-none"
                  onClick={() => handleSort(column.key)}
                >
                  <div className="flex items-center space-x-1">
                    <span>{column.label}</span>
                    {getSortIcon(column.key)}
                  </div>
                </TableHead>
              ))}
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedDeals.map((deal) => (
              <TableRow key={deal.id}>
                 {visibleColumns.map((column) => {
                   // Check if this specific field should be visible for this specific deal
                   const isBasicField = ['deal_name', 'stage', 'amount', 'probability', 'closing_date', 'currency', 'description', 'modified_at', 'created_at', 'internal_notes'].includes(column.key);
                   const shouldShowField = isBasicField || isFieldVisibleForDeal(deal, column.key);
                   
                   return (
                     <TableCell key={column.key}>
                       {shouldShowField 
                         ? formatCellValue(deal, column.key) 
                         : '-'
                       }
                     </TableCell>
                   );
                 })}
                <TableCell className="text-right">
                  <div className="flex items-center gap-2 justify-end">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        onEdit(deal);
                      }}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        onDelete(deal.id);
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default DealsListView;