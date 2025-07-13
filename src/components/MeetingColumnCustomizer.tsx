import { useState } from 'react';
import { Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';

export interface MeetingColumn {
  key: string;
  label: string;
  visible: boolean;
  required?: boolean;
}

interface MeetingColumnCustomizerProps {
  columns: MeetingColumn[];
  onColumnsChange: (columns: MeetingColumn[]) => void;
}

const MeetingColumnCustomizer = ({ columns, onColumnsChange }: MeetingColumnCustomizerProps) => {
  const [open, setOpen] = useState(false);

  const handleColumnToggle = (columnKey: string) => {
    const updatedColumns = columns.map(col => 
      col.key === columnKey ? { ...col, visible: !col.visible } : col
    );
    onColumnsChange(updatedColumns);
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
          <DialogTitle>Customize Columns</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Choose which columns to display in the meetings table.
          </p>
          <div className="space-y-3">
            {columns.map((column) => (
              <div key={column.key} className="flex items-center justify-between">
                <Label htmlFor={column.key} className="text-sm font-medium">
                  {column.label}
                  {column.required && <span className="text-red-500 ml-1">*</span>}
                </Label>
                <Switch
                  id={column.key}
                  checked={column.visible}
                  onCheckedChange={() => handleColumnToggle(column.key)}
                  disabled={column.required}
                />
              </div>
            ))}
          </div>
          <div className="pt-4 border-t">
            <p className="text-xs text-muted-foreground">
              * Required columns cannot be hidden
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MeetingColumnCustomizer;