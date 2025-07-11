
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Settings } from 'lucide-react';

export interface ContactColumn {
  key: string;
  label: string;
  required: boolean;
  visible: boolean;
}

interface ContactColumnCustomizerProps {
  columns: ContactColumn[];
  onColumnsChange: (columns: ContactColumn[]) => void;
}

const ContactColumnCustomizer = ({ columns, onColumnsChange }: ContactColumnCustomizerProps) => {
  const [open, setOpen] = useState(false);
  const [localColumns, setLocalColumns] = useState(columns);

  const handleColumnToggle = (columnKey: string, checked: boolean) => {
    const updatedColumns = localColumns.map(col => 
      col.key === columnKey ? { ...col, visible: checked } : col
    );
    setLocalColumns(updatedColumns);
  };

  const handleSave = () => {
    onColumnsChange(localColumns);
    setOpen(false);
  };

  const handleReset = () => {
    const resetColumns = localColumns.map(col => ({
      ...col,
      visible: col.required
    }));
    setLocalColumns(resetColumns);
  };

  const handleShowAll = () => {
    const showAllColumns = localColumns.map(col => ({
      ...col,
      visible: true
    }));
    setLocalColumns(showAllColumns);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Settings className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Customize Table Columns</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 max-h-96 overflow-y-auto">
          {localColumns.map((column) => (
            <div key={column.key} className="flex items-center space-x-2">
              <Checkbox
                id={column.key}
                checked={column.visible}
                disabled={column.required}
                onCheckedChange={(checked) => 
                  handleColumnToggle(column.key, checked as boolean)
                }
              />
              <label
                htmlFor={column.key}
                className={`text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 ${
                  column.required ? 'text-gray-500' : ''
                }`}
              >
                {column.label}
                {column.required && ' (Required)'}
              </label>
            </div>
          ))}
        </div>
        <div className="flex justify-between pt-4">
          <div className="flex space-x-2">
            <Button variant="outline" size="sm" onClick={handleReset}>
              Required Only
            </Button>
            <Button variant="outline" size="sm" onClick={handleShowAll}>
              Show All
            </Button>
          </div>
          <div className="flex space-x-2">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave}>
              Save Changes
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ContactColumnCustomizer;
