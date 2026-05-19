"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Settings,
  Bell,
  HelpCircle,
  User,
  LogOut,
  Moon,
  Sun,
  Copy,
  Check,
  Wallet,
  X,
} from "lucide-react";
import { useTheme } from "next-themes";
import { usePrivy } from "@privy-io/react-auth";
import { useWalletStore } from "@/stores/wallet-store";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
} from "@/components/ui/drawer";
import { Separator } from "@/components/ui/separator";

import { useNotifications } from "@/lib/query-hooks";
import { Facehash } from "facehash";

export function MobileProfileDrawer({
  open,
  setOpen,
}: {
  open: boolean;
  setOpen: (open: boolean) => void;
}) {
  const { setTheme, theme } = useTheme();
  const { user, logout } = usePrivy();
  const { wallets } = useWalletStore();
  const { data: notifications } = useNotifications();
  const unreadCount = notifications?.filter((n) => !n.read).length ?? 0;

  const connectedWallet = wallets.find((w) => w.type === "connected");
  const smartWallet = wallets.find((w) => w.type === "smart");

  const [copiedAddress, setCopiedAddress] = React.useState<string | null>(null);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedAddress(text);
    setTimeout(() => setCopiedAddress(null), 2000);
  };

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

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerContent className="h-[80vh] outline-0 bg-background/95 backdrop-blur-xl border-t border-border">
        <DrawerHeader className="pb-3 border-b border-border">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-3">
              <img
                src="/qleva-brand/new-logo-primary.png"
                alt="logo"
                className="w-7 h-7 object-contain"
              />
              <span className="font-heading text-2xl font-bold tracking-tight text-foreground">
                Qleva
              </span>
            </div>

            <span className="bg-card p-2 rounded-lg" onClick={() => setOpen(false)}><X /></span>
          </div>
        </DrawerHeader>

        <div className="flex-1 overflow-auto px-4 py-6 space-y-6">
          {/* User Profile Card */}
          <div className="flex items-center gap-4 p-4 rounded-2xl border border-border">
            <div className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary overflow-hidden border border-primary/20">
              {avatarUrl ? (
                <img src={avatarUrl} alt="Avatar" className="size-full object-cover" />
              ) : (
                <Facehash name={displayName} />
              )}
            </div>
            <div className="flex flex-col leading-tight min-w-0">
              <span className="text-lg font-bold text-foreground truncate">
                {displayName}
              </span>
              <span className="text-sm text-muted-foreground truncate">
                {displaySub}
              </span>
            </div>
          </div>

          {/* Wallets & Balances Section */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider px-1">
            Wallets
            </h4>

            <div className="space-y-3">
              {/* Connected Wallet */}
              {connectedWallet && (
                <div className="flex flex-col gap-2 p-4 rounded-xl bg-card border border-border">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-foreground flex items-center gap-2">
                      <div className="size-2 rounded-full" style={{ backgroundColor: connectedWallet.chainColor }} />
                      {connectedWallet.name}
                    </span>
                    <span className="text-sm font-bold text-foreground">
                      {connectedWallet.balance.toFixed(2)} ETH
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span className="truncate max-w-[220px] font-mono">{connectedWallet.address}</span>
                    <button
                      onClick={() => copyToClipboard(connectedWallet.address)}
                      className="p-1.5 hover:bg-muted rounded-md transition-colors"
                    >
                      {copiedAddress === connectedWallet.address ? (
                        <Check className="size-3.5 text-green-500" />
                      ) : (
                        <Copy className="size-3.5 text-muted-foreground" />
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* Smart Wallet */}
              {smartWallet && (
                <div className="flex flex-col gap-2 p-4 rounded-xl bg-card border border-border">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-foreground flex items-center gap-2">
                      <div className="size-2 rounded-full" style={{ backgroundColor: smartWallet.chainColor }} />
                      {smartWallet.name}
                    </span>
                    <span className="text-sm font-bold text-foreground">
                      ${smartWallet.balance.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span className="truncate max-w-[220px] font-mono">{smartWallet.address}</span>
                    <button
                      onClick={() => copyToClipboard(smartWallet.address)}
                      className="p-1.5 hover:bg-muted rounded-md transition-colors"
                    >
                      {copiedAddress === smartWallet.address ? (
                        <Check className="size-3.5 text-green-500" />
                      ) : (
                        <Copy className="size-3.5 text-muted-foreground" />
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          <Separator className="bg-border/50" />

          {/* Quick Settings & Navigation */}
          <div className="grid grid-cols-2 gap-3">
            <DrawerClose asChild>
              <Link
                href="/notifications"
                className="flex items-center justify-between rounded-xl p-4 text-sm font-medium bg-muted/30 text-muted-foreground hover:bg-muted border border-border transition-all active:scale-[0.98] w-full"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-background/50 text-foreground border border-border/20">
                    <Bell className="size-4" />
                  </div>
                  <span>Notifications</span>
                </div>
                {unreadCount > 0 && (
                  <span className="flex relative -top-6 -right-4 min-w-6 h-6 items-center justify-center rounded-full bg-primary text-[12px] font-bold text-black">
                    {unreadCount}
                  </span>
                )}
              </Link>
            </DrawerClose>
            <DrawerClose asChild>
              <Link
                href="/settings"
                className="flex items-center gap-3 rounded-xl p-4 text-sm font-medium bg-muted/30 text-muted-foreground hover:bg-muted border border-border transition-all active:scale-[0.98]"
              >
                <div className="p-2 rounded-xl bg-background/50 text-foreground border border-border/20">
                  <Settings className="size-4" />
                </div>
                Settings
              </Link>
            </DrawerClose>
            <DrawerClose asChild>
              <Link
                href="/help"
                className="flex items-center gap-3 rounded-xl p-4 text-sm font-medium bg-muted/30 text-muted-foreground hover:bg-muted border border-border transition-all active:scale-[0.98]"
              >
                <div className="p-2 rounded-xl bg-background/50 text-foreground border border-border/20">
                  <HelpCircle className="size-4" />
                </div>
                Help
              </Link>
            </DrawerClose>
            <button
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="flex items-center gap-3 rounded-xl p-4 text-sm font-medium bg-muted/30 text-muted-foreground hover:bg-muted border border-border transition-all active:scale-[0.98]"
            >
              <div className="p-2 rounded-xl bg-background/50 text-foreground border border-border/20">
                <Sun className="size-4 hidden dark:block" />
                <Moon className="size-4 block dark:hidden" />
              </div>
              Theme
            </button>
          </div>

          {/* Log Out */}
          <DrawerClose asChild>
            <button
              className="w-full flex items-center justify-center gap-3 rounded-xl p-4 mt-2 text-sm font-semibold text-destructive bg-destructive/5 hover:bg-destructive/10 border border-destructive/10 transition-all active:scale-[0.98]"
              onClick={() => logout()}
            >
              <LogOut className="size-5" /> Log out
            </button>
          </DrawerClose>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
