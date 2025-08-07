import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function Customers() {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Customers</h1>
        <Button>Add Customer</Button>
      </div>
      
      <Card>
        <CardContent>
          <p className="text-muted-foreground">Customer management functionality will be implemented soon.</p>
          <p className="text-muted-foreground mt-2">This page will display a list of customers with details and order history.</p>
        </CardContent>
      </Card>
    </div>
  );
}