import React, { useState, useEffect } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { ingredientsApi } from "../services/ingredients-api";

// Form validation schema
const formSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters" }),
  category: z.string().optional(),
  stock: z.coerce.number().min(0, { message: "Stock cannot be negative" }),
  unit: z.string().min(1, { message: "Unit is required" }),
  reorder_point: z.coerce.number().min(0, { message: "Reorder point cannot be negative" }),
  cost_per_unit: z.coerce.number().min(0, { message: "Cost cannot be negative" }).optional(),
  notes: z.string().optional(),
});

export function IngredientFormDialog({
  open,
  onOpenChange,
  ingredient = null,
  categories = [],
  onSuccess,
}) {
  const [isLoading, setIsLoading] = useState(false);
  
  // Initialize form with default values or ingredient data if editing
  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: ingredient?.name || "",
      category: ingredient?.category?.toString() || "",
      stock: ingredient?.stock || 0,
      unit: ingredient?.unit || "",
      reorder_point: ingredient?.reorder_point || 0,
      cost_per_unit: ingredient?.cost_per_unit || 0,
      notes: ingredient?.notes || "",
    },
  });

  // Update form values when ingredient changes
  useEffect(() => {
    if (ingredient) {
      form.reset({
        name: ingredient.name || "",
        category: ingredient.category?.toString() || "",
        stock: ingredient.stock || 0,
        unit: ingredient.unit || "",
        reorder_point: ingredient.reorder_point || 0,
        cost_per_unit: ingredient.cost_per_unit || 0,
        notes: ingredient.notes || "",
      });
    } else {
      form.reset({
        name: "",
        category: "",
        stock: 0,
        unit: "",
        reorder_point: 0,
        cost_per_unit: 0,
        notes: "",
      });
    }
  }, [ingredient, form]);

  // Handle form submission
  async function onSubmit(data) {
    setIsLoading(true);
    try {
      if (ingredient) {
        // Update existing ingredient
        await ingredientsApi.updateIngredient(ingredient.id, data);
        toast.success("Ingredient updated successfully");
      } else {
        // Create new ingredient
        await ingredientsApi.createIngredient(data);
        toast.success("Ingredient added successfully");
      }
      onOpenChange(false);
      if (onSuccess) onSuccess();
    } catch (error) {
      console.error("Failed to save ingredient:", error);
      toast.error(
        error.response?.data?.detail || "Failed to save ingredient"
      );
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {ingredient ? "Edit Ingredient" : "Add Ingredient"}
          </DialogTitle>
          <DialogDescription>
            {ingredient
              ? "Update the details of this ingredient"
              : "Add a new ingredient to your inventory"}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Milk" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.id.toString()}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="stock"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Stock</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="unit"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Unit</FormLabel>
                    <FormControl>
                      <Input placeholder="ml, g, pcs" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="reorder_point"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Reorder Point</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="cost_per_unit"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cost per Unit</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Additional notes about this ingredient"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {ingredient ? "Update" : "Add"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
