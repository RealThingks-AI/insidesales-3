
import { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Deal } from '@/types/deal';
import { STAGE_COLORS } from '@/types/deal';
import { Search, Edit2, Trash2, Users, Settings, Filter, FileDown, FileUp, ChevronDown, ChevronUp, Calendar } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { DealActionItemsModal } from '@/components/DealActionItemsModal';

interface ListViewProps {
  deals: Deal[];
  onDealClick: (deal: Deal) => void;
  onUpdateDeal: (dealId: string, updates: Partial<Deal>) => Promise<void>;
  onDeleteDeals: (dealIds: string[]) => Promise<void>;
  onImportDeals: (deals: (Partial<Deal> & { shouldUpdate?: boolean })[]) => Promise<void>;
}

interface Column {
  key: string;
  label: string;
  visible: boolean;
  width: number;
}

const defaultColumns = [
  { key: 'select', label: 'Select', visible: true, width: 50 },
  { key: 'deal_name', label: 'Deal Name', visible: true, width: 200 },
  { key: 'stage', label: 'Stage', visible: true, width: 120 },
  { key: 'customer_name', label: 'Customer', visible: true, width: 150 },
  { key: 'total_contract_value', label: 'Value', visible: true, width: 120 },
  { key: 'probability', label: 'Probability', visible: true, width: 100 },
  { key: 'expected_closing_date', label: 'Expected Close', visible: true, width: 140 },
  { key: 'priority', label: 'Priority', visible: true, width: 80 },
  { key: 'created_at', label: 'Created', visible: true, width: 120 },
  { key: 'actions', label: 'Actions', visible: true, width: 180 }
];

