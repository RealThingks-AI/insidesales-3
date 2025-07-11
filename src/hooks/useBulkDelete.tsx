
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface UseBulkDeleteProps {
  tableName: string;
  onRefresh: () => void;
  clearSelection: () => void;
}

export const useBulkDelete = ({ tableName, onRefresh, clearSelection }: UseBulkDeleteProps) => {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleBulkDelete = async (ids: string[]) => {
    if (ids.length === 0) return;
    
    setIsDeleting(true);
    try {
      console.log(`Attempting to delete ${ids.length} records from ${tableName}:`, ids);
      
      // Delete records in batches to handle large selections
      const batchSize = 50;
      const batches = [];
      for (let i = 0; i < ids.length; i += batchSize) {
        batches.push(ids.slice(i, i + batchSize));
      }
      
      let totalDeleted = 0;
      let hasError = false;
      
      for (const batch of batches) {
        const { error, count } = await supabase
          .from(tableName as any)
          .delete({ count: 'exact' })
          .in('id', batch);

        if (error) {
          console.error(`Supabase delete error for batch in ${tableName}:`, error);
          hasError = true;
          // Continue with other batches instead of throwing
        } else {
          totalDeleted += count || batch.length;
          console.log(`Successfully deleted batch of ${count || batch.length} records from ${tableName}`);
        }
      }
      
      if (hasError && totalDeleted === 0) {
        throw new Error(`Failed to delete any records from ${tableName}`);
      }

      if (totalDeleted > 0) {
        toast({
          title: "Records deleted successfully",
          description: `Successfully deleted ${totalDeleted} record(s)${hasError ? ' (some deletions failed)' : ''}`,
        });

        console.log(`Successfully deleted ${totalDeleted} records from ${tableName}`);
        
        // Clear selection and refresh data immediately
        clearSelection();
        await onRefresh();
      }
      
      if (hasError && totalDeleted > 0) {
        toast({
          variant: "destructive",
          title: "Partial deletion completed",
          description: `${totalDeleted} records deleted, but some deletions failed. Please try again for remaining records.`,
        });
      }
      
    } catch (error: any) {
      console.error(`Error deleting records from ${tableName}:`, error);
      toast({
        variant: "destructive",
        title: "Error deleting records",
        description: error.message || `Failed to delete records from ${tableName}`,
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSingleDelete = async (id: string) => {
    return handleBulkDelete([id]);
  };

  return {
    handleBulkDelete,
    handleSingleDelete,
    isDeleting
  };
};
