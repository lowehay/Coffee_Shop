from django.db import models
from products.models import Product
from users.models import Customer
import uuid
from decimal import Decimal


def generate_order_id():
    """Generate a unique order ID"""
    return str(uuid.uuid4()).split('-')[0].upper()
    
    
class Order(models.Model):
    STATUS_CHOICES = [
        ("pending", "Pending"),
        ("processing", "Processing"),
        ("completed", "Completed"),
        ("cancelled", "Cancelled"),
    ]
    order_id = models.CharField(max_length=10, unique=True, default=generate_order_id)
    customer = models.ForeignKey(Customer, on_delete=models.SET_NULL, null=True, blank=True)
    customer_name = models.CharField(max_length=100, null=True, blank=True, help_text="Name for guest customers or override")
    total_price = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="pending")
    ordered_at = models.DateTimeField(auto_now_add=True)

    def update_total_price(self):
        """Calculate the total price based on all items"""
        total = Decimal('0')
        for item in self.items.all():
            total += item.item_total
        self.total_price = total
        self.save()

    def __str__(self):
        return f"Order #{self.order_id} - {self.customer.name if self.customer else 'Guest'}"

class OrderItem(models.Model):
    order = models.ForeignKey(Order, related_name='items', on_delete=models.CASCADE)
    product = models.ForeignKey(Product, on_delete=models.CASCADE)
    quantity = models.PositiveIntegerField(default=1)
    price = models.DecimalField(max_digits=8, decimal_places=2)  # Price at time of purchase
    
    @property
    def item_total(self):
        return self.price * self.quantity
    
    def save(self, *args, **kwargs):
        # Set price from product if not already set
        if not self.price and self.product:
            self.price = self.product.price
            
        # Save the item
        super().save(*args, **kwargs)
        
        # Update order total price
        self.order.update_total_price()
        
    def __str__(self):
        return f"{self.quantity} x {self.product.name} in Order #{self.order.order_id}"


class OrderStatusHistory(models.Model):
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name="status_history")
    status = models.CharField(max_length=20, choices=Order.STATUS_CHOICES)
    changed_at = models.DateTimeField(auto_now_add=True)
    changed_by = models.CharField(max_length=100, blank=True, null=True)  # Optionally link to user if you want

    def __str__(self):
        return f"Order {self.order.order_id} changed to {self.status} at {self.changed_at}"