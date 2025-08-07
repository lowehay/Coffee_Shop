import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ShoppingCart, Plus, Minus, Trash2, Loader2 } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { toast } from 'sonner';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { ShoppingBag } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

export function CartHeader() {
  const [isCreatingOrder, setIsCreatingOrder] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const { cart, isCartOpen, setIsCartOpen, getTotalItems, getTotalPrice, updateQuantity, removeFromCart, createOrder } = useCart();

  const handleCreateOrder = async () => {
    if (cart.length === 0) {
      toast.error('Cart is empty');
      return;
    }
    
    setShowConfirmDialog(true);
  };

  const confirmCheckout = async () => {
    setShowConfirmDialog(false);
    setIsCartOpen(false); // Close the sheet immediately
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

  return (
    <div className="flex items-center gap-2">
      <Sheet open={isCartOpen} onOpenChange={setIsCartOpen}>
        <SheetTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="relative hover:bg-gray-100 transition-colors"
          >
            <ShoppingCart className="h-4 w-4 text-gray-700" />
            {getTotalItems() > 0 && (
              <Badge className="absolute -top-1 -right-1 h-4 w-4 flex items-center justify-center p-0 text-xs bg-gradient-to-r from-amber-500 to-orange-500 border border-white">
                {getTotalItems()}
              </Badge>
            )}
          </Button>
        </SheetTrigger>
        <SheetContent className="w-full max-w-sm p-0">
          <SheetHeader className="p-4 border-b bg-white">
            <SheetTitle className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-gray-900">Shopping Cart</h2>
                <p className="text-sm text-gray-500">{getTotalItems()} {getTotalItems() === 1 ? 'item' : 'items'}</p>
              </div>
            </SheetTitle>
          </SheetHeader>
          <div className="flex-1 overflow-y-auto p-4">
            {cart.length === 0 ? (
              <div className="text-center py-16">
                <ShoppingBag className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Your cart is empty</h3>
                <p className="text-sm text-gray-500">Add some delicious coffee to get started!</p>
              </div>
            ) : (
              <div className="space-y-4">
                {cart.map(item => (
                  <div key={item.id} className="flex gap-3 p-3 border rounded-lg hover:shadow-sm transition-shadow">
                    {item.image && (
                      <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 shadow-sm">
                        <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start mb-1">
                        <h4 className="text-sm font-semibold text-gray-900 truncate pr-2">{item.name}</h4>
                        <span className="text-sm font-bold text-amber-600 whitespace-nowrap">
                          {new Intl.NumberFormat('en-PH', {
                            style: 'currency',
                            currency: 'PHP'
                          }).format(item.price * item.quantity)}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mb-2">
                        {new Intl.NumberFormat('en-PH', {
                          style: 'currency',
                          currency: 'PHP'
                        }).format(item.price)} each
                      </p>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          disabled={item.quantity <= 1}
                          className="h-6 w-6 p-0"
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="text-sm font-semibold w-6 text-center text-gray-900">{item.quantity}</span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          disabled={item.quantity >= item.stock}
                          className="h-6 w-6 p-0"
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFromCart(item.id)}
                          className="h-6 w-6 p-0 ml-auto text-red-500 hover:text-red-600 hover:bg-red-50 rounded-full"
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
          {cart.length > 0 && (
            <div className="border-t p-4 bg-white">
              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Total</span>
                  <span className="font-bold text-lg">
                    {new Intl.NumberFormat('en-PH', {
                      style: 'currency',
                      currency: 'PHP'
                    }).format(getTotalPrice())}
                  </span>
                </div>
              </div>
              <Button 
                className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-md hover:shadow-lg transition-all duration-200 rounded-lg" 
                onClick={handleCreateOrder}
                disabled={isCreatingOrder || cart.length === 0}
              >
                <span className="flex items-center justify-center gap-2">
                  <ShoppingBag className="h-4 w-4" />
                  {isCreatingOrder ? 'Creating Order...' : `Create Order (${getTotalItems()})`}
                </span>
              </Button>
            </div>
          )}
        </SheetContent>
      </Sheet>
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Checkout</DialogTitle>
            <DialogDescription>
              Are you sure you want to checkout with {getTotalItems()} item{getTotalItems() !== 1 ? 's' : ''} for 
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
    </div>
  );
}
