import * as React from "react"
import {
  Coffee,
  Map,
  PieChart,
  Settings2,
  ShoppingCart,
  Package,
} from "lucide-react"
import { Link } from "react-router-dom";

import { NavUser } from "@/components/user/nav-user"
import { ModeToggle } from "@/components/theme/mode-toggle"
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar"

const data = {
  navMain: [
    {
      title: "Main",
      items: [
        { title: "Dashboard", url: "/dashboard", icon: Coffee },
        { title: "Products", url: "/products", icon: Package },
        { title: "Orders", url: "/orders", icon: ShoppingCart },
      ],
    },
    {
      title: "Management",
      items: [
        { title: "Customers", url: "/customers", icon: PieChart },
        { title: "Reports", url: "/reports", icon: Map },
      ],
    },
    {
      title: "Settings",
      items: [
        { title: "Settings", url: "/settings", icon: Settings2 },
      ],
    },
  ],
};

import { useSidebar } from "@/components/ui/sidebar";
import { useUser } from "@/context/UserContext";

export function AppSidebar({ ...props }) {
  const { state } = useSidebar();
  const { user } = useUser();
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <a href="#">
                <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                  <Coffee className="size-4" />
                </div>
                <div className="flex flex-1 items-center justify-between">
                  <div className="text-left text-sm leading-tight">
                    <span className="truncate font-medium block">Star Luck</span>
                    <span className="truncate text-xs block">Management System</span>
                  </div>
                  {state !== "collapsed" && <ModeToggle />}
                </div>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        {/* Grouped, flat navigation */}
        {data.navMain.map((section) => (
          <SidebarGroup key={section.title}>
            <SidebarGroupLabel>{section.title}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {section.items.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild isActive={item.isActive}>
                      <Link to={item.url}>
                        {item.icon && <item.icon className="mr-2 w-4 h-4" />}
                        {item.title}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}