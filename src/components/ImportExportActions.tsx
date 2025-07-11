
import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Upload, Download, ChevronDown } from 'lucide-react';
import ImportDialog from './ImportDialog';

interface ImportExportActionsProps {
  onImport: (file: File) => void;
  onExportAll: () => void;
  onExportSelected: () => void;
  onExportFiltered: () => void;
  hasSelected: boolean;
  hasFiltered: boolean;
  moduleName: string;
}

const ImportExportActions = ({
  onImport,
  onExportAll,
  onExportSelected,
  onExportFiltered,
  hasSelected,
  hasFiltered,
  moduleName
}: ImportExportActionsProps) => {
  const [showImportDialog, setShowImportDialog] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImportClick = () => {
    setShowImportDialog(true);
  };

  const handleFileSelect = (file: File) => {
    onImport(file);
    setShowImportDialog(false);
  };

  return (
    <>
      <div className="flex space-x-2">
        <Button
          variant="outline"
          size="sm"
          onClick={handleImportClick}
        >
          <Upload className="h-4 w-4 mr-2" />
          Import
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export
              <ChevronDown className="h-4 w-4 ml-2" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={onExportAll}>
              Export All Records
            </DropdownMenuItem>
            {hasSelected && (
              <DropdownMenuItem onClick={onExportSelected}>
                Export Selected Records
              </DropdownMenuItem>
            )}
            {hasFiltered && (
              <DropdownMenuItem onClick={onExportFiltered}>
                Export Filtered Records
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <ImportDialog
        open={showImportDialog}
        onOpenChange={setShowImportDialog}
        onFileSelect={handleFileSelect}
        moduleName={moduleName}
      />
    </>
  );
};

export default ImportExportActions;
