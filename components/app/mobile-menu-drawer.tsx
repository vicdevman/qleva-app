"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  MessageCirclePlus,
  Workflow,
  AlignEndHorizontal,
  Clock,
  Wallet,
  Settings,
  Bell,
  HelpCircle,
  Search,
  User,
  LogOut,
  Sparkles,
  Moon,
  Sun,
} from "lucide-react";
import { useTheme } from "next-themes";
import { usePrivy } from "@privy-io/react-auth";
import { useChatsList } from "@/lib/query-hooks";
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
    { title: "New chat", url: "/chat", icon: MessageCirclePlus },
  // { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { title: "Portfolio", url: "/portfolio", icon: AlignEndHorizontal },

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
  const { setTheme, theme } = useTheme();
  const { user, logout } = usePrivy();

  // Extract address
  const activeAddress = user?.wallet?.address || (user as any)?.wallets?.[0]?.address || "";
  const abbreviatedAddress = activeAddress
    ? `${activeAddress.slice(0, 6)}...${activeAddress.slice(-4)}`
    : "No Wallet Linked";

  // Extract avatar
  const avatarUrl = (user?.google as any)?.profilePictureUrl || (user?.twitter as any)?.profilePictureUrl || (user?.github as any)?.profilePictureUrl || "";

  // Extract name/email from social oauth
  const googleAccount = user?.google as any;
  const twitterAccount = user?.twitter as any;
  const emailAccount = user?.email as any;
  const githubAccount = user?.github as any;

  let displayName = "Qleva User";
  let displaySub = "";

  if (user) {
    if (googleAccount?.name) {
      displayName = googleAccount.name;
      displaySub = googleAccount.email || emailAccount?.address || abbreviatedAddress;
    } else if (twitterAccount?.name) {
      displayName = twitterAccount.name;
      displaySub = `@${twitterAccount.username}`;
    } else if (githubAccount?.name) {
      displayName = githubAccount.name;
      displaySub = githubAccount.username || emailAccount?.address || abbreviatedAddress;
    } else if (emailAccount?.address) {
      displayName = emailAccount.address.split("@")[0];
      displaySub = emailAccount.address;
    } else if (activeAddress) {
      displayName = abbreviatedAddress;
      displaySub = "Wallet Connected";
    }
  }

  const { data: chats = [], isLoading } = useChatsList();

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerContent className="h-[85vh] outline-0 bg-background/95 backdrop-blur-xl border-t border-border">
        <DrawerHeader className="pb-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              placeholder="Search or command..."
              className="pl-9 bg-muted/50 border-border py-5"
            />
          </div>
        </DrawerHeader>

        <div className="flex-1 overflow-auto px-4 pb-6 space-y-6 mt-2">
          {/* Main Nav Gallery */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {mainNav.map((item) => {
              const isActive =
                item.url === "/chat"
                  ? pathname === item.url
                  : pathname === item.url || pathname.startsWith(item.url + "/");
              return (
                <DrawerClose asChild key={item.title}>
                  <Link
                    href={item.url}
                    className={`flex flex-col items-center justify-center gap-2 rounded-xl p-4 text-sm font-medium transition-all ${
                      isActive
                        ? "bg-primary text-primary-foreground shadow-md scale-[1.02]"
                        : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground border border-border"
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
              {chats.length > 0 ? (
                chats.map((chat) => {
                  const url = `/chat/${chat.id}`;
                  const isActive = pathname === url;
                  return (
                    <DrawerClose asChild key={chat.id}>
                      <Link
                        href={url}
                        className={`flex items-center gap-4 rounded-xl px-4 py-3.5 text-sm font-medium transition-all active:scale-[0.98] ${
                          isActive
                            ? "bg-primary text-primary-foreground border border-primary/20 shadow-md"
                            : "bg-muted/30 text-muted-foreground hover:bg-muted hover:text-foreground border border-border"
                        }`}
                      >
                        <span className="truncate">{chat.title}</span>
                        {isActive && <div className="ml-auto size-2 rounded-full bg-primary-foreground animate-pulse" />}
                      </Link>
                    </DrawerClose>
                  );
                })
              ) : isLoading ? (
                <div className="px-3 py-4 text-center rounded-xl bg-muted/10 border border-border/50 text-xs text-muted-foreground/40 italic">
                  Loading chats...
                </div>
              ) : (
                <div className="px-3 py-4 text-center rounded-xl bg-muted/10 border border-border/50 text-xs text-muted-foreground/60 italic">
                  No active chats yet. Start a new session above!
                </div>
              )}
            </div>
          </div>

          <Separator className="bg-border/50" />

        </div>
      </DrawerContent>
    </Drawer>
  );
}
