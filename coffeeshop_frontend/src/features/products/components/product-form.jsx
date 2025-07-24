import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import axios from "axios";

export function ProductForm({ isOpen, onClose, onSuccess, product = null }) {
  const isEditing = !!product;
  
  // Form state
  const [formData, setFormData] = useState({
    name: "",
    price: "",
    stock: "",
    description: ""
  });
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  
  // Populate form when editing
  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name || "",
        price: product.price || "",
        stock: product.stock || "",
        description: product.description || ""
      });
      
      if (product.image) {
        setImagePreview(`${product.image}`);
      } else {
        setImagePreview(null);
      }
    } else {
      // Reset form for new product
      setFormData({
        name: "",
        price: "",
        stock: "",
        description: ""
      });
      setImagePreview(null);
      setImage(null);
    }
  }, [product]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
    
    // Clear error for this field when user types
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: null
      });
    }
  };
  
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImage(file);
      // Create a preview URL
      const previewUrl = URL.createObjectURL(file);
      setImagePreview(previewUrl);
      
      // Clear error for image if any
      if (errors.image) {
        setErrors({
          ...errors,
          image: null
        });
      }
    }
  };
  
  const validateForm = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = "Name is required";
    if (!formData.price) newErrors.price = "Price is required";
    else if (isNaN(parseFloat(formData.price)) || parseFloat(formData.price) <= 0) {
      newErrors.price = "Price must be a positive number";
    }
    
    if (!formData.stock) newErrors.stock = "Stock is required";
    else if (isNaN(parseInt(formData.stock)) || parseInt(formData.stock) < 0) {
      newErrors.stock = "Stock must be a non-negative number";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setLoading(true);
    
    try {
      const endpoint = isEditing 
        ? `/api/products/products/${product.id}/` 
        : '/api/products/products/';
      
      const method = isEditing ? 'put' : 'post';
      
      // Use FormData for file uploads
      const formDataObj = new FormData();
      formDataObj.append('name', formData.name);
      formDataObj.append('price', formData.price);
      formDataObj.append('stock', formData.stock);
      formDataObj.append('description', formData.description);
      
      // Only append image if a new one is selected
      if (image) {
        formDataObj.append('image', image);
      }
      
      // Use axios directly for multipart form data
      const axiosConfig = {
        url: `http://localhost:8000${endpoint}`,
        method: method,
        data: formDataObj,
        withCredentials: true,
        headers: {
          'Content-Type': 'multipart/form-data',
        }
      };
      
      await axios(axiosConfig);
      
      toast.success(isEditing ? "Product updated successfully" : "Product created successfully");
      onSuccess();
      onClose();
    } catch (err) {
      console.error('Error saving product:', err);
      
      // Handle API validation errors
      if (err.response && err.response.data) {
        const apiErrors = err.response.data;
        const formattedErrors = {};
        
        Object.keys(apiErrors).forEach(key => {
          formattedErrors[key] = apiErrors[key][0];
        });
        
        setErrors(formattedErrors);
      } else {
        toast.error(isEditing ? "Failed to update product" : "Failed to create product");
      }
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Product" : "Add New Product"}</DialogTitle>
          <DialogDescription>
            {isEditing 
              ? "Update product details below" 
              : "Fill in the information for the new product"}
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            {/* Image Upload */}
            <div className="grid grid-cols-4 items-start gap-4">
              <Label htmlFor="image" className="text-right">
                Image
              </Label>
              <div className="col-span-3 space-y-3">
                <Input
                  id="image"
                  name="image"
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="col-span-3"
                  aria-invalid={errors.image ? "true" : "false"}
                />
                {imagePreview && (
                  <div className="relative w-32 h-32 border rounded">
                    <img 
                      src={imagePreview} 
                      alt="Preview" 
                      className="object-cover w-full h-full rounded" 
                    />
                  </div>
                )}
                {errors.image && (
                  <p className="text-sm text-red-500">
                    {errors.image}
                  </p>
                )}
              </div>
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Name
              </Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="col-span-3"
                aria-invalid={errors.name ? "true" : "false"}
              />
              {errors.name && (
                <p className="col-span-3 col-start-2 text-sm text-red-500">
                  {errors.name}
                </p>
              )}
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="price" className="text-right">
                Price
              </Label>
              <Input
                id="price"
                name="price"
                type="number"
                step="0.01"
                min="0"
                value={formData.price}
                onChange={handleChange}
                className="col-span-3"
                aria-invalid={errors.price ? "true" : "false"}
              />
              {errors.price && (
                <p className="col-span-3 col-start-2 text-sm text-red-500">
                  {errors.price}
                </p>
              )}
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="stock" className="text-right">
                Stock
              </Label>
              <Input
                id="stock"
                name="stock"
                type="number"
                min="0"
                step="1"
                value={formData.stock}
                onChange={handleChange}
                className="col-span-3"
                aria-invalid={errors.stock ? "true" : "false"}
              />
              {errors.stock && (
                <p className="col-span-3 col-start-2 text-sm text-red-500">
                  {errors.stock}
                </p>
              )}
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="description" className="text-right">
                Description
              </Label>
              <Textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                className="col-span-3"
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : (isEditing ? "Update" : "Create")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
