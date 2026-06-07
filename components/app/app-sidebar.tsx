"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { usePrivy } from "@privy-io/react-auth";
import {
  LayoutDashboard,
  MessageCirclePlus,
  AlignEndHorizontal,
  Workflow,
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
  ChevronsUpDown,
  Moon,
  Sun,
  Search,
  History,
} from "lucide-react";
import { useTheme } from "next-themes";
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
  useSidebar,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { useUIStore } from "@/stores/ui-store";
import Image from "next/image";
import { Button } from "../ui/button";
import { Facehash } from "facehash";
import { useChatsList } from "@/lib/query-hooks";

const mainNav = [
  { title: "New chat", url: "/chat", icon: MessageCirclePlus },
  { title: "Portfolio", url: "/portfolio", icon: AlignEndHorizontal },
  // { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  
  { title: "Automations", url: "/automations", icon: Workflow },

  // { title: "Activity", url: "/activity", icon: Clock },
  { title: "Wallets", url: "/wallets", icon: Wallet },
];

export function AppSidebar() {
  const pathname = usePathname();
  const { setTheme, theme } = useTheme();
  const { user, logout } = usePrivy();
  const { state, setOpen } = useSidebar();

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
  const { toggleCommandBar } = useUIStore();

  return (
    <Sidebar
      collapsible="icon"
      variant="floating"
      className="border-sidebar-border hidden md:flex rounded-3xl"
    >
      <SidebarHeader className={`relative flex-row items-center gap-2 px-1 py-3 ${state !== "collapsed" && "px-4 pr-2"}`}>
        <div className={`relative flex items-center ${state === "collapsed" && "ml-2"}`}>
          <Image
            src="/qleva-brand/qleva-drak.png"
            alt="logo"
            width={500}
            height={500}
            className="w-6"
          />
          {/* When collapsed show a small trigger overlay on hover to expand */}
          {state === "collapsed" && (
            <div className="absolute inset-0 flex items-center justify-center">
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="opacity-0 hover:opacity-100 transition-opacity duration-150 bg-sidebar">
                    <SidebarTrigger aria-label="Expand sidebar" />
                  </div>
                </TooltipTrigger>
                <TooltipContent side="right">Expand sidebar</TooltipContent>
              </Tooltip>
            </div>
          )}
        </div>
        <div className="flex flex-col group-data-[collapsible=icon]:hidden">
          <span className="font-heading text-xl font-semibold tracking-tight">
            Qleva
          </span>
        </div>

        <div className="ml-auto flex items-center gap-1">
          {/* Search icon in header when expanded */}
          {state !== "collapsed" && (
            <SidebarMenuButton
              onClick={toggleCommandBar}
              title="Search"
            >
              <Search />
            </SidebarMenuButton>
          )}

          {/* Sidebar trigger - visible when expanded; collapsed overlay shows separate trigger */}
          <div className="group-data-[collapsible=icon]:hidden">
            <SidebarTrigger />
          </div>
        </div>
      </SidebarHeader>

      {/* Search row: placed below header so it never competes horizontally with the logo */}
      <div className="">
        {state === "collapsed" && (
          <div className="flex justify-center text-muted-foreground">
            <Tooltip>
              <TooltipTrigger asChild>
                <SidebarMenuButton
                  onClick={toggleCommandBar}
                >
                  <Search />
                </SidebarMenuButton>
              </TooltipTrigger>
              <TooltipContent side="right">Search</TooltipContent>
            </Tooltip>
          </div>
        )}
      </div>

      {/* <SidebarSeparator /> */}

      <SidebarContent>
        <SidebarGroup>
          {/* <SidebarGroupLabel>Main</SidebarGroupLabel> */}
          <SidebarGroupContent>
            <SidebarMenu className="flex flex-col gap-1 text-muted-foreground">
              {mainNav.map((item) => {
                const isActive =
                  item.url === "/chat"
                    ? pathname === item.url
                    : pathname === item.url || pathname.startsWith(item.url + "/");
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      tooltip={item.title}
                    >
                      <Link href={item.url}>
                        <item.icon />
                        <span className="group-data-[collapsible=icon]:hidden">{item.title}</span>
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
          {/* Recent chats: show compact icon when collapsed, full list when expanded */}
          <div className="flex items-center justify-between pr-6 group-data-[collapsible=icon]:hidden">
            <SidebarGroupLabel>Recent chats</SidebarGroupLabel>
            <Link
              href="/chat"
              className="flex size-5 items-center justify-center rounded-md text-muted-foreground transition-colors"
            >
              <Button size="sm" variant="ghost" className="text-xs">
                <Plus className="size-3" /> New
              </Button>
            </Link>
          </div>
          <SidebarGroupContent>
            {state === "collapsed" ? (
              <SidebarMenu className="flex gap-1 mt-2 text-muted-foreground">
                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    tooltip="All messages"
                    onClick={() => setOpen(true)}
                  >
                    <button className="w-full flex items-center justify-center">
                      <History />
                    </button>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            ) : (
              <SidebarMenu className="flex gap-1 mt-2 text-muted-foreground">
                {chats.length > 0 ? (
                  chats.map((chat) => {
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
                            <span className="truncate">{chat.title}</span>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })
                ) : isLoading ? (
                  <div className="px-3 py-2 text-xs text-muted-foreground/40 italic group-data-[collapsible=icon]:hidden">
                    Loading chats...
                  </div>
                ) : (
                  <div className="px-3 py-2 text-xs text-muted-foreground/50 italic group-data-[collapsible=icon]:hidden">
                    No active chats
                  </div>
                )}
              </SidebarMenu>
            )}
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
              <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary overflow-hidden">
                {avatarUrl ? (
                  <img src={avatarUrl} alt="Avatar" className="size-full object-cover" />
                ) : (
                   <Facehash name={displayName} />
                )}
              </div>
              <div className="flex flex-col gap-0.5 leading-none group-data-[collapsible=icon]:hidden">
                <span className="text-sm font-medium">{displayName}</span>
                <span className="text-xs text-muted-foreground truncate max-w-[140px]">
                  {displaySub}
                </span>
              </div>
              <ChevronsUpDown className="ml-auto size-4 group-data-[collapsible=icon]:hidden" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            side="top"
            className="w-[--radix-dropdown-menu-trigger-width] min-w-56 text-muted-foreground hover:text-foreground"
            align="end"
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <div className="flex size-8 items-center justify-center rounded-xl bg-primary/10 text-primary overflow-hidden">
                  {avatarUrl ? (
                    <img src={avatarUrl} alt="Avatar" className="size-full object-cover" />
                  ) : (
                    <Facehash name={displayName} />
                  )}
                </div>
                <div className="flex flex-col gap-0.5 leading-none">
                  <span className="font-medium">{displayName}</span>
                  <span className="text-xs text-muted-foreground">
                    {displaySub}
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
            {/* <DropdownMenuItem asChild>
              <Link
                href="/help"
                className="cursor-pointer w-full flex items-center"
              >
                <HelpCircle className="mr-2 size-4" />
                Help & Memory
              </Link>
            </DropdownMenuItem> */}
            <DropdownMenuItem
              className="cursor-pointer w-full flex items-center"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            >
              {theme === "dark" ? (
                <Moon className="mr-2 size-4" />
              ) : (
                <Sun className="mr-2 size-4" />
              )}
              {theme === "dark" ? "Dark mode" : "Light mode"}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              className="text-destructive focus:text-destructive cursor-pointer"
              onClick={() => logout()}
            >
              <LogOut className="mr-2 size-4" />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
