import React, { useState, useEffect, useCallback } from "react";
import { useUser } from "@/hooks/useUser";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { X, Plus, Trash2, Search } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";

export function OrderForm({ isOpen, onClose, onSuccess }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [hasSearchResults, setHasSearchResults] = useState(true);
  const [orderItems, setOrderItems] = useState([]);
  const [customer, setCustomer] = useState("");
  const { apiCallWithTokenRefresh } = useUser();

  // Fetch available products - defined before the useEffect that uses it
  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      const response = await apiCallWithTokenRefresh('/api/products/products/');
      // Only show products that have stock available
      const availableProducts = response.data.filter(product => product.stock > 0);
      setProducts(availableProducts);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching products:', err);
      setLoading(false);
      toast.error('Could not load products');
    }
  }, [apiCallWithTokenRefresh]);
  
  // Fetch products when component mounts or dialog opens
  useEffect(() => {
    if (isOpen) {
      fetchProducts();
      setSelectedProduct("");
      setQuantity(1);
      setOrderItems([]);
    }
  }, [isOpen, fetchProducts]);

  // Handle product selection
  const handleProductChange = (value) => {
    setSelectedProduct(value);
    // Find selected product and update max quantity
    const product = products.find(p => p.id.toString() === value);
    if (product) {
      // Reset quantity to 1
      setQuantity(1);
    }
  };

  // Handle quantity change
  const handleQuantityChange = (e) => {
    let value = parseInt(e.target.value, 10);
    if (isNaN(value) || value < 1) {
      value = 1;
    }
    
    // Check against product stock
    if (selectedProduct) {
      const product = products.find(p => p.id.toString() === selectedProduct);
      if (product && value > product.stock) {
        value = product.stock;
      }
    }
    
    setQuantity(value);
  };

  // Add product to order items
  const addProductToOrder = () => {
    if (!selectedProduct || quantity < 1) {
      toast.error("Please select a product and quantity");
      return;
    }
    
    const product = products.find(p => p.id.toString() === selectedProduct);
    if (!product) return;
    
    // Check if product already exists in order
    const existingItemIndex = orderItems.findIndex(item => item.product_id.toString() === selectedProduct);
    
    if (existingItemIndex >= 0) {
      // Update quantity if product already exists
      const updatedItems = [...orderItems];
      const newQuantity = updatedItems[existingItemIndex].quantity + quantity;
      
      // Check if new quantity exceeds stock
      if (newQuantity > product.stock) {
        toast.error(`Cannot add more than ${product.stock} units of ${product.name}`);
        return;
      }
      
      updatedItems[existingItemIndex].quantity = newQuantity;
      setOrderItems(updatedItems);
    } else {
      // Add new product to order items
      setOrderItems([
        ...orderItems,
        {
          product_id: product.id,
          product_name: product.name,
          price: product.price,
          quantity: quantity,
          max_stock: product.stock
        }
      ]);
    }
    
    // Reset selection
    setSelectedProduct("");
    setQuantity(1);
    setSearchQuery("");
    setHasSearchResults(true); // Reset search results flag too
  };
  
  // Remove product from order items
  const removeOrderItem = (index) => {
    const updatedItems = [...orderItems];
    updatedItems.splice(index, 1);
    setOrderItems(updatedItems);
  };
  
  // Update quantity for an existing order item
  const updateOrderItemQuantity = (index, newQuantity) => {
    const updatedItems = [...orderItems];
    const item = updatedItems[index];
    
    // Validate quantity
    let value = parseInt(newQuantity, 10);
    if (isNaN(value) || value < 1) {
      value = 1;
    } else if (value > item.max_stock) {
      value = item.max_stock;
    }
    
    updatedItems[index].quantity = value;
    setOrderItems(updatedItems);
  };
  
  // Calculate order total
  const calculateTotal = () => {
    return orderItems.reduce((total, item) => {
      return total + (parseFloat(item.price) * item.quantity);
    }, 0);
  };

  // Create order
  const handleSubmit = async () => {
    if (orderItems.length === 0) {
      toast.error("Please add at least one product to the order");
      return;
    }

    try {
      setSubmitting(true);
      
      // First create the order
      const orderResponse = await apiCallWithTokenRefresh('/api/orders/orders/', 'post', {
        customer: customer || null,
        customer_name: customer || null,  // Send customer name for display
        total_price: calculateTotal()
      });
      
      const orderId = orderResponse.data.id;
      
      // Then create order items for each product
      const itemPromises = orderItems.map(item => {
        return apiCallWithTokenRefresh('/api/orders/order-items/', 'post', {
          order: orderId,
          product: item.product_id,
          quantity: item.quantity
        });
      });
      
      // Wait for all items to be created
      await Promise.all(itemPromises);
      
      toast.success("Order created successfully");
      onClose();
      if (onSuccess) onSuccess();
    } catch (err) {
      console.error('Error creating order:', err);
      const errorMsg = err.response?.data?.detail || err.response?.data?.non_field_errors?.[0] || 'Failed to create order';
      toast.error(errorMsg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle>Create New Order</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          {/* Customer input */}
          <div className="space-y-2">
            <Label htmlFor="customer">Customer Name (Optional)</Label>
            <Input
              id="customer"
              value={customer}
              onChange={(e) => setCustomer(e.target.value)}
              placeholder="Enter customer name"
            />
          </div>
          
          {/* Product selection section */}
          <div className="space-y-4 border-t pt-4">
            <h3 className="font-medium">Add Products</h3>
            
            {loading ? (
              <div>Loading products...</div>
            ) : products.length === 0 ? (
              <div className="text-center text-muted-foreground">
                No products available with stock
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  <Label htmlFor="product">Product</Label>
                  <Select
                    id="product"
                    value={selectedProduct}
                    onValueChange={handleProductChange}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select a product" />
                    </SelectTrigger>
                    <SelectContent>
                      <div className="relative py-2">
                        <div className="flex items-center gap-2 px-3 pb-2 border-b">
                          <Search className="h-4 w-4 text-muted-foreground" />
                          <input
                            className="flex-1 bg-transparent outline-none placeholder:text-muted-foreground text-sm"
                            placeholder="Search products..."
                            value={searchQuery}
                            onChange={(e) => {
                              setSearchQuery(e.target.value);
                              // Filter product items in DOM and track if any results are shown
                              const searchValue = e.target.value.toLowerCase();
                              let foundResults = false;
                              document.querySelectorAll('.product-item').forEach(item => {
                                const productName = item.getAttribute('data-product-name');
                                if (productName.includes(searchValue)) {
                                  item.style.display = 'block';
                                  foundResults = true;
                                } else {
                                  item.style.display = 'none';
                                }
                              });
                              
                              setHasSearchResults(foundResults);
                            }}
                            name="product-search"
                          />
                        </div>
                      </div>
                      <ScrollArea className="h-[200px]">
                        {products.length > 0 && products.map((product) => (
                          <SelectItem 
                            key={product.id} 
                            value={product.id.toString()}
                            data-product-name={product.name.toLowerCase()}
                            className="product-item"
                          >
                            {product.name} - ₱{parseFloat(product.price).toFixed(2)} (Stock: {product.stock})
                          </SelectItem>
                        ))}
                        
                        {searchQuery && !hasSearchResults && (
                          <div className="text-center py-4 text-muted-foreground">
                            No products match "{searchQuery}"
                          </div>
                        )}
                      </ScrollArea>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex gap-3 items-end">
                  <div className="flex-1 space-y-2">
                    <Label htmlFor="quantity">Quantity</Label>
                    <Input
                      id="quantity"
                      type="number"
                      min={1}
                      value={quantity}
                      onChange={handleQuantityChange}
                      disabled={!selectedProduct}
                    />
                  </div>
                  
                  <Button 
                    onClick={addProductToOrder}
                    disabled={!selectedProduct || loading}
                    className="mb-0.5"
                  >
                    <Plus className="h-4 w-4 mr-1" /> Add
                  </Button>
                </div>
              </>
            )}
          </div>
          
          {/* Order items list */}
          <div className="space-y-3 border-t pt-4">
            <div className="flex justify-between items-center">
              <h3 className="font-medium">Order Items</h3>
              {orderItems.length > 0 && (
                <p className="font-semibold text-sm">
                  Total: ₱{parseFloat(calculateTotal()).toFixed(2)}
                </p>
              )}
            </div>
            
            {orderItems.length === 0 ? (
              <div className="text-center py-4 text-muted-foreground border rounded-md">
                No items added to order yet
              </div>
            ) : (
              <div className="space-y-2 max-h-[250px] overflow-y-auto pr-1">
                {orderItems.map((item, index) => (
                  <Card key={`${item.product_id}-${index}`} className="overflow-hidden">
                    <CardContent className="p-3">
                      <div className="flex justify-between items-center gap-2">
                        <div className="flex-1">
                          <p className="font-medium">{item.product_name}</p>
                          <div className="flex justify-between">
                            <div className="flex items-center gap-2 mt-1">
                              <p className="text-sm">₱{parseFloat(item.price).toFixed(2)} × </p>
                              <Input
                                type="number"
                                className="w-16 h-7 text-sm"
                                min={1}
                                max={item.max_stock}
                                value={item.quantity}
                                onChange={(e) => updateOrderItemQuantity(index, e.target.value)}
                              />
                            </div>
                            <p className="text-sm font-medium">
                              ₱{parseFloat(item.price * item.quantity).toFixed(2)}
                            </p>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => removeOrderItem(index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={orderItems.length === 0 || submitting || loading}
          >
            {submitting ? "Creating..." : "Create Order"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
