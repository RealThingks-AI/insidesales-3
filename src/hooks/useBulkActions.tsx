
import { useState, useMemo } from 'react';

export const useBulkActions = <T extends { id: string }>(items: T[]) => {
  const [selectedItems, setSelectedItems] = useState<string[]>([]);

  // Ensure selectedItems only contains IDs that exist in current items
  const validSelectedItems = useMemo(() => {
    const currentIds = new Set(items.map(item => item.id));
    return selectedItems.filter(id => currentIds.has(id));
  }, [selectedItems, items]);

  const isAllSelected = useMemo(() => {
    return items.length > 0 && validSelectedItems.length === items.length;
  }, [items.length, validSelectedItems.length]);

  const toggleSelectAll = (selectAll: boolean) => {
    if (selectAll) {
      setSelectedItems(items.map(item => item.id));
    } else {
      setSelectedItems([]);
    }
  };

  const toggleSelectItem = (itemId: string) => {
    setSelectedItems(prev => 
      prev.includes(itemId)
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
  };

  const clearSelection = () => {
    setSelectedItems([]);
  };

  return {
    selectedItems: validSelectedItems,
    isAllSelected,
    toggleSelectAll,
    toggleSelectItem,
    clearSelection,
    hasSelection: validSelectedItems.length > 0
  };
};
