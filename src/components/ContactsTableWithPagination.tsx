
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Eye, Edit, Plus, Building, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import { ContactColumn } from './ContactColumnCustomizer';
import { useBulkDelete } from '@/hooks/useBulkDelete';

interface Contact {
  id: string;
  contact_name: string;
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
  contact_owner: string;
  contact_owner_name?: string;
  created_by_name?: string;
  modified_by_name?: string;
  modified_time: string;
  created_by: string;
  modified_by: string;
}

interface ContactsTableWithPaginationProps {
  contacts: Contact[];
  visibleColumns: ContactColumn[];
  onViewContact: (contactId: string) => void;
  onEditContact: (contact: Contact) => void;
  onDeleteContact: (contactId: string) => void;
  onAddContact: () => void;
  selectedItems: string[];
  onToggleSelect: (contactId: string) => void;
  onRefresh: () => void;
}

const ITEMS_PER_PAGE = 100;

const ContactsTableWithPagination = ({ 
  contacts, 
  visibleColumns, 
  onViewContact, 
  onEditContact,
  onDeleteContact,
  onAddContact,
  selectedItems,
  onToggleSelect,
  onRefresh
}: ContactsTableWithPaginationProps) => {
  const [deleteContactId, setDeleteContactId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [currentPageSelection, setCurrentPageSelection] = useState<string[]>([]);

  // Calculate pagination
  const totalPages = Math.ceil(contacts.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const currentPageContacts = contacts.slice(startIndex, endIndex);

  // Bulk delete functionality using the updated table name
  const { handleBulkDelete, isDeleting } = useBulkDelete({
    tableName: 'contacts',
    onRefresh,
    clearSelection: () => {
      setCurrentPageSelection([]);
    }
  });

  const getStageColor = (stage: string) => {
    switch (stage?.toLowerCase()) {
      case 'new':
        return 'bg-blue-100 text-blue-800';
      case 'contacted':
        return 'bg-yellow-100 text-yellow-800';
      case 'qualified':
        return 'bg-green-100 text-green-800';
      case 'lost':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const renderCellValue = (contact: Contact, columnKey: string) => {
    const value = contact[columnKey as keyof Contact];
    
    if (columnKey === 'contact_name') {
      return (
        <div className="space-y-1">
          <button
            onClick={() => onEditContact(contact)}
            className="text-blue-600 hover:text-blue-800 hover:underline font-medium text-left"
          >
            {value || '-'}
          </button>
          <div className="text-xs text-gray-500">
            Created by: {contact.created_by_name || 'Unknown User'}
          </div>
        </div>
      );
    }
    
    if (columnKey === 'lead_status') {
      return (
        <Badge className={getStageColor(value as string)}>
          {value || 'New'}
        </Badge>
      );
    }
    
    if (columnKey === 'contact_owner') {
      return contact.contact_owner_name || 'Unknown User';
    }
    
    if (columnKey === 'annual_revenue' && value) {
      return `$${(value as number).toLocaleString()}`;
    }
    
    return value || '-';
  };

  const handleDeleteConfirm = () => {
    if (deleteContactId) {
      onDeleteContact(deleteContactId);
      setDeleteContactId(null);
    }
  };

  const handleSelectAll = () => {
    const currentPageIds = currentPageContacts.map(contact => contact.id);
    const allSelected = currentPageIds.every(id => currentPageSelection.includes(id));
    
    if (allSelected) {
      setCurrentPageSelection([]);
    } else {
      setCurrentPageSelection(currentPageIds);
    }
  };

  const handleSingleSelect = (contactId: string) => {
    if (currentPageSelection.includes(contactId)) {
      setCurrentPageSelection(prev => prev.filter(id => id !== contactId));
    } else {
      setCurrentPageSelection(prev => [...prev, contactId]);
    }
    onToggleSelect(contactId);
  };

  const handleBulkDeleteAction = async () => {
    if (currentPageSelection.length > 0) {
      await handleBulkDelete(currentPageSelection);
    }
  };

  // Reset to first page when contacts change
  if (currentPage > totalPages && totalPages > 0) {
    setCurrentPage(1);
  }

  if (contacts.length === 0) {
    return (
      <div className="p-12 text-center">
        <Building className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No contacts found</h3>
        <p className="text-gray-600 mb-4">Get started by adding your first contact.</p>
        <Button onClick={onAddContact}>
          <Plus className="h-4 w-4 mr-2" />
          Add Contact
        </Button>
      </div>
    );
  }

  return (
    <>
      {/* Bulk Actions for current page */}
      {currentPageSelection.length > 0 && (
        <div className="p-4 bg-blue-50 border-b">
          <div className="flex items-center justify-between">
            <span className="text-sm text-blue-700">
              {currentPageSelection.length} contact(s) selected on this page
            </span>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleBulkDeleteAction}
              disabled={isDeleting}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              {isDeleting ? 'Deleting...' : `Delete ${currentPageSelection.length} contact(s)`}
            </Button>
          </div>
        </div>
      )}

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12">
              <Checkbox
                checked={currentPageContacts.length > 0 && currentPageContacts.every(contact => currentPageSelection.includes(contact.id))}
                onCheckedChange={handleSelectAll}
              />
            </TableHead>
            {visibleColumns.map((column) => (
              <TableHead key={column.key}>{column.label}</TableHead>
            ))}
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {currentPageContacts.map((contact) => (
            <TableRow key={contact.id}>
              <TableCell>
                <Checkbox
                  checked={currentPageSelection.includes(contact.id)}
                  onCheckedChange={() => handleSingleSelect(contact.id)}
                />
              </TableCell>
              {visibleColumns.map((column) => (
                <TableCell key={column.key}>
                  {renderCellValue(contact, column.key)}
                </TableCell>
              ))}
              <TableCell>
                <div className="flex space-x-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => onViewContact(contact.id)}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => onEditContact(contact)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setDeleteContactId(contact.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-3 border-t">
          <div className="text-sm text-gray-700">
            Showing {startIndex + 1} to {Math.min(endIndex, contacts.length)} of {contacts.length} contacts
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
            <span className="text-sm">
              Page {currentPage} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      <AlertDialog open={!!deleteContactId} onOpenChange={() => setDeleteContactId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Deletion</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this contact? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default ContactsTableWithPagination;
