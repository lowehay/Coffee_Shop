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
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { PlusCircle, X } from "lucide-react";
import { toast } from "sonner";
import axios from "axios";

export function ProductForm({ isOpen, onClose, onSuccess, product = null }) {
  const isEditing = !!product;
  
  // Form state
  const [formData, setFormData] = useState({
    name: "",
    price: "",
    stock: "",
    description: "",
    deductable: false
  });
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  
  // Ingredients state
  const [ingredients, setIngredients] = useState([]);
  const [selectedIngredients, setSelectedIngredients] = useState([]);
  const [loadingIngredients, setLoadingIngredients] = useState(false);

  // Load ingredients
  useEffect(() => {
    const fetchIngredients = async () => {
      try {
        setLoadingIngredients(true);
        const response = await axios.get('http://localhost:8000/api/ingredients/ingredients/', {
          withCredentials: true
        });
        setIngredients(response.data);
      } catch (error) {
        console.error('Error fetching ingredients:', error);
        toast.error('Failed to load ingredients');
      } finally {
        setLoadingIngredients(false);
      }
    };

    fetchIngredients();
  }, []);

  // Load product ingredients if editing
  useEffect(() => {
    const fetchProductIngredients = async () => {
      if (product && product.id) {
        try {
          const response = await axios.get(
            `http://localhost:8000/api/products/products/${product.id}/`,
            { withCredentials: true }
          );
          
          // Set deductable from product data
          if (response.data.deductable !== undefined) {
            setFormData(prevData => ({
              ...prevData,
              deductable: response.data.deductable
            }));
          }
          
          // Set deductable from product data
          if (response.data.deductable !== undefined) {
            setFormData(prevData => ({
              ...prevData,
              deductable: response.data.deductable
            }));
          }
          
          // If product has ingredients, load them
          if (response.data.product_ingredients && response.data.product_ingredients.length > 0) {
            const formattedIngredients = response.data.product_ingredients.map(item => ({
              ingredient: item.ingredient.toString(),
              quantity: item.quantity
            }));
            setSelectedIngredients(formattedIngredients);
          }
        } catch (error) {
          console.error('Error fetching product ingredients:', error);
        }
      }
    };
    
    if (product) {
      fetchProductIngredients();
    }
  }, [product]);

  // Populate form when editing
  useEffect(() => {
    if (product) {
      // For deductable products, use available_stock if provided
      const stockValue = product.deductable && product.available_stock !== undefined
        ? product.available_stock
        : product.stock || "";
      
      setFormData({
        name: product.name || "",
        price: product.price || "",
        stock: stockValue,
        description: product.description || "",
        deductable: product.deductable || false
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
        description: "",
        deductable: false
      });
      setImagePreview(null);
      setImage(null);
      setSelectedIngredients([]);
    }
  }, [product]);

  // Handle deductable checkbox change
  const handleDeductableChange = async (checked) => {
    // Update form state first
    setFormData({
      ...formData,
      deductable: checked,
    });
    
    // Clear errors for stock field
    if (errors.stock) {
      setErrors({
        ...errors,
        stock: undefined
      });
    }
    
    if (checked) {
      // If checked, fetch calculated stock if product already exists
      if (isEditing && product?.id) {
        try {
          const response = await axios.get(
            `http://localhost:8000/api/products/products/${product.id}/`,
            { withCredentials: true }
          );
          if (response.data.available_stock !== undefined) {
            // Set stock to the calculated available_stock
            setFormData(prev => ({
              ...prev,
              stock: response.data.available_stock
            }));
          }
        } catch (error) {
          console.error('Error fetching product available stock:', error);
        }
      } else {
        // For new products, just set stock to 0 - it will be calculated
        setFormData(prev => ({
          ...prev,
          stock: 0
        }));
      }
    } else {
      // If unchecked, clear stock value and selected ingredients
      setFormData(prev => ({
        ...prev,
        stock: ""
      }));
      setSelectedIngredients([]);
    }
  };
  
  // Add ingredient to the list
  const handleAddIngredient = () => {
    setSelectedIngredients([
      ...selectedIngredients,
      { ingredient: '', quantity: '' }
    ]);
  };
  
  // Remove ingredient from the list
  const handleRemoveIngredient = (index) => {
    const newIngredients = [...selectedIngredients];
    newIngredients.splice(index, 1);
    setSelectedIngredients(newIngredients);
  };
  
  // Update ingredient data
  const handleIngredientChange = (index, field, value) => {
    const newIngredients = [...selectedIngredients];
    newIngredients[index][field] = value;
    setSelectedIngredients(newIngredients);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const newValue = type === 'checkbox' ? checked : value;
    
    setFormData({
      ...formData,
      [name]: newValue
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
    if (!formData.price || parseFloat(formData.price) <= 0) newErrors.price = "Valid price is required";
    // Only validate stock for non-deductable products
    if (!formData.deductable && (!formData.stock || parseInt(formData.stock) <= 0)) {
      newErrors.stock = "Valid stock is required for non-deductable products";
    }
    if (formData.deductable && selectedIngredients.length === 0) {
      newErrors.ingredients = "At least one ingredient is required for deductable products";
    }
    // Check if all ingredients have valid data
    if (selectedIngredients.length > 0) {
      const hasInvalidIngredient = selectedIngredients.some(
        item => !item.ingredient || !item.quantity || parseFloat(item.quantity) <= 0
      );
      
      if (hasInvalidIngredient) {
        newErrors.ingredients = "All ingredients must have valid selection and quantity";
      }
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
      formDataObj.append('deductable', formData.deductable);
      
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
      
      // First save the product
      const response = await axios(axiosConfig);
      const savedProduct = response.data;
      
      // If product is deductable, update the ingredients
      if (formData.deductable && selectedIngredients.length > 0) {
        // Filter out ingredients without both id and quantity
        const validIngredients = selectedIngredients.filter(item => 
          item.ingredient && item.quantity && parseFloat(item.quantity) > 0
        );
        
        if (validIngredients.length > 0) {
          try {
            // Save product ingredients
            await axios.post(
              `http://localhost:8000/api/products/product-ingredients/${savedProduct.id}/`,
              { ingredients: validIngredients },
              { withCredentials: true }
            );
          } catch (error) {
            console.error("Error saving ingredients:", error);
            toast.error("Product saved but failed to update ingredients");
            // Continue with success flow since the product itself was saved
          }
        }
      }
      
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
      <DialogContent className="sm:max-w-[525px]">
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
            
            <div className="grid grid-cols-4 items-center gap-4 mb-4">
              <Label htmlFor="stock" className="text-right">
                Stock
              </Label>
              <div className="col-span-3">
                <Input
                  id="stock"
                  type="number"
                  min="0"
                  placeholder={formData.deductable ? "Calculated from ingredients" : "Stock quantity"}
                  value={formData.stock}
                  onChange={handleChange}
                  name="stock"
                  disabled={formData.deductable} // Disable stock input when deductable is checked
                  className={formData.deductable ? "bg-muted cursor-not-allowed" : ""}
                  readOnly={formData.deductable} // Ensure it's truly read-only when deductable
                />
                {formData.deductable && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Stock will be automatically calculated based on available ingredients
                  </p>
                )}
                {errors.stock && (
                  <p className="text-sm text-red-500">{errors.stock}</p>
                )}
              </div>
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
            
            {/* Deductable Checkbox */}
            <div className="grid grid-cols-4 items-center gap-4">
              <div className="text-right">
                <Label htmlFor="deductable">Deductable</Label>
              </div>
              <div className="flex items-center space-x-2 col-span-3">
                <Checkbox 
                  id="deductable" 
                  checked={formData.deductable} 
                  onCheckedChange={handleDeductableChange}
                />
                <Label htmlFor="deductable" className="text-sm font-normal">
                  This product uses ingredients from inventory
                </Label>
              </div>
            </div>
            
            {/* Ingredients Selection - Only shown when deductable is checked */}
            {formData.deductable && (
              <div className="grid grid-cols-4 items-start gap-4">
                <Label className="text-right mt-2">
                  Ingredients
                </Label>
                <div className="col-span-3 space-y-3">
                  <ScrollArea className="max-h-[300px] border rounded-md p-3">
                    {selectedIngredients.length === 0 ? (
                      <p className="text-sm text-muted-foreground p-2">No ingredients selected</p>
                    ) : (
                      <div className="space-y-3">
                        {selectedIngredients.map((item, index) => (
                          <div key={index} className="flex items-center space-x-2">
                            <select
                              value={item.ingredient || ''}
                              onChange={(e) => handleIngredientChange(index, 'ingredient', e.target.value)}
                              className="flex-1 h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              <option value="">Select ingredient...</option>
                              {ingredients.map((ing) => (
                                <option key={ing.id} value={ing.id}>
                                  {ing.name} ({ing.stock} {ing.unit})
                                </option>
                              ))}
                            </select>
                            <div className="flex items-center">
                              <Input
                                type="number"
                                min="0"
                                step="0.01"
                                placeholder="Qty"
                                value={item.quantity || ''}
                                onChange={(e) => handleIngredientChange(index, 'quantity', e.target.value)}
                                className="w-20"
                              />
                              <span className="ml-1 text-sm">
                                {item.ingredient && ingredients.find(i => i.id == item.ingredient)?.unit}
                              </span>
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => handleRemoveIngredient(index)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </ScrollArea>
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm" 
                    onClick={handleAddIngredient}
                    className="flex items-center"
                  >
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Add Ingredient
                  </Button>
                  {errors.ingredients && (
                    <p className="text-sm text-red-500">
                      {errors.ingredients}
                    </p>
                  )}
                  {loadingIngredients && (
                    <p className="text-sm text-muted-foreground">Loading ingredients...</p>
                  )}
                </div>
              </div>
            )}
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
