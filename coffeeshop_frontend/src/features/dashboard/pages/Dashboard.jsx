import React from "react";
import { useUser } from "@/context/UserContext";

// Import dashboard components
import { SummaryCards } from "../components/summary-cards";
import { SalesChart } from "../components/sales-chart";
import { PopularProducts } from "../components/popular-products";
import { RecentOrders } from "../components/recent-orders";
import { OrderStatusChart } from "../components/order-status-chart";
import { InventoryStatus } from "../components/inventory-status";

// Import UI components
import { Card, CardContent } from "@/components/ui/card";

export default function Dashboard() {
  const { user } = useUser();
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back, {user?.username || 'User'}! Here's an overview of your coffee shop.
        </p>
      </div>

      {/* Summary Stats */}
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
        <SummaryCards />
      </div>

      {/* Sales Chart */}
      <div className="grid gap-4 grid-cols-1 lg:grid-cols-4">
        <SalesChart />
      </div>

      {/* Recent Orders and Order Status */}
      <div className="grid gap-4 grid-cols-1 lg:grid-cols-6">
        <div className="lg:col-span-4 h-full">
          <RecentOrders className="h-full" />
        </div>
        <div className="lg:col-span-2 h-full">
          <OrderStatusChart className="h-full" />
        </div>
      </div>

      {/* Popular Products and Inventory */}
      <div className="grid gap-4 grid-cols-1 lg:grid-cols-6 mb-6">
        <PopularProducts />
        <InventoryStatus />
      </div>
    </div>
  );
}