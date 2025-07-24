import React, { useState, useEffect, useCallback } from "react";
import { useUser } from "@/context/UserContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function OrderForm({ isOpen, onClose, onSuccess }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [maxQuantity, setMaxQuantity] = useState(0);
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
      setMaxQuantity(0);
    }
  }, [isOpen, fetchProducts]);

  // Handle product selection
  const handleProductChange = (value) => {
    setSelectedProduct(value);
    // Find selected product and update max quantity
    const product = products.find(p => p.id.toString() === value);
    if (product) {
      setMaxQuantity(product.stock);
      // Reset quantity to 1 or max stock if stock is less than 1
      setQuantity(1);
    }
  };

  // Handle quantity change
  const handleQuantityChange = (e) => {
    let value = parseInt(e.target.value, 10);
    if (isNaN(value) || value < 1) {
      value = 1;
    } else if (value > maxQuantity) {
      value = maxQuantity;
    }
    setQuantity(value);
  };

  // Calculate order total
  const calculateTotal = () => {
    if (!selectedProduct) return 0;
    const product = products.find(p => p.id.toString() === selectedProduct);
    if (!product) return 0;
    return product.price * quantity;
  };

  // Create order
  const handleSubmit = async () => {
    if (!selectedProduct || quantity < 1) {
      toast.error("Please select a product and quantity");
      return;
    }

    try {
      setSubmitting(true);
      await apiCallWithTokenRefresh('/api/orders/orders/', 'post', {
        product: selectedProduct,
        quantity: quantity
      });
      
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
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create New Order</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          {loading ? (
            <div>Loading products...</div>
          ) : products.length === 0 ? (
            <div className="text-center text-muted-foreground">
              No products available in stock
            </div>
          ) : (
            <>
              <div className="space-y-2">
                <Label htmlFor="product">Product</Label>
                <Select value={selectedProduct} onValueChange={handleProductChange}>
                  <SelectTrigger id="product">
                    <SelectValue placeholder="Select a product" />
                  </SelectTrigger>
                  <SelectContent>
                    {products.map((product) => (
                      <SelectItem key={product.id} value={product.id.toString()}>
                        {product.name} - ₱{parseFloat(product.price).toFixed(2)} (Stock: {product.stock})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="quantity">Quantity</Label>
                <Input
                  id="quantity"
                  type="number"
                  min={1}
                  max={maxQuantity}
                  value={quantity}
                  onChange={handleQuantityChange}
                  disabled={!selectedProduct}
                />
                {selectedProduct && (
                  <p className="text-sm text-muted-foreground">
                    Maximum available: {maxQuantity}
                  </p>
                )}
              </div>

              {selectedProduct && (
                <div className="pt-2">
                  <p className="font-semibold">
                    Total: ₱{parseFloat(calculateTotal()).toFixed(2)}
                  </p>
                </div>
              )}
            </>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={!selectedProduct || submitting || loading || products.length === 0}
          >
            {submitting ? "Creating..." : "Create Order"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
