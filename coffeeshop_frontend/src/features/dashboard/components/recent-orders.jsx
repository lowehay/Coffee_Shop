import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronRight, Loader2 } from "lucide-react";
import { dashboardApi } from "../services/dashboard-api";
import { toast } from "sonner";
import { Link } from "react-router-dom";

export function RecentOrders({ className }) {
  // State for orders, loading status, and error
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Fetch orders on component mount
  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setIsLoading(true);
        const data = await dashboardApi.getRecentOrders(8); // Get 8 most recent orders
        setOrders(data);
        setError(null);
      } catch (err) {
        console.error('Failed to fetch recent orders:', err);
        setError('Failed to load recent orders. Please try again later.');
        toast.error("Could not load recent orders. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchOrders();
  }, []); // No dependencies needed
  // Get status badge classes
  const getStatusClasses = (status) => {
    // Force lowercase for case-insensitive comparison
    const statusLower = status?.toLowerCase() || "pending";
    
    switch(statusLower) {
      case "completed":
        return "bg-green-500 text-white hover:bg-green-600";
      case "processing":
        return "bg-blue-500 text-white hover:bg-blue-600";
      case "cancelled":
        return "bg-red-500 text-white hover:bg-red-600";
      case "pending":
      default:
        return "bg-yellow-500 text-white hover:bg-yellow-600";
    }
  };

  // Format currency
  const formatCurrency = (value) => {
    return new Intl.NumberFormat("en-PH", {
      style: "currency",
      currency: "PHP",
      minimumFractionDigits: 0,
    }).format(value);
  };

  return (
    <Card className={className || ""}>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Recent Orders</CardTitle> 
          <CardDescription className="mt-2">Your latest incoming orders</CardDescription>
        </div>
        <Button variant="outline" size="sm" className="h-8" asChild>
          <Link to="/orders">
            View All
            <ChevronRight className="ml-1 h-4 w-4" />
          </Link>
        </Button>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center items-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            <span className="ml-2 text-muted-foreground">Loading orders...</span>
          </div>
        ) : error ? (
          <div className="flex justify-center items-center py-8 text-destructive">
            <p>{error}</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="flex justify-center items-center py-8 text-muted-foreground">
            <p>No recent orders found</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order ID</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Items</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="font-medium">{order.id}</TableCell>
                  <TableCell>{order.customer}</TableCell>
                  <TableCell>
                    <div className="max-w-[200px] truncate" title={order.items}>
                      {order.items}
                    </div>
                  </TableCell>
                  <TableCell>{order.date}</TableCell>
                  <TableCell>
                    <Badge className={`${getStatusClasses(order.status)}`}>
                      {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">{formatCurrency(order.total)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
