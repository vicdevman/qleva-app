"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
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
  MoreVertical,
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
  SidebarMenuAction,
} from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { useUIStore } from "@/stores/ui-store";
import Image from "next/image";
import { Button } from "../ui/button";
import { Facehash } from "facehash";
import { useChatsList, useRenameChat, useDeleteChat } from "@/lib/query-hooks";

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

  const router = useRouter();
  const renameChatMutation = useRenameChat();
  const deleteChatMutation = useDeleteChat();

  const [editingChatId, setEditingChatId] = React.useState<string | null>(null);
  const [editTitle, setEditTitle] = React.useState("");
  const [deleteConfirmChatId, setDeleteConfirmChatId] = React.useState<string | null>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const isEscapePressed = React.useRef(false);

  React.useEffect(() => {
    if (editingChatId && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editingChatId]);

  const handleSaveRename = async (chatId: string) => {
    const trimmed = editTitle.trim();
    if (!trimmed || trimmed === chats.find(c => c.id === chatId)?.title) {
      setEditingChatId(null);
      return;
    }
    try {
      await renameChatMutation.mutateAsync({ id: chatId, title: trimmed });
    } catch (err) {
      console.error("Failed to rename chat:", err);
    } finally {
      setEditingChatId(null);
    }
  };

  const handleDeleteChat = async (chatId: string) => {
    try {
      await deleteChatMutation.mutateAsync(chatId);
      const activeUrl = `/chat/${chatId}`;
      if (pathname === activeUrl) {
        router.push("/chat");
      }
    } catch (err) {
      console.error("Failed to delete chat:", err);
    } finally {
      setDeleteConfirmChatId(null);
    }
  };

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
                    const isEditing = editingChatId === chat.id;

                    if (isEditing) {
                      return (
                        <SidebarMenuItem key={chat.id}>
                          <div className="flex h-8 w-full items-center gap-2 overflow-hidden rounded-md px-2 py-1 text-left text-sm bg-sidebar-accent border border-primary/30">
                            <input
                              ref={inputRef}
                              value={editTitle}
                              onChange={(e) => setEditTitle(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  handleSaveRename(chat.id);
                                } else if (e.key === "Escape") {
                                  isEscapePressed.current = true;
                                  setEditingChatId(null);
                                }
                              }}
                              onBlur={() => {
                                if (!isEscapePressed.current) {
                                  handleSaveRename(chat.id);
                                }
                              }}
                              className="w-full bg-transparent border-none outline-none focus:outline-none focus:ring-0 p-0 text-sm font-medium text-foreground animate-in fade-in duration-150"
                            />
                          </div>
                        </SidebarMenuItem>
                      );
                    }

                    return (
                      <SidebarMenuItem key={chat.id}>
                        <SidebarMenuButton
                          asChild
                          isActive={isActive}
                          tooltip={chat.title}
                          className="pr-8 group-hover/menu-item:pr-8"
                        >
                          <Link href={url}>
                            <span className="truncate">{chat.title}</span>
                          </Link>
                        </SidebarMenuButton>
                        <DropdownMenu modal={false}>
                          <DropdownMenuTrigger asChild>
                            <SidebarMenuAction showOnHover>
                              <MoreVertical className="size-4" />
                              <span className="sr-only">More</span>
                            </SidebarMenuAction>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent side="right" align="start">
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditTitle(chat.title);
                                isEscapePressed.current = false;
                                setEditingChatId(chat.id);
                              }}
                            >
                              <span>Rename</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive"
                              onClick={(e) => {
                                e.stopPropagation();
                                setDeleteConfirmChatId(chat.id);
                              }}
                            >
                              <span>Delete</span>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
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
            className="w-[--radix-dropdown-menu-trigger-width] min-w-56 text-muted-foreground"
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

      <Dialog
        open={deleteConfirmChatId !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteConfirmChatId(null);
        }}
      >
        <DialogContent className="max-w-[360px] p-5 rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold text-foreground">
              Delete Conversation?
            </DialogTitle>
            <DialogDescription className="text-muted-foreground mt-2">
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-6 flex flex-row justify-end gap-2 border-t-0 p-0 bg-transparent">
            <Button
              variant="outline"
              onClick={() => setDeleteConfirmChatId(null)}
              className="rounded-xl px-4 py-2 text-sm font-medium"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (deleteConfirmChatId) {
                  handleDeleteChat(deleteConfirmChatId);
                }
              }}
              disabled={deleteChatMutation.isPending}
              className="rounded-xl px-4 py-2 text-sm font-medium bg-red-600 hover:bg-red-700 text-white"
            >
              {deleteChatMutation.isPending ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Sidebar>
  );
}
