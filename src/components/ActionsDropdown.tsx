
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ChevronDown, Download, Upload, Trash2, UserCheck } from 'lucide-react';
import ImportDialog from '@/components/ImportDialog';

interface ActionsDropdownProps {
  onImport: (file: File) => void;
  onExportAll: () => void;
  onExportSelected: () => void;
  onExportFiltered: () => void;
  onBulkDelete: (ids: string[]) => void;
  onBulkUpdateOwner: (ids: string[], ownerId: string) => void;
  hasSelected: boolean;
  hasFiltered: boolean;
  selectedItems: string[];
  moduleName: string;
}

const ActionsDropdown = ({
  onImport,
  onExportAll,
  onExportSelected,
  onExportFiltered,
  onBulkDelete,
  onBulkUpdateOwner,
  hasSelected,
  hasFiltered,
  selectedItems,
  moduleName
}: ActionsDropdownProps) => {
  const [open, setOpen] = useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);

  const handleBulkDelete = () => {
    onBulkDelete(selectedItems);
    setOpen(false);
  };

  const handleImportClick = () => {
    setShowImportDialog(true);
    setOpen(false);
  };

  const handleFileSelect = (file: File) => {
    onImport(file);
    setShowImportDialog(false);
  };

  return (
    <>
      <DropdownMenu open={open} onOpenChange={setOpen}>
        <DropdownMenuTrigger asChild>
          <Button variant="outline">
            Actions
            <ChevronDown className="ml-2 h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48 bg-white">
          <DropdownMenuLabel>Import/Export</DropdownMenuLabel>
          <DropdownMenuItem onClick={handleImportClick}>
            <Upload className="mr-2 h-4 w-4" />
            Import {moduleName}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={onExportAll}>
            <Download className="mr-2 h-4 w-4" />
            Export All
          </DropdownMenuItem>
          {hasSelected && (
            <DropdownMenuItem onClick={onExportSelected}>
              <Download className="mr-2 h-4 w-4" />
              Export Selected
            </DropdownMenuItem>
          )}
          {hasFiltered && (
            <DropdownMenuItem onClick={onExportFiltered}>
              <Download className="mr-2 h-4 w-4" />
              Export Filtered
            </DropdownMenuItem>
          )}
          
          {hasSelected && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuLabel>Bulk Actions</DropdownMenuLabel>
              <DropdownMenuItem onClick={handleBulkDelete} className="text-red-600">
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Selected
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => console.log('Change owner not implemented')}>
                <UserCheck className="mr-2 h-4 w-4" />
                Change Owner
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <ImportDialog
        open={showImportDialog}
        onOpenChange={setShowImportDialog}
        onFileSelect={handleFileSelect}
        moduleName={moduleName}
      />
    </>
  );
};

export default ActionsDropdown;
