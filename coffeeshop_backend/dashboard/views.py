from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.db.models import Sum, Count, Avg, F, Q, Value, DecimalField
from django.db.models.functions import TruncHour, TruncDate, TruncMonth, Coalesce
from django.utils import timezone
from datetime import timedelta, datetime, time
from decimal import Decimal
import calendar
from django.contrib.auth import get_user_model

from orders.models import Order, OrderItem
from products.models import Product

User = get_user_model()

class DashboardStatsView(APIView):
    """
    API view to provide dashboard statistics for the frontend
    """
    def get(self, request):
        try:
            # Get time periods
            today = timezone.now().date()
            yesterday = today - timedelta(days=1)
            current_month = today.replace(day=1)
            last_month = (current_month - timedelta(days=1)).replace(day=1)
            
            # Total sales (all time)
            total_sales = Order.objects.filter(
                status__in=['completed', 'processing']
            ).aggregate(
                total=Sum('total_price')
            )['total'] or Decimal('0')
            
            # Sales for current month
            current_month_sales = Order.objects.filter(
                status__in=['completed', 'processing'],
                ordered_at__gte=current_month
            ).aggregate(
                total=Sum('total_price')
            )['total'] or Decimal('0')
            
            # Sales for last month
            last_month_sales = Order.objects.filter(
                status__in=['completed', 'processing'],
                ordered_at__gte=last_month,
                ordered_at__lt=current_month
            ).aggregate(
                total=Sum('total_price')
            )['total'] or Decimal('0')
            
            # Calculate sales trend (percentage change)
            sales_trend = 0
            if last_month_sales > 0:
                sales_trend = round(((current_month_sales - last_month_sales) / last_month_sales) * 100, 1)
            
            # Total orders (all time)
            total_orders = Order.objects.count()
            
            # Orders for current month
            current_month_orders = Order.objects.filter(
                ordered_at__gte=current_month
            ).count()
            
            # Orders for last month
            last_month_orders = Order.objects.filter(
                ordered_at__gte=last_month,
                ordered_at__lt=current_month
            ).count()
            
            # Calculate orders trend
            orders_trend = 0
            if last_month_orders > 0:
                orders_trend = round(((current_month_orders - last_month_orders) / last_month_orders) * 100, 1)
            
            # Average order value
            avg_order = Order.objects.filter(
                status__in=['completed', 'processing']
            ).aggregate(
                avg=Avg('total_price')
            )['avg'] or Decimal('0')
            
            # Current month avg order
            current_month_avg = Order.objects.filter(
                status__in=['completed', 'processing'],
                ordered_at__gte=current_month
            ).aggregate(
                avg=Avg('total_price')
            )['avg'] or Decimal('0')
            
            # Last month avg order
            last_month_avg = Order.objects.filter(
                status__in=['completed', 'processing'],
                ordered_at__gte=last_month,
                ordered_at__lt=current_month
            ).aggregate(
                avg=Avg('total_price')
            )['avg'] or Decimal('0')
            
            # Calculate average order trend
            avg_trend = 0
            if last_month_avg > 0:
                avg_trend = round(((current_month_avg - last_month_avg) / last_month_avg) * 100, 1)
            
            # Low stock count
            # Consider products with less than 10 items as low stock
            low_stock_count = Product.objects.filter(stock__lt=10).count()
            
            # Last month low stock count (we'll use a dummy trend here since we don't track historical stock)
            # In a real application, you would track inventory history
            low_stock_trend = -5.0  # Placeholder
            
            return Response({
                'sales': {
                    'total': str(total_sales),
                    'current_month': str(current_month_sales),
                    'last_month': str(last_month_sales),
                    'trend': sales_trend
                },
                'orders': {
                    'total': total_orders,
                    'current_month': current_month_orders,
                    'last_month': last_month_orders,
                    'trend': orders_trend
                },
                'average_order': {
                    'total': str(round(avg_order, 2)),
                    'current_month': str(round(current_month_avg, 2)),
                    'last_month': str(round(last_month_avg, 2)),
                    'trend': avg_trend
                },
                'inventory': {
                    'low_stock_count': low_stock_count,
                    'trend': low_stock_trend
                }
            })
        
        except Exception as e:
            return Response({
                'error': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class SalesChartView(APIView):
    """
    API view to provide sales chart data for the frontend
    Provides data for daily, weekly, and monthly charts
    """
    def get(self, request):
        chart_type = request.query_params.get('type', 'daily')
        
        try:
            if chart_type == 'daily':
                return self.get_daily_data()
            elif chart_type == 'weekly':
                return self.get_weekly_data()
            elif chart_type == 'monthly':
                return self.get_monthly_data()
            else:
                return Response({'error': 'Invalid chart type'}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    def get_daily_data(self):
        """
        Return hourly sales data for the current day
        """
        # Use the current timezone-aware datetime and extract the date part
        today = timezone.now().date()
        today_start = timezone.make_aware(datetime.combine(today, time.min))
        today_end = timezone.make_aware(datetime.combine(today, time.max))
        
        # Get hourly sales for today
        
        # Get hourly sales for today - include all statuses except 'cancelled'
        hourly_sales = Order.objects.filter(
            ordered_at__date=today,  # Use date field directly for better matching
            # Include all valid statuses, just exclude cancelled
            status__in=['completed', 'processing', 'pending', 'shipped', 'delivered']
        ).annotate(
            hour=TruncHour('ordered_at')
        ).values('hour').annotate(
            sales=Coalesce(Sum('total_price'), Value(0, output_field=DecimalField()), output_field=DecimalField())
        ).order_by('hour')
        
        # Format data for frontend
        chart_data = []
        
        # Create entries for all hours (7AM-11PM) even if no sales
        business_hours = range(7, 23)  # 7AM to 11PM
        
        # Create a map for easier lookup
        sales_by_hour = {}
        for item in hourly_sales:
            # Store by hour number (0-23)
            hour_key = item['hour'].hour
            sales_by_hour[hour_key] = item['sales']
            
        # Generate chart data for each business hour
        for hour in business_hours:
            hour_datetime = today_start + timedelta(hours=hour)
            
            # Get sales for this hour (or default to 0)
            sales_amount = sales_by_hour.get(hour, Decimal('0'))
            
            # Format hour as '9AM', '10AM', etc.
            hour_num = hour
            am_pm = 'AM' if hour_num < 12 else 'PM'
            display_hour = hour_num if hour_num <= 12 else hour_num - 12
            if display_hour == 0:  # Handle midnight (12 AM)
                display_hour = 12
            formatted_hour = f'{display_hour}{am_pm}'
            
            chart_data.append({
                'name': formatted_hour,
                'sales': float(sales_amount)
            })
        
        return Response(chart_data)
    
    def get_weekly_data(self):
        """
        Return daily sales data for the current week
        """
        today = timezone.now().date()
        start_of_week = today - timedelta(days=today.weekday())  # Monday
        end_of_week = start_of_week + timedelta(days=6)  # Sunday
        
        # Get orders for current week
        
        # Get daily sales for the current week - include all statuses except 'cancelled'
        daily_sales = Order.objects.filter(
            ordered_at__date__range=(start_of_week, end_of_week),
            status__in=['completed', 'processing', 'pending', 'shipped', 'delivered']
        ).annotate(
            day=TruncDate('ordered_at')
        ).values('day').annotate(
            sales=Coalesce(Sum('total_price'), Value(0, output_field=DecimalField()), output_field=DecimalField())
        ).order_by('day')
        
        # Process sales data by day
        
        # Create a map for easier lookup
        sales_by_date = {}
        for item in daily_sales:
            # Get the date as a string for mapping
            date_key = item['day'].isoformat()
            sales_by_date[date_key] = item['sales']
        
        # Format data for frontend
        chart_data = []
        
        # Create entries for all days of the week
        days_of_week = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
        for i, day_name in enumerate(days_of_week):
            day_date = start_of_week + timedelta(days=i)
            # Get sales for this day (or default to 0)
            date_key = day_date.isoformat()
            sales_amount = sales_by_date.get(date_key, Decimal('0'))
            
            chart_data.append({
                'name': day_name,
                'sales': float(sales_amount)
            })
        
        return Response(chart_data)
    
    def get_monthly_data(self):
        """
        Return monthly sales data for the current year
        """
        today = timezone.now().date()
        start_of_year = today.replace(month=1, day=1)
        end_of_year = today.replace(month=12, day=31)
        
        # Get orders for current year
        
        # Get monthly sales for the current year - include all statuses except 'cancelled'
        monthly_sales = Order.objects.filter(
            ordered_at__date__range=(start_of_year, end_of_year),
            status__in=['completed', 'processing', 'pending', 'shipped', 'delivered']
        ).annotate(
            month=TruncMonth('ordered_at')
        ).values('month').annotate(
            sales=Coalesce(Sum('total_price'), Value(0, output_field=DecimalField()), output_field=DecimalField())
        ).order_by('month')
        
        # Process sales data by month
        
        # Create a map for easier lookup
        sales_by_month = {}
        for item in monthly_sales:
            # Store by month number (1-12)
            month_key = item['month'].month
            sales_by_month[month_key] = item['sales']
        
        # Format data for frontend
        chart_data = []
        
        # Create entries for all months
        months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
        for i, month_name in enumerate(months, 1):
            # Get sales for this month (or default to 0)
            sales_amount = sales_by_month.get(i, Decimal('0'))
            
            chart_data.append({
                'name': month_name,
                'sales': float(sales_amount)
            })
        
        return Response(chart_data)


class RecentOrdersView(APIView):
    """
    API view to provide recent orders data for the dashboard
    """
    def get(self, request):
        # Get limit parameter (default to 5)
        limit = int(request.query_params.get('limit', 5))
        
        # Get recent orders (exclude cancelled)
        recent_orders = Order.objects.filter(
            status__in=['completed', 'processing', 'pending', 'shipped', 'delivered']
        ).order_by('-ordered_at')[:limit]
        
        # Format data for frontend
        orders_data = []
        for order in recent_orders:
            # Get customer name - first try the customer_name field, then fall back to related customer
            if order.customer_name and order.customer_name.strip():
                customer_name = order.customer_name
            elif order.customer:
                try:
                    customer_name = order.customer.name
                except Exception:
                    customer_name = "Guest"
            else:
                customer_name = "Guest"
                    
            # Get items summary
            items = OrderItem.objects.filter(order=order)
            if items:
                items_text = ", ".join([f"{item.product.name} (x{item.quantity})" if item.quantity > 1 
                                      else item.product.name for item in items])
            else:
                items_text = "No items"
                
            # Format date
            order_date = timezone.localtime(order.ordered_at)
            formatted_date = order_date.strftime("%B %d, %Y - %I:%M %p")
            
            orders_data.append({
                'id': order.order_id,
                'customer': customer_name,
                'items': items_text,
                'date': formatted_date,
                'status': order.status,
                'total': float(order.total_price)
            })
        
        return Response(orders_data)


class OrderStatusChartView(APIView):
    """
    API view to provide order status distribution data for the dashboard
    """
    def get(self, request):
        # Get counts for each status
        status_counts = Order.objects.values('status').annotate(
            count=Count('id')
        ).order_by('status')
        
        # Define standard statuses and colors
        standard_statuses = {
            'completed': {'name': 'Completed', 'color': 'var(--chart-2)'},
            'processing': {'name': 'Processing', 'color': 'var(--chart-1)'},
            'pending': {'name': 'Pending', 'color': 'var(--chart-3)'},
            'shipped': {'name': 'Shipped', 'color': 'var(--chart-5)'},
            'delivered': {'name': 'Delivered', 'color': 'var(--chart-6)'},
            'cancelled': {'name': 'Cancelled', 'color': 'var(--chart-4)'}
        }
        
        # Format data for the frontend
        status_data = []
        for status in status_counts:
            status_key = status['status'].lower()
            if status_key in standard_statuses:
                status_info = standard_statuses[status_key]
                status_data.append({
                    'name': status_info['name'],
                    'value': status['count'],
                    'color': status_info['color']
                })
            else:
                # Handle any non-standard statuses
                status_data.append({
                    'name': status['status'].capitalize(),
                    'value': status['count'],
                    'color': 'var(--chart-7)'
                })
        
        # If there are no orders yet, provide default placeholder data
        if not status_data:
            status_data = [
                {'name': 'No Orders', 'value': 1, 'color': 'var(--muted)'}
            ]
            
        return Response(status_data)


class PopularProductsView(APIView):
    """
    API view to provide popular products data for the dashboard
    """
    def get(self, request):
        # Get limit parameter (default to 5)
        limit = int(request.query_params.get('limit', 5))
        
        # Use Django ORM to aggregate order items by product
        # We'll only count orders with status != 'cancelled'
        valid_statuses = ['completed', 'processing', 'pending', 'shipped', 'delivered']
        
        # Time period filter (default to current month)
        period = request.query_params.get('period', 'month')
        
        # Starting date for filtering
        start_date = None
        if period == 'month':
            today = timezone.now().date()
            start_date = today.replace(day=1)  # First day of current month
        elif period == 'week':
            today = timezone.now().date()
            start_date = today - timedelta(days=today.weekday())  # Monday of current week
        elif period == 'year':
            today = timezone.now().date()
            start_date = today.replace(month=1, day=1)  # First day of current year
        
        # Create base queryset for order items
        order_item_query = OrderItem.objects.filter(
            order__status__in=valid_statuses
        )
        
        # Apply date filter if applicable
        if start_date:
            order_item_query = order_item_query.filter(
                order__ordered_at__gte=timezone.make_aware(datetime.combine(start_date, time.min))
            )
        
        # Aggregate by product
        product_stats = (
            order_item_query
            .values('product')
            .annotate(
                total_quantity=Sum('quantity'),
                total_revenue=Sum(F('quantity') * F('price'))
            )
            .order_by('-total_quantity')[:limit]
        )
        
        # If there are no results, return empty array
        if not product_stats:
            return Response([]) 
            
        # Get product details for the results
        products_data = []
        for stat in product_stats:
            try:
                product = Product.objects.get(pk=stat['product'])
                
                # Determine stock status
                if product.stock <= 0:
                    status = "Out of Stock"
                elif product.stock < 10:
                    status = "Low Stock"
                else:
                    status = "In Stock"
                
                # Get image URL if available
                image_url = None
                if product.image and hasattr(product.image, 'url'):
                    image_url = request.build_absolute_uri(product.image.url)
                
                products_data.append({
                    'id': product.id,
                    'name': product.name,
                    'quantity': stat['total_quantity'],
                    'revenue': float(stat['total_revenue']),
                    'image': image_url,
                    'category': 'Coffee',  # Placeholder - would come from a category field in the Product model
                    'status': status,
                    'stock': product.stock
                })
            except Product.DoesNotExist:
                continue
        
        return Response(products_data)


class InventoryStatusView(APIView):
    """
    API view to provide inventory status data for the dashboard
    """
    def get(self, request):
        # Get limit parameter (default to show all products)
        limit = int(request.query_params.get('limit', 0))
        
        # Get products with stock information
        products = Product.objects.all().order_by('stock')
        
        if limit > 0:
            products = products[:limit]
        
        inventory_data = []
        for product in products:
            # Determine stock status based on levels
            # Using percentage of theoretical maximum stock (100 units as default)
            max_stock = 100  # Default maximum stock level for visualization
            
            # Calculate status
            if product.stock <= 0:
                status = "Critical"
            elif product.stock < 10:
                status = "Low"
            else:
                status = "Good"
            
            # Calculate reorder point (20% of max stock as default)
            reorder_point = 10  # Default reorder point
            
            inventory_data.append({
                'id': product.id,
                'name': product.name,
                'stockLevel': product.stock,
                'totalCapacity': max_stock,
                'unit': 'pcs',  # Default unit
                'status': status,
                'reorderPoint': reorder_point
            })
        
        return Response(inventory_data)
