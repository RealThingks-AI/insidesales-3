
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Eye, Edit, Plus, TrendingUp, Trash2 } from 'lucide-react';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { LeadColumn } from './LeadColumnCustomizer';
import { useState } from 'react';

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
  no_of_employees: number;
  annual_revenue: number;
  city: string;
  state: string;
  country: string;
  description: string;
  created_time: string;
}

interface LeadsTableProps {
  leads: Lead[];
  visibleColumns: LeadColumn[];
  onEditLead: (lead: Lead) => void;
  onDeleteLead?: (leadId: string) => void;
  onAddLead: () => void;
  selectedItems?: string[];
  onToggleSelect?: (leadId: string) => void;
  isDeleting?: boolean;
}

const LeadsTable = ({ 
  leads, 
  visibleColumns, 
  onEditLead, 
  onDeleteLead,
  onAddLead,
  selectedItems = [],
  onToggleSelect,
  isDeleting = false
}: LeadsTableProps) => {
  const [deleteLeadId, setDeleteLeadId] = useState<string | null>(null);

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
    
    if (columnKey === 'annual_revenue' && value) {
      return `$${(value as number).toLocaleString()}`;
    }
    
    return value || '-';
  };

  const handleDeleteConfirm = () => {
    if (deleteLeadId && onDeleteLead) {
      onDeleteLead(deleteLeadId);
      setDeleteLeadId(null);
    }
  };

  if (leads.length === 0) {
    return (
      <div className="p-12 text-center">
        <TrendingUp className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No leads found</h3>
        <p className="text-gray-600 mb-4">Get started by adding your first lead.</p>
        <Button onClick={onAddLead}>
          <Plus className="h-4 w-4 mr-2" />
          Add Lead
        </Button>
      </div>
    );
  }

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            {onToggleSelect && (
              <TableHead className="w-12">
                <span className="sr-only">Select</span>
              </TableHead>
            )}
            {visibleColumns.map((column) => (
              <TableHead key={column.key}>{column.label}</TableHead>
            ))}
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {leads.map((lead) => (
            <TableRow key={lead.id}>
              {onToggleSelect && (
                <TableCell>
                  <Checkbox
                    checked={selectedItems.includes(lead.id)}
                    onCheckedChange={() => onToggleSelect(lead.id)}
                  />
                </TableCell>
              )}
              {visibleColumns.map((column) => (
                <TableCell key={column.key}>
                  {renderCellValue(lead, column.key)}
                </TableCell>
              ))}
              <TableCell>
                <div className="flex space-x-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => onEditLead(lead)}
                    disabled={isDeleting}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  {onDeleteLead && (
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setDeleteLeadId(lead.id)}
                      disabled={isDeleting}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {onDeleteLead && (
        <AlertDialog open={!!deleteLeadId} onOpenChange={() => setDeleteLeadId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Lead</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this lead? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteConfirm}>
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </>
  );
};

export default LeadsTable;
