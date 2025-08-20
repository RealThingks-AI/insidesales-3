
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Edit, Trash2, List } from "lucide-react";
import { Deal } from "@/types/deal";
import { format } from "date-fns";
import { ImportExportBar } from "@/components/ImportExportBar";
import { DealsFilterPanel } from "@/components/DealsFilterPanel";
import { BulkActionsBar } from "@/components/BulkActionsBar";
import { useDealsImportExport } from "@/hooks/useDealsImportExport";
import { DealActionItemsModal } from "@/components/DealActionItemsModal";

interface ListViewProps {
  deals: Deal[];
  onDealClick: (deal: Deal) => void;
  onUpdateDeal: (dealId: string, updates: Partial<Deal>) => Promise<void>;
  onDeleteDeals: (dealIds: string[]) => void;
  onImportDeals: (deals: any[]) => void;
}

export const ListView = ({ 
  deals, 
  onDealClick, 
  onUpdateDeal, 
  onDeleteDeals, 
  onImportDeals 
}: ListViewProps) => {
  const [selectedDeals, setSelectedDeals] = useState<string[]>([]);
  const [filteredDeals, setFilteredDeals] = useState(deals);
  const [actionItemsModal, setActionItemsModal] = useState<{
    open: boolean;
    deal: { id: string; deal_name: string } | null;
  }>({ open: false, deal: null });

  // Use the import/export hook
  const importExportHook = useDealsImportExport();

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedDeals(filteredDeals.map(deal => deal.id));
    } else {
      setSelectedDeals([]);
    }
  };

  const handleSelectDeal = (dealId: string, checked: boolean) => {
    if (checked) {
      setSelectedDeals(prev => [...prev, dealId]);
    } else {
      setSelectedDeals(prev => prev.filter(id => id !== dealId));
    }
  };

  const getStageColor = (stage: string) => {
    const stageColors = {
      'Lead': 'bg-gray-100 text-gray-800',
      'Qualified': 'bg-blue-100 text-blue-800',
      'RFQ': 'bg-yellow-100 text-yellow-800',
      'Discussions': 'bg-purple-100 text-purple-800',
      'Offered': 'bg-orange-100 text-orange-800',
      'Closed Won': 'bg-green-100 text-green-800',
      'Closed Lost': 'bg-red-100 text-red-800',
    };
    return stageColors[stage as keyof typeof stageColors] || 'bg-gray-100 text-gray-800';
  };

  const formatCurrency = (amount: number | null) => {
    if (!amount) return 'N/A';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return format(new Date(dateString), 'MMM dd, yyyy');
  };

  const handleActionItems = (deal: Deal) => {
    setActionItemsModal({
      open: true,
      deal: { id: deal.id, deal_name: deal.deal_name }
    });
  };

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Filter Panel */}
      <div className="flex-shrink-0 border-b bg-background">
        <DealsFilterPanel 
          deals={deals} 
          onFilteredDealsChange={setFilteredDeals}
        />
      </div>

      {/* Import/Export Bar */}
      {selectedDeals.length === 0 && (
        <div className="flex-shrink-0 bg-background border-b">
          <ImportExportBar
            onImport={importExportHook.handleImport}
            onExportAll={() => importExportHook.handleExportAll(filteredDeals)}
            onExportSelected={() => importExportHook.handleExportSelected(filteredDeals, selectedDeals)}
            onExportFiltered={() => importExportHook.handleExportFiltered(filteredDeals)}
            selectedCount={selectedDeals.length}
            totalCount={filteredDeals.length}
            entityName="deals"
          />
        </div>
      )}

      {/* Bulk Actions Bar */}
      {selectedDeals.length > 0 && (
        <div className="flex-shrink-0 bg-background border-b">
          <BulkActionsBar
            selectedCount={selectedDeals.length}
            onDelete={() => {
              onDeleteDeals(selectedDeals);
              setSelectedDeals([]);
            }}
            onExport={() => importExportHook.handleExportSelected(filteredDeals, selectedDeals)}
            onClearSelection={() => setSelectedDeals([])}
          />
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 overflow-auto p-6">
        <div className="space-y-4">
          {/* Header Row */}
          <div className="grid grid-cols-12 gap-4 items-center py-3 px-4 bg-muted rounded-lg font-medium text-sm">
            <div className="col-span-1">
              <Checkbox
                checked={selectedDeals.length === filteredDeals.length && filteredDeals.length > 0}
                onCheckedChange={handleSelectAll}
              />
            </div>
            <div className="col-span-2">Deal Name</div>
            <div className="col-span-1">Stage</div>
            <div className="col-span-2">Customer</div>
            <div className="col-span-1">Value</div>
            <div className="col-span-2">Expected Close</div>
            <div className="col-span-1">Priority</div>
            <div className="col-span-2">Actions</div>
          </div>

          {/* Deal Rows */}
          {filteredDeals.map((deal) => (
            <Card key={deal.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="grid grid-cols-12 gap-4 items-center">
                  <div className="col-span-1">
                    <Checkbox
                      checked={selectedDeals.includes(deal.id)}
                      onCheckedChange={(checked) => handleSelectDeal(deal.id, !!checked)}
                    />
                  </div>
                  
                  <div className="col-span-2">
                    <button
                      onClick={() => onDealClick(deal)}
                      className="text-left hover:text-primary font-medium"
                    >
                      {deal.deal_name || 'Untitled Deal'}
                    </button>
                  </div>
                  
                  <div className="col-span-1">
                    <Badge className={getStageColor(deal.stage)} variant="secondary">
                      {deal.stage}
                    </Badge>
                  </div>
                  
                  <div className="col-span-2 text-sm text-muted-foreground">
                    {deal.customer_name || 'N/A'}
                  </div>
                  
                  <div className="col-span-1 font-medium">
                    {formatCurrency(deal.total_contract_value)}
                  </div>
                  
                  <div className="col-span-2 text-sm">
                    {formatDate(deal.expected_closing_date)}
                  </div>
                  
                  <div className="col-span-1">
                    {deal.priority && (
                      <Badge variant="outline">
                        P{deal.priority}
                      </Badge>
                    )}
                  </div>
                  
                  <div className="col-span-2 flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onDealClick(deal)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onDeleteDeals([deal.id])}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleActionItems(deal)}
                    >
                      <List className="w-4 h-4" />
                      Action
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {filteredDeals.length === 0 && (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No deals found matching your criteria.</p>
            </div>
          )}
        </div>
      </div>

      {/* Action Items Modal */}
      <DealActionItemsModal
        open={actionItemsModal.open}
        onOpenChange={(open) => setActionItemsModal({ open, deal: actionItemsModal.deal })}
        deal={actionItemsModal.deal}
      />
    </div>
  );
};
