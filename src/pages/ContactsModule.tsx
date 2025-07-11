
import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import ContactModuleDetails from '@/components/ContactModuleDetails';
import AddContactModuleForm from '@/components/forms/AddContactModuleForm';
import EditContactModuleForm from '@/components/forms/EditContactModuleForm';
import ContactsStats from '@/components/ContactsStats';
import ContactsModuleHeader from '@/components/ContactsModuleHeader';
import ContactsModuleSearch from '@/components/ContactsModuleSearch';
import ContactsTableWithPagination from '@/components/ContactsTableWithPagination';
import { useContactsModule } from '@/hooks/useContactsModule';
import { useBulkActions } from '@/hooks/useBulkActions';
import { Contact } from '@/types/contact';

const ContactsModule = () => {
  const { contacts, loading, columns, setColumns, fetchContacts } = useContactsModule();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedContactId, setSelectedContactId] = useState<string | null>(null);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [showContactDetails, setShowContactDetails] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);

  const filteredContacts = contacts.filter(contact =>
    contact.contact_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    contact.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    contact.company_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const {
    selectedItems,
    toggleSelectItem,
  } = useBulkActions(filteredContacts);

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

  const handleViewContact = (contactId: string) => {
    setSelectedContactId(contactId);
    setShowContactDetails(true);
  };

  const handleDeleteContact = async (contactId: string) => {
    try {
      const { error } = await supabase
        .from('contacts')
        .delete()
        .eq('id', contactId);

      if (error) throw error;

      toast({
        title: "Contact deleted",
        description: "Contact has been successfully deleted",
      });

      fetchContacts();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error deleting contact",
        description: error.message,
      });
    }
  };

  const visibleColumns = columns.filter(col => col.visible);

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
      <ContactsModuleHeader 
        onAddContact={() => setShowAddForm(true)}
        columns={columns}
        onColumnsChange={setColumns}
      />

      <ContactsModuleSearch 
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
      />

      <ContactsStats contacts={contacts} />

      <Card>
        <CardContent className="p-0">
          <ContactsTableWithPagination
            contacts={filteredContacts}
            visibleColumns={visibleColumns}
            onViewContact={handleViewContact}
            onEditContact={handleEditContact}
            onDeleteContact={handleDeleteContact}
            onAddContact={() => setShowAddForm(true)}
            selectedItems={selectedItems}
            onToggleSelect={toggleSelectItem}
            onRefresh={fetchContacts}
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

      <Dialog open={showContactDetails} onOpenChange={setShowContactDetails}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-auto">
          {selectedContactId && (
            <ContactModuleDetails
              contactId={selectedContactId}
              onClose={() => setShowContactDetails(false)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ContactsModule;
