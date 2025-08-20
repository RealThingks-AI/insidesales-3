
import { useState, useEffect } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Filter, X } from "lucide-react";
import { format } from "date-fns";
import { DealStage, DEAL_STAGES, Deal } from "@/types/deal";
import { cn } from "@/lib/utils";

export interface FilterState {
  stage: DealStage | "all";
  region: string;
  leadOwner: string;
  priority: string;
  probability: [number];
  expectedClosingDateStart?: Date;
  expectedClosingDateEnd?: Date;
  dealName: string;
  projectName: string;
  leadName: string;
  customerName: string;
}

interface DealsFilterPanelProps {
  onFilteredDealsChange: (deals: Deal[]) => void;
}

const initialFilters: FilterState = {
  stage: "all",
  region: "",
  leadOwner: "",
  priority: "all",
  probability: [0],
  dealName: "",
  projectName: "",
  leadName: "",
  customerName: "",
};

export const DealsFilterPanel = ({ onFilteredDealsChange }: DealsFilterPanelProps) => {
  const [filters, setFilters] = useState<FilterState>(initialFilters);
  const [isOpen, setIsOpen] = useState(false);

  const updateFilter = <K extends keyof FilterState>(key: K, value: FilterState[K]) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const applyFilters = () => {
    // For now, just close the panel - actual filtering logic would go here
    // In a real implementation, this would filter the deals based on the current filters
    setIsOpen(false);
    console.log('Applying filters:', filters);
    // This would normally call onFilteredDealsChange with filtered results
  };

  const clearAllFilters = () => {
    const clearedFilters = { ...initialFilters };
    setFilters(clearedFilters);
    console.log('Cleared all filters');
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (filters.stage !== "all") count++;
    if (filters.region) count++;
    if (filters.leadOwner) count++;
    if (filters.priority !== "all") count++;
    if (filters.probability[0] > 0) count++;
    if (filters.expectedClosingDateStart || filters.expectedClosingDateEnd) count++;
    if (filters.dealName) count++;
    if (filters.projectName) count++;
    if (filters.leadName) count++;
    if (filters.customerName) count++;
    return count;
  };

  const activeFiltersCount = getActiveFiltersCount();

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Filter className="w-4 h-4" />
          Filters
          {activeFiltersCount > 0 && (
            <span className="bg-primary text-primary-foreground text-xs px-2 py-1 rounded-full">
              {activeFiltersCount}
            </span>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-[400px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Filter className="w-4 h-4" />
            Filter Deals
          </SheetTitle>
        </SheetHeader>

        <div className="space-y-6 mt-6">
          {/* Stage Filter */}
          <div className="space-y-2">
            <Label htmlFor="stage">Stage</Label>
            <Select value={filters.stage} onValueChange={(value) => updateFilter("stage", value as DealStage | "all")}>
              <SelectTrigger>
                <SelectValue placeholder="Select stage" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Stages</SelectItem>
                {DEAL_STAGES.map(stage => (
                  <SelectItem key={stage} value={stage}>
                    {stage}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Region Filter */}
          <div className="space-y-2">
            <Label htmlFor="region">Region</Label>
            <Input
              id="region"
              placeholder="Enter region..."
              value={filters.region}
              onChange={(e) => updateFilter("region", e.target.value)}
            />
          </div>

          {/* Lead Owner Filter */}
          <div className="space-y-2">
            <Label htmlFor="leadOwner">Lead Owner</Label>
            <Input
              id="leadOwner"
              placeholder="Enter lead owner..."
              value={filters.leadOwner}
              onChange={(e) => updateFilter("leadOwner", e.target.value)}
            />
          </div>

          {/* Priority Filter */}
          <div className="space-y-2">
            <Label htmlFor="priority">Priority</Label>
            <Select value={filters.priority} onValueChange={(value) => updateFilter("priority", value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priorities</SelectItem>
                <SelectItem value="1">High (1)</SelectItem>
                <SelectItem value="2">Medium (2)</SelectItem>
                <SelectItem value="3">Low (3)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Probability Filter */}
          <div className="space-y-2">
            <Label>Probability (minimum %)</Label>
            <div className="px-3">
              <Slider
                value={filters.probability}
                onValueChange={(value) => updateFilter("probability", value as [number])}
                max={100}
                step={5}
                className="w-full"
              />
              <div className="flex justify-between text-sm text-muted-foreground mt-1">
                <span>0%</span>
                <span className="font-medium">{filters.probability[0]}%</span>
                <span>100%</span>
              </div>
            </div>
          </div>

          {/* Expected Closing Date Range */}
          <div className="space-y-2">
            <Label>Expected Closing Date</Label>
            <div className="space-y-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !filters.expectedClosingDateStart && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {filters.expectedClosingDateStart ? (
                      format(filters.expectedClosingDateStart, "PPP")
                    ) : (
                      <span>From date</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={filters.expectedClosingDateStart}
                    onSelect={(date) => updateFilter("expectedClosingDateStart", date)}
                    initialFocus
                    className="p-3 pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
              
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !filters.expectedClosingDateEnd && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {filters.expectedClosingDateEnd ? (
                      format(filters.expectedClosingDateEnd, "PPP")
                    ) : (
                      <span>To date</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={filters.expectedClosingDateEnd}
                    onSelect={(date) => updateFilter("expectedClosingDateEnd", date)}
                    initialFocus
                    className="p-3 pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Text Search Fields */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="dealName">Deal Name</Label>
              <Input
                id="dealName"
                placeholder="Search deal name..."
                value={filters.dealName}
                onChange={(e) => updateFilter("dealName", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="projectName">Project Name</Label>
              <Input
                id="projectName"
                placeholder="Search project name..."
                value={filters.projectName}
                onChange={(e) => updateFilter("projectName", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="leadName">Lead Name</Label>
              <Input
                id="leadName"
                placeholder="Search lead name..."
                value={filters.leadName}
                onChange={(e) => updateFilter("leadName", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="customerName">Customer Name</Label>
              <Input
                id="customerName"
                placeholder="Search customer name..."
                value={filters.customerName}
                onChange={(e) => updateFilter("customerName", e.target.value)}
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-6 border-t">
            <Button 
              onClick={clearAllFilters} 
              variant="outline" 
              className="flex-1"
              disabled={activeFiltersCount === 0}
            >
              <X className="w-4 h-4 mr-2" />
              Clear All
            </Button>
            <Button onClick={applyFilters} className="flex-1">
              Apply Filters
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};
