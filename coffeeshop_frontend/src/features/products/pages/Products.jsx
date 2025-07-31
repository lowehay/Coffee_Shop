import React, { useState, useEffect, useCallback } from "react";
import { useUser } from "@/hooks/useUser";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { ProductForm } from "@/features/products/components/product-form";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { Badge } from "@/components/ui/badge";

export default function Products() {
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const { apiCallWithTokenRefresh } = useUser();
  
  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      // Use the apiCallWithTokenRefresh function from UserContext
      // This handles token refresh if needed
      const response = await apiCallWithTokenRefresh('/api/products/products/');
      setProducts(response.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching products:', err);
      setError('Failed to load products. Please try again.');
      toast.error('Could not load products');
    } finally {
      setLoading(false);
    }
  }, [apiCallWithTokenRefresh]);
  
  useEffect(() => {
    // Fetch products when component mounts
    fetchProducts();
  }, [fetchProducts]);
  
  // Filter products when search query or products change
  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredProducts(products);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = products.filter(product => 
        product.name.toLowerCase().includes(query)
      );
      setFilteredProducts(filtered);
    }
  }, [searchQuery, products]);
  
  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        await apiCallWithTokenRefresh(`/api/products/products/${id}/`, 'delete');
        toast.success('Product deleted successfully');
        // Refresh the products list
        fetchProducts();
      } catch (err) {
        console.error('Error deleting product:', err);
        toast.error('Failed to delete product');
      }
    }
  };
  
  const openCreateForm = () => {
    setEditingProduct(null);
    setIsFormOpen(true);
  };
  
  const openEditForm = (product) => {
    setEditingProduct(product);
    setIsFormOpen(true);
  };
  
  const closeForm = () => {
    setIsFormOpen(false);
    // Small delay to allow the dialog to close properly before clearing the editing state
    setTimeout(() => setEditingProduct(null), 300);
  };

  if (loading) {
    return (
      <div>
        <h1>Products</h1>
        <p>Loading products...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <h1>Products</h1>
        <p className="text-red-500">{error}</p>
        <Button onClick={fetchProducts}>Try Again</Button>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Products</h1>
        <Button onClick={openCreateForm}>Add New Product</Button>
      </div>
      
      {/* Search Bar */}
      <div className="relative mb-6">
        <input
          type="text"
          placeholder="Search products by name..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-80 px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary dark:bg-gray-800 dark:border-gray-700"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery("")}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
          >
            ✕
          </button>
        )}
      </div>

      {products.length === 0 ? (
        <p>No products found. Create your first product!</p>
      ) : filteredProducts.length === 0 ? (
        <p>No products match your search. Try a different search term.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {filteredProducts.map(product => (
            <Card key={product.id} className="overflow-hidden group transition-all duration-300 hover:shadow-md h-full flex flex-col">
              <CardContent className="p-4 flex flex-col h-full">
                {product.image && (
                  <div className="mb-4 w-full aspect-square overflow-hidden rounded-md relative group-hover:shadow transition-all duration-300">
                    <img 
                      src={`${product.image}`} 
                      alt={product.name}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" 
                    />
                    {product.stock <= 10 && (
                      <Badge variant="destructive" className="absolute top-2 right-2">
                        Low Stock: {product.stock}
                      </Badge>
                    )}
                  </div>
                )}
                {!product.image && (
                  <div className="mb-4 w-full aspect-square bg-gray-100 dark:bg-gray-800 rounded-md flex items-center justify-center relative">
                    <span className="text-gray-400 dark:text-gray-500 text-sm">No image</span>
                    {product.stock <= 10 && (
                      <Badge variant="destructive" className="absolute top-2 right-2">
                        Low Stock: {product.stock}
                      </Badge>
                    )}
                  </div>
                )}
                <div className="flex-grow">
                  <div className="flex justify-between items-start">
                    <div className="w-full">
                      <div className="flex justify-between items-start">
                        <h2 className="text-xl font-semibold group-hover:text-primary transition-colors duration-300">{product.name}</h2>
                      </div>
                      <p className="text-gray-600 dark:text-gray-400 mt-1 text-lg font-medium">
                        ₱{parseFloat(product.price).toFixed(2)}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                        Stock: <span className={product.stock <= 10 ? 'text-red-500 font-medium' : ''}>{product.stock}</span>
                      </p>
                      <HoverCard>
                        <HoverCardTrigger asChild>
                          <p className="text-sm mt-2 mb-2 line-clamp-2 cursor-help">
                            {product.description}
                          </p>
                        </HoverCardTrigger>
                        <HoverCardContent className="w-80">
                          <div className="space-y-1">
                            <h4 className="text-sm font-semibold">{product.name}</h4>
                            <p className="text-sm">{product.description}</p>
                          </div>
                        </HoverCardContent>
                      </HoverCard>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2 mt-4 pt-3 border-t border-gray-100 dark:border-gray-800 mt-auto">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => openEditForm(product)}
                    className="group-hover:border-primary group-hover:text-primary transition-colors duration-300"
                  >
                    Edit
                  </Button>
                  <Button 
                    variant="destructive" 
                    size="sm"
                    onClick={() => handleDelete(product.id)}
                    className="group-hover:opacity-90 transition-opacity duration-300"
                  >
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      
      {/* Product Form Modal */}
      <ProductForm 
        isOpen={isFormOpen}
        onClose={closeForm}
        onSuccess={fetchProducts}
        product={editingProduct}
      />
    </div>
  );
}
