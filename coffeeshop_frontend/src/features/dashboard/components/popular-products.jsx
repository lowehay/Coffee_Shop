import React, { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { dashboardApi } from "../services/dashboard-api";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
export function PopularProducts() {
  // State for API data
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Function to fetch popular products data from the API
  const fetchPopularProducts = async () => {
    try {
      setIsRefreshing(true);
      const data = await dashboardApi.getPopularProducts(5, 'month');
      setProducts(data);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch popular products:', err);
      setError('Failed to load popular products. Please try again later.');
      toast.error("Could not load popular products. Please try again.");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  // Fetch data on component mount
  useEffect(() => {
    fetchPopularProducts();
  }, []);
  // Format currency
  const formatCurrency = (value) => {
    return new Intl.NumberFormat("en-PH", {
      style: "currency",
      currency: "PHP",
      minimumFractionDigits: 0,
    }).format(value);
  };

  // Generate chart data from products state
  const chartData = products
    .map(product => ({
      name: product.name.split(' ')[0], // First word only for chart clarity
      quantity: product.quantity,
      fullName: product.name // Store full name for tooltip
    }))
    .sort((a, b) => b.quantity - a.quantity); // Sort by quantity

  return (
    <Card className="col-span-3">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Popular Products</CardTitle>
          <CardDescription>
            Your best selling products this month
          </CardDescription>
        </div>
        {!isLoading && (
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={fetchPopularProducts} 
            disabled={isRefreshing}
            className="h-8 w-8 p-0"
            title="Refresh data"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span className="sr-only">Refresh</span>
          </Button>
        )}
      </CardHeader>

      <CardContent>
        {isLoading ? (
          <div className="space-y-6">
            <Skeleton className="h-[180px] w-full" />
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center gap-4">
                  <Skeleton className="h-12 w-12 rounded-md" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-[80%]" />
                    <Skeleton className="h-3 w-[60%]" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center h-[320px] text-center space-y-4">
            <p className="text-sm text-muted-foreground">{error}</p>
            <Button size="sm" onClick={fetchPopularProducts}>
              Try Again
            </Button>
          </div>
        ) : (
          <>
            <div className="h-[180px] mb-6">
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={chartData}
                    margin={{ top: 10, right: 10, left: 10, bottom: 10 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" />
                    <YAxis hide={true} />
                    <Tooltip 
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          return (
                            <div className="p-2 bg-background border rounded-md shadow-sm">
                              <p className="font-medium text-foreground mb-1">{data.fullName}</p>
                              <p className="text-sm text-muted-foreground">{data.quantity} units sold</p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Bar 
                      dataKey="quantity" 
                      fill="var(--primary)" 
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <p className="text-sm text-muted-foreground">No sales data available</p>
                </div>
              )}
            </div>
            <div className="space-y-4">
              {products.length > 0 ? products.map((product) => (
                <div key={product.id} className="flex items-center gap-4">
                  <Avatar className="h-12 w-12 rounded-md">
                    {product.image ? (
                      <img
                        src={product.image}
                        alt={product.name}
                        className="object-cover"
                      />
                    ) : (
                      <span className="text-xs font-medium">{product.name.substring(0, 2).toUpperCase()}</span>
                    )}
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium">{product.name}</p>
                      <div className="text-sm font-medium">
                        {formatCurrency(product.revenue)}
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <div>{product.category || 'Product'} • {product.quantity} units</div>
                      <Badge
                        variant={
                          product.status === "In Stock"
                            ? "outline"
                            : product.status === "Low Stock"
                            ? "secondary"
                            : "destructive"
                        }
                        className="text-xs"
                      >
                        {product.status}
                      </Badge>
                    </div>
                  </div>
                </div>
              )) : (
                <p className="text-sm text-center text-muted-foreground py-4">No popular products found</p>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
