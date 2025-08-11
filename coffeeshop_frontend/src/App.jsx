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
import { BrowserRouter, Routes, Route, Navigate, Outlet } from "react-router-dom";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { Toaster } from "@/components/ui/sonner";
import { UserProvider } from "@/context/UserContext";
import { CartProvider } from "@/context/CartContext";
import { CartHeader } from "@/components/layout/CartHeader";
import Login from "@/features/auth/pages/Login";
import Register from "@/features/auth/pages/Register";
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
          <Outlet />
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
              <Route path="/register" element={<Register />} />
              <Route path="/dashboard" element={
                <ProtectedRoute>
                  <MainLayout />
                </ProtectedRoute>
              }>
                <Route index element={<Dashboard />} />
              </Route>
              <Route path="/products" element={
                <ProtectedRoute>
                  <MainLayout />
                </ProtectedRoute>
              }>
                <Route index element={<Products />} />
              </Route>
              <Route path="/orders" element={
                <ProtectedRoute>
                  <MainLayout />
                </ProtectedRoute>
              }>
                <Route index element={<Orders />} />
              </Route>
              <Route path="/customers" element={
                <ProtectedRoute>
                  <MainLayout />
                </ProtectedRoute>
              }>
                <Route index element={<Customers />} />
              </Route>
              <Route path="/reports" element={
                <ProtectedRoute>
                  <MainLayout />
                </ProtectedRoute>
              }>
                <Route index element={<Reports />} />
              </Route>
              <Route path="/settings" element={
                <ProtectedRoute>
                  <MainLayout />
                </ProtectedRoute>
              }>
                <Route index element={<Settings />} />
              </Route>
              <Route path="/ingredients" element={
                <ProtectedRoute>
                  <MainLayout />
                </ProtectedRoute>
              }>
                <Route index element={<IngredientsPage />} />
              </Route>
              <Route path="/cart" element={
                <ProtectedRoute>
                  <MainLayout />
                </ProtectedRoute>
              }>
                <Route index element={<ProductCartPage />} />
              </Route>
            </Routes>
          </ThemeProvider>
        </BrowserRouter>
      </CartProvider>
    </UserProvider>
  );
}