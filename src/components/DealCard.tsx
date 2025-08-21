
import { Deal } from "@/types/deal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Edit, Trash2, CheckSquare } from "lucide-react";
import { format } from "date-fns";

interface DealCardProps {
  deal: Deal;
  onClick: (e?: React.MouseEvent) => void;
  isDragging?: boolean;
  isSelected?: boolean;
  selectionMode?: boolean;
  onDelete: (dealId: string) => void;
  onStageChange: (dealId: string, newStage: any) => void;
  onActionClick?: (deal: Deal) => void;
}

export const DealCard = ({ 
  deal, 
  onClick, 
  isDragging, 
  isSelected, 
  selectionMode,
  onDelete,
  onStageChange,
  onActionClick
}: DealCardProps) => {
  const formatCurrency = (amount: number | undefined) => {
    if (!amount) return '';
    return `€${amount.toLocaleString()}`;
  };

  const formatDate = (date: string | undefined) => {
    if (!date) return '';
    try {
      return format(new Date(date), 'MMM dd');
    } catch {
      return '';
    }
  };

  const getPriorityColor = (priority: number | undefined) => {
    if (!priority) return 'bg-gray-100 text-gray-800';
    if (priority >= 8) return 'bg-red-100 text-red-800';
    if (priority >= 6) return 'bg-orange-100 text-orange-800';
    if (priority >= 4) return 'bg-yellow-100 text-yellow-800';
    return 'bg-green-100 text-green-800';
  };

  const handleActionClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onActionClick?.(deal);
  };

  return (
    <div
      onClick={onClick}
      className={`
        bg-card rounded-lg border border-border p-3 cursor-pointer 
        transition-all duration-200 hover:shadow-md hover:border-primary/30
        ${isDragging ? 'shadow-lg rotate-3 opacity-75' : ''}
        ${isSelected ? 'ring-2 ring-primary bg-primary/5' : ''}
        ${selectionMode ? 'hover:bg-muted/50' : 'hover:bg-accent/50'}
        group relative
      `}
    >
      <div className="space-y-2">
        <div className="flex items-start justify-between gap-2">
          <h4 className="font-medium text-sm leading-tight text-foreground line-clamp-2 flex-1">
            {deal.project_name || deal.deal_name}
          </h4>
          
          {!selectionMode && (
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
              <Button
                size="sm"
                variant="ghost"
                onClick={handleActionClick}
                className="h-6 w-6 p-0 hover:bg-primary/10"
                title="Action Items"
              >
                <CheckSquare className="h-3 w-3" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={(e) => {
                  e.stopPropagation();
                  onClick(e);
                }}
                className="h-6 w-6 p-0 hover:bg-primary/10"
                title="Edit"
              >
                <Edit className="h-3 w-3" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(deal.id);
                }}
                className="h-6 w-6 p-0 hover:bg-destructive/10 text-destructive"
                title="Delete"
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          )}
        </div>

        {deal.customer_name && (
          <p className="text-xs text-muted-foreground line-clamp-1">
            {deal.customer_name}
          </p>
        )}

        <div className="flex flex-wrap gap-1">
          {deal.priority && (
            <Badge 
              variant="secondary" 
              className={`text-xs px-2 py-0 h-5 ${getPriorityColor(deal.priority)}`}
            >
              P{deal.priority}
            </Badge>
          )}
          
          {deal.probability !== undefined && (
            <Badge variant="outline" className="text-xs px-2 py-0 h-5">
              {deal.probability}%
            </Badge>
          )}
        </div>

        <div className="space-y-1 text-xs text-muted-foreground">
          {deal.total_contract_value && (
            <div className="font-medium text-foreground">
              {formatCurrency(deal.total_contract_value)}
            </div>
          )}
          
          {deal.expected_closing_date && (
            <div>
              Due: {formatDate(deal.expected_closing_date)}
            </div>
          )}
          
          {deal.lead_owner && (
            <div className="truncate">
              Owner: {deal.lead_owner}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
