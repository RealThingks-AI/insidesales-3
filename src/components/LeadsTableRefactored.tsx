
import { TrendingUp, Calendar } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import GenericTable from '@/components/GenericTable';
import { LeadColumn } from '@/components/LeadColumnCustomizer';

interface Lead {
  id: string;
  lead_name: string;
  company_name: string;
  position: string;
  email: string;
  phone_no: string;
  mobile_no: string;
  linkedin: string;
  website: string;
  contact_source: string;
  lead_status: string;
  industry: string;
  city: string;
  country: string;
  description: string;
  created_time: string;
  contact_owner: string;
  lead_owner_name?: string;
}

interface LeadsTableRefactoredProps {
  leads: Lead[];
  visibleColumns: LeadColumn[];
  onEditLead: (lead: Lead) => void;
  onDeleteLead: (leadId: string) => void;
  onAddLead: () => void;
  selectedItems: string[];
  onToggleSelect: (leadId: string) => void;
  isDeleting?: boolean;
  onSort?: (columnKey: string) => void;
  sortConfig?: { key: string; direction: 'asc' | 'desc' | null };
  columnsCustomizer?: React.ReactNode;
  onCreateMeeting?: (lead: Lead) => void;
}

const LeadsTableRefactored = ({
  leads,
  visibleColumns,
  onEditLead,
  onDeleteLead,
  onAddLead,
  selectedItems,
  onToggleSelect,
  isDeleting = false,
  onSort,
  sortConfig,
  columnsCustomizer,
  onCreateMeeting
}: LeadsTableRefactoredProps) => {
  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'new':
        return 'bg-blue-100 text-blue-800';
      case 'qualified':
        return 'bg-green-100 text-green-800';
      case 'contacted':
        return 'bg-yellow-100 text-yellow-800';
      case 'lost':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const renderCellValue = (lead: Lead, columnKey: string) => {
    const value = lead[columnKey as keyof Lead];
    
    if (columnKey === 'lead_name') {
      return (
        <button
          onClick={() => onEditLead(lead)}
          className="text-blue-600 hover:text-blue-800 hover:underline font-medium text-left"
        >
          {value || '-'}
        </button>
      );
    }
    
    if (columnKey === 'lead_status') {
      return (
        <Badge className={getStatusColor(value as string)}>
          {value || 'New'}
        </Badge>
      );
    }
    
    if (columnKey === 'lead_owner_name') {
      return value || 'Unknown User';
    }
    
    return value || '-';
  };

  const renderRowActions = (lead: Lead) => {
    return (
      <div className="flex space-x-2">
        {onCreateMeeting && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => onCreateMeeting(lead)}
            className="text-green-600 hover:text-green-800"
            disabled={isDeleting}
          >
            <Calendar className="h-4 w-4" />
            Meeting
          </Button>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {columnsCustomizer && (
        <div className="flex justify-end p-4 border-b">
          {columnsCustomizer}
        </div>
      )}
      <div className="overflow-auto">
        <GenericTable
          data={leads}
          columns={visibleColumns}
          onEdit={onEditLead}
          onDelete={onDeleteLead}
          onAdd={onAddLead}
          selectedItems={selectedItems}
          onToggleSelect={onToggleSelect}
          emptyIcon={<TrendingUp className="h-12 w-12 text-gray-400 mx-auto mb-4" />}
          emptyTitle="No leads found"
          emptyDescription="Get started by adding your first lead."
          renderCellValue={renderCellValue}
          renderRowActions={renderRowActions}
          isDeleting={isDeleting}
          onSort={onSort}
          sortConfig={sortConfig}
        />
      </div>
    </div>
  );
};

export default LeadsTableRefactored;
