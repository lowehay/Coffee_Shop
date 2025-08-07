import React from "react";
import { Card, CardContent } from "@/components/ui/card";

export function StatCard({ title, value, description, icon, className }) {
  return (
    <Card className={`overflow-hidden ${className}`}>
      <CardContent className="p-6 relative">
        <div className="flex items-start justify-between">
          {/* Left content area */}
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            
            <div className="flex items-baseline gap-2">
              <h3 className="text-3xl font-bold tracking-tight">{value}</h3>
            </div>
            
            <p className="text-xs text-muted-foreground">{description}</p>
          </div>
          
          {/* Icon area with simplified styling */}
          {icon && (
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
              {React.cloneElement(icon, { className: "h-6 w-6 text-primary" })}
            </div>
          )}
        </div>
        
        {/* Bottom gradient bar that fades out */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
      </CardContent>
    </Card>
  );
}
