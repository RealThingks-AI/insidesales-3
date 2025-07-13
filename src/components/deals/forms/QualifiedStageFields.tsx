import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface QualifiedStageFieldsProps {
  formData: any;
  updateFormData: (updates: any) => void;
  readOnly?: boolean;
}

export const QualifiedStageFields = ({ formData, updateFormData, readOnly = false }: QualifiedStageFieldsProps) => {
  return (
    <div className={`space-y-4 border-t pt-4 ${readOnly ? 'opacity-75' : ''}`}>
      <h3 className={`font-medium text-sm ${readOnly ? 'text-gray-500' : 'text-gray-700'}`}>
        Qualified Stage {readOnly && '(Read Only)'}
      </h3>
      
      <div className="flex items-center space-x-2">
        <Checkbox
          id="nda_signed"
          checked={formData.nda_signed}
          onCheckedChange={readOnly ? undefined : (checked) => updateFormData({ nda_signed: checked as boolean })}
          disabled={readOnly}
        />
        <Label htmlFor="nda_signed">NDA Signed</Label>
      </div>

      <div className="space-y-2">
        <Label htmlFor="budget_confirmed">Budget Confirmed</Label>
        <Select 
          value={formData.budget_confirmed} 
          onValueChange={readOnly ? undefined : (value) => updateFormData({ budget_confirmed: value })}
          disabled={readOnly}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select budget status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Yes">Yes</SelectItem>
            <SelectItem value="No">No</SelectItem>
            <SelectItem value="Estimate Only">Estimate Only</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="supplier_portal_access">Supplier Portal Access</Label>
        <Select 
          value={formData.supplier_portal_access} 
          onValueChange={readOnly ? undefined : (value) => updateFormData({ supplier_portal_access: value })}
          disabled={readOnly}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select portal status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Invited">Invited</SelectItem>
            <SelectItem value="Approved">Approved</SelectItem>
            <SelectItem value="Not Invited">Not Invited</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="expected_deal_timeline_start">Timeline Start</Label>
          <Input
            id="expected_deal_timeline_start"
            type="date"
            value={formData.expected_deal_timeline_start}
            onChange={readOnly ? undefined : (e) => updateFormData({ expected_deal_timeline_start: e.target.value })}
            readOnly={readOnly}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="expected_deal_timeline_end">Timeline End</Label>
          <Input
            id="expected_deal_timeline_end"
            type="date"
            value={formData.expected_deal_timeline_end}
            onChange={readOnly ? undefined : (e) => updateFormData({ expected_deal_timeline_end: e.target.value })}
            readOnly={readOnly}
          />
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <Checkbox
          id="supplier_portal_required"
          checked={formData.supplier_portal_required}
          onCheckedChange={readOnly ? undefined : (checked) => updateFormData({ supplier_portal_required: checked as boolean })}
          disabled={readOnly}
        />
        <Label htmlFor="supplier_portal_required">Supplier Portal Required</Label>
      </div>
    </div>
  );
};