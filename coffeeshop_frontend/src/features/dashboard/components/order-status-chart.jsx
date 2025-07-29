import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from "recharts";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { dashboardApi } from "../services/dashboard-api";

export function OrderStatusChart({ className }) {
  const [statusData, setStatusData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [total, setTotal] = useState(0);
  
  // Fetch order status data on component mount
  useEffect(() => {
    const fetchOrderStatusData = async () => {
      try {
        setIsLoading(true);
        const data = await dashboardApi.getOrderStatusChart();
        setStatusData(data);
        
        // Calculate total orders
        const sum = data.reduce((acc, entry) => acc + entry.value, 0);
        setTotal(sum);
        
        setError(null);
      } catch (err) {
        console.error('Failed to fetch order status data:', err);
        setError('Failed to load order status data');
        toast.error("Could not load order status data. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchOrderStatusData();
  }, []);
  
  // Custom tooltip
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const percentage = total > 0 ? ((data.value / total) * 100).toFixed(1) : '0.0';
      
      return (
        <div className="bg-background p-2 border rounded shadow-sm">
          <p className="text-sm font-medium">{`${data.name}: ${data.value} orders`}</p>
          <p className="text-xs text-muted-foreground">{`${percentage}% of total`}</p>
        </div>
      );
    }
    return null;
  };
  
  return (
    <Card className={className || ""}>
      <CardHeader>
        <CardTitle>Order Status</CardTitle>
        <CardDescription>
          Distribution of orders by status
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            <span className="ml-2 text-muted-foreground">Loading order status data...</span>
          </div>
        ) : error ? (
          <div className="flex justify-center items-center py-12 text-destructive">
            <p>{error}</p>
          </div>
        ) : (
          <>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    fill="var(--primary)"
                    dataKey="value"
                  >
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-2 gap-4 mt-2">
              {statusData.map((status) => (
                <div key={status.name} className="flex flex-col">
                  <div className="flex items-center">
                    <div 
                      className="w-3 h-3 rounded-full mr-2" 
                      style={{ backgroundColor: status.color }}
                    ></div>
                    <span className="text-sm font-medium">{status.name}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">
                      {status.value} orders
                    </span>
                    <span className="text-xs font-medium">
                      {total > 0 ? ((status.value / total) * 100).toFixed(1) : '0.0'}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
