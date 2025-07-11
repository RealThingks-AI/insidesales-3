
import { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Edit, Trash2, Plus, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';

interface Column {
  key: string;
  label: string;
  visible: boolean;
}

interface GenericTableProps<T> {
  data: T[];
  columns: Column[];
  onEdit: (item: T) => void;
  onDelete: (itemId: string) => void;
  onAdd: () => void;
  selectedItems: string[];
  onToggleSelect: (itemId: string) => void;
  emptyIcon: React.ReactNode;
  emptyTitle: string;
  emptyDescription: string;
  renderCellValue: (item: T, columnKey: string) => React.ReactNode;
  isDeleting?: boolean;
  customActions?: (item: T) => React.ReactNode;
  renderRowActions?: (item: T) => React.ReactNode;
  onSort?: (columnKey: string) => void;
  sortConfig?: { key: string; direction: 'asc' | 'desc' | null };
}

function GenericTable<T extends { id: string }>({
  data,
  columns,
  onEdit,
  onDelete,
  onAdd,
  selectedItems,
  onToggleSelect,
  emptyIcon,
  emptyTitle,
  emptyDescription,
  renderCellValue,
  isDeleting = false,
  customActions,
  renderRowActions,
  onSort,
  sortConfig
}: GenericTableProps<T>) {
  const getSortIcon = (columnKey: string) => {
    if (!sortConfig || sortConfig.key !== columnKey) {
      return <ArrowUpDown className="h-4 w-4 text-gray-400" />;
    }
    if (sortConfig.direction === 'asc') {
      return <ArrowUp className="h-4 w-4 text-blue-600" />;
    } else if (sortConfig.direction === 'desc') {
      return <ArrowDown className="h-4 w-4 text-blue-600" />;
    }
    return <ArrowUpDown className="h-4 w-4 text-gray-400" />;
  };

  if (data.length === 0) {
    return (
      <div className="p-12 text-center">
        {emptyIcon}
        <h3 className="text-lg font-medium text-gray-900 mb-2">{emptyTitle}</h3>
        <p className="text-gray-600 mb-4">{emptyDescription}</p>
        <Button onClick={onAdd}>
          <Plus className="h-4 w-4 mr-2" />
          Add New
        </Button>
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12">
              <Checkbox
                checked={selectedItems.length === data.length}
                onCheckedChange={(checked) => {
                  if (checked) {
                    data.forEach(item => onToggleSelect(item.id));
                  } else {
                    selectedItems.forEach(id => onToggleSelect(id));
                  }
                }}
              />
            </TableHead>
            {columns.map((column) => (
              <TableHead 
                key={column.key}
                className={onSort ? "cursor-pointer hover:bg-gray-50 select-none" : ""}
                onClick={() => onSort && onSort(column.key)}
              >
                <div className="flex items-center space-x-1">
                  <span>{column.label}</span>
                  {onSort && getSortIcon(column.key)}
                </div>
              </TableHead>
            ))}
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((item) => (
            <TableRow key={item.id}>
              <TableCell>
                <Checkbox
                  checked={selectedItems.includes(item.id)}
                  onCheckedChange={() => onToggleSelect(item.id)}
                />
              </TableCell>
              {columns.map((column) => (
                <TableCell key={column.key}>
                  {renderCellValue(item, column.key)}
                </TableCell>
              ))}
              <TableCell className="text-right">
                {renderRowActions ? (
                  <div className="flex items-center gap-2 justify-end">
                    {renderRowActions(item)}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onEdit(item)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onDelete(item.id)}
                      disabled={isDeleting}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ) : customActions ? (
                  customActions(item)
                ) : (
                  <div className="flex items-center gap-2 justify-end">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onEdit(item)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onDelete(item.id)}
                      disabled={isDeleting}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

export default GenericTable;
