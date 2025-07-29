import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";
import { dashboardApi } from "../services/dashboard-api";
import { toast } from "sonner";



export function InventoryStatus() {
  // State for inventory data, loading status, and error
  const [inventoryItems, setInventoryItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Fetch inventory data on component mount
  useEffect(() => {
    const fetchInventoryData = async () => {
      try {
        setIsLoading(true);
        const data = await dashboardApi.getInventoryStatus();
        setInventoryItems(data);
        setError(null);
      } catch (err) {
        console.error('Failed to fetch inventory data:', err);
        setError('Failed to load inventory data. Please try again later.');
        toast.error("Could not load inventory data. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchInventoryData();
  }, []); // No dependencies needed
  // Get status badge variant
  const getStatusVariant = (status) => {
    switch(status.toLowerCase()) {
      case "good":
        return "outline";
      case "low":
        return "secondary";
      case "critical":
        return "destructive";
      default:
        return "outline";
    }
  };

  // Get progress bar color
  const getProgressColor = (stockLevel, totalCapacity) => {
    const percentage = (stockLevel / totalCapacity) * 100;
    if (percentage <= 20) return "bg-[var(--destructive)]";
    if (percentage <= 40) return "bg-[var(--chart-3)]";
    return "bg-[var(--primary)]"; // Default using primary theme color
  };

  return (
    <Card className="col-span-3">
      <CardHeader>
        <CardTitle>Inventory Status</CardTitle>
        <CardDescription>
          Monitor your stock levels and reorder needs
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center items-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            <span className="ml-2 text-muted-foreground">Loading inventory data...</span>
          </div>
        ) : error ? (
          <div className="flex justify-center items-center py-8 text-destructive">
            <p>{error}</p>
          </div>
        ) : inventoryItems.length === 0 ? (
          <div className="flex justify-center items-center py-8 text-muted-foreground">
            <p>No inventory items found</p>
          </div>
        ) : (
          <div className="space-y-4">
            {inventoryItems.map((item) => (
              <div key={item.id} className="grid gap-2">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">{item.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {item.stockLevel} {item.unit} of {item.totalCapacity} {item.unit}
                    </p>
                  </div>
                  <Badge variant={getStatusVariant(item.status)}>
                    {item.status}
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <Progress 
                    value={(item.stockLevel / item.totalCapacity) * 100} 
                    className={`h-2 ${getProgressColor(item.stockLevel, item.totalCapacity)}`}
                  />
                  <span className="text-xs font-medium">
                    {Math.round((item.stockLevel / item.totalCapacity) * 100)}%
                  </span>
                </div>
                {item.stockLevel <= item.reorderPoint && (
                  <p className="text-xs text-destructive">
                    Reorder needed (below {item.reorderPoint} {item.unit})
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
