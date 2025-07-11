
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';

interface ContactsModuleSearchProps {
  searchTerm: string;
  onSearchChange: (term: string) => void;
}

const ContactsModuleSearch = ({ searchTerm, onSearchChange }: ContactsModuleSearchProps) => {
  return (
    <div className="mb-6">
      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Search contacts..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10"
        />
      </div>
    </div>
  );
};

export default ContactsModuleSearch;
