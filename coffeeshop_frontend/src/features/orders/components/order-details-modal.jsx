import React, { useState, useEffect, useCallback } from "react";
import { useUser } from "@/context/UserContext";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";

// Helper function to format date
const formatDate = (dateString) => {
  if (!dateString) return "";
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);
};

export function OrderDetailsModal({ isOpen, onClose, order, onStatusChange }) {
  const [newStatus, setNewStatus] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  const [orderItems, setOrderItems] = useState([]);
  const [isLoadingItems, setIsLoadingItems] = useState(false);
  const { apiCallWithTokenRefresh } = useUser();
  
  // Function to fetch order items wrapped in useCallback
  const fetchOrderItems = useCallback(async (orderId) => {
    try {
      setIsLoadingItems(true);
      const response = await apiCallWithTokenRefresh(
        `/api/orders/order-items/?order_id=${orderId}`,
        "get"
      );
      setOrderItems(response.data);
    } catch (error) {
      console.error("Error fetching order items:", error);
      toast.error("Could not load order items");
    } finally {
      setIsLoadingItems(false);
    }
  }, [apiCallWithTokenRefresh]);

  // Function to fetch the latest order details including history
  const fetchUpdatedOrder = useCallback(async (orderId) => {
    try {
      const response = await apiCallWithTokenRefresh(
        `/api/orders/orders/${orderId}/`,
        "get"
      );
      // Also refresh order items
      await fetchOrderItems(orderId);
      return response.data;
    } catch (error) {
      console.error("Error fetching updated order:", error);
      return null;
    }
  }, [apiCallWithTokenRefresh, fetchOrderItems]);



  // Fetch order items when the order changes
  useEffect(() => {
    if (isOpen && order?.id) {
      fetchOrderItems(order.id);
    }
  }, [isOpen, order?.id, fetchOrderItems, apiCallWithTokenRefresh]);

  // Don't render if no order
  if (!order) return null;





  const handleStatusChange = async () => {
    if (!newStatus || newStatus === order.status) return;
    
    try {
      setIsUpdating(true);
      console.log(`Updating order ${order.id} status to ${newStatus}`);
      // Fix: apiCallWithTokenRefresh expects (url, method, data) as separate parameters
      const response = await apiCallWithTokenRefresh(
        `/api/orders/orders/${order.id}/update_status/`, 
        "patch", 
        { status: newStatus }
      );

      // Fetch the updated order with new status history
      const updatedOrder = await fetchUpdatedOrder(order.id);
      
      toast.success(`Order status updated to ${response.data.status_display}`);
      if (onStatusChange && updatedOrder) {
        // Pass the full updated order data
        onStatusChange(order.id, updatedOrder);
      }
    } catch (error) {
      console.error("Error updating order status:", error);
      toast.error("Failed to update order status");
    } finally {
      setIsUpdating(false);
    }
  };

  // Status badge color mapping - uses custom Tailwind classes
  const getStatusClasses = (status) => {
    // Force lowercase for case-insensitive comparison
    const statusLower = status?.toLowerCase() || "pending";
    
    switch(statusLower) {
      case "completed": return "bg-green-500 text-white hover:bg-green-600";
      case "processing": return "bg-blue-500 text-white hover:bg-blue-600";
      case "cancelled": return "bg-red-500 text-white hover:bg-red-600";
      case "pending":
      default: return "bg-yellow-500 text-white hover:bg-yellow-600";
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
        <div className="absolute right-12 top-4">
          <Badge className={`px-3 py-1 text-sm ${getStatusClasses(order.status)}`}>
            {order.status_display || order.status}
          </Badge>
        </div>
        <DialogHeader>
          <DialogTitle className="text-xl">
            Order {order.order_id}
          </DialogTitle>
          <DialogDescription>
            Order placed on {formatDate(order.ordered_at)}
          </DialogDescription>
        </DialogHeader>

        {/* Order information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
          <div>
            <h3 className="text-sm font-medium mb-2">Customer</h3>
            <p className="text-base">{order.customer_name || "N/A"}</p>
          </div>

          <div>
            <h3 className="text-sm font-medium mb-2">Total Price</h3>
            <p className="text-base">
              {new Intl.NumberFormat("en-PH", {
                style: "currency",
                currency: "PHP",
              }).format(order.total_price)}
            </p>
          </div>
        </div>

        {/* Order Items */}
        <div className="mt-4">
          <h3 className="font-medium mb-2">Order Items</h3>
          {isLoadingItems ? (
            <div className="text-center py-4 text-muted-foreground">
              Loading order items...
            </div>
          ) : orderItems.length === 0 ? (
            <div className="text-center py-4 text-muted-foreground border rounded-md">
              No items found for this order
            </div>
          ) : (
            <div className="space-y-2">
              <div className="grid grid-cols-12 gap-2 px-3 py-2 bg-muted text-sm font-medium rounded-md">
                <div className="col-span-6">Product</div>
                <div className="col-span-2 text-center">Price</div>
                <div className="col-span-2 text-center">Quantity</div>
                <div className="col-span-2 text-right">Subtotal</div>
              </div>
              
              {orderItems.map((item) => (
                <Card key={item.id} className="overflow-hidden">
                  <CardContent className="p-3">
                    <div className="grid grid-cols-12 gap-2">
                      <div className="col-span-6">
                        {item.product_name || `Product #${item.product}`}
                      </div>
                      <div className="col-span-2 text-center">
                        {new Intl.NumberFormat("en-PH", {
                          style: "currency",
                          currency: "PHP",
                        }).format(item.price)}
                      </div>
                      <div className="col-span-2 text-center">
                        {item.quantity}
                      </div>
                      <div className="col-span-2 text-right font-medium">
                        {new Intl.NumberFormat("en-PH", {
                          style: "currency",
                          currency: "PHP",
                        }).format(item.price * item.quantity)}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              
              <div className="flex justify-end pt-2">
                <p className="font-medium">
                  Total: {new Intl.NumberFormat("en-PH", {
                    style: "currency",
                    currency: "PHP",
                  }).format(order.total_price)}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Status history */}
        {order.status_history && order.status_history.length > 0 && (
          <Card className="mt-4">
            <CardHeader>
              <CardTitle className="text-md">Status History</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {order.status_history.map((history, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <div className="flex-shrink-0">
                      <Badge className={`px-2 py-1 ${getStatusClasses(history.status)}`}>
                        {history.status ? history.status.charAt(0).toUpperCase() + history.status.slice(1) : "Pending"}
                      </Badge>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm">
                        <span className="text-muted-foreground">
                          {formatDate(history.changed_at)}
                        </span>
                        {history.changed_by && (
                          <span className="ml-1">by {history.changed_by}</span>
                        )}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Update Status */}
        <div className="mt-4 border-t pt-4">
          <h3 className="font-medium mb-2">Update Status</h3>
          <div className="flex gap-4 items-center">
            <Select value={newStatus} onValueChange={setNewStatus}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select new status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="processing">Processing</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
            <Button 
              onClick={handleStatusChange} 
              disabled={!newStatus || newStatus === order.status || isUpdating}
            >
              {isUpdating ? "Updating..." : "Update Status"}
            </Button>
          </div>
        </div>

        <DialogFooter className="mt-6">
          <Button variant="outline" onClick={onClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
