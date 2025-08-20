import React, { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Edit, Trash2, Search, Filter, Download, Upload, Settings, List } from "lucide-react";
import { Deal } from "@/types/deal";
import { format } from "date-fns";
import { BulkActionsBar } from "@/components/BulkActionsBar";
import { ImportExportBar } from "@/components/ImportExportBar";
import { useDealsImportExport } from "@/hooks/useDealsImportExport";
import { ColumnCustomizer } from "@/components/ColumnCustomizer";
import { DealActionItemsModal } from "@/components/DealActionItemsModal";

interface ListViewProps {
  deals: Deal[];
  onDealClick: (deal: Deal) => void;
  onUpdateDeal: (dealId: string, updates: Partial<Deal>) => Promise<void>;
  onDeleteDeals: (dealIds: string[]) => Promise<void>;
  onImportDeals: (deals: any[]) => Promise<void>;
}

export const ListView: React.FC<ListViewProps> = ({
  deals,
  onDealClick,
  onUpdateDeal,
  onDeleteDeals,
  onImportDeals,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDeals, setSelectedDeals] = useState<string[]>([]);
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [showImportExport, setShowImportExport] = useState(false);
  const [showColumnCustomizer, setShowColumnCustomizer] = useState(false);
  const [actionItemsModalOpen, setActionItemsModalOpen] = useState(false);
  const [selectedDealForActions, setSelectedDealForActions] = useState<Deal | null>(null);

  const [visibleColumns, setVisibleColumns] = useState({
    project: true,
    customer: true,
    leadOwner: true,
    stage: true,
    priority: true,
    value: true,
    expectedClose: true,
    actions: true,
  });

  const { exportToCSV, importFromCSV, isProcessing } = useDealsImportExport({
    onImport: onImportDeals,
    filename: 'deals'
  });

  const filteredDeals = useMemo(() => {
    return deals.filter(deal => {
      const searchLower = searchTerm.toLowerCase();
      return (
        deal.project_name?.toLowerCase().includes(searchLower) ||
        deal.customer_name?.toLowerCase().includes(searchLower) ||
        deal.lead_owner?.toLowerCase().includes(searchLower) ||
        deal.stage?.toLowerCase().includes(searchLower)
      );
    });
  }, [deals, searchTerm]);

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

  const handleBulkDelete = async () => {
    if (selectedDeals.length > 0) {
      await onDeleteDeals(selectedDeals);
      setSelectedDeals([]);
      setShowBulkActions(false);
    }
  };

  const getStageColor = (stage: string) => {
    const colors = {
      'Lead': 'bg-gray-100 text-gray-800',
      'Qualified': 'bg-blue-100 text-blue-800',
      'RFQ': 'bg-yellow-100 text-yellow-800',
      'Discussions': 'bg-purple-100 text-purple-800',
      'Offered': 'bg-orange-100 text-orange-800',
      'Final': 'bg-green-100 text-green-800',
    };
    return colors[stage as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const getPriorityColor = (priority: number) => {
    if (priority === 1) return 'bg-red-100 text-red-800';
    if (priority === 2) return 'bg-yellow-100 text-yellow-800';
    if (priority === 3) return 'bg-green-100 text-green-800';
    return 'bg-gray-100 text-gray-800';
  };

  const getPriorityLabel = (priority: number) => {
    if (priority === 1) return 'Highest';
    if (priority === 2) return 'High';
    if (priority === 3) return 'Medium';
    return 'Low';
  };

  const formatCurrency = (value: number | null) => {
    if (!value) return '-';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'EUR',
    }).format(value);
  };

  const formatDate = (date: string | null) => {
    if (!date) return '-';
    return format(new Date(date), 'dd/MM/yyyy');
  };

  const handleActionItemsClick = (deal: Deal) => {
    setSelectedDealForActions(deal);
    setActionItemsModalOpen(true);
  };

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Fixed Header */}
      <div className="flex-shrink-0 bg-background border-b">
        <div className="px-6 py-4 space-y-4">
          {/* Search and Actions Row */}
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search all deal details..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowImportExport(!showImportExport)}
                className="flex items-center gap-2"
              >
                <Upload className="h-4 w-4" />
                Import
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => exportToCSV(deals)}
                disabled={isProcessing}
                className="flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                Export
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowColumnCustomizer(true)}
                className="flex items-center gap-2"
              >
                <Settings className="h-4 w-4" />
                Columns
              </Button>
            </div>
          </div>

          {/* Import/Export Bar */}
          {showImportExport && (
            <ImportExportBar
              onImport={importFromCSV}
              onExport={() => exportToCSV(deals)}
              isProcessing={isProcessing}
              onClose={() => setShowImportExport(false)}
            />
          )}

          {/* Bulk Actions Bar */}
          {selectedDeals.length > 0 && (
            <BulkActionsBar
              selectedCount={selectedDeals.length}
              onDelete={handleBulkDelete}
              onSelectAll={() => handleSelectAll(false)}
            />
          )}
        </div>
      </div>

      {/* Scrollable Table Content */}
      <div className="flex-1 overflow-auto">
        <div className="px-6">
          <div className="bg-white border rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted/50 border-b">
                  <tr>
                    <th className="p-3 text-left">
                      <Checkbox
                        checked={selectedDeals.length === filteredDeals.length && filteredDeals.length > 0}
                        onCheckedChange={handleSelectAll}
                      />
                    </th>
                    {visibleColumns.project && <th className="p-3 text-left font-medium">Project</th>}
                    {visibleColumns.customer && <th className="p-3 text-left font-medium">Customer</th>}
                    {visibleColumns.leadOwner && <th className="p-3 text-left font-medium">Lead Owner</th>}
                    {visibleColumns.stage && <th className="p-3 text-left font-medium">Stage</th>}
                    {visibleColumns.priority && <th className="p-3 text-left font-medium">Priority</th>}
                    {visibleColumns.value && <th className="p-3 text-left font-medium">Value</th>}
                    {visibleColumns.expectedClose && <th className="p-3 text-left font-medium">Expected Close</th>}
                    {visibleColumns.actions && <th className="p-3 text-left font-medium">Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {filteredDeals.map((deal) => (
                    <tr key={deal.id} className="border-b hover:bg-muted/30 transition-colors">
                      <td className="p-3">
                        <Checkbox
                          checked={selectedDeals.includes(deal.id)}
                          onCheckedChange={(checked) => handleSelectDeal(deal.id, checked as boolean)}
                        />
                      </td>
                      {visibleColumns.project && (
                        <td 
                          className="p-3 cursor-pointer hover:text-primary"
                          onClick={() => onDealClick(deal)}
                        >
                          <div className="font-medium">{deal.project_name || deal.deal_name}</div>
                        </td>
                      )}
                      {visibleColumns.customer && (
                        <td className="p-3">
                          <div>{deal.customer_name || '-'}</div>
                        </td>
                      )}
                      {visibleColumns.leadOwner && (
                        <td className="p-3">
                          <div>{deal.lead_owner || '-'}</div>
                        </td>
                      )}
                      {visibleColumns.stage && (
                        <td className="p-3">
                          <Badge className={getStageColor(deal.stage)}>
                            {deal.stage}
                          </Badge>
                        </td>
                      )}
                      {visibleColumns.priority && (
                        <td className="p-3">
                          {deal.priority ? (
                            <Badge className={getPriorityColor(deal.priority)}>
                              {deal.priority} ({getPriorityLabel(deal.priority)})
                            </Badge>
                          ) : (
                            <span>-</span>
                          )}
                        </td>
                      )}
                      {visibleColumns.value && (
                        <td className="p-3">
                          {formatCurrency(deal.total_contract_value)}
                        </td>
                      )}
                      {visibleColumns.expectedClose && (
                        <td className="p-3">
                          {formatDate(deal.expected_closing_date)}
                        </td>
                      )}
                      {visibleColumns.actions && (
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => onDealClick(deal)}
                              className="h-8 w-8 p-0"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => onDeleteDeals([deal.id])}
                              className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleActionItemsClick(deal)}
                              className="h-8 px-2 py-1 text-xs"
                            >
                              <List className="h-3 w-3 mr-1" />
                              Action
                            </Button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {filteredDeals.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                {searchTerm ? 'No deals found matching your search.' : 'No deals found.'}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Column Customizer Modal */}
      {showColumnCustomizer && (
        <ColumnCustomizer
          visibleColumns={visibleColumns}
          onColumnsChange={setVisibleColumns}
          onClose={() => setShowColumnCustomizer(false)}
        />
      )}

      {/* Deal Action Items Modal */}
      <DealActionItemsModal
        open={actionItemsModalOpen}
        onOpenChange={setActionItemsModalOpen}
        deal={selectedDealForActions}
      />
    </div>
  );
};
