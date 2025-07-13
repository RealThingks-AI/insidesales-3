import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { Search, Plus } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import ContactColumnCustomizer from '@/components/ContactColumnCustomizer';
import ContactsTableRefactored from '@/components/ContactsTableRefactored';
import AddContactModuleForm from '@/components/forms/AddContactModuleForm';
import EditContactModuleForm from '@/components/forms/EditContactModuleForm';
import ConvertToLeadForm from '@/components/forms/ConvertToLeadForm';
import BulkActions from '@/components/BulkActions';
import ActionsDropdown from '@/components/ActionsDropdown';
import { useContactsModule } from '@/hooks/useContactsModule';
import { useBulkActions } from '@/hooks/useBulkActions';
import { useImportExport } from '@/hooks/useImportExport';
import { useBulkDelete } from '@/hooks/useBulkDelete';
import { Contact } from '@/types/contact';

const ContactsModule = () => {
  const { contacts, loading, columns, setColumns, fetchContacts } = useContactsModule();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [showConvertForm, setShowConvertForm] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [convertingContact, setConvertingContact] = useState<Contact | null>(null);

  const filteredContacts = contacts.filter(contact =>
    contact.contact_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    contact.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    contact.company_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const {
    selectedItems,
    isAllSelected,
    toggleSelectAll,
    toggleSelectItem,
    clearSelection,
    hasSelection
  } = useBulkActions(filteredContacts);

  const { handleBulkDelete, handleSingleDelete, isDeleting } = useBulkDelete({
    tableName: 'contacts',
    onRefresh: fetchContacts,
    clearSelection
  });

  const { handleImport, handleExportAll, handleExportSelected, handleExportFiltered } = useImportExport({
    moduleName: 'Contacts',
    tableName: 'contacts',
    onRefresh: fetchContacts
  });

  const handleBulkUpdateStatus = async (ids: string[], status: string) => {
    try {
      // Create the update object - check if the field exists in the contacts table
      const updateData: Record<string, any> = {};
      
      // First, let's check what fields are available in the contacts table
      const { data: sampleData, error: sampleError } = await supabase
        .from('contacts')
        .select('*')
        .limit(1);
        
      if (!sampleError && sampleData && sampleData.length > 0) {
        // Check if lead_status field exists in the contacts table
        if ('lead_status' in sampleData[0]) {
          updateData.lead_status = status;
        } else {
          // If lead_status doesn't exist, we can't update it
          toast({
            variant: "destructive",
            title: "Field not available",
            description: "The lead_status field is not available in the contacts table",
          });
          return;
        }
      }

      const { error } = await supabase
        .from('contacts')
        .update(updateData)
        .in('id', ids);

      if (error) throw error;

      toast({
        title: "Status updated",
        description: `Successfully updated status for ${ids.length} contact(s)`,
      });

      clearSelection();
      fetchContacts();
    } catch (error: any) {
      console.error('Error updating status:', error);
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
        .from('contacts')
        .update({ contact_owner: ownerId })
        .in('id', ids);

      if (error) throw error;

      toast({
        title: "Owner updated",
        description: `Successfully updated owner for ${ids.length} contact(s)`,
      });

      clearSelection();
      fetchContacts();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error updating owner",
        description: error.message,
      });
    }
  };

  const handleAddSuccess = () => {
    setShowAddForm(false);
    fetchContacts();
  };

  const handleEditSuccess = () => {
    setShowEditForm(false);
    setEditingContact(null);
    fetchContacts();
  };

  const handleEditContact = (contact: Contact) => {
    setEditingContact(contact);
    setShowEditForm(true);
  };

  const handleConvertToLead = (contact: Contact) => {
    setConvertingContact(contact);
    setShowConvertForm(true);
  };

  const handleConvertSuccess = () => {
    setShowConvertForm(false);
    setConvertingContact(null);
    toast({
      title: "Success",
      description: "Contact converted to lead successfully",
    });
  };

  const statusOptions = [
    { value: 'New', label: 'New' },
    { value: 'Contacted', label: 'Contacted' },
    { value: 'Qualified', label: 'Qualified' },
    { value: 'Lost', label: 'Lost' }
  ];

  const ownerOptions = [
    { value: 'user1', label: 'John Doe' },
    { value: 'user2', label: 'Jane Smith' }
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
          <h1 className="text-3xl font-bold text-gray-900">Contacts</h1>
        </div>
        <div className="flex items-center space-x-3">
          <ContactColumnCustomizer 
            columns={columns} 
            onColumnsChange={setColumns} 
          />
          <Button onClick={() => setShowAddForm(true)} size="default">
            <Plus className="h-4 w-4 mr-2" />
            Add Contact
          </Button>
          <ActionsDropdown
            onImport={handleImport}
            onExportAll={() => handleExportAll(contacts, 'contacts')}
            onExportSelected={() => handleExportSelected(contacts, selectedItems, 'contacts')}
            onExportFiltered={() => handleExportFiltered(filteredContacts, 'contacts')}
            onBulkDelete={handleBulkDelete}
            onBulkUpdateOwner={handleBulkChangeOwner}
            hasSelected={hasSelection}
            hasFiltered={searchTerm.length > 0}
            selectedItems={selectedItems}
            moduleName="Contacts"
          />
        </div>
      </div>

      <div className="mb-6">
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search contacts..."
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
          onChangeOwner={handleBulkChangeOwner}
          isAllSelected={isAllSelected}
          totalItems={filteredContacts.length}
          statusOptions={statusOptions}
          ownerOptions={ownerOptions}
        />
      </div>

      <Card>
        <CardContent className="p-0">
          <ContactsTableRefactored
            contacts={filteredContacts}
            visibleColumns={columns.filter(col => col.visible)}
            onEditContact={handleEditContact}
            onDeleteContact={handleSingleDelete}
            onConvertToLead={handleConvertToLead}
            onAddContact={() => setShowAddForm(true)}
            selectedItems={selectedItems}
            onToggleSelect={toggleSelectItem}
            isDeleting={isDeleting}
          />
        </CardContent>
      </Card>

      <Dialog open={showAddForm} onOpenChange={setShowAddForm}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>Add New Contact</DialogTitle>
          </DialogHeader>
          <AddContactModuleForm
            onSuccess={handleAddSuccess}
            onCancel={() => setShowAddForm(false)}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={showEditForm} onOpenChange={setShowEditForm}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>Edit Contact</DialogTitle>
          </DialogHeader>
          {editingContact && (
            <EditContactModuleForm
              contact={editingContact}
              onSuccess={handleEditSuccess}
              onCancel={() => {
                setShowEditForm(false);
                setEditingContact(null);
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={showConvertForm} onOpenChange={setShowConvertForm}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>Convert Contact to Lead</DialogTitle>
          </DialogHeader>
          {convertingContact && (
            <ConvertToLeadForm
              contact={convertingContact}
              onSuccess={handleConvertSuccess}
              onCancel={() => {
                setShowConvertForm(false);
                setConvertingContact(null);
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ContactsModule;
