import { AppSidebar } from "@/components/layout/app-sidebar"
import { ThemeProvider } from "@/components/theme/theme-provider"
import { Separator } from "@/components/ui/separator"
import { ModeToggle } from "@/components/theme/mode-toggle"
import { SearchCommand } from "@/components/ui/search-command"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { Toaster } from "@/components/ui/sonner";
import { UserProvider } from "@/context/UserContext";
import { CartProvider } from "@/context/CartContext";
import { CartHeader } from "@/components/layout/CartHeader";
import Login from "@/features/auth/pages/Login";
import Dashboard from "@/features/dashboard/pages/Dashboard";
import Products from "@/features/products/pages/Products";
import Orders from "@/features/orders/pages/Orders";
import Customers from "@/features/customers/pages/Customers";
import Reports from "@/features/reports/pages/Reports";
import Settings from "@/features/settings/pages/Settings";
import { IngredientsPage } from "@/features/ingredients/pages";
import { ProductCartPage } from "@/features/cart/components/ProductCartPage";

function MainLayout() {
  
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center justify-between bg-background border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
          <div className="flex items-center gap-4 px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator
              orientation="vertical"
              className="mr-2 data-[orientation=vertical]:h-4"
            />
            <SearchCommand />
          </div>
          <div className="flex items-center gap-2 px-4">
            <div className="lg:hidden">
              <CartHeader />
            </div>
            <ModeToggle />
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0 mt-4">
          <Routes>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/products" element={<Products />} />
            <Route path="/orders" element={<Orders />} />
            <Route path="/ingredients" element={<IngredientsPage />} />
            <Route path="/customers" element={<Customers />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/cart" element={<ProductCartPage />} />
          </Routes>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}

export default function App() {
  return (
    <UserProvider>
      <CartProvider>
        <BrowserRouter>
          <ThemeProvider defaultTheme="light" storageKey="vite-ui-theme">
            <Toaster position="top-right" richColors />
            <Routes>
              <Route path="/" element={<Login />} />
              <Route path="*" element={
                <ProtectedRoute>
                  <MainLayout />
                </ProtectedRoute>
              } />
            </Routes>
          </ThemeProvider>
        </BrowserRouter>
      </CartProvider>
    </UserProvider>
  );
}