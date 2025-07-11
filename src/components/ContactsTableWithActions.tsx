
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus } from 'lucide-react';
import ContactsTableActions from '@/components/ContactsTableActions';
import { ContactColumn } from '@/components/ContactColumnCustomizer';

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
  contact_owner: string;
  contact_owner_name?: string;
  created_by_name?: string;
  modified_by_name?: string;
}

interface ContactsTableWithActionsProps {
  contacts: Contact[];
  visibleColumns: ContactColumn[];
  onEditContact: (contact: Contact) => void;
  onDeleteContact: (contactId: string) => void;
  onAddContact: () => void;
  selectedItems: string[];
  onToggleSelect: (contactId: string) => void;
}

const ContactsTableWithActions = ({
  contacts,
  visibleColumns,
  onEditContact,
  onDeleteContact,
  onAddContact,
  selectedItems,
  onToggleSelect,
}: ContactsTableWithActionsProps) => {
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

  const renderCellContent = (contact: Contact, column: ContactColumn) => {
    const value = contact[column.key as keyof Contact];
    
    if (column.key === 'contact_name') {
      return (
        <div className="space-y-1">
          <button
            onClick={() => onEditContact(contact)}
            className="text-blue-600 hover:text-blue-800 hover:underline font-medium text-left"
          >
            {value as string || '-'}
          </button>
          <div className="text-xs text-gray-500">
            Created by: {contact.created_by_name || 'Unknown User'}
          </div>
        </div>
      );
    }
    
    if (column.key === 'lead_status') {
      return (
        <Badge className={getStatusColor(value as string)}>
          {value as string}
        </Badge>
      );
    }
    
    if (column.key === 'contact_owner') {
      return contact.contact_owner_name || 'Unknown User';
    }
    
    if (column.key === 'annual_revenue' && value) {
      return `$${(value as number).toLocaleString()}`;
    }
    
    if (column.key === 'linkedin' && value) {
      return (
        <a href={value as string} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
          LinkedIn
        </a>
      );
    }
    
    if (column.key === 'website' && value) {
      return (
        <a href={value as string} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
          Website
        </a>
      );
    }
    
    return value || '-';
  };

  if (contacts.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 mb-4">No contacts found</p>
        <Button onClick={onAddContact}>
          <Plus className="h-4 w-4 mr-2" />
          Add First Contact
        </Button>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12">
              <Checkbox />
            </TableHead>
            {visibleColumns.map((column) => (
              <TableHead key={column.key}>{column.label}</TableHead>
            ))}
            <TableHead className="w-20">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {contacts.map((contact) => (
            <TableRow key={contact.id}>
              <TableCell>
                <Checkbox
                  checked={selectedItems.includes(contact.id)}
                  onCheckedChange={() => onToggleSelect(contact.id)}
                />
              </TableCell>
              {visibleColumns.map((column) => (
                <TableCell key={column.key}>
                  {renderCellContent(contact, column)}
                </TableCell>
              ))}
              <TableCell>
                <ContactsTableActions
                  contact={contact}
                  onEditContact={onEditContact}
                  onDeleteContact={onDeleteContact}
                />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default ContactsTableWithActions;
