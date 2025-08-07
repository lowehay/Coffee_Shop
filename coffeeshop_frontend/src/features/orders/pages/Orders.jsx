import React, { useState, useEffect, useCallback } from "react";
import { useUser } from "@/hooks/useUser";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { DataTable } from "@/components/ui/data-table";
import { columns } from "@/features/orders/components/columns";
import { OrderForm } from "@/features/orders/components/order-form";
import { OrderDetailsModal } from "@/features/orders/components/order-details-modal";
import { OrderFilters } from "@/features/orders/components/order-filters";
import { isValid, parseISO, isBefore, isAfter, isEqual } from "date-fns";

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  
  // Filter state
  const [filters, setFilters] = useState({
    status: null,
    customer: null,
    startDate: null,
    endDate: null
  });
  const { apiCallWithTokenRefresh } = useUser();

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      const response = await apiCallWithTokenRefresh('/api/orders/orders/');
      // Sort orders by ordered_at date in descending order (newest first)
      const sortedOrders = response.data.sort((a, b) => {
        return new Date(b.ordered_at) - new Date(a.ordered_at);
      });
      setOrders(sortedOrders);
      setError(null);
    } catch (err) {
      console.error('Error fetching orders:', err);
      setError('Failed to load orders. Please try again.');
      toast.error('Could not load orders');
    } finally {
      setLoading(false);
    }
  }, [apiCallWithTokenRefresh]);

  useEffect(() => {
    // Fetch orders when component mounts
    fetchOrders();
  }, [fetchOrders]);
  
  // Apply filters to orders
  useEffect(() => {
    if (!orders.length) {
      setFilteredOrders([]);
      return;
    }
    
    let result = [...orders];
    
    // Filter by status
    if (filters.status) {
      result = result.filter(order => order.status === filters.status);
    }
    
    // Filter by customer name
    if (filters.customer) {
      const searchTerm = filters.customer.toLowerCase();
      result = result.filter(order => {
        const customerName = (order.customer_name || '').toLowerCase();
        return customerName.includes(searchTerm);
      });
    }
    
    // Filter by start date
    if (filters.startDate && isValid(filters.startDate)) {
      result = result.filter(order => {
        const orderDate = parseISO(order.ordered_at);
        return isEqual(orderDate, filters.startDate) || isAfter(orderDate, filters.startDate);
      });
    }
    
    // Filter by end date
    if (filters.endDate && isValid(filters.endDate)) {
      result = result.filter(order => {
        const orderDate = parseISO(order.ordered_at);
        return isEqual(orderDate, filters.endDate) || isBefore(orderDate, filters.endDate);
      });
    }
    
    setFilteredOrders(result);
  }, [orders, filters]);

  const handleRowClick = (order) => {
    setSelectedOrder(order);
    setIsDetailsOpen(true);
  };
  
  // Handle status updates from the modal
  const handleStatusChange = (orderId, updatedOrder) => {
    // Update the local orders state
    setOrders(orders.map(order => {
      if (order.id === orderId) {
        // Replace the order with updated data
        return updatedOrder;
      }
      return order;
    }));
    
    // Also update the selectedOrder with complete order data including history
    setSelectedOrder(updatedOrder);
  };

  // Handle filter changes
  const handleFilterChange = useCallback(() => {
    // This is handled by the useEffect above
    // Just updating state is enough
  }, []);
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Orders</h1>
        <Button onClick={() => setIsFormOpen(true)}>New Order</Button>
      </div>
      
      {/* Order Filters */}
      <OrderFilters 
        filters={filters} 
        setFilters={setFilters} 
        onFilterChange={handleFilterChange} 
      />
      
      {loading ? (
        <div className="py-8 text-center">
          <p>Loading orders...</p>
        </div>
      ) : error ? (
        <Card>
          <CardContent className="py-6">
            <div className="text-center">
              <p className="text-red-500 mb-4">{error}</p>
              <Button onClick={fetchOrders}>Try Again</Button>
            </div>
          </CardContent>
        </Card>
      ) : orders.length === 0 ? (
        <Card>
          <CardContent className="py-8">
            <div className="text-center">
              <p className="text-muted-foreground mb-2">No orders found.</p>
              <p className="text-muted-foreground mb-4">Create your first order to get started!</p>
              <Button onClick={() => setIsFormOpen(true)}>Create Order</Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>
              Order History
              {filteredOrders.length !== orders.length && (
                <span className="ml-2 text-sm text-muted-foreground font-normal">
                  {filteredOrders.length} of {orders.length} orders
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <DataTable 
              columns={columns} 
              data={filteredOrders}
              searchKey="order_id"
              onRowClick={handleRowClick}
              initialSort={{
                id: "ordered_at",
                desc: true
              }}
            />
          </CardContent>
        </Card>
      )}

      {/* Order Form Dialog */}
      <OrderForm 
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSuccess={fetchOrders}
      />
      
      {/* Order Details Modal */}
      <OrderDetailsModal
        isOpen={isDetailsOpen}
        onClose={() => setIsDetailsOpen(false)}
        order={selectedOrder}
        onStatusChange={handleStatusChange}
      />
    </div>
  );
}