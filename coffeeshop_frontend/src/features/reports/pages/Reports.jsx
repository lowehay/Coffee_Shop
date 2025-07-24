import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function Reports() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Reports</h1>
      
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Sales Reports</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">Sales reporting functionality will be implemented soon.</p>
            <p className="text-muted-foreground mt-2">View sales data and trends over time.</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Inventory Reports</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">Inventory reporting functionality will be implemented soon.</p>
            <p className="text-muted-foreground mt-2">Track stock levels and product performance.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}