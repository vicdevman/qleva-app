"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  MessageSquareText,
  Workflow,
  Briefcase,
  Clock,
  Wallet,
  Settings,
  Bell,
  HelpCircle,
  Sparkles,
  Plus,
  ChevronUp,
  User,
  LogOut,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
  SidebarFooter,
} from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

const mainNav = [
  { title: "Portfolio", url: "/portfolio", icon: Briefcase },
  // { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { title: "Chat", url: "/chat", icon: MessageSquareText },
  { title: "Automations", url: "/automations", icon: Workflow },

  // { title: "Activity", url: "/activity", icon: Clock },
  { title: "Wallets", url: "/wallets", icon: Wallet },
];

export function AppSidebar() {
  const pathname = usePathname();

  // Dummy chat data for the new Chats section
  const [chats, setChats] = React.useState([
    { id: "1", title: "Wallet setup assistant" },
    { id: "2", title: "DeFi yield analysis" },
  ]);

  const handleAddChat = () => {
    const newId = Date.now().toString();
    setChats([{ id: newId, title: "New Chat Session" }, ...chats]);
  };

  return (
    <Sidebar
      collapsible="icon"
      variant="floating"
      className="border-sidebar-border/50 hidden md:flex"
    >
      <SidebarHeader className="flex-row items-center gap-3 px-3 py-4">
        <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <Sparkles className="size-4" />
        </div>
        <div className="flex flex-col group-data-[collapsible=icon]:hidden">
          <span className="font-heading text-sm font-semibold tracking-tight">
            Qleva
          </span>
          <span className="text-[10px] text-muted-foreground">
            Smart Wallet OS
          </span>
        </div>
      </SidebarHeader>

      <SidebarSeparator />

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Main</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="flex flex-col gap-1">
              {mainNav.map((item) => {
                const isActive =
                  pathname === item.url || pathname.startsWith(item.url + "/");
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      tooltip={item.title}
                    >
                      <Link href={item.url}>
                        <item.icon />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator />

        <SidebarGroup>
          <div className="flex items-center justify-between pr-2 group-data-[collapsible=icon]:hidden">
            <SidebarGroupLabel>Chats</SidebarGroupLabel>
            <button
              onClick={handleAddChat}
              className="flex size-5 items-center justify-center rounded-md hover:bg-muted text-muted-foreground transition-colors"
            >
              <Plus className="size-3.5" />
            </button>
          </div>
          <SidebarGroupContent>
            <SidebarMenu>
              {chats.map((chat) => {
                const url = `/chat/${chat.id}`;
                const isActive = pathname === url;
                return (
                  <SidebarMenuItem key={chat.id}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      tooltip={chat.title}
                    >
                      <Link href={url}>
                        <span className="">{chat.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <div className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <User className="size-6" />
              </div>
              <div className="flex flex-col gap-0.5 leading-none group-data-[collapsible=icon]:hidden">
                <span className="text-sm font-medium">0x1234...abcd</span>
                <span className="text-xs text-muted-foreground truncate max-w-[140px]">
                  user@example.com
                </span>
              </div>
              <ChevronUp className="ml-auto size-4 group-data-[collapsible=icon]:hidden" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            side="top"
            className="w-[--radix-dropdown-menu-trigger-width] min-w-56"
            align="end"
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <div className="flex size-8 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <User className="size-4" />
                </div>
                <div className="flex flex-col gap-0.5 leading-none">
                  <span className="font-medium">0x1234...abcd</span>
                  <span className="text-xs text-muted-foreground">
                    user@example.com
                  </span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            {/* <DropdownMenuItem asChild>
              <Link href="/profile" className="cursor-pointer w-full flex items-center">
                <Sparkles className="mr-2 size-4" />
                Profile
              </Link>
            </DropdownMenuItem> */}
            <DropdownMenuItem asChild>
              <Link
                href="/notifications"
                className="cursor-pointer w-full flex items-center"
              >
                <Bell className="mr-2 size-4" />
                Notifications
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link
                href="/settings"
                className="cursor-pointer w-full flex items-center"
              >
                <Settings className="mr-2 size-4" />
                Settings
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link
                href="/help"
                className="cursor-pointer w-full flex items-center"
              >
                <HelpCircle className="mr-2 size-4" />
                Help & Memory
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-destructive focus:text-destructive cursor-pointer">
              <LogOut className="mr-2 size-4" />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
