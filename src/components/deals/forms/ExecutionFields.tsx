import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';

interface ExecutionFieldsProps {
  formData: any;
  updateFormData: (updates: any) => void;
  readOnly?: boolean;
}

export const ExecutionFields = ({ formData, updateFormData, readOnly = false }: ExecutionFieldsProps) => {
  return (
    <>
      <div className={`space-y-4 border-t pt-4 ${readOnly ? 'opacity-75' : ''}`}>
        <h3 className={`font-medium text-sm ${readOnly ? 'text-gray-500' : 'text-gray-700'}`}>
          Execution {readOnly && '(Read Only)'}
        </h3>
        
        <div className="flex items-center space-x-2">
          <Checkbox
            id="execution_started"
            checked={formData.execution_started}
            onCheckedChange={readOnly ? undefined : (checked) => updateFormData({ execution_started: checked as boolean })}
            disabled={readOnly}
          />
          <Label htmlFor="execution_started">Execution Started</Label>
        </div>

        <div className="space-y-2">
          <Label htmlFor="begin_execution_date">Begin Execution Date</Label>
          <Input
            id="begin_execution_date"
            type="date"
            value={formData.begin_execution_date}
            onChange={readOnly ? undefined : (e) => updateFormData({ begin_execution_date: e.target.value })}
            readOnly={readOnly}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="internal_notes">Internal Notes</Label>
        <Textarea
          id="internal_notes"
          value={formData.internal_notes}
          onChange={readOnly ? undefined : (e) => updateFormData({ internal_notes: e.target.value })}
          rows={2}
          readOnly={readOnly}
        />
      </div>
    </>
  );
};