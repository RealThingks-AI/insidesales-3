import { useState } from 'react';
import { Settings, RotateCcw } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Separator } from '@/components/ui/separator';
import { useDashboardPreferences, DashboardPreferences } from '@/hooks/useDashboardPreferences';

const WIDGET_OPTIONS = [
  { id: 'pipeline', label: 'Pipeline Overview', description: 'Deals pipeline by stage' },
  { id: 'meetings', label: 'Meetings Summary', description: 'Upcoming and past meetings' },
];

const LAYOUT_OPTIONS = [
  { id: 'grid', label: 'Grid View', description: 'Standard card layout' },
  { id: 'compact', label: 'Compact View', description: 'Smaller cards, more info' },
  { id: 'analytics', label: 'Analytics-Only', description: 'Focus on charts and data' },
  { id: 'minimal', label: 'Minimal', description: 'Essential info only' },
];

export const DashboardCustomizationModal = () => {
  const { preferences, savePreferences, resetPreferences } = useDashboardPreferences();
  const [isOpen, setIsOpen] = useState(false);

  const handleWidgetToggle = (widgetId: string, checked: boolean) => {
    const updatedWidgets = checked
      ? [...preferences.visible_widgets, widgetId]
      : preferences.visible_widgets.filter(id => id !== widgetId);
    
    savePreferences({ visible_widgets: updatedWidgets });
  };

  const handleLayoutChange = (layout: DashboardPreferences['layout_view']) => {
    savePreferences({ layout_view: layout });
  };

  const handleReset = async () => {
    await resetPreferences();
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Settings className="h-4 w-4" />
          Customize Dashboard
        </Button>
      </DialogTrigger>
      
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Customize Dashboard</DialogTitle>
          <DialogDescription>
            Personalize your dashboard by selecting widgets and choosing your preferred layout.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Widget Visibility */}
          <div>
            <h3 className="text-lg font-medium mb-3">Visible Widgets</h3>
            <div className="space-y-3">
              {WIDGET_OPTIONS.map((widget) => (
                <div key={widget.id} className="flex items-start space-x-3">
                  <Checkbox
                    id={widget.id}
                    checked={preferences.visible_widgets.includes(widget.id)}
                    onCheckedChange={(checked) => 
                      handleWidgetToggle(widget.id, checked as boolean)
                    }
                  />
                  <div className="flex flex-col">
                    <Label htmlFor={widget.id} className="text-sm font-medium">
                      {widget.label}
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      {widget.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <Separator />

          {/* Layout Options */}
          <div>
            <h3 className="text-lg font-medium mb-3">Layout View</h3>
            <RadioGroup
              value={preferences.layout_view}
              onValueChange={handleLayoutChange}
              className="space-y-3"
            >
              {LAYOUT_OPTIONS.map((layout) => (
                <div key={layout.id} className="flex items-start space-x-3">
                  <RadioGroupItem value={layout.id} id={layout.id} className="mt-1" />
                  <div className="flex flex-col">
                    <Label htmlFor={layout.id} className="text-sm font-medium">
                      {layout.label}
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      {layout.description}
                    </p>
                  </div>
                </div>
              ))}
            </RadioGroup>
          </div>

          <Separator />

          {/* Reset Button */}
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-medium">Reset to Default</h3>
              <p className="text-sm text-muted-foreground">
                Restore all dashboard settings to their original state
              </p>
            </div>
            <Button
              variant="outline"
              onClick={handleReset}
              className="gap-2 text-destructive hover:text-destructive"
            >
              <RotateCcw className="h-4 w-4" />
              Reset Dashboard
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};