export const ListView = ({ deals, onDealClick, onUpdateDeal, onDeleteDeals, onImportDeals }: ListViewProps) => {
  const [selectedDeals, setSelectedDeals] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [columns, setColumns] = useState(defaultColumns);
  const [filters, setFilters] = useState<Record<string, any>>({});
  const [editingCell, setEditingCell] = useState<{ dealId: string; field: string } | null>(null);
  const [editValue, setEditValue] = useState<string>('');
  const [actionModalDeal, setActionModalDeal] = useState<Deal | null>(null);
  
  const { toast } = useToast();

  const filteredAndSortedDeals = useMemo(() => {
    let filtered = deals.filter(deal => {
      const searchMatch = deal.deal_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         deal.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         deal.project_name?.toLowerCase().includes(searchTerm.toLowerCase());
      
      if (!searchMatch) return false;
      
      return Object.entries(filters).every(([key, value]) => {
        if (!value || (Array.isArray(value) && value.length === 0)) return true;
        
        const dealValue = deal[key as keyof Deal];
        if (Array.isArray(value)) {
          return value.includes(dealValue);
        }
        return dealValue === value;
      });
    });

    if (sortConfig) {
      filtered.sort((a, b) => {
        const aValue = a[sortConfig.key as keyof Deal] || '';
        const bValue = b[sortConfig.key as keyof Deal] || '';
        
        if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return filtered;
  }, [deals, searchTerm, sortConfig, filters]);

  const handleSort = (key: string) => {
    setSortConfig(current => ({
      key,
      direction: current?.key === key && current.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const handleSelectAll = (checked: boolean) => {
    setSelectedDeals(checked ? filteredAndSortedDeals.map(deal => deal.id) : []);
  };

  const handleSelectDeal = (dealId: string, checked: boolean) => {
    setSelectedDeals(prev => 
      checked ? [...prev, dealId] : prev.filter(id => id !== dealId)
    );
  };

  const handleDeleteSelected = async () => {
    if (selectedDeals.length === 0) return;
    
    try {
      await onDeleteDeals(selectedDeals);
      setSelectedDeals([]);
      toast({
        title: "Success",
        description: `Deleted ${selectedDeals.length} deal(s)`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete deals",
        variant: "destructive",
      });
    }
  };

  const startEditing = (dealId: string, field: string, currentValue: any) => {
    setEditingCell({ dealId, field });
    setEditValue(String(currentValue || ''));
  };

  const saveEdit = async () => {
    if (!editingCell) return;
    
    try {
      let processedValue: any = editValue;
      
      if (['total_contract_value', 'quarterly_revenue_q1', 'quarterly_revenue_q2', 'quarterly_revenue_q3', 'quarterly_revenue_q4', 'total_revenue'].includes(editingCell.field)) {
        processedValue = parseFloat(editValue) || null;
      } else if (['priority', 'probability', 'project_duration'].includes(editingCell.field)) {
        processedValue = parseInt(editValue) || null;
      }
      
      await onUpdateDeal(editingCell.dealId, { [editingCell.field]: processedValue });
      setEditingCell(null);
      setEditValue('');
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update deal",
        variant: "destructive",
      });
    }
  };

  const cancelEdit = () => {
    setEditingCell(null);
    setEditValue('');
  };

  const formatCurrency = (value: number | null | undefined) => {
    if (!value) return '-';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(value);
  };

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString();
  };

  const getPriorityColor = (priority: number | null | undefined) => {
    if (!priority) return 'bg-gray-100 text-gray-800';
    if (priority >= 4) return 'bg-red-100 text-red-800';
    if (priority >= 3) return 'bg-yellow-100 text-yellow-800';
    return 'bg-green-100 text-green-800';
  };

  const visibleColumns = columns.filter(col => col.visible);

  const InlineEditCell = ({ 
    value, 
    dealId, 
    field, 
    className = "" 
  }: { 
    value: string; 
    dealId: string; 
    field: string; 
    className?: string; 
  }) => {
    const isEditing = editingCell?.dealId === dealId && editingCell?.field === field;
    
    if (isEditing) {
      return (
        <Input
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={saveEdit}
          onKeyDown={(e) => {
            if (e.key === 'Enter') saveEdit();
            if (e.key === 'Escape') cancelEdit();
          }}
          className="h-8"
          autoFocus
        />
      );
    }
    
    return (
      <div
        className={cn("cursor-pointer hover:bg-muted/50 p-1 rounded", className)}
        onClick={() => startEditing(dealId, field, value)}
      >
        {value || '-'}
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col bg-background">
      <div className="flex-shrink-0 p-6 border-b bg-background">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1 flex items-center gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search deals..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </div>
      </div>

      {selectedDeals.length > 0 && (
        <div className="p-4 bg-blue-50 border-b flex items-center justify-between">
          <span className="text-sm font-medium">
            {selectedDeals.length} deal(s) selected
          </span>
          <div className="flex gap-2">
            <Button
              variant="destructive"
              size="sm"
              onClick={handleDeleteSelected}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete Selected
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedDeals([])}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      <div className="flex-1 overflow-auto">
        <Table>
          <TableHeader>
            <TableRow>
              {visibleColumns.map((column) => (
                <TableHead 
                  key={column.key} 
                  style={{ width: column.width }}
                  className={column.key !== 'select' && column.key !== 'actions' ? 'cursor-pointer hover:bg-muted/50' : ''}
                  onClick={() => column.key !== 'select' && column.key !== 'actions' && handleSort(column.key)}
                >
                  <div className="flex items-center gap-1">
                    {column.key === 'select' ? (
                      <Checkbox
                        checked={selectedDeals.length === filteredAndSortedDeals.length && filteredAndSortedDeals.length > 0}
                        onCheckedChange={handleSelectAll}
                      />
                    ) : (
                      <>
                        {column.label}
                        {sortConfig?.key === column.key && (
                          sortConfig.direction === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
                        )}
                      </>
                    )}
                  </div>
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredAndSortedDeals.map((deal) => (
              <TableRow key={deal.id} className="hover:bg-muted/50">
                {visibleColumns.map((column) => (
                  <TableCell key={`${deal.id}-${column.key}`}>
                    {column.key === 'select' && (
                      <Checkbox
                        checked={selectedDeals.includes(deal.id)}
                        onCheckedChange={(checked) => handleSelectDeal(deal.id, checked as boolean)}
                      />
                    )}
                    {column.key === 'deal_name' && (
                      <InlineEditCell
                        value={deal.deal_name || ''}
                        dealId={deal.id}
                        field="deal_name"
                        className="font-medium"
                      />
                    )}
                    {column.key === 'stage' && (
                      <Badge className={STAGE_COLORS[deal.stage]} variant="outline">
                        {deal.stage}
                      </Badge>
                    )}
                    {column.key === 'customer_name' && (
                      <InlineEditCell
                        value={deal.customer_name || ''}
                        dealId={deal.id}
                        field="customer_name"
                      />
                    )}
                    {column.key === 'total_contract_value' && (
                      <InlineEditCell
                        value={formatCurrency(deal.total_contract_value)}
                        dealId={deal.id}
                        field="total_contract_value"
                      />
                    )}
                    {column.key === 'probability' && (
                      <InlineEditCell
                        value={deal.probability ? `${deal.probability}%` : ''}
                        dealId={deal.id}
                        field="probability"
                      />
                    )}
                    {column.key === 'expected_closing_date' && (
                      <InlineEditCell
                        value={formatDate(deal.expected_closing_date)}
                        dealId={deal.id}
                        field="expected_closing_date"
                      />
                    )}
                    {column.key === 'priority' && deal.priority && (
                      <Badge className={getPriorityColor(deal.priority)} variant="outline">
                        {deal.priority}
                      </Badge>
                    )}
                    {column.key === 'created_at' && formatDate(deal.created_at)}
                    {column.key === 'actions' && (
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onDealClick(deal)}
                          className="h-8 w-8 p-0"
                          title="Edit Deal"
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setActionModalDeal(deal)}
                          className="h-8 w-8 p-0"
                          title="Action Items"
                        >
                          <Calendar className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleSelectDeal(deal.id, true)}
                          className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                          title="Select for Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {filteredAndSortedDeals.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            No deals found matching your criteria
          </div>
        )}
      </div>

      <DealActionItemsModal
        deal={actionModalDeal}
        isOpen={!!actionModalDeal}
        onClose={() => setActionModalDeal(null)}
      />
    </div>
  );
};
