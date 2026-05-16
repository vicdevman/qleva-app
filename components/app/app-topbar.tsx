"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Bell, Wallet, Command, Menu } from "lucide-react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useUIStore } from "@/stores/ui-store";
import { useNotifications } from "@/lib/query-hooks";
import { MobileMenuDrawer } from "./mobile-menu-drawer";
import LiquidGlass from "liquid-glass-react";

export function AppTopbar() {
  const { toggleCommandBar, setCommandBarOpen } = useUIStore();
  const { data: notifications } = useNotifications();
  const unreadCount = notifications?.filter((n) => !n.read).length ?? 0;

  const [menuOpen, setMenuOpen] = React.useState(false);
  const [notificationsOpen, setNotificationsOpen] = React.useState(false);

  const handleKeyDown = React.useCallback(
    (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setCommandBarOpen(true);
      }
    },
    [setCommandBarOpen],
  );

  React.useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  const NotificationsDropdown = ({
    children,
    open,
    setOpen,
  }: {
    children: React.ReactNode;
    open?: boolean;
    setOpen?: (open: boolean) => void;
  }) => (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>{children}</DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-72 mt-2">
        <DropdownMenuLabel>Notifications</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <div className="max-h-64 overflow-auto">
          {notifications?.slice(0, 4).map((notif) => (
            <DropdownMenuItem
              key={notif.id}
              className="flex flex-col items-start gap-0.5 py-2"
            >
              <div className="flex w-full items-center gap-2">
                <span className="text-sm font-medium">{notif.title}</span>
                {!notif.read && (
                  <span className="ml-auto size-2 shrink-0 rounded-full bg-primary" />
                )}
              </div>
              <span className="text-xs text-muted-foreground">
                {notif.description}
              </span>
            </DropdownMenuItem>
          ))}
          {(!notifications || notifications.length === 0) && (
            <div className="py-4 text-center text-sm text-muted-foreground">
              No new notifications
            </div>
          )}
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="justify-center text-primary cursor-pointer">
          View all notifications
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );

  return (
    <>
      <MobileMenuDrawer open={menuOpen} setOpen={setMenuOpen} />

      {/* Mobile Floating Header Elements */}
      {/* Left: Mobile Menu Drawer Trigger */}
      <div className="fixed top-4 left-4 z-50 md:hidden">
        <div
          className="flex items-center justify-center text-foreground cursor-pointer border border-border/50 shadow-[0_20px_50px_rgba(0,0,0,0.3)] backdrop-blur-xl bg-card/60 rounded-3xl p-3"
          onClick={() => setMenuOpen(true)}
        >
          <div className="flex flex-col items-center justify-center gap-[4px] h-5 w-5">
            <div className="h-[2px] w-[20px] bg-foreground rounded-full" />
            <div className="h-[2px] w-[20px] bg-foreground rounded-full" />
          </div>
        </div>
      </div>

      {/* Right: Notifications */}
      <div className="fixed top-4 right-4 z-50 md:hidden">
        <NotificationsDropdown
          open={notificationsOpen}
          setOpen={setNotificationsOpen}
        >
          {/* This div acts as the anchor for the dropdown menu */}
          <div className="flex items-center justify-center text-foreground cursor-pointer border border-border/50 shadow-[0_20px_50px_rgba(0,0,0,0.3)] backdrop-blur-xl bg-card/60 rounded-3xl p-3 relative">
            <Bell className="size-5" />
            {unreadCount > 0 && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute -top-1 -right-1 flex size-4 items-center justify-center rounded-full bg-chart-3 text-[10px] font-bold text-destructive-foreground"
              >
                {unreadCount}
              </motion.span>
            )}
          </div>
        </NotificationsDropdown>
      </div>

      {/* Desktop Sticky Header */}
      <header className="hidden sticky top-0 z-30 md:flex h-14 items-center gap-3 border-b bg-background/80 px-4 backdrop-blur-md">
        <SidebarTrigger />

        {/* Command Bar Trigger */}
        <Button
          variant="outline"
          className="relative h-9 w-9 justify-center gap-2 p-0 text-muted-foreground sm:w-64 sm:justify-start sm:px-3 sm:py-2 lg:w-72"
          onClick={toggleCommandBar}
        >
          <Search className="size-4 sm:size-3.5" />
          <span className="hidden text-sm sm:inline-flex">
            Search or command...
          </span>
          <kbd className="ml-auto hidden items-center gap-0.5 rounded border bg-muted px-1.5 font-mono text-[10px] text-muted-foreground lg:inline-flex">
            <Command className="size-2.5" />K
          </kbd>
        </Button>

        <div className="flex-1" />

        {/* Notifications */}
        <NotificationsDropdown>
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
        </NotificationsDropdown>

        {/* Portfolio Summary Pill */}
        <div className="flex items-center gap-2 rounded-full border bg-muted/50 px-3 py-1.5">
          <Wallet className="size-3.5 text-muted-foreground" />
          <span className="text-sm font-medium">$3,731.05</span>
          <span className="text-xs text-green-500">+3.46%</span>
        </div>
      </header>
    </>
  );
}
