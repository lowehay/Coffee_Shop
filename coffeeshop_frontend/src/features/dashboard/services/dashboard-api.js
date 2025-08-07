import api from '../../../services/api';

export const dashboardApi = {
  /**
   * Fetches dashboard statistics from the backend
   * @returns {Promise<Object>} Dashboard statistics including sales, orders, average order value, and inventory
   */
  async getStats() {
    try {
      const response = await api.get('/api/dashboard/stats/');
      return response.data;
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      throw error;
    }
  },

  /**
   * Fetches sales chart data from the backend
   * @param {string} type - Type of chart data to fetch ('daily', 'weekly', or 'monthly')
   * @returns {Promise<Array>} Array of data points for the chart
   */
  async getSalesChart(type = 'daily') {
    try {
      const response = await api.get(`/api/dashboard/sales-chart/?type=${type}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching ${type} sales chart data:`, error);
      throw error;
    }
  },
  
  /**
   * Fetches recent orders data from the backend
   * @param {number} limit - Number of orders to fetch (default: 5)
   * @returns {Promise<Array>} Array of recent orders
   */
  async getRecentOrders(limit = 5) {
    try {
      const response = await api.get(`/api/dashboard/recent-orders/?limit=${limit}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching recent orders:', error);
      throw error;
    }
  },
  
  /**
   * Fetches popular products data from the backend
   * @param {number} limit - Number of products to fetch (default: 5)
   * @param {string} period - Time period for data (month, week, year)
   * @returns {Promise<Array>} Array of popular products with sales data
   */
  async getPopularProducts(limit = 5, period = 'month') {
    try {
      const response = await api.get(`/api/dashboard/popular-products/?limit=${limit}&period=${period}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching popular products:', error);
      throw error;
    }
  },
  
  /**
   * Fetches order status distribution data from the backend
   * @returns {Promise<Array>} Array of order status data with counts
   */
  async getOrderStatusChart() {
    try {
      const response = await api.get('/api/dashboard/order-status-chart/');
      return response.data;
    } catch (error) {
      console.error('Error fetching order status chart data:', error);
      throw error;
    }
  },
  
  /**
   * Fetches inventory status data from the backend
   * @param {number} limit - Optional limit for number of inventory items to fetch
   * @returns {Promise<Array>} Array of inventory items with stock levels
   */
  async getInventoryStatus(limit) {
    try {
      const url = limit 
        ? `/api/dashboard/inventory-status/?limit=${limit}` 
        : '/api/dashboard/inventory-status/';
      const response = await api.get(url);
      return response.data;
    } catch (error) {
      console.error('Error fetching inventory status data:', error);
      throw error;
    }
  }
};
