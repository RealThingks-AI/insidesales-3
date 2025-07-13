
import { useDroppable } from '@dnd-kit/core';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import DealCard from './DealCard';
import { Deal, canMoveToStage } from '@/hooks/useDeals';

interface KanbanColumnProps {
  stage: string;
  deals: Deal[];
  onRefresh: () => void;
  onEditDeal?: (deal: Deal) => void;
  onDeleteDeal?: (dealId: string) => void;
}

const getStageColor = (stage: string) => {
  const colors: Record<string, string> = {
    'Discussions': 'bg-blue-50 border-blue-200',
    'Qualified': 'bg-amber-50 border-amber-200',
    'RFQ': 'bg-orange-50 border-orange-200',
    'Offered': 'bg-purple-50 border-purple-200',
    'Won': 'bg-emerald-50 border-emerald-200',
    'Lost': 'bg-red-50 border-red-200',
    'Dropped': 'bg-gray-50 border-gray-200',
  };
  return colors[stage] || 'bg-gray-50 border-gray-200';
};

const getStageBadgeColor = (stage: string) => {
  const colors: Record<string, string> = {
    'Discussions': 'bg-blue-100 text-blue-700 border-blue-200',
    'Qualified': 'bg-amber-100 text-amber-700 border-amber-200',
    'RFQ': 'bg-orange-100 text-orange-700 border-orange-200',
    'Offered': 'bg-purple-100 text-purple-700 border-purple-200',
    'Won': 'bg-emerald-100 text-emerald-700 border-emerald-200',
    'Lost': 'bg-red-100 text-red-700 border-red-200',
    'Dropped': 'bg-gray-100 text-gray-700 border-gray-200',
  };
  return colors[stage] || 'bg-gray-100 text-gray-700 border-gray-200';
};

const getStageDescription = (stage: string) => {
  return '';
};

const getStageProgress = (deals: Deal[]) => {
  if (deals.length === 0) return 0;
  
  const completedDeals = deals.filter(deal => {
    const nextStages: Record<string, string> = {
      'Discussions': 'Qualified',
      'Qualified': 'RFQ',
      'RFQ': 'Offered',
      'Offered': 'Won'
    };
    
    const nextStage = nextStages[deal.stage];
    return nextStage ? canMoveToStage(deal, nextStage) : true;
  });
  
  return Math.round((completedDeals.length / deals.length) * 100);
};

const KanbanColumn = ({ stage, deals, onRefresh, onEditDeal, onDeleteDeal }: KanbanColumnProps) => {
  const { setNodeRef, isOver } = useDroppable({
    id: stage,
  });

  const totalValue = deals.reduce((sum, deal) => sum + (deal.amount || 0), 0);
  const progressPercentage = getStageProgress(deals);

  return (
    <div className={`rounded-xl border-2 border-dashed transition-colors ${
      isOver ? 'border-blue-400 bg-blue-50' : 'border-transparent'
    } ${getStageColor(stage)}`}>
      <Card className="shadow-sm border-0 bg-transparent">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between mb-2">
            <CardTitle className="text-base font-bold text-gray-800 tracking-tight">
              {stage}
            </CardTitle>
            <Badge 
              variant="secondary" 
              className={`${getStageBadgeColor(stage)} font-semibold px-2.5 py-1 rounded-full border`}
            >
              {deals.length}
            </Badge>
          </div>
          <p className="text-sm text-gray-600 leading-relaxed">{getStageDescription(stage)}</p>
          
          {totalValue > 0 && (
            <div className="mt-3 p-2 bg-white/50 rounded-lg border border-white/20">
              <p className="text-sm font-semibold text-gray-700">
                Total: ${totalValue.toLocaleString()}
              </p>
            </div>
          )}
          
          {/* Progress indicator for non-final stages */}
          {!['Won', 'Lost', 'Dropped'].includes(stage) && deals.length > 0 && (
            <div className="mt-3 space-y-2">
              <div className="flex justify-between text-xs font-medium text-gray-600">
                <span>Ready to advance</span>
                <span>{progressPercentage}%</span>
              </div>
              <Progress value={progressPercentage} className="h-2 bg-white/30" />
            </div>
          )}
        </CardHeader>
        <CardContent
          ref={setNodeRef}
          className="space-y-4 min-h-[420px] px-4 pb-4"
        >
          {deals.map((deal) => (
            <DealCard key={deal.id} deal={deal} onRefresh={onRefresh} onEdit={onEditDeal} />
          ))}
          {deals.length === 0 && (
            <div className="flex items-center justify-center h-32 text-gray-400 text-sm">
              No deals in this stage
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default KanbanColumn;
