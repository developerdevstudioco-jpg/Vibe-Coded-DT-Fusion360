import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Button } from '../ui/button';
import { Checkbox } from '../ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Filters } from './index';
        
interface FilterDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  filters: Filters;
  onFiltersChange: (filters: Filters) => void;
}

const FilterDrawer: React.FC<FilterDrawerProps> = ({
  open,
  onOpenChange,
  filters,
  onFiltersChange,
}) => {
  const [tempFilters, setTempFilters] = useState<Filters>(filters);
  const [expandedGroups, setExpandedGroups] = useState({
    type: true,
    date: true,
    size: true,
  });

  useEffect(() => {
    setTempFilters(filters);
  }, [filters]);

  const toggleGroup = (group: 'type' | 'date' | 'size') => {
    setExpandedGroups((prev) => ({
      ...prev,
      [group]: !prev[group],
    }));
  };

  const handleFilterChange = (group: 'type' | 'date' | 'size', value: string) => {
    setTempFilters((prev) => {
      const values = prev[group] || [];
      const newValues = values.includes(value)
        ? values.filter((v) => v !== value)
        : [...values, value];
      return {
        ...prev,
        [group]: newValues.length > 0 ? newValues : undefined,
      };
    });
  };

  const handleApply = () => {
    onFiltersChange(tempFilters);
    onOpenChange(false);
  };

  const handleClear = () => {
    setTempFilters({});
  };

  const filterGroups = {
    type: {
      label: 'Type',
      options: [
        { value: 'folder', label: 'Folder' },
        { value: 'image', label: 'Image' },
      ],
    },
    date: {
      label: 'Date Modified',
      options: [
        { value: 'today', label: 'Today' },
        { value: '7d', label: 'Last 7 days' },
        { value: '30d', label: 'Last 30 days' },
        { value: 'older', label: 'Older' },
      ],
    },
    size: {
      label: 'Size',
      options: [
        { value: 'small', label: 'Small (< 1 MB)' },
        { value: 'medium', label: 'Medium (1–10 MB)' },
        { value: 'large', label: 'Large (> 10 MB)' },
      ],
    },
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Filters</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 max-h-96 overflow-auto">
          {(Object.keys(filterGroups) as Array<'type' | 'date' | 'size'>).map((groupKey) => {
            const group = filterGroups[groupKey];
            const isExpanded = expandedGroups[groupKey];

            return (
              <div
                key={groupKey}
                className="border border-slate-200 rounded-lg overflow-hidden"
              >
                <button
                  onClick={() => toggleGroup(groupKey)}
                  className="w-full flex items-center justify-between px-4 py-3 bg-slate-50 hover:bg-slate-100 transition-colors"
                >
                  <label className="flex items-center gap-2 cursor-pointer font-medium">
                    <Checkbox
                      checked={
                        tempFilters[groupKey] &&
                        tempFilters[groupKey]!.length > 0 &&
                        tempFilters[groupKey]!.length < group.options.length
                          ? 'indeterminate'
                          : tempFilters[groupKey]?.length === group.options.length
                      }
                      onCheckedChange={() => {
                        if (
                          tempFilters[groupKey]?.length ===
                          group.options.length
                        ) {
                          setTempFilters((prev) => ({
                            ...prev,
                            [groupKey]: undefined,
                          }));
                        } else {
                          setTempFilters((prev) => ({
                            ...prev,
                            [groupKey]: group.options.map((o) => o.value),
                          }));
                        }
                      }}
                    />
                    <span>{group.label}</span>
                  </label>
                  <span className="text-sm text-slate-500">
                    {isExpanded ? '▾' : '▸'}
                  </span>
                </button>

                {isExpanded && (
                  <div className="px-4 py-3 space-y-2 bg-white">
                    {group.options.map((option) => (
                      <label
                        key={option.value}
                        className="flex items-center gap-2 cursor-pointer"
                      >
                        <Checkbox
                          checked={
                            tempFilters[groupKey]?.includes(
                              option.value
                            ) || false
                          }
                          onCheckedChange={() =>
                            handleFilterChange(groupKey, option.value)
                          }
                        />
                        <span className="text-sm">{option.label}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="flex gap-2 pt-4">
          <Button
            variant="outline"
            onClick={handleClear}
            className="flex-1"
          >
            Clear
          </Button>
          <Button onClick={handleApply} className="flex-1">
            Apply
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default FilterDrawer;
