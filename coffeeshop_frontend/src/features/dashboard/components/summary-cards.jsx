import React, { useState, useEffect } from "react";
import { StatCard } from "./stat-card";
import { 
  Coffee, 
  ShoppingBasket, 
  AlertCircle, 
  DollarSign,
  TrendingUp
} from "lucide-react";
import { dashboardApi } from "../services/dashboard-api";

export function SummaryCards() {
  const [stats, setStats] = useState({
    sales: { total: "0", current_month: "0", last_month: "0" },
    orders: { total: 0, current_month: 0, last_month: 0 },
    average_order: { total: "0", current_month: "0", last_month: "0" },
    inventory: { low_stock_count: 0 }
  });
  
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardStats = async () => {
      try {
        setLoading(true);
        const data = await dashboardApi.getStats();
        setStats(data);
      } catch (err) {
        console.error('Error fetching dashboard stats:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardStats();
  }, []);

  // Format currency
  const formatCurrency = (value) => {
    return `₱${parseFloat(value).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  return (
    <>
      <StatCard
        className="col-span-1"
        title="Total Sales"
        value={loading ? "Loading..." : formatCurrency(stats.sales.current_month)}
        description={loading ? "" : `vs. ${formatCurrency(stats.sales.last_month)} last month`}
        icon={<DollarSign className="h-5 w-5 text-muted-foreground" />}
      />
      <StatCard
        className="col-span-1"
        title="Total Orders"
        value={loading ? "Loading..." : stats.orders.current_month.toString()}
        description={loading ? "" : `vs. ${stats.orders.last_month} last month`}
        icon={<ShoppingBasket className="h-5 w-5 text-muted-foreground" />}
      />
      <StatCard
        className="col-span-1"
        title="Average Order"
        value={loading ? "Loading..." : formatCurrency(stats.average_order.current_month)}
        description={loading ? "" : `vs. ${formatCurrency(stats.average_order.last_month)} last month`}
        icon={<TrendingUp className="h-5 w-5 text-muted-foreground" />}
      />
      <StatCard
        className="col-span-1"
        title="Low Stock Items"
        value={loading ? "Loading..." : stats.inventory.low_stock_count.toString()}
        description={loading ? "" : `Items below threshold`}
        icon={<AlertCircle className="h-5 w-5 text-muted-foreground" />}
      />
    </>
  );
}
