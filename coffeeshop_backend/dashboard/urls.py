from django.urls import path
from .views import DashboardStatsView, SalesChartView, RecentOrdersView, OrderStatusChartView, PopularProductsView, InventoryStatusView

urlpatterns = [
    path('stats/', DashboardStatsView.as_view(), name='dashboard-stats'),
    path('sales-chart/', SalesChartView.as_view(), name='sales-chart'),
    path('recent-orders/', RecentOrdersView.as_view(), name='recent-orders'),
    path('order-status-chart/', OrderStatusChartView.as_view(), name='order-status-chart'),
    path('popular-products/', PopularProductsView.as_view(), name='popular-products'),
    path('inventory-status/', InventoryStatusView.as_view(), name='inventory-status'),
]
