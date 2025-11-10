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
import { ButtonGroup } from "@/components/ui/button-group";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { PlusCircle, X, ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import api from "@/services/api";

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
        const response = await api.get('/api/ingredients/ingredients/');
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
          const response = await api.get(
            `/api/products/products/${product.id}/`
          );
          
          // Set deductable from product dataa
          if (response.data.deductable !== undefined) {
            setFormData(prevData => ({
              ...prevData,
              deductable: response.data.deductable
            }));
          }
          
          // If product has ingredients, load them with required_unit
          if (response.data.product_ingredients && response.data.product_ingredients.length > 0) {
            const formattedIngredients = response.data.product_ingredients.map(item => ({
              ingredient: item.ingredient.toString(),
              quantity: item.quantity.toString(),
              required_unit: item.required_unit || ''
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
          const response = await api.get(
            `/api/products/products/${product.id}/`
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
      { ingredient: '', quantity: '', required_unit: '' }
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
    
    // Auto-set unit when ingredient is selected
    if (field === 'ingredient' && value) {
      const selectedIng = ingredients.find(ing => ing.id == value);
      if (selectedIng && !newIngredients[index].required_unit) {
        newIngredients[index].required_unit = selectedIng.unit;
      }
    }
    
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
          
          // Save product ingredients
          if (formData.deductable && selectedIngredients.length > 0) {
            const ingredientsData = selectedIngredients.map(ingredient => ({
              ingredient: ingredient.ingredient,
              quantity: ingredient.quantity,
              required_unit: ingredient.required_unit
            }));
            formDataObj.append('ingredients', JSON.stringify(ingredientsData));
          }
          
          // Use api instance for multipart form data
          const response = await api({
            url: endpoint,
            method: method,
            data: formDataObj,
            headers: {
              'Content-Type': 'multipart/form-data',
            }
          });
      const savedProduct = response.data;
      
      // If product is deductable, update the ingredients
      if (formData.deductable && selectedIngredients.length > 0) {
        // Filter out ingredients without all required fields
        const validIngredients = selectedIngredients.filter(item => 
          item.ingredient && item.quantity && parseFloat(item.quantity) > 0 && item.required_unit
        );
        
        if (validIngredients.length > 0) {
          try {
            // Save product ingredients
            await api.post(
              `/api/products/product-ingredients/${savedProduct.id}/`,
              { ingredients: validIngredients }
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
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
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
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <Label className="mb-2 block">
                    Ingredients
                  </Label>
                  <ScrollArea className="max-h-[300px] border rounded-md">
                    {selectedIngredients.length === 0 ? (
                      <p className="text-sm text-muted-foreground p-4 text-center">No ingredients selected</p>
                    ) : (
                      <div className="space-y-3 p-3">
                        {selectedIngredients.map((item, index) => {
                          const selectedIng = ingredients.find(ing => ing.id == item.ingredient);
                          const ingredientUnit = selectedIng ? selectedIng.unit : '';
                          const unitOptions = ['g', 'kg', 'ml', 'l', 'pcs', 'tbsp', 'tsp'];
                          const uniqueUnits = ingredientUnit && !unitOptions.includes(ingredientUnit) 
                            ? [ingredientUnit, ...unitOptions] 
                            : unitOptions;
                          
                          return (
                            <div key={index} className="grid grid-cols-12 gap-2 items-start">
                              <div className="col-span-5">
                                <select
                                  value={item.ingredient || ''}
                                  onChange={(e) => handleIngredientChange(index, 'ingredient', e.target.value)}
                                  className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm"
                                >
                                  <option value="">Select ingredient...</option>
                                  {ingredients.map((ing) => (
                                    <option key={ing.id} value={ing.id}>
                                      {ing.name} ({ing.stock} {ing.unit})
                                    </option>
                                  ))}
                                </select>
                              </div>
                              <div className="col-span-6">
                                <ButtonGroup className="w-full">
                                  <Input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    placeholder="Quantity"
                                    value={item.quantity || ''}
                                    onChange={(e) => handleIngredientChange(index, 'quantity', e.target.value)}
                                    onKeyDown={(e) => {
                                      // Allow: backspace, delete, tab, escape, enter, decimal point
                                      if ([46, 8, 9, 27, 13, 110, 190].indexOf(e.keyCode) !== -1 ||
                                        // Allow: Ctrl+A, Ctrl+C, Ctrl+V, Ctrl+X
                                        (e.keyCode === 65 && e.ctrlKey === true) ||
                                        (e.keyCode === 67 && e.ctrlKey === true) ||
                                        (e.keyCode === 86 && e.ctrlKey === true) ||
                                        (e.keyCode === 88 && e.ctrlKey === true) ||
                                        // Allow: home, end, left, right
                                        (e.keyCode >= 35 && e.keyCode <= 39)) {
                                        return;
                                      }
                                      // Ensure that it is a number and stop the keypress
                                      if ((e.shiftKey || (e.keyCode < 48 || e.keyCode > 57)) && (e.keyCode < 96 || e.keyCode > 105)) {
                                        e.preventDefault();
                                      }
                                    }}
                                    onPaste={(e) => {
                                      const pastedText = e.clipboardData.getData('text');
                                      if (!/^\d*\.?\d*$/.test(pastedText)) {
                                        e.preventDefault();
                                      }
                                    }}
                                    className="h-9 rounded-r-none border-r-0"
                                  />
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button 
                                        type="button"
                                        variant="outline" 
                                        className="h-9 !pl-3 !pr-2 min-w-[80px] rounded-l-none justify-between"
                                      >
                                        <span className="text-sm">{item.required_unit || 'Unit'}</span>
                                        <ChevronDown className="h-4 w-4 ml-1" />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="min-w-[100px]">
                                      {uniqueUnits.map(unit => (
                                        <DropdownMenuItem 
                                          key={unit}
                                          onClick={() => handleIngredientChange(index, 'required_unit', unit)}
                                        >
                                          {unit}
                                        </DropdownMenuItem>
                                      ))}
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </ButtonGroup>
                                {selectedIng && !item.required_unit && (
                                  <p className="text-xs text-muted-foreground mt-1">
                                    Ingredient uses: {selectedIng.unit}
                                  </p>
                                )}
                              </div>
                              <div className="col-span-1">
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleRemoveIngredient(index)}
                                  className="h-9 w-9"
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </ScrollArea>
                  <div className="flex justify-between items-center mt-3">
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
                    <div className="text-sm text-muted-foreground">
                      {selectedIngredients.length} ingredient{selectedIngredients.length !== 1 ? 's' : ''}
                    </div>
                  </div>
                  {errors.ingredients && (
                    <p className="text-sm text-red-500 mt-2">
                      {errors.ingredients}
                    </p>
                  )}
                  {loadingIngredients && (
                    <p className="text-sm text-muted-foreground text-center py-4">Loading ingredients...</p>
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
