import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CalendarIcon, X } from "lucide-react";
import { format, isValid } from "date-fns";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";

export function OrderFilters({ filters, setFilters, onFilterChange }) {
  // Status options
  const statusOptions = [
    { value: "all", label: "All Statuses" },
    { value: "pending", label: "Pending" },
    { value: "processing", label: "Processing" },
    { value: "completed", label: "Completed" },
    { value: "cancelled", label: "Cancelled" },
  ];

  // Handle filter changes
  const handleStatusChange = (value) => {
    const newFilters = {
      ...filters,
      status: value === "all" ? null : value,
    };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const handleCustomerChange = (e) => {
    const newFilters = {
      ...filters,
      customer: e.target.value || null,
    };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const handleStartDateChange = (date) => {
    const newFilters = {
      ...filters,
      startDate: date,
    };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const handleEndDateChange = (date) => {
    const newFilters = {
      ...filters,
      endDate: date,
    };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const clearFilters = () => {
    const newFilters = {
      status: null,
      customer: null,
      startDate: null,
      endDate: null,
    };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  // Check if any filters are active
  const hasActiveFilters = 
    filters.status || 
    filters.customer || 
    filters.startDate || 
    filters.endDate;

  return (
    <Card className="mb-4">
      <CardContent className="pt-6">
        <div className="flex flex-col space-y-4 sm:flex-row sm:items-end sm:space-y-0 sm:space-x-4">
          {/* Date Range Filter */}
          <div className="grid gap-2">
            <label className="text-sm font-medium">Start Date</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal sm:w-[180px]",
                    !filters.startDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {filters.startDate && isValid(filters.startDate) ? (
                    format(filters.startDate, "PPP")
                  ) : (
                    <span>Pick a date</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={filters.startDate}
                  onSelect={handleStartDateChange}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="grid gap-2">
            <label className="text-sm font-medium">End Date</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal sm:w-[180px]",
                    !filters.endDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {filters.endDate && isValid(filters.endDate) ? (
                    format(filters.endDate, "PPP")
                  ) : (
                    <span>Pick a date</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={filters.endDate}
                  onSelect={handleEndDateChange}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Status Filter */}
          <div className="grid gap-2">
            <label className="text-sm font-medium">Status</label>
            <Select
              value={filters.status || "all"}
              onValueChange={handleStatusChange}
            >
              <SelectTrigger className="sm:w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                {statusOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Customer Filter */}
          <div className="grid gap-2">
            <label className="text-sm font-medium">Customer</label>
            <Input
              placeholder="Search by customer name"
              value={filters.customer || ""}
              onChange={handleCustomerChange}
              className="sm:w-[200px]"
            />
          </div>

          {/* Clear Filters Button - only show if filters are active */}
          {hasActiveFilters && (
            <Button 
              variant="outline" 
              onClick={clearFilters}
              className="flex items-center"
            >
              <X className="mr-2 h-4 w-4" />
              Clear Filters
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
