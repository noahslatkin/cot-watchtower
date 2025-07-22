import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { useDateRange } from "@/contexts/DateRangeContext";

const presets = [
  { label: "30 days", value: "30d", days: 30 },
  { label: "60 days", value: "60d", days: 60 },
  { label: "90 days", value: "90d", days: 90 },
  { label: "180 days", value: "180d", days: 180 },
  { label: "1 year", value: "1y", days: 365 },
  { label: "Custom", value: "custom", days: 0 }
];

export function DateRangePicker() {
  const { dateRange, setDateRange, preset, setPreset } = useDateRange();
  const [isOpen, setIsOpen] = useState(false);

  const handlePresetChange = (value: string) => {
    setPreset(value);
    
    if (value !== "custom") {
      const selectedPreset = presets.find(p => p.value === value);
      if (selectedPreset) {
        const to = new Date(); // Use current date as latest
        const from = new Date(to);
        from.setDate(to.getDate() - selectedPreset.days);
        setDateRange({ from, to });
      }
    }
  };

  const handleCustomDateChange = (from: Date | undefined, to: Date | undefined) => {
    if (from && to) {
      setDateRange({ from, to });
      setPreset("custom");
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Select value={preset} onValueChange={handlePresetChange}>
        <SelectTrigger className="w-[140px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {presets.map((preset) => (
            <SelectItem key={preset.value} value={preset.value}>
              {preset.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {preset === "custom" && (
        <Popover open={isOpen} onOpenChange={setIsOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" className="w-[200px] justify-start text-left font-normal">
              <CalendarIcon className="mr-2 h-4 w-4" />
              {dateRange.from && dateRange.to ? (
                `${format(dateRange.from, "MMM dd")} - ${format(dateRange.to, "MMM dd")}`
              ) : (
                "Pick a date range"
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <div className="flex">
              <div className="p-3">
                <div className="text-sm font-medium mb-2">From</div>
                <Calendar
                  mode="single"
                  selected={dateRange.from}
                  onSelect={(date) => date && handleCustomDateChange(date, dateRange.to)}
                  disabled={(date) => date > new Date() || date < new Date("2008-01-01")}
                />
              </div>
              <div className="p-3 border-l">
                <div className="text-sm font-medium mb-2">To</div>
                <Calendar
                  mode="single"
                  selected={dateRange.to}
                  onSelect={(date) => date && handleCustomDateChange(dateRange.from, date)}
                  disabled={(date) => date > new Date() || date < dateRange.from}
                />
              </div>
            </div>
          </PopoverContent>
        </Popover>
      )}

      <div className="text-sm text-muted-foreground">
        {format(dateRange.from, "MMM dd, yyyy")} - {format(dateRange.to, "MMM dd, yyyy")}
      </div>
    </div>
  );
}