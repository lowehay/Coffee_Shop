import React, { useState, useEffect } from "react";
import { toast } from "sonner";
import { PlusIcon, Trash2 } from "lucide-react";

import { ingredientsApi } from "../services/ingredients-api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { IngredientFormDialog } from "../components/ingredient-form-dialog";
import { CategoryFormDialog } from "../components/category-form-dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export function IngredientsPage() {
  const [activeTab, setActiveTab] = useState("ingredients");
  const [loading, setLoading] = useState(true);
  const [ingredients, setIngredients] = useState([]);
  const [categories, setCategories] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Form dialog states
  const [ingredientFormOpen, setIngredientFormOpen] = useState(false);
  const [categoryFormOpen, setCategoryFormOpen] = useState(false);
  const [selectedIngredient, setSelectedIngredient] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);
  
  // Delete confirmation dialog states
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [deleteItemType, setDeleteItemType] = useState(null); // 'ingredient' or 'category'

  const fetchIngredients = async () => {
    try {
      setLoading(true);
      const response = await ingredientsApi.getIngredients();
      setIngredients(response.data);
      setLoading(false);
    } catch (error) {
      console.error("Failed to fetch ingredients:", error);
      toast.error("Failed to load ingredients");
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await ingredientsApi.getCategories();
      setCategories(response.data);
    } catch (error) {
      console.error("Failed to fetch categories:", error);
      toast.error("Failed to load categories");
    }
  };
  
  // Refresh data after changes
  const refreshData = () => {
    fetchIngredients();
    fetchCategories();
  };
  
  // Open ingredient form for editing
  const handleEditIngredient = (ingredient) => {
    setSelectedIngredient(ingredient);
    setIngredientFormOpen(true);
  };
  
  // Open category form for editing
  const handleEditCategory = (category) => {
    setSelectedCategory(category);
    setCategoryFormOpen(true);
  };
  
  // Open delete confirmation dialog
  const handleDeleteClick = (item, type) => {
    setItemToDelete(item);
    setDeleteItemType(type);
    setDeleteDialogOpen(true);
  };
  
  // Handle deletion confirmation
  const handleDeleteConfirm = async () => {
    try {
      if (deleteItemType === 'ingredient') {
        await ingredientsApi.deleteIngredient(itemToDelete.id);
        toast.success("Ingredient deleted successfully");
      } else if (deleteItemType === 'category') {
        await ingredientsApi.deleteCategory(itemToDelete.id);
        toast.success("Category deleted successfully");
      }
      refreshData();
    } catch (error) {
      console.error(`Failed to delete ${deleteItemType}:`, error);
      toast.error(`Failed to delete ${deleteItemType}`);
    } finally {
      setDeleteDialogOpen(false);
      setItemToDelete(null);
      setDeleteItemType(null);
    }
  };

  useEffect(() => {
    fetchIngredients();
    fetchCategories();
  }, []);

  const filteredIngredients = ingredients.filter(ingredient =>
    ingredient.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredCategories = categories.filter(category =>
    category.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <>
      <div className="flex justify-between items-center mb-2">
      <h1 className="text-2xl font-bold">Inventory Management</h1>
        <Button 
          onClick={() => {
            if (activeTab === "ingredients") {
              setSelectedIngredient(null);
              setIngredientFormOpen(true);
            } else {
              setSelectedCategory(null);
              setCategoryFormOpen(true);
            }
          }}
        >
          <PlusIcon className="mr-2 h-4 w-4" />
          Add {activeTab === "ingredients" ? "Ingredient" : "Category"}
        </Button>
      </div>

      <div className="flex w-full max-w-sm items-center space-x-2 mb-6">
        <Input
          type="text"
          placeholder={`Search ${activeTab}...`}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="max-w-md"
        />
      </div>

      <Tabs defaultValue="ingredients" onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="ingredients">Ingredients</TabsTrigger>
          <TabsTrigger value="categories">Categories</TabsTrigger>
        </TabsList>
        
        <TabsContent value="ingredients" className="space-y-4">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-8 gap-2">
              <Progress value={80} className="w-[60%]" />
              <p className="text-sm text-muted-foreground">Loading ingredients...</p>
            </div>
          ) : filteredIngredients.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredIngredients.map((ingredient) => (
                <IngredientCard
                  key={ingredient.id}
                  ingredient={ingredient}
                  categories={categories}
                  onEdit={() => handleEditIngredient(ingredient)}
                  onDelete={() => handleDeleteClick(ingredient, 'ingredient')}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No ingredients found.</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="categories" className="space-y-4">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-8 gap-2">
              <Progress value={80} className="w-[60%]" />
              <p className="text-sm text-muted-foreground">Loading categories...</p>
            </div>
          ) : filteredCategories.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredCategories.map((category) => (
                <CategoryCard 
                  key={category.id} 
                  category={category}
                  onEdit={() => handleEditCategory(category)}
                  onDelete={() => handleDeleteClick(category, 'category')} 
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No categories found.</p>
            </div>
          )}
        </TabsContent>
      </Tabs>
      
      {/* Ingredient Form Dialog */}
      <IngredientFormDialog
        open={ingredientFormOpen}
        onOpenChange={setIngredientFormOpen}
        ingredient={selectedIngredient}
        categories={categories}
        onSuccess={refreshData}
      />
      
      {/* Category Form Dialog */}
      <CategoryFormDialog
        open={categoryFormOpen}
        onOpenChange={setCategoryFormOpen}
        category={selectedCategory}
        onSuccess={refreshData}
      />
      
      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this {deleteItemType}.
              {deleteItemType === 'category' && ' Any ingredients in this category will be left without a category.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} className="bg-destructive text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function IngredientCard({ ingredient, categories, onEdit, onDelete }) {
  const category = categories.find(c => c.id === ingredient.category) || { name: 'Uncategorized' };
  
  // Calculate status based on stock level vs reorder point
  const getStatus = () => {
    if (ingredient.stock <= 0) return { label: "Out of Stock", color: "text-destructive" };
    if (ingredient.stock <= ingredient.reorder_point) return { label: "Low Stock", color: "text-amber-500" };
    return { label: "In Stock", color: "text-green-500" };
  };
  
  const status = getStatus();
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>{ingredient.name}</CardTitle>
        <CardDescription>{category.name}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="flex justify-between">
            <span>Stock:</span>
            <span>
              {ingredient.stock} {ingredient.unit}
            </span>
          </div>
          <div className="flex justify-between">
            <span>Reorder Point:</span>
            <span>
              {ingredient.reorder_point} {ingredient.unit}
            </span>
          </div>
          <div className="flex justify-between">
            <span>Status:</span>
            <span className={status.color}>{status.label}</span>
          </div>
          {ingredient.cost_per_unit > 0 && (
            <div className="flex justify-between">
              <span>Cost:</span>
              <span>₱{ingredient.cost_per_unit} / {ingredient.unit}</span>
            </div>
          )}
          {ingredient.notes && (
            <div className="mt-2 text-sm text-muted-foreground">
              <p className="font-medium">Notes:</p>
              <p>{ingredient.notes}</p>
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline" size="sm" onClick={onEdit}>Edit</Button>
        <Button variant="destructive" size="sm" onClick={onDelete}>
          <Trash2 className="h-4 w-4" />
        </Button>
      </CardFooter>
    </Card>
  );
}

function CategoryCard({ category, onEdit, onDelete }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{category.name}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">
          {category.description || "No description provided."}
        </p>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline" size="sm" onClick={onEdit}>Edit</Button>
        <Button variant="destructive" size="sm" onClick={onDelete}>
          <Trash2 className="h-4 w-4" />
        </Button>
      </CardFooter>
    </Card>
  );
}
