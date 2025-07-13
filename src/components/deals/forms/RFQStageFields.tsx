import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

interface RFQStageFieldsProps {
  formData: any;
  updateFormData: (updates: any) => void;
  readOnly?: boolean;
}

export const RFQStageFields = ({ formData, updateFormData, readOnly = false }: RFQStageFieldsProps) => {
  return (
    <div className={`space-y-4 border-t pt-4 ${readOnly ? 'opacity-75' : ''}`}>
      <h3 className={`font-medium text-sm ${readOnly ? 'text-gray-500' : 'text-gray-700'}`}>
        RFQ Stage {readOnly && '(Read Only)'}
      </h3>
      
      <div className="space-y-2">
        <Label htmlFor="rfq_value">RFQ Value</Label>
        <Input
          id="rfq_value"
          type="number"
          step="0.01"
          value={formData.rfq_value}
          onChange={readOnly ? undefined : (e) => updateFormData({ rfq_value: e.target.value })}
          readOnly={readOnly}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="rfq_document_url">RFQ Document URL</Label>
        <Input
          id="rfq_document_url"
          type="url"
          value={formData.rfq_document_url}
          onChange={readOnly ? undefined : (e) => updateFormData({ rfq_document_url: e.target.value })}
          readOnly={readOnly}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="product_service_scope">Product/Service Scope</Label>
        <Textarea
          id="product_service_scope"
          value={formData.product_service_scope}
          onChange={readOnly ? undefined : (e) => updateFormData({ product_service_scope: e.target.value })}
          rows={2}
          readOnly={readOnly}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="rfq_confirmation_note">RFQ Confirmation Note</Label>
        <Textarea
          id="rfq_confirmation_note"
          value={formData.rfq_confirmation_note}
          onChange={readOnly ? undefined : (e) => updateFormData({ rfq_confirmation_note: e.target.value })}
          rows={2}
          readOnly={readOnly}
        />
      </div>
    </div>
  );
};