"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, Wallet, Command, Menu, User } from "lucide-react";
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
import { useNotifications, usePortfolio } from "@/lib/query-hooks";
import { MobileMenuDrawer } from "./mobile-menu-drawer";
import { MobileProfileDrawer } from "./mobile-profile-drawer";
import { usePrivy } from "@privy-io/react-auth";
import LiquidGlass from "liquid-glass-react";
import { Facehash } from "facehash";

export function AppTopbar() {
  const { toggleCommandBar, setCommandBarOpen } = useUIStore();
  const { data: notifications } = useNotifications();
  const { data: portfolio } = usePortfolio();
  const unreadCount = notifications?.filter((n) => !n.read).length ?? 0;

  const [menuOpen, setMenuOpen] = React.useState(false);
  const [profileOpen, setProfileOpen] = React.useState(false);
  const [notificationsOpen, setNotificationsOpen] = React.useState(false);

  const { user } = usePrivy();
  const avatarUrl =
    (user?.google as any)?.profilePictureUrl ||
    (user?.twitter as any)?.profilePictureUrl ||
    (user?.github as any)?.profilePictureUrl ||
    "";

  // Extract name/email from social oauth
  const googleAccount = user?.google as any;
  const twitterAccount = user?.twitter as any;
  const emailAccount = user?.email as any;
  const githubAccount = user?.github as any;

  // Extract address
  const activeAddress = user?.wallet?.address || (user as any)?.wallets?.[0]?.address || "";
  const abbreviatedAddress = activeAddress
    ? `${activeAddress.slice(0, 6)}...${activeAddress.slice(-4)}`
    : "No Wallet Linked";

  let displayName = "Qleva User";
  let displaySub = "";

  if (user) {
    if (googleAccount?.name) {
      displayName = googleAccount.name;
      displaySub =
        googleAccount.email || emailAccount?.address || abbreviatedAddress;
    } else if (twitterAccount?.name) {
      displayName = twitterAccount.name;
      displaySub = `@${twitterAccount.username}`;
    } else if (githubAccount?.name) {
      displayName = githubAccount.name;
      displaySub =
        githubAccount.username || emailAccount?.address || abbreviatedAddress;
    } else if (emailAccount?.address) {
      displayName = emailAccount.address.split("@")[0];
      displaySub = emailAccount.address;
    } else if (activeAddress) {
      displayName = abbreviatedAddress;
      displaySub = "Wallet Connected";
    }
  }

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
      <MobileProfileDrawer open={profileOpen} setOpen={setProfileOpen} />

      {/* Mobile Floating Header Elements */}
      {/* Left: Mobile Menu Drawer Trigger */}
      <div className="fixed top-4 left-4 z-50 md:hidden">
        <div
          className="flex items-center justify-center text-foreground cursor-pointer border border-border backdrop-blur-xl bg-card/60 rounded-3xl p-3"
          onClick={() => setMenuOpen(true)}
        >
          <div className="flex flex-col items-center justify-center gap-[4px] h-5 w-5">
            <div className="h-[2px] w-[20px] bg-foreground rounded-full" />
            <div className="h-[2px] w-[20px] bg-foreground rounded-full" />
          </div>
        </div>
      </div>

      {/* Right: Profile Trigger (replaces Notification button) */}
      <div className="fixed top-4 right-4 z-50 md:hidden">
        <div
          className="flex items-center justify-center text-foreground cursor-pointer border border-border backdrop-blur-xl bg-card/60 rounded-3xl relative size-11"
          onClick={() => setProfileOpen(true)}
        >
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt="Avatar"
              className="size-full object-cover rounded-full"
            />
          ) : (
            <Facehash name={displayName} intensity3d="none" enableBlink />
          )}
          {unreadCount > 0 && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute -top-1 -right-1 flex w-4 h-4 items-center justify-center rounded-full bg-primary text-[10px] text-black font-bold text-destructive-foreground z-10"
            >
              {unreadCount}
            </motion.span>
          )}
        </div>
      </div>

      {/* Desktop Sticky Header */}
      <header className="hidden sticky top-0 z-30 md:flex h-14 items-center gap-3 bg-linear-to-b from-background via-background/80 to-transparent px-4">
        <div className="flex-1" />

        {/* Notifications */}
        <NotificationsDropdown>
          <Button variant="ghost" size="icon-sm" className="relative">
            <Bell className="size-4.5" />
            {unreadCount > 0 && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute -top-0.5 -right-0.5 flex size-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-black"
              >
                {unreadCount}
              </motion.span>
            )}
          </Button>
        </NotificationsDropdown>

        {/* Portfolio Summary Pill */}
        <div className="flex items-center gap-2 rounded-full border bg-muted px-3 py-1.5">
          <Wallet className="size-3.5 text-muted-foreground" />
          <span className="text-sm font-medium">
            {portfolio
              ? new Intl.NumberFormat("en-US", {
                  style: "currency",
                  currency: "USD",
                }).format(portfolio.totalValue)
              : "$0.00"}
          </span>
          {portfolio && (
            <span
              className={`text-xs ${portfolio.dailyChangePercent >= 0 ? "text-green-500" : "text-red-500"}`}
            >
              {portfolio.dailyChangePercent >= 0 ? "+" : ""}
              {portfolio.dailyChangePercent}%
            </span>
          )}
        </div>
      </header>
    </>
  );
}
