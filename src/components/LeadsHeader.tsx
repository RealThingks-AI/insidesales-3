
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { LeadColumn } from '@/components/LeadColumnCustomizer';

interface LeadsHeaderProps {
  onAddLead: () => void;
  columns: LeadColumn[];
  onColumnsChange: (columns: LeadColumn[]) => void;
}

const LeadsHeader = ({ onAddLead }: LeadsHeaderProps) => {
  return (
    <div className="flex items-center space-x-2">
      <Button onClick={onAddLead}>
        <Plus className="h-4 w-4 mr-2" />
        Add Lead
      </Button>
    </div>
  );
};

export default LeadsHeader;
