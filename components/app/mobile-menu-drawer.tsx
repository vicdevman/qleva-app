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
  Search,
  User,
  LogOut,
  Sparkles,
} from "lucide-react";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";

const mainNav = [
  // { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { title: "Portfolio", url: "/portfolio", icon: Briefcase },
  { title: "Chat", url: "/chat", icon: MessageSquareText },
  { title: "Automations", url: "/automations", icon: Workflow },

  // { title: "Activity", url: "/activity", icon: Clock },
  { title: "Wallets", url: "/wallets", icon: Wallet },
];

export function MobileMenuDrawer({
  open,
  setOpen,
}: {
  open: boolean;
  setOpen: (open: boolean) => void;
}) {
  const pathname = usePathname();

  // Dummy chat data matching the sidebar
  const [chats] = React.useState([
    { id: "1", title: "Wallet setup assistant" },
    { id: "2", title: "DeFi yield analysis" },
  ]);

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerContent className="h-[85vh] outline-0 bg-background/95 backdrop-blur-xl border-t border-border/50">
        <DrawerHeader className="pb-2">
          {/* <div className="flex items-center gap-2 mb-4">
            <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Sparkles className="size-4" />
            </div>
            <div className="flex flex-col text-left">
              <span className="font-heading text-sm font-semibold tracking-tight">Qleva</span>
              <span className="text-[10px] text-muted-foreground">Smart Wallet OS</span>
            </div>
          </div> */}

          {/* Search Bar Sneaked In */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              placeholder="Search or command..."
              className="pl-9 bg-muted/50 border-border/50 py-6"
            />
          </div>
        </DrawerHeader>

        <div className="flex-1 overflow-auto px-4 pb-6 space-y-6 mt-2">
          {/* Main Nav Gallery */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {mainNav.map((item) => {
              const isActive =
                pathname === item.url || pathname.startsWith(item.url + "/");
              return (
                <DrawerClose asChild key={item.title}>
                  <Link
                    href={item.url}
                    className={`flex flex-col items-center justify-center gap-2 rounded-xl p-4 text-sm font-medium transition-all ${
                      isActive
                        ? "bg-primary text-primary-foreground shadow-md scale-[1.02]"
                        : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground border border-border/50"
                    }`}
                  >
                    <item.icon className="size-6" />
                    <span className="text-xs">{item.title}</span>
                  </Link>
                </DrawerClose>
              );
            })}
          </div>

          <Separator className="bg-border/50" />

          {/* Chats section */}
          <div>
            <h4 className="mb-3 px-1 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Recent Chats
            </h4>
            <div className="space-y-2">
              {chats.map((chat) => {
                const url = `/chat/${chat.id}`;
                const isActive = pathname === url;
                return (
                  <DrawerClose asChild key={chat.id}>
                    <Link
                      href={url}
                      className={`flex items-center gap-4 rounded-xl px-4 py-3.5 text-sm font-medium transition-all active:scale-[0.98] ${
                        isActive
                          ? "bg-primary/10 text-primary border border-primary/20"
                          : "bg-muted/30 text-muted-foreground hover:bg-muted hover:text-foreground border border-border/30"
                      }`}
                    >
                      <span className="truncate">{chat.title}</span>
                    </Link>
                  </DrawerClose>
                );
              })}
            </div>
          </div>

          <Separator className="bg-border/50" />

          {/* User Profile & System */}
          <div className="space-y-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <User className="size-6" />
              </div>
              <div className="flex flex-col leading-none">
                <span className="text-base font-semibold text-foreground">
                  0x1234...abcd
                </span>
                <span className="text-sm text-muted-foreground truncate max-w-[140px]">
                  user@example.com
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <DrawerClose asChild>
                <Link
                  href="/notifications"
                  className="flex items-center gap-3 rounded-xl p-4 text-sm font-medium bg-muted/30 text-muted-foreground hover:bg-muted border border-border/30 transition-all active:scale-[0.98]"
                >
                  <div className="p-2 rounded-xl bg-background/50 text-foreground">
                    <Bell className="size-4" />
                  </div>
                  Notifications
                </Link>
              </DrawerClose>
              <DrawerClose asChild>
                <Link
                  href="/settings"
                  className="flex items-center gap-3 rounded-xl p-4 text-sm font-medium bg-muted/30 text-muted-foreground hover:bg-muted border border-border/30 transition-all active:scale-[0.98]"
                >
                  <div className="p-2 rounded-xl bg-background/50 text-foreground">
                    <Settings className="size-4" />
                  </div>
                  Settings
                </Link>
              </DrawerClose>
              <DrawerClose asChild>
                <Link
                  href="/help"
                  className="flex items-center gap-3 rounded-xl p-4 text-sm font-medium bg-muted/30 text-muted-foreground hover:bg-muted border border-border/30 transition-all active:scale-[0.98]"
                >
                  <div className="p-2 rounded-xl bg-background/50 text-foreground">
                    <HelpCircle className="size-4" />
                  </div>
                  Help
                </Link>
              </DrawerClose>
            </div>

            <DrawerClose asChild>
              <button className="w-full flex items-center justify-center gap-3 rounded-xl p-4 mt-2 text-sm font-medium text-destructive bg-destructive/5 hover:bg-destructive/10 border border-destructive/10 transition-all active:scale-[0.98]">
                <LogOut className="size-5" /> Log out
              </button>
            </DrawerClose>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
