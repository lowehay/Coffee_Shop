import React, { useState, useEffect, useCallback } from "react";
import { useUser } from "@/hooks/useUser";
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
import { Input } from "@/components/ui/input";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Plus,
  Minus,
  Trash2,
  Edit3,
  Save,
  X
} from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";

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
  const [isEditingItems, setIsEditingItems] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [newItemQuantity, setNewItemQuantity] = useState(1);
  const [products, setProducts] = useState([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);
  const [currentOrder, setCurrentOrder] = useState(order);
  const [previewTotal, setPreviewTotal] = useState(0);
  const [editingItemId, setEditingItemId] = useState(null);
  const [editingQuantities, setEditingQuantities] = useState({});
  const { apiCallWithTokenRefresh } = useUser();
  
  // Reset form state when dialog opens or order changes
  useEffect(() => {
    if (isOpen) {
      setNewStatus("");
      setSelectedProduct(null);
      setNewItemQuantity(1);
      setIsEditingItems(false);
      setEditingItemId(null);
      setEditingQuantities({});
    }
  }, [isOpen, order]);
  
  // Function to fetch order items wrapped in useCallback
  const fetchOrderItems = useCallback(async (orderId) => {
    try {
      setIsLoadingItems(true);
      const response = await apiCallWithTokenRefresh(`/api/orders/order-items/?order_id=${orderId}`);
      setOrderItems(response.data);
    } catch (error) {
      console.error("Error fetching order items:", error);
      toast.error("Failed to load order items");
    } finally {
      setIsLoadingItems(false);
    }
  }, [apiCallWithTokenRefresh]);

  // Function to fetch products for adding new items
  const fetchProducts = useCallback(async () => {
    try {
      setIsLoadingProducts(true);
      const response = await apiCallWithTokenRefresh('/api/products/products/', 'get');
      setProducts(response.data);
    } catch (error) {
      console.error("Error fetching products:", error);
      toast.error("Could not load products");
    } finally {
      setIsLoadingProducts(false);
    }
  }, [apiCallWithTokenRefresh]);

  // Add new item to order
  const handleAddItem = async () => {
    if (!selectedProduct || newItemQuantity <= 0) {
      toast.error('Please select a product and enter a valid quantity');
      return;
    }
    
    try {
      setIsUpdating(true);
      const response = await apiCallWithTokenRefresh(
        `/api/orders/orders/${order.id}/add_item/`,
        'post',
        { product: selectedProduct.id, quantity: newItemQuantity }
      );
      
      toast.success('Item added successfully');
      setOrderItems([...orderItems, response.data.item]);
      setSelectedProduct(null);
      setNewItemQuantity(1);
      
      // Update order total in real-time using backend calculated total
      const updatedOrder = { ...currentOrder, total_price: response.data.new_total };
      setCurrentOrder(updatedOrder);
      
      // Update order total in parent
      if (onStatusChange) {
        onStatusChange(order.id, updatedOrder);
      }
      
    } catch (error) {
      console.error("Error adding item:", error);
      toast.error(error.response?.data?.error || 'Failed to add item');
    } finally {
      setIsUpdating(false);
    }
  };

  // Update item quantity
  const handleUpdateItem = async (itemId, newQuantity) => {
    if (newQuantity <= 0) return;
    
    try {
      setIsUpdating(true);
      const response = await apiCallWithTokenRefresh(
        `/api/orders/orders/${order.id}/update_item/`,
        'patch',
        { item_id: itemId, quantity: newQuantity }
      );
      
      toast.success('Item updated successfully');
      setOrderItems(orderItems.map(item => 
        item.id === itemId ? response.data.item : item
      ));
      setEditingItemId(null);
      
      // Update order total in real-time using backend calculated total
      const updatedOrder = { ...currentOrder, total_price: response.data.new_total };
      setCurrentOrder(updatedOrder);
      
      // Update order total in parent
      if (onStatusChange) {
        onStatusChange(order.id, updatedOrder);
      }
      
    } catch (error) {
      console.error("Error updating item:", error);
      toast.error(error.response?.data?.error || 'Failed to update item');
    } finally {
      setIsUpdating(false);
    }
  };

  // Remove item from order
  const handleRemoveItem = async (itemId) => {
    try {
      setIsUpdating(true);
      const response = await apiCallWithTokenRefresh(
        `/api/orders/orders/${order.id}/remove_item/`,
        'post',
        { item_id: itemId }
      );
      
      toast.success('Item removed successfully');
      setOrderItems(orderItems.filter(item => item.id !== itemId));
      
      // Update order total in real-time using backend calculated total
      const updatedOrder = { ...currentOrder, total_price: response.data.new_total };
      setCurrentOrder(updatedOrder);
      
      // Update order total in parent
      if (onStatusChange) {
        onStatusChange(order.id, updatedOrder);
      }
      
    } catch (error) {
      console.error("Error removing item:", error);
      toast.error(error.response?.data?.error || 'Failed to remove item');
    } finally {
      setIsUpdating(false);
    }
  };

  // Start editing quantity for an item
  const startEditingQuantity = (itemId, currentQuantity) => {
    setEditingItemId(itemId);
    setEditingQuantities(prev => ({ ...prev, [itemId]: currentQuantity }));
  };

  // Update quantity in temporary state
  const updateEditingQuantity = (itemId, newQuantity) => {
    setEditingQuantities(prev => ({ ...prev, [itemId]: newQuantity }));
  };

  // Save quantity changes
  const saveQuantity = async (itemId) => {
    const newQuantity = editingQuantities[itemId];
    if (!newQuantity || newQuantity <= 0) return;
    
    await handleUpdateItem(itemId, newQuantity);
    setEditingItemId(null);
    setEditingQuantities(prev => {
      const updated = { ...prev };
      delete updated[itemId];
      return updated;
    });
  };

  // Cancel quantity editing
  const cancelQuantityEditing = (itemId) => {
    setEditingItemId(null);
    setEditingQuantities(prev => {
      const updated = { ...prev };
      delete updated[itemId];
      return updated;
    });
  };

  // Calculate real-time preview for edited item
  const calculateEditedSubtotal = (itemId) => {
    const item = orderItems.find(item => item.id === itemId);
    const editedQuantity = editingQuantities[itemId];
    if (!item || !editedQuantity) return 0;
    return item.price * editedQuantity;
  };

  // Calculate real-time total with all edits
  const calculateEditedTotal = () => {
    let total = 0;
    orderItems.forEach(item => {
      if (editingItemId === item.id && editingQuantities[item.id]) {
        total += item.price * editingQuantities[item.id];
      } else {
        total += item.price * item.quantity;
      }
    });
    return total;
  };

  // Check if there's an active quantity edit
  const hasActiveQuantityEdit = () => {
    return editingItemId !== null && editingQuantities[editingItemId] !== undefined;
  };

  // Function to fetch the latest order details including history
  const fetchUpdatedOrder = useCallback(async (orderId) => {
    try {
      const response = await apiCallWithTokenRefresh(
        `/api/orders/orders/${orderId}/`,
        "get"
      );
      console.log('Updated order data:', response.data);
      console.log('Updated total:', response.data.total_price);
      return response.data;
    } catch (error) {
      console.error("Error fetching updated order:", error);
      return null;
    }
  }, [apiCallWithTokenRefresh, fetchOrderItems]);



  // Update current order when prop changes
  useEffect(() => {
    setCurrentOrder(order);
  }, [order]);

  // Calculate preview total when selected product or quantity changes
  useEffect(() => {
    if (!currentOrder) {
      setPreviewTotal(0);
      return;
    }
    
    if (selectedProduct && newItemQuantity > 0) {
      const itemTotal = parseFloat(selectedProduct.price) * newItemQuantity;
      const currentTotal = parseFloat(currentOrder.total_price) || 0;
      setPreviewTotal(currentTotal + itemTotal);
    } else {
      setPreviewTotal(parseFloat(currentOrder.total_price) || 0);
    }
  }, [selectedProduct, newItemQuantity, currentOrder]);

  // Fetch order items when the order changes
  useEffect(() => {
    if (isOpen && order?.id) {
      fetchOrderItems(order.id);
      fetchProducts();
    }
  }, [isOpen, order?.id, fetchOrderItems, fetchProducts, apiCallWithTokenRefresh]);

  // Don't render if no current order
  if (!currentOrder) return null;





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
          <div className="flex justify-between items-center mb-2">
            <h3 className="font-medium">Order Items</h3>
            {order.status === "pending" && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditingItems(!isEditingItems)}
                disabled={isUpdating}
              >
                {isEditingItems ? <X className="h-4 w-4" /> : <Edit3 className="h-4 w-4" />}
                {isEditingItems ? 'Done' : 'Edit'}
              </Button>
            )}
          </div>
          
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
                {isEditingItems && <div className="col-span-12 md:col-span-0"></div>}
              </div>
              
              {orderItems.map((item) => (
                <Card key={item.id} className="overflow-hidden">
                  <CardContent className="p-3">
                    <div className="grid grid-cols-12 gap-2 items-center">
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
                        {isEditingItems && order.status === 'pending' ? (
                          editingItemId === item.id ? (
                            <div className="flex items-center gap-1">
                              <Input
                                type="number"
                                min="1"
                                max="99"
                                value={editingQuantities[item.id] || item.quantity}
                                onChange={(e) => {
                                  const value = e.target.value;
                                  if (value === '') {
                                    updateEditingQuantity(item.id, 1);
                                  } else {
                                    const num = parseInt(value);
                                    if (!isNaN(num) && num > 0) {
                                      updateEditingQuantity(item.id, Math.min(99, num));
                                    }
                                  }
                                }}
                                className="h-8 w-16 text-center text-sm bg-background text-foreground border border-input"
                                disabled={isUpdating}
                              />
                            </div>
                          ) : (
                            <div className="flex items-center justify-center">
                              <span className="cursor-pointer hover:bg-muted px-2 py-1 rounded border border-transparent hover:border-border transition-all duration-200 group" 
                                    onClick={() => startEditingQuantity(item.id, item.quantity)}>
                                <span className="flex items-center gap-1">
                                  {item.quantity}
                                  <Edit3 className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                                </span>
                              </span>
                            </div>
                          )
                        ) : (
                          <span>{item.quantity}</span>
                        )}
                      </div>
                      <div className="col-span-2 text-right font-medium">
                        {editingItemId === item.id && editingQuantities[item.id] ? (
                          <span className="text-blue-600">
                            {new Intl.NumberFormat("en-PH", {
                              style: "currency",
                              currency: "PHP",
                            }).format(calculateEditedSubtotal(item.id))}
                          </span>
                        ) : (
                          new Intl.NumberFormat("en-PH", {
                            style: "currency",
                            currency: "PHP",
                          }).format(item.price * item.quantity)
                        )}
                      </div>
                      {isEditingItems && (
                        <div className="col-span-12 md:col-span-0 flex gap-1 justify-end">
                          {editingItemId === item.id ? (
                            <>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0 text-green-600 hover:text-green-700"
                                onClick={() => saveQuantity(item.id)}
                                disabled={isUpdating}
                              >
                                <Save className="h-3 w-3" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0 text-gray-500 hover:text-gray-700"
                                onClick={() => cancelQuantityEditing(item.id)}
                                disabled={isUpdating}
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </>
                          ) : (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0 text-red-500 hover:text-red-600"
                              onClick={() => handleRemoveItem(item.id)}
                              disabled={isUpdating}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
              
              {/* Add new item section */}
              {isEditingItems && (
                <Card className="border-dashed border-2">
                  <CardContent className="p-4">
                    {/* First row - Product selection */}
                    <div className="grid grid-cols-12 gap-3 items-center mb-3">
                      <div className="col-span-3 font-medium text-sm">Product:</div>
                      <div className="col-span-9">
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              role="combobox"
                              className="w-full justify-between text-sm"
                              disabled={isLoadingProducts || isUpdating}
                            >
                              {selectedProduct ? selectedProduct.name : "Select product..."}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-[250px] p-0">
                            <Command>
                              <CommandInput placeholder="Search products..." />
                              <CommandList>
                                <CommandEmpty>No products found.</CommandEmpty>
                                <CommandGroup>
                                  {products.map((product) => {
                                    const stock = product.available_stock || product.stock || 0;
                                    const isOutOfStock = stock <= 0;
                                    
                                    return (
                                      <CommandItem
                                        key={product.id}
                                        value={product.name}
                                        onSelect={() => {
                                          if (!isOutOfStock) {
                                            setSelectedProduct(product);
                                          }
                                        }}
                                        className={`flex items-center gap-3 ${
                                          isOutOfStock 
                                            ? 'opacity-50 cursor-not-allowed' 
                                            : 'cursor-pointer'
                                        }`}
                                        disabled={isOutOfStock}
                                      >
                                        <Avatar className="h-8 w-8">
                                          <AvatarImage 
                                            src={product.image} 
                                            alt={product.name}
                                            className="object-cover"
                                          />
                                          <AvatarFallback className="text-xs">
                                            {product.name.substring(0, 2).toUpperCase()}
                                          </AvatarFallback>
                                        </Avatar>
                                        <div className="flex-1">
                                          <div className={`font-medium ${
                                            isOutOfStock ? 'text-muted-foreground' : ''
                                          }`}>
                                            {product.name}
                                          </div>
                                          <div className="text-xs text-muted-foreground">
                                            {new Intl.NumberFormat("en-PH", {
                                              style: "currency",
                                              currency: "PHP",
                                            }).format(product.price)}
                                          </div>
                                        </div>
                                        <div className="text-right">
                                          <div className={`text-xs font-medium ${
                                            isOutOfStock ? 'text-red-500' : 'text-green-600'
                                          }`}>
                                            {isOutOfStock ? 'Out of Stock' : `Stock: ${stock}`}
                                          </div>
                                        </div>
                                      </CommandItem>
                                    );
                                  })}
                                </CommandGroup>
                              </CommandList>
                            </Command>
                          </PopoverContent>
                        </Popover>
                      </div>
                    </div>
                    
                    {/* Second row - Price and Quantity */}
                    <div className="grid grid-cols-12 gap-3 items-center">
                      <div className="col-span-3 font-medium text-sm">Price:</div>
                      <div className="col-span-3">
                        {selectedProduct ? (
                          <div className="text-sm font-medium">
                            {new Intl.NumberFormat("en-PH", {
                              style: "currency",
                              currency: "PHP",
                            }).format(selectedProduct.price)}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </div>
                      
                      <div className="col-span-3 font-medium text-sm text-right">Quantity:</div>
                      <div className="col-span-3">
                        <div className="flex justify-center">
                          <Input
                              type="number"
                              min="1"
                              max="99"
                              value={newItemQuantity}
                              onChange={(e) => {
                                const value = e.target.value;
                                if (value === '') {
                                  setNewItemQuantity(1);
                                } else {
                                  const num = parseInt(value);
                                  if (!isNaN(num) && num > 0) {
                                    setNewItemQuantity(Math.min(99, num));
                                  }
                                }
                              }}
                              className="w-20 h-10 text-center font-bold text-base border border-input focus:ring-2 focus:ring-ring focus:ring-offset-0"
                              disabled={!selectedProduct || isUpdating}
                            />
                        </div>
                      </div>
                    </div>
                    
                    {/* Third row - Add button and subtotal preview */}
                    <div className="flex justify-between items-center mt-4">
                      {selectedProduct && (
                        <div className="text-sm">
                          <span className="text-muted-foreground">Subtotal: </span>
                          <span className="font-medium">
                            {new Intl.NumberFormat("en-PH", {
                              style: "currency",
                              currency: "PHP",
                            }).format(parseFloat(selectedProduct.price) * newItemQuantity)}
                          </span>
                        </div>
                      )}
                      <Button
                        className="ml-auto"
                        onClick={handleAddItem}
                        disabled={!selectedProduct || isUpdating}
                      >
                        <Plus className="h-4 w-4 mr-1" /> Add Item
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
              
              <div className="flex justify-end pt-2">
                <p className="font-medium">
                  {selectedProduct && newItemQuantity > 0 && currentOrder ? (
                    <>
                      <span className="text-muted-foreground mr-2">Current:</span>
                      {new Intl.NumberFormat("en-PH", {
                        style: "currency",
                        currency: "PHP",
                      }).format(currentOrder.total_price || 0)}
                      <span className="text-muted-foreground mx-2">+</span>
                      <span className="text-green-600">
                        {new Intl.NumberFormat("en-PH", {
                          style: "currency",
                          currency: "PHP",
                        }).format(parseFloat(selectedProduct.price) * newItemQuantity)}
                      </span>
                      <span className="text-muted-foreground mx-2">=</span>
                      <span className="font-bold">
                        {new Intl.NumberFormat("en-PH", {
                          style: "currency",
                          currency: "PHP",
                        }).format(previewTotal)}
                      </span>
                    </>
                  ) : hasActiveQuantityEdit() ? (
                    <>
                      <span className="text-muted-foreground mr-2">Updated Total:</span>
                      <span className="font-bold text-blue-600">
                        {new Intl.NumberFormat("en-PH", {
                          style: "currency",
                          currency: "PHP",
                        }).format(calculateEditedTotal())}
                      </span>
                    </>
                  ) : (
                    <>
                      Total: {new Intl.NumberFormat("en-PH", {
                        style: "currency",
                        currency: "PHP",
                      }).format(currentOrder?.total_price || 0)}
                    </>
                  )}
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
          {order.status === "completed" || order.status === "cancelled" ? (
            <div className="bg-muted p-3 rounded-md">
              <p className="text-muted-foreground text-sm">
                {order.status === "completed" 
                  ? "This order has been marked as completed and cannot be modified."
                  : "This order has been cancelled and cannot be modified."
                }
              </p>
            </div>
          ) : (
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
          )}
        </div>

        <DialogFooter className="mt-6">
          <Button variant="outline" onClick={onClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
