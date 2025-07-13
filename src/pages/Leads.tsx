import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { Search, Plus } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import AddLeadForm from '@/components/forms/AddLeadForm';
import MeetingFormModal from '@/components/forms/MeetingFormModal';
import LeadsHeader from '@/components/LeadsHeader';
import LeadsTableRefactored from '@/components/LeadsTableRefactored';
import BulkActions from '@/components/BulkActions';
import ActionsDropdown from '@/components/ActionsDropdown';
import LeadColumnCustomizer from '@/components/LeadColumnCustomizer';
import { useLeads } from '@/hooks/useLeads';
import { useBulkActions } from '@/hooks/useBulkActions';
import { useImportExport } from '@/hooks/useImportExport';
import { useBulkDelete } from '@/hooks/useBulkDelete';

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
  created_by: string;
  modified_by: string;
  created_time: string;
  modified_time: string;
  city: string;
  country: string;
  description: string;
  contact_owner: string;
  lead_owner_name?: string;
}

const Leads = () => {
  const { leads, loading, columns, setColumns, fetchLeads } = useLeads();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [showMeetingForm, setShowMeetingForm] = useState(false);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [selectedLeadForMeeting, setSelectedLeadForMeeting] = useState<Lead | null>(null);
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' | null }>({ key: '', direction: null });

  const filteredLeads = leads.filter(lead =>
    lead.lead_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    lead.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    lead.company_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Sort the filtered leads
  const sortedLeads = [...filteredLeads].sort((a, b) => {
    if (!sortConfig.key || !sortConfig.direction) return 0;
    
    const aValue = a[sortConfig.key as keyof Lead];
    const bValue = b[sortConfig.key as keyof Lead];
    
    if (aValue === null || aValue === undefined) return 1;
    if (bValue === null || bValue === undefined) return -1;
    
    if (typeof aValue === 'string' && typeof bValue === 'string') {
      return sortConfig.direction === 'asc' 
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue);
    }
    
    if (typeof aValue === 'number' && typeof bValue === 'number') {
      return sortConfig.direction === 'asc' ? aValue - bValue : bValue - aValue;
    }
    
    return 0;
  });

  const {
    selectedItems,
    isAllSelected,
    toggleSelectAll,
    toggleSelectItem,
    clearSelection,
    hasSelection
  } = useBulkActions(sortedLeads);

  const { handleBulkDelete, handleSingleDelete, isDeleting } = useBulkDelete({
    tableName: 'leads',
    onRefresh: fetchLeads,
    clearSelection
  });

  const { handleImport, handleExportAll, handleExportSelected, handleExportFiltered } = useImportExport({
    moduleName: 'Leads',
    tableName: 'leads',
    onRefresh: fetchLeads
  });

  const handleBulkUpdateStatus = async (ids: string[], status: string) => {
    try {
      const { error } = await supabase
        .from('leads')
        .update({ lead_status: status as any })
        .in('id', ids);

      if (error) throw error;

      toast({
        title: "Status updated",
        description: `Successfully updated status for ${ids.length} lead(s)`,
      });

      clearSelection();
      fetchLeads();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error updating status",
        description: error.message,
      });
    }
  };

  const handleBulkChangeOwner = async (ids: string[], ownerId: string) => {
    try {
      const { error } = await supabase
        .from('leads')
        .update({ created_by: ownerId })
        .in('id', ids);

      if (error) throw error;

      toast({
        title: "Owner updated",
        description: `Successfully updated owner for ${ids.length} lead(s)`,
      });

      clearSelection();
      fetchLeads();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error updating owner",
        description: error.message,
      });
    }
  };

  const handleSort = (columnKey: string) => {
    setSortConfig(prev => {
      if (prev.key === columnKey) {
        if (prev.direction === 'asc') {
          return { key: columnKey, direction: 'desc' };
        } else if (prev.direction === 'desc') {
          return { key: '', direction: null };
        }
      }
      return { key: columnKey, direction: 'asc' };
    });
  };

  const handleAddSuccess = () => {
    setShowAddForm(false);
    fetchLeads();
  };

  const handleEditSuccess = () => {
    setShowEditForm(false);
    setEditingLead(null);
    fetchLeads();
  };

  const handleEditLead = (lead: Lead) => {
    setEditingLead(lead);
    setShowEditForm(true);
  };

  const handleCreateMeeting = (lead: Lead) => {
    setSelectedLeadForMeeting(lead);
    setShowMeetingForm(true);
  };

  const handleMeetingSuccess = () => {
    setShowMeetingForm(false);
    setSelectedLeadForMeeting(null);
    toast({
      title: "Success",
      description: "Meeting created successfully",
    });
  };

  const visibleColumns = columns.filter(col => col.visible);

  const statusOptions = [
    { value: 'New', label: 'New' },
    { value: 'Contacted', label: 'Contacted' },
    { value: 'Qualified', label: 'Qualified' },
    { value: 'Lost', label: 'Lost' }
  ];

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-24 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Leads</h1>
        </div>
        <div className="flex items-center space-x-3">
          <LeadColumnCustomizer
            columns={columns}
            onColumnsChange={setColumns}
          />
          <Button onClick={() => setShowAddForm(true)} size="default">
            <Plus className="h-4 w-4 mr-2" />
            Add Lead
          </Button>
          <ActionsDropdown
            onImport={handleImport}
            onExportAll={() => handleExportAll(leads, 'leads')}
            onExportSelected={() => handleExportSelected(leads, selectedItems, 'leads')}
            onExportFiltered={() => handleExportFiltered(sortedLeads, 'leads')}
            onBulkDelete={handleBulkDelete}
            onBulkUpdateOwner={handleBulkChangeOwner}
            hasSelected={hasSelection}
            hasFiltered={searchTerm.length > 0}
            selectedItems={selectedItems}
            moduleName="Leads"
          />
        </div>
      </div>

      <div className="mb-6">
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search leads..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <div className="mb-4">
        <BulkActions
          selectedItems={selectedItems}
          onSelectAll={toggleSelectAll}
          onDelete={handleBulkDelete}
          onUpdateStatus={handleBulkUpdateStatus}
          isAllSelected={isAllSelected}
          totalItems={sortedLeads.length}
          statusOptions={statusOptions}
          ownerOptions={[]}
        />
      </div>

      <Card>
        <CardContent className="p-0">
          <LeadsTableRefactored
            leads={sortedLeads}
            visibleColumns={visibleColumns}
            onEditLead={handleEditLead}
            onDeleteLead={handleSingleDelete}
            onAddLead={() => setShowAddForm(true)}
            selectedItems={selectedItems}
            onToggleSelect={toggleSelectItem}
            isDeleting={isDeleting}
            onSort={handleSort}
            sortConfig={sortConfig}
            onCreateMeeting={handleCreateMeeting}
            columnsCustomizer={
              <LeadColumnCustomizer
                columns={columns}
                onColumnsChange={setColumns}
              />
            }
          />
        </CardContent>
      </Card>

      <Dialog open={showAddForm} onOpenChange={setShowAddForm}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>Add New Lead</DialogTitle>
          </DialogHeader>
          <AddLeadForm
            onSuccess={handleAddSuccess}
            onCancel={() => setShowAddForm(false)}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={showEditForm} onOpenChange={setShowEditForm}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>Edit Lead</DialogTitle>
          </DialogHeader>
          {editingLead && (
            <AddLeadForm
              onSuccess={handleEditSuccess}
              onCancel={() => {
                setShowEditForm(false);
                setEditingLead(null);
              }}
              initialData={editingLead}
              isEditing={true}
              leadId={editingLead.id}
            />
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={showMeetingForm} onOpenChange={setShowMeetingForm}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>Create Meeting</DialogTitle>
          </DialogHeader>
          {selectedLeadForMeeting && (
            <MeetingFormModal
              onSuccess={handleMeetingSuccess}
              onCancel={() => {
                setShowMeetingForm(false);
                setSelectedLeadForMeeting(null);
              }}
              initialLeadData={{
                id: selectedLeadForMeeting.id,
                lead_name: selectedLeadForMeeting.lead_name,
                email: selectedLeadForMeeting.email,
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Leads;
