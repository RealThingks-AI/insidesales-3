import { useState, useMemo } from 'react';
import { Deal, DEAL_STAGES, getStageIndex } from './useDeals';

export interface StageFieldMapping {
  stage: string;
  fields: string[];
}

export const STAGE_FIELD_MAPPINGS: StageFieldMapping[] = [
  {
    stage: 'Discussions',
    fields: [
      'customer_need_identified',
      'need_summary', 
      'decision_maker_present',
      'customer_agreed_on_need',
      'discussion_notes'
    ]
  },
  {
    stage: 'Qualified',
    fields: [
      'nda_signed',
      'budget_confirmed',
      'supplier_portal_access',
      'expected_deal_timeline_start',
      'expected_deal_timeline_end',
      'budget_holder',
      'decision_makers',
      'timeline',
      'supplier_portal_required'
    ]
  },
  {
    stage: 'RFQ',
    fields: [
      'rfq_value',
      'rfq_document_url',
      'rfq_document_link',
      'product_service_scope',
      'rfq_confirmation_note'
    ]
  },
  {
    stage: 'Offered',
    fields: [
      'proposal_sent_date',
      'negotiation_status',
      'decision_expected_date',
      'offer_sent_date',
      'revised_offer_notes',
      'negotiation_notes'
    ]
  },
  {
    stage: 'Won',
    fields: [
      'win_reason',
      'execution_started',
      'begin_execution_date',
      'confirmation_note'
    ]
  },
  {
    stage: 'Lost',
    fields: [
      'loss_reason',
      'lost_to',
      'learning_summary'
    ]
  },
  {
    stage: 'Dropped',
    fields: [
      'drop_reason',
      'drop_summary'
    ]
  }
];

export const BASIC_FIELDS = [
  'deal_name',
  'stage',
  'amount',
  'probability',
  'closing_date',
  'currency',
  'description',
  'internal_notes'
];

export const useStageBasedVisibility = (deal: Deal) => {
  const [showPreviousStageFields, setShowPreviousStageFields] = useState(false);

  const currentStageIndex = useMemo(() => getStageIndex(deal.stage), [deal.stage]);

  const visibleStages = useMemo(() => {
    if (showPreviousStageFields) {
      // Show all stages up to and including current stage
      return DEAL_STAGES.slice(0, currentStageIndex + 1);
    } else {
      // Show only current stage and future stages
      return [deal.stage];
    }
  }, [deal.stage, currentStageIndex, showPreviousStageFields]);

  const isFieldVisible = useMemo(() => {
    return (fieldKey: string) => {
      // Basic fields are always visible
      if (BASIC_FIELDS.includes(fieldKey)) {
        return true;
      }

      // Check if field belongs to any visible stage
      return STAGE_FIELD_MAPPINGS.some(mapping => 
        visibleStages.includes(mapping.stage) && mapping.fields.includes(fieldKey)
      );
    };
  }, [visibleStages]);

  const isFieldReadOnly = useMemo(() => {
    return (fieldKey: string) => {
      // Basic fields are always editable
      if (BASIC_FIELDS.includes(fieldKey)) {
        return false;
      }

      // Find which stage this field belongs to
      const fieldStage = STAGE_FIELD_MAPPINGS.find(mapping => 
        mapping.fields.includes(fieldKey)
      )?.stage;

      if (!fieldStage) return false;

      const fieldStageIndex = getStageIndex(fieldStage);
      
      // Fields from previous stages are read-only
      return fieldStageIndex < currentStageIndex;
    };
  }, [currentStageIndex]);

  const getVisibleStageFieldMappings = useMemo(() => {
    return STAGE_FIELD_MAPPINGS.filter(mapping => 
      visibleStages.includes(mapping.stage)
    );
  }, [visibleStages]);

  const canShowPreviousStageFields = useMemo(() => {
    return currentStageIndex > 0;
  }, [currentStageIndex]);

  return {
    showPreviousStageFields,
    setShowPreviousStageFields,
    visibleStages,
    isFieldVisible,
    isFieldReadOnly,
    getVisibleStageFieldMappings,
    canShowPreviousStageFields,
    currentStageIndex
  };
};