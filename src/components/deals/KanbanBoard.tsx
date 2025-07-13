
import { useState } from 'react';
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent } from '@dnd-kit/core';
import { Card } from '@/components/ui/card';
import KanbanColumn from './KanbanColumn';
import DealCard from './DealCard';
import StageRequirementsDialog from './StageRequirementsDialog';
import { Deal, DEAL_STAGES, canMoveToStage, getStageCompletionStatus, getVisibleStages } from '@/hooks/useDeals';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface KanbanBoardProps {
  deals: Deal[];
  onRefresh: () => void;
  onEditDeal?: (deal: Deal) => void;
  onDeleteDeal?: (dealId: string) => void;
}

const KanbanBoard = ({ deals, onRefresh, onEditDeal, onDeleteDeal }: KanbanBoardProps) => {
  const [activeDeal, setActiveDeal] = useState<Deal | null>(null);
  const [stageDialog, setStageDialog] = useState<{
    open: boolean;
    deal: Deal | null;
    targetStage: string;
  }>({ open: false, deal: null, targetStage: '' });

  const handleDragStart = (event: DragStartEvent) => {
    const deal = deals.find(d => d.id === event.active.id);
    if (deal) {
      setActiveDeal(deal);
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveDeal(null);

    if (!over || active.id === over.id) return;

    const dealId = active.id as string;
    const targetStage = over.id as string;
    const deal = deals.find(d => d.id === dealId);

    if (!deal) return;

    // If moving to the same stage, do nothing
    if (deal.stage === targetStage) return;

    // Check completion status for current stage
    const completionStatus = getStageCompletionStatus(deal);
    const finalStages = ['Won', 'Lost', 'Dropped'];
    
    // Prevent moving forward if current stage is not complete (except to final stages)
    if (!finalStages.includes(targetStage) && completionStatus !== 'complete') {
      toast({
        variant: "destructive",
        title: "Cannot move deal",
        description: "Please complete all required fields for the current stage before moving forward.",
      });
      return;
    }

    // Check if this is a move to final stages or requires validation
    const requiresValidation = finalStages.includes(targetStage) || !canMoveToStage(deal, targetStage);

    if (requiresValidation) {
      // Open requirements dialog
      setStageDialog({
        open: true,
        deal,
        targetStage
      });
      return;
    }

    // Direct move for simple cases
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast({
          variant: "destructive",
          title: "Authentication required",
          description: "Please log in to move deals.",
        });
        return;
      }

      const { error } = await supabase
        .from('deals')
        .update({ 
          stage: targetStage,
          modified_by: user.id
        })
        .eq('id', dealId);

      if (error) throw error;

      toast({
        title: "Deal moved",
        description: `Deal moved to ${targetStage} stage`,
      });

      onRefresh();
    } catch (error: any) {
      console.error('Error updating deal stage:', error);
      toast({
        variant: "destructive",
        title: "Error moving deal",
        description: error.message,
      });
    }
  };

  const getDealsForStage = (stage: string) => {
    return deals.filter(deal => deal.stage === stage);
  };

  const visibleStages = getVisibleStages(deals);

  const handleStageDialogSuccess = () => {
    setStageDialog({ open: false, deal: null, targetStage: '' });
    onRefresh();
  };

  return (
    <>
      <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <div className={`grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6 min-h-[600px] w-full ${
          visibleStages.length <= 3 ? 'lg:grid-cols-3' : 
          visibleStages.length <= 5 ? 'lg:grid-cols-5' : 'lg:grid-cols-7'
        }`}>
          {visibleStages.map((stage) => (
            <KanbanColumn
              key={stage}
              stage={stage}
              deals={getDealsForStage(stage)}
              onRefresh={onRefresh}
              onEditDeal={onEditDeal}
              onDeleteDeal={onDeleteDeal}
            />
          ))}
        </div>
        
        <DragOverlay>
          {activeDeal ? (
            <Card className="rotate-2 opacity-90 shadow-xl border-2 border-blue-300 bg-white">
              <DealCard deal={activeDeal} onRefresh={onRefresh} onEdit={onEditDeal} />
            </Card>
          ) : null}
        </DragOverlay>
      </DndContext>

      {/* Stage Requirements Dialog */}
      {stageDialog.deal && (
        <StageRequirementsDialog
          open={stageDialog.open}
          onOpenChange={(open) => 
            setStageDialog(prev => ({ ...prev, open }))
          }
          deal={stageDialog.deal}
          targetStage={stageDialog.targetStage}
          onSuccess={handleStageDialogSuccess}
        />
      )}
    </>
  );
};

export default KanbanBoard;
