
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ArrowUpDown, ArrowUp, ArrowDown, Edit, Trash2, Plus, Users, ArrowRight } from 'lucide-react';
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
import { ContactColumn } from './ContactColumnCustomizer';
import { useState } from 'react';

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
  industry: string;
  city: string;
  country: string;
  description: string;
  created_time: string;
  contact_owner: string;
  contact_owner_name?: string;
  created_by_name?: string;
  modified_by_name?: string;
  lead_status: string;
  no_of_employees: number;
  annual_revenue: number;
  
  state: string;
  modified_time: string;
  created_by: string;
  modified_by: string;
}

interface ContactsTableRefactoredProps {
  contacts: Contact[];
  visibleColumns: ContactColumn[];
  onEditContact: (contact: Contact) => void;
  onDeleteContact?: (contactId: string) => void;
  onAddContact: () => void;
  selectedItems?: string[];
  onToggleSelect?: (contactId: string) => void;
  isDeleting?: boolean;
  onRefresh?: () => void;
  onSort?: (columnKey: string) => void;
  sortConfig?: { key: string; direction: 'asc' | 'desc' | null };
  onConvertToLead?: (contact: Contact) => void;
}

const ContactsTableRefactored = ({ 
  contacts, 
  visibleColumns, 
  onEditContact, 
  onDeleteContact,
  onAddContact,
  selectedItems = [],
  onToggleSelect,
  isDeleting = false,
  onRefresh,
  onSort,
  sortConfig,
  onConvertToLead
}: ContactsTableRefactoredProps) => {
  const [deleteContactId, setDeleteContactId] = useState<string | null>(null);

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
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
        <button
          onClick={() => onEditContact(contact)}
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
    
    if (columnKey === 'contact_owner') {
      return contact.contact_owner_name || 'Unknown User';
    }
    
    if (columnKey === 'annual_revenue' && value) {
      return `$${(value as number).toLocaleString()}`;
    }
    
    if (columnKey === 'linkedin' && value) {
      return (
        <a href={value as string} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
          LinkedIn
        </a>
      );
    }
    
    if (columnKey === 'website' && value) {
      return (
        <a href={value as string} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
          Website
        </a>
      );
    }
    
    return value || '-';
  };

  const getSortIcon = (columnKey: string) => {
    if (!onSort || sortConfig?.key !== columnKey) {
      return <ArrowUpDown className="h-4 w-4" />;
    }
    
    if (sortConfig.direction === 'asc') {
      return <ArrowUp className="h-4 w-4" />;
    } else if (sortConfig.direction === 'desc') {
      return <ArrowDown className="h-4 w-4" />;
    }
    
    return <ArrowUpDown className="h-4 w-4" />;
  };

  const handleDeleteConfirm = () => {
    if (deleteContactId && onDeleteContact) {
      onDeleteContact(deleteContactId);
      setDeleteContactId(null);
    }
  };

  if (contacts.length === 0) {
    return (
      <div className="p-12 text-center">
        <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
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
      <Table>
        <TableHeader>
          <TableRow>
            {onToggleSelect && (
              <TableHead className="w-12">
                <span className="sr-only">Select</span>
              </TableHead>
            )}
            {visibleColumns.map((column) => (
              <TableHead key={column.key} className="min-w-[100px]">
                {onSort ? (
                  <Button
                    variant="ghost"
                    className="h-auto p-0 font-semibold hover:bg-transparent"
                    onClick={() => onSort(column.key)}
                  >
                    {column.label}
                    {getSortIcon(column.key)}
                  </Button>
                ) : (
                  column.label
                )}
              </TableHead>
            ))}
            <TableHead className="w-[200px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {contacts.map((contact) => (
            <TableRow key={contact.id}>
              {onToggleSelect && (
                <TableCell>
                  <Checkbox
                    checked={selectedItems.includes(contact.id)}
                    onCheckedChange={() => onToggleSelect(contact.id)}
                  />
                </TableCell>
              )}
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
                    onClick={() => onEditContact(contact)}
                    disabled={isDeleting}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  {onConvertToLead && (
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => onConvertToLead(contact)}
                      disabled={isDeleting}
                      className="text-green-600 hover:text-green-800"
                    >
                      <ArrowRight className="h-4 w-4" />
                      Convert
                    </Button>
                  )}
                  {onDeleteContact && (
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setDeleteContactId(contact.id)}
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

      {onDeleteContact && (
        <AlertDialog open={!!deleteContactId} onOpenChange={() => setDeleteContactId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Contact</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this contact? This action cannot be undone.
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

export default ContactsTableRefactored;
