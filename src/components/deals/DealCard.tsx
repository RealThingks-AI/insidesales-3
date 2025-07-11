
import React, { useState } from 'react';
import { useDraggable } from '@dnd-kit/core';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, User, Building, CheckCircle, AlertCircle, XCircle, DollarSign, Percent } from 'lucide-react';
import { Deal, getStageCompletionStatus } from '@/hooks/useDeals';
import StagePanelDialog from './StagePanelDialog';

interface DealCardProps {
  deal: Deal;
  onRefresh: () => void;
}

const DealCard = ({ deal, onRefresh }: DealCardProps) => {
  const [isStagePanelOpen, setIsStagePanelOpen] = useState(false);
  const [linkedLead, setLinkedLead] = useState<any>(null);
  const [linkedLeadOwner, setLinkedLeadOwner] = useState<any>(null);

  const completionStatus = getStageCompletionStatus(deal);
  const isDraggingDisabled = completionStatus !== 'complete' && !['Won', 'Lost', 'Dropped'].includes(deal.stage);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    isDragging,
  } = useDraggable({
    id: deal.id,
    disabled: isDraggingDisabled,
  });

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
  } : undefined;

  // Fetch linked lead data when component mounts
  React.useEffect(() => {
    const fetchLeadData = async () => {
      if (!deal.related_lead_id) return;

      try {
        const { supabase } = await import('@/integrations/supabase/client');
        
        const { data: lead, error: leadError } = await supabase
          .from('leads')
          .select('lead_name, company_name, contact_owner')
          .eq('id', deal.related_lead_id)
          .single();

        if (leadError) {
          console.error('Error fetching lead:', leadError);
          return;
        }

        setLinkedLead(lead);

        // Fetch lead owner profile if contact_owner exists
        if (lead.contact_owner) {
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('full_name')
            .eq('id', lead.contact_owner)
            .single();

          if (!profileError && profile) {
            setLinkedLeadOwner(profile);
          }
        }
      } catch (error) {
        console.error('Error in fetchLeadData:', error);
      }
    };

    fetchLeadData();
  }, [deal.related_lead_id]);

  const getStageColor = (stage: string) => {
    const colors: Record<string, string> = {
      'Discussions': 'bg-blue-100 text-blue-800',
      'Qualified': 'bg-yellow-100 text-yellow-800',
      'RFQ': 'bg-orange-100 text-orange-800',
      'Offered': 'bg-purple-100 text-purple-800',
      'Won': 'bg-green-100 text-green-800',
      'Lost': 'bg-red-100 text-red-800',
      'Dropped': 'bg-gray-100 text-gray-600'
    };
    return colors[stage] || 'bg-gray-100 text-gray-800';
  };

  const getCompletionIcon = () => {
    switch (completionStatus) {
      case 'complete':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'partial':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      case 'incomplete':
        return <XCircle className="h-4 w-4 text-red-500" />;
    }
  };

  const formatCurrency = (amount?: number) => {
    if (!amount) return 'N/A';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: deal.currency || 'USD'
    }).format(amount);
  };

  return (
    <>
      <Card 
        ref={setNodeRef}
        style={style}
        className={`w-full max-w-72 bg-white border border-gray-200 cursor-pointer ${
          isDragging ? 'opacity-50' : ''
        } ${isDraggingDisabled ? 'cursor-not-allowed opacity-70' : 'hover:border-gray-400'}`}
        onClick={() => setIsStagePanelOpen(true)}
        {...attributes}
        {...listeners}
      >
        <CardHeader className="p-3 pb-2">
          <div className="flex justify-between items-start gap-2 mb-3">
            <CardTitle className="text-sm font-semibold text-gray-900 leading-tight flex-1">
              {deal.deal_name}
            </CardTitle>
            <div className="flex-shrink-0">
              {getCompletionIcon()}
            </div>
          </div>
          
          {/* Company, Lead, and Owner Info */}
          <div className="space-y-1.5">
            <div className="flex items-center text-xs text-gray-600">
              <Building className="h-3 w-3 mr-2 text-gray-500 flex-shrink-0" />
              <span className="truncate">
                {linkedLead?.company_name || 'No Company'}
              </span>
            </div>
            
            <div className="flex items-center text-xs text-gray-600">
              <User className="h-3 w-3 mr-2 text-gray-500 flex-shrink-0" />
              <span className="truncate">
                {linkedLead?.lead_name || 'No Lead Name'}
              </span>
            </div>
            
            <div className="flex items-center text-xs text-gray-600">
              <User className="h-3 w-3 mr-2 text-gray-500 flex-shrink-0" />
              <span className="truncate">
                Owner: {linkedLeadOwner?.full_name || 'No Owner'}
              </span>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="p-3 pt-0">
          {/* Deal Metrics */}
          <div className="space-y-1.5">
            {deal.amount && (
              <div className="flex items-center justify-between">
                <div className="flex items-center text-xs text-gray-600">
                  <DollarSign className="h-3 w-3 mr-2 text-gray-500" />
                  <span>Value</span>
                </div>
                <span className="text-xs font-medium text-gray-900">
                  {formatCurrency(deal.amount)}
                </span>
              </div>
            )}
            
            {deal.probability !== null && deal.probability !== undefined && (
              <div className="flex items-center justify-between">
                <div className="flex items-center text-xs text-gray-600">
                  <Percent className="h-3 w-3 mr-2 text-gray-500" />
                  <span>Probability</span>
                </div>
                <span className="text-xs font-medium text-gray-900">
                  {deal.probability}%
                </span>
              </div>
            )}
            
            {deal.closing_date && (
              <div className="flex items-center justify-between">
                <div className="flex items-center text-xs text-gray-600">
                  <Calendar className="h-3 w-3 mr-2 text-gray-500" />
                  <span>Close Date</span>
                </div>
                <span className="text-xs font-medium text-gray-900">
                  {new Date(deal.closing_date).toLocaleDateString()}
                </span>
              </div>
            )}
          </div>

        </CardContent>
      </Card>

      <StagePanelDialog
        open={isStagePanelOpen}
        onOpenChange={setIsStagePanelOpen}
        deal={deal}
        onSuccess={() => {
          setIsStagePanelOpen(false);
          onRefresh();
        }}
      />
    </>
  );
};

export default DealCard;
