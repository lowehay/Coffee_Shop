import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2 } from "lucide-react";
import { dashboardApi } from "../services/dashboard-api";

export function SalesChart() {
  // Using a single state to track active tab is unnecessary since Tabs handles this internally
  // We're still defining the handleTabChange function for potential future use
  const [chartData, setChartData] = useState({
    daily: [],
    weekly: [],
    monthly: []
  });
  const [loading, setLoading] = useState({
    daily: true,
    weekly: true,
    monthly: true
  });
  const [error, setError] = useState({
    daily: null,
    weekly: null,
    monthly: null
  });
  
  // Fetch data when the component mounts and when tab changes
  useEffect(() => {
    const fetchChartData = async (type) => {
      try {
        setLoading(prev => ({ ...prev, [type]: true }));
        const data = await dashboardApi.getSalesChart(type);
        setChartData(prev => ({ ...prev, [type]: data }));
        setError(prev => ({ ...prev, [type]: null }));
      } catch (err) {
        console.error(`Error fetching ${type} chart data:`, err);
        setError(prev => ({ ...prev, [type]: `Failed to load ${type} data` }));
      } finally {
        setLoading(prev => ({ ...prev, [type]: false }));
      }
    };

    // Fetch data for each tab type
    fetchChartData("daily");
    fetchChartData("weekly");
    fetchChartData("monthly");
  }, []);
  
  // Format currency for tooltip
  const formatCurrency = (value) => {
    return new Intl.NumberFormat("en-PH", {
      style: "currency",
      currency: "PHP",
      minimumFractionDigits: 0,
    }).format(value);
  };
  
  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background p-3 border rounded-md shadow">
          <p className="font-medium">{label}</p>
          <p className="text-primary">
            {formatCurrency(payload[0].value)}
          </p>
        </div>
      );
    }
    return null;
  };

  // Chart loading placeholder
  const LoadingPlaceholder = () => (
    <div className="flex items-center justify-center h-[300px] w-full">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
      <span className="ml-2 text-muted-foreground">Loading chart data...</span>
    </div>
  );

  // Chart error message
  const ErrorMessage = ({ message }) => (
    <div className="flex items-center justify-center h-[300px] w-full flex-col">
      <p className="text-destructive font-medium mb-2">Error loading chart</p>
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  );

  // Handle tab change - just a placeholder for now, but we could add analytics tracking or other logic here
  const handleTabChange = (value) => {
    console.log(`Tab changed to ${value}`);
    // We could add analytics tracking or other side effects here
  };
  
  return (
    <Card className="col-span-4">
      <CardHeader>
        <CardTitle>Sales Overview</CardTitle>
        <CardDescription>
          View your sales performance across different time periods
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="daily" className="space-y-4" onValueChange={handleTabChange}>
          <TabsList>
            <TabsTrigger value="daily">Daily</TabsTrigger>
            <TabsTrigger value="weekly">Weekly</TabsTrigger>
            <TabsTrigger value="monthly">Monthly</TabsTrigger>
          </TabsList>
          
          <TabsContent value="daily">
            <div className="h-[300px] w-full">
              {loading.daily ? (
                <LoadingPlaceholder />
              ) : error.daily ? (
                <ErrorMessage message={error.daily} />
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={chartData.daily}
                    margin={{ top: 20, right: 30, left: 20, bottom: 10 }}
                  >
                    <defs>
                      <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.8} />
                        <stop offset="95%" stopColor="var(--primary)" stopOpacity={0.1} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" tickLine={false} axisLine={false} />
                    <YAxis 
                      tickFormatter={(value) => `₱${value.toLocaleString()}`}
                      tickLine={false} 
                      axisLine={false} 
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Area
                      type="monotone"
                      dataKey="sales"
                      stroke="var(--primary)"
                      strokeWidth={2}
                      fill="url(#colorSales)"
                      activeDot={{ r: 8 }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="weekly">
            <div className="h-[300px] w-full">
              {loading.weekly ? (
                <LoadingPlaceholder />
              ) : error.weekly ? (
                <ErrorMessage message={error.weekly} />
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={chartData.weekly}
                    margin={{ top: 20, right: 30, left: 20, bottom: 10 }}
                  >
                    <defs>
                      <linearGradient id="colorSalesWeekly" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.8} />
                        <stop offset="95%" stopColor="var(--primary)" stopOpacity={0.1} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" tickLine={false} axisLine={false} />
                    <YAxis 
                      tickFormatter={(value) => `₱${value.toLocaleString()}`}
                      tickLine={false} 
                      axisLine={false} 
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Area
                      type="monotone"
                      dataKey="sales"
                      stroke="var(--primary)"
                      strokeWidth={2}
                      fill="url(#colorSalesWeekly)"
                      activeDot={{ r: 8 }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="monthly">
            <div className="h-[300px] w-full">
              {loading.monthly ? (
                <LoadingPlaceholder />
              ) : error.monthly ? (
                <ErrorMessage message={error.monthly} />
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={chartData.monthly}
                    margin={{ top: 20, right: 30, left: 20, bottom: 10 }}
                  >
                    <defs>
                      <linearGradient id="colorSalesMonthly" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.8} />
                        <stop offset="95%" stopColor="var(--primary)" stopOpacity={0.1} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" tickLine={false} axisLine={false} />
                    <YAxis 
                      tickFormatter={(value) => `₱${value.toLocaleString()}`}
                      tickLine={false} 
                      axisLine={false} 
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Area
                      type="monotone"
                      dataKey="sales"
                      stroke="var(--primary)"
                      strokeWidth={2}
                      fill="url(#colorSalesMonthly)"
                      activeDot={{ r: 8 }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
