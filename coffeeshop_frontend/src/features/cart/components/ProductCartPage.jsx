import React, { useState, useEffect, useCallback } from 'react';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useUser } from '@/hooks/useUser';
import { useCart } from '@/context/CartContext';
import { toast } from 'sonner';
import {
  ShoppingBag,
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  Coffee,
  Package,
  Heart,
  Loader2
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from '@/components/ui/hover-card';

export function ProductCartPage() {
  const [products, setProducts] = useState([]);
  const [isCreatingOrder, setIsCreatingOrder] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  const [loading, setLoading] = useState(true);
  const { apiCallWithTokenRefresh } = useUser();
  const { cart, addToCart, updateQuantity, removeFromCart, getTotalPrice, getTotalItems, createOrder } = useCart();

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      const response = await apiCallWithTokenRefresh('/api/products/products/');
      setProducts(response.data);
    } catch (error) {
      console.error('Error fetching products:', error);
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  }, [apiCallWithTokenRefresh]);

  const handleCreateOrder = async () => {
    if (cart.length === 0) return;
    setShowConfirmDialog(true);
  };

  const confirmCheckout = async () => {
    setShowConfirmDialog(false);
    setIsCreatingOrder(true);
    try {
      await createOrder();
      // Toast is handled by CartContext, no need to show another one
    } catch (error) {
      console.error('Error creating order:', error);
      // Toast is handled by CartContext, no need to show another one
    } finally {
      setIsCreatingOrder(false);
    }
  };



  // Fetch products on component mount
  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  if (loading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2">
        {[...Array(8)].map((_, i) => (
          <Card key={i} className="overflow-hidden border-border">
            <div className="aspect-square bg-muted animate-pulse"></div>
            <div className="p-3 space-y-2">
              <div className="h-4 bg-muted rounded animate-pulse"></div>
              <div className="h-3 bg-muted rounded w-3/4 animate-pulse"></div>
              <div className="flex justify-between items-center">
                <div className="h-5 bg-muted rounded w-16 animate-pulse"></div>
                <div className="h-6 bg-muted rounded w-12 animate-pulse"></div>
              </div>
              <div className="h-8 bg-muted rounded animate-pulse"></div>
            </div>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <>
      {/* Mobile Cart Summary */}
      <div className="lg:hidden bg-background border-b p-4 mb-3">
        <div className="flex justify-between items-center">
          <span className="text-sm text-muted-foreground">
            {getTotalItems()} items in cart
          </span>
          <span className="font-bold text-lg text-foreground">
            {new Intl.NumberFormat('en-PH', {
              style: 'currency',
              currency: 'PHP'
            }).format(getTotalPrice())}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 lg:gap-3">
        {/* Products Section */}
        <div className="lg:col-span-8 xl:col-span-9">
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2">
            {products.map(product => (
              <HoverCard key={product.id}>
                <HoverCardTrigger asChild>
                  <Card className="overflow-hidden hover:shadow-lg transition-all duration-300 transform hover:-translate-y-0.5 flex flex-col bg-card border-border cursor-pointer">
                    {product.image && (
                      <div className="aspect-square overflow-hidden relative group">
                        <img 
                          src={product.image} 
                          alt={product.name}
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                          onError={(e) => {
                            e.target.src = 'https://via.placeholder.com/300x300?text=No+Image';
                          }}
                        />
                      </div>
                    )}
                    <div className="flex-1 flex flex-col">
                      <CardHeader className="p-3">
                        <CardTitle className="text-sm font-bold text-foreground line-clamp-2 leading-tight hover:text-amber-600 transition-colors">
                          {product.name}
                        </CardTitle>
                        <CardDescription className="text-xs text-muted-foreground line-clamp-1 mt-1">
                          {product.description || 'Premium coffee blend'}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="p-3 pt-0 mt-auto">
                        <div className="flex items-center justify-between">
                          <div className="text-lg font-bold text-amber-600 dark:text-amber-400">
                            {new Intl.NumberFormat('en-PH', {
                              style: 'currency',
                              currency: 'PHP'
                            }).format(product.price)}
                          </div>
                          <Badge variant={product.stock > 0 ? "secondary" : "destructive"} 
                                 className={`text-xs px-2 py-0.5 ${product.stock > 0 ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-green-200' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-red-200'}`}>
                            {product.stock > 0 ? `${product.stock} left` : 'Out of Stock'}
                          </Badge>
                        </div>
                      </CardContent>
                      <CardFooter className="p-3 pt-0">
                        <Button 
                          className={`w-full text-xs h-9 transition-all duration-200 ${product.stock > 0 ? 'bg-amber-500 hover:bg-amber-600 text-white shadow-sm hover:shadow-md' : 'bg-muted text-muted-foreground cursor-not-allowed'}`} 
                          onClick={() => addToCart(product)}
                          disabled={product.stock <= 0}
                          size="sm"
                        >
                          <ShoppingCart className="mr-1 h-3 w-3" />
                          {product.stock <= 0 ? 'Out of Stock' : 'Add to Cart'}
                        </Button>
                      </CardFooter>
                    </div>
                  </Card>
                </HoverCardTrigger>
                <HoverCardContent className="w-80">
                  <div className="space-y-2">
                    <h4 className="font-bold text-base">{product.name}</h4>
                    <p className="text-sm text-muted-foreground">
                      {product.description || 'Premium coffee blend with rich flavor and aroma.'}
                    </p>
                    <div className="flex justify-between items-center pt-2">
                      <span className="text-sm font-semibold">Price:</span>
                      <span className="text-lg font-bold text-amber-600">
                        {new Intl.NumberFormat('en-PH', {
                          style: 'currency',
                          currency: 'PHP'
                        }).format(product.price)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-semibold">Stock:</span>
                      <span className={`text-sm font-medium ${product.stock > 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {product.stock > 0 ? `${product.stock} available` : 'Out of Stock'}
                      </span>
                    </div>
                  </div>
                </HoverCardContent>
              </HoverCard>
            ))}
        </div>
      </div>

      {/* Desktop Cart */}
      <div className="hidden lg:block lg:col-span-4 xl:col-span-3">
        <Card className="border-border shadow-lg h-[calc(100vh-8rem)] max-h-[600px] flex flex-col bg-card">
          <CardHeader className="pb-3 border-b border-border flex-shrink-0">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg font-bold text-foreground">Shopping Cart</CardTitle>
                <p className="text-sm text-muted-foreground">{getTotalItems()} {getTotalItems() === 1 ? 'item' : 'items'}</p>
              </div>
              <Badge variant="secondary" className="bg-amber-500 text-white px-2">
                {getTotalItems()}
              </Badge>
            </div>
          </CardHeader>
            
            <CardContent className="p-0 flex-1 flex flex-col min-h-0">
              <div className="flex-1 overflow-y-auto">
                {cart.length === 0 ? (
                  <div className="text-center py-8 px-4">
                    <div className="w-16 h-16 mx-auto mb-3 bg-gradient-to-br from-amber-100 to-orange-100 dark:from-amber-900/30 dark:to-orange-900/30 rounded-full flex items-center justify-center">
                      <ShoppingBag className="h-8 w-8 text-amber-600 dark:text-amber-400" />
                    </div>
                    <h3 className="text-base font-medium text-foreground mb-1">Your cart is empty</h3>
                    <p className="text-sm text-muted-foreground">Add some delicious coffee to get started!</p>
                  </div>
                ) : (
                  <div className="p-3 space-y-2">
                    {cart.map(item => (
                      <div key={item.id} className="flex gap-3 p-3 bg-background border border-border rounded-xl hover:shadow-sm transition-all duration-200">
                        {item.image && (
                          <div className="w-14 h-14 rounded-lg overflow-hidden flex-shrink-0 shadow-sm">
                            <img 
                              src={item.image} 
                              alt={item.name}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.target.src = 'https://via.placeholder.com/64x64?text=No+Image';
                              }}
                            />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-start mb-1">
                            <h4 className="text-sm font-semibold text-foreground truncate pr-2">{item.name}</h4>
                            <span className="text-sm font-bold text-amber-600 dark:text-amber-400 whitespace-nowrap">
                              {new Intl.NumberFormat('en-PH', {
                                style: 'currency',
                                currency: 'PHP'
                              }).format(item.price * item.quantity)}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground mb-2">
                            {new Intl.NumberFormat('en-PH', {
                              style: 'currency',
                              currency: 'PHP'
                            }).format(item.price)} each
                          </p>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => updateQuantity(item.id, item.quantity - 1)}
                              disabled={item.quantity <= 1}
                              className="h-6 w-6 p-0 hover:bg-amber-50 hover:text-amber-600 rounded-full transition-colors"
                            >
                              <Minus className="h-3 w-3" />
                            </Button>
                            <span className="text-sm font-semibold w-6 text-center text-foreground bg-muted rounded-full">{item.quantity}</span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => updateQuantity(item.id, item.quantity + 1)}
                              disabled={item.quantity >= item.stock}
                              className="h-6 w-6 p-0 hover:bg-amber-50 hover:text-amber-600 rounded-full transition-colors"
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeFromCart(item.id)}
                              className="h-6 w-6 p-0 ml-auto text-red-500 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
            
            {cart.length > 0 && (
              <CardFooter className="border-t pt-3 border-t-border flex-shrink-0">
                <div className="w-full space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground font-medium">Total</span>
                    <span className="font-bold text-lg text-foreground">
                      {new Intl.NumberFormat('en-PH', {
                        style: 'currency',
                        currency: 'PHP'
                      }).format(getTotalPrice())}
                    </span>
                  </div>
                  <Button 
                    className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold transition-all duration-200"
                    onClick={handleCreateOrder}
                    disabled={isCreatingOrder || cart.length === 0}
                  >
                    {isCreatingOrder ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <ShoppingCart className="mr-2 h-4 w-4" />
                        Checkout ({getTotalItems()} items)
                      </>
                    )}
                  </Button>
                </div>
              </CardFooter>
            )}
          </Card>
        </div>
      </div>

      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Checkout</DialogTitle>
            <DialogDescription>
              Are you sure you want to checkout with {getTotalItems()} item(s) for a total of 
              {new Intl.NumberFormat('en-PH', {
                style: 'currency',
                currency: 'PHP'
              }).format(getTotalPrice())}?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConfirmDialog(false)}>
              Cancel
            </Button>
            <Button onClick={confirmCheckout} className="bg-green-600 hover:bg-green-700">
              Confirm Checkout
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
