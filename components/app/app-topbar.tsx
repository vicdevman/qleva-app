"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Bell,
  ChevronDown,
  Wallet,
  LogOut,
  Settings,
  User,
  Command,
} from "lucide-react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuthStore } from "@/stores/auth-store";
import { useUIStore } from "@/stores/ui-store";
import { useNotifications } from "@/lib/query-hooks";
import { cn } from "@/lib/utils";

export function AppTopbar() {
  const { user } = useAuthStore();
  const { toggleCommandBar, setCommandBarOpen } = useUIStore();
  const { data: notifications } = useNotifications();
  const unreadCount = notifications?.filter((n) => !n.read).length ?? 0;

  const handleKeyDown = React.useCallback(
    (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setCommandBarOpen(true);
      }
    },
    [setCommandBarOpen]
  );

  React.useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b bg-background/80 px-4 backdrop-blur-md">
      <SidebarTrigger />

      {/* Command Bar Trigger */}
      <Button
        variant="outline"
        className="relative h-9 w-9 justify-center gap-2 p-0 text-muted-foreground sm:w-64 sm:justify-start sm:px-3 sm:py-2 lg:w-72"
        onClick={toggleCommandBar}
      >
        <Search className="size-4 sm:size-3.5" />
        <span className="hidden text-sm sm:inline-flex">Search or command...</span>
        <kbd className="ml-auto hidden items-center gap-0.5 rounded border bg-muted px-1.5 font-mono text-[10px] text-muted-foreground lg:inline-flex">
          <Command className="size-2.5" />K
        </kbd>
      </Button>

      <div className="flex-1" />

 {/* Notifications */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon-sm" className="relative">
            <Bell className="size-4" />
            {unreadCount > 0 && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute -top-0.5 -right-0.5 flex size-4 items-center justify-center rounded-full bg-chart-3 text-[10px] font-bold text-destructive-foreground"
              >
                {unreadCount}
              </motion.span>
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-72">
          <DropdownMenuLabel>Notifications</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <div className="max-h-64 overflow-auto">
            {notifications?.slice(0, 4).map((notif) => (
              <DropdownMenuItem key={notif.id} className="flex flex-col items-start gap-0.5 py-2">
                <div className="flex w-full items-center gap-2">
                  <span className="text-sm font-medium">{notif.title}</span>
                  {!notif.read && (
                    <span className="ml-auto size-2 shrink-0 rounded-full bg-primary" />
                  )}
                </div>
                <span className="text-xs text-muted-foreground">{notif.description}</span>
              </DropdownMenuItem>
            ))}
          </div>
          <DropdownMenuSeparator />
          <DropdownMenuItem className="justify-center text-primary">
            View all notifications
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Portfolio Summary Pill */}
      <div className="hidden items-center gap-2 rounded-full border bg-muted/50 px-3 py-1.5 md:flex">
        <Wallet className="size-3.5 text-muted-foreground" />
        <span className="text-sm font-medium">$3,731.05</span>
        <span className="text-xs text-green-500">+3.46%</span>
      </div>

     

      {/* Profile Menu */}
      {/* <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 gap-2 px-2">
            <div className="flex size-6 items-center justify-center rounded-full bg-primary/10 text-xs font-medium text-primary">
              {user?.name?.charAt(0) ?? "U"}
            </div>
            <span className="hidden text-sm font-medium md:inline">{user?.name?.split(" ")[0]}</span>
            <ChevronDown className="size-3 text-muted-foreground" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuLabel>
            <div className="flex flex-col">
              <span className="text-sm font-medium">{user?.name}</span>
              <span className="text-xs text-muted-foreground">{user?.email}</span>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem>
            <User className="size-4" />
            Profile
          </DropdownMenuItem>
          <DropdownMenuItem>
            <Settings className="size-4" />
            Settings
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem className="text-destructive">
            <LogOut className="size-4" />
            Log out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu> */}
    </header>
  );
}
