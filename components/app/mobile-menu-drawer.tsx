"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
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
  MoreVertical,
} from "lucide-react";
import { useTheme } from "next-themes";
import { usePrivy } from "@privy-io/react-auth";
import { useChatsList, useRenameChat, useDeleteChat } from "@/lib/query-hooks";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
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
                  const isEditing = editingChatId === chat.id;

                  if (isEditing) {
                    return (
                      <div
                        key={chat.id}
                        className="flex items-center justify-between gap-2 rounded-xl px-4 py-3 border border-primary/30 bg-muted/50"
                      >
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
                          className="w-full bg-transparent border-none outline-none focus:outline-none focus:ring-0 p-0 font-medium text-foreground"
                        />
                      </div>
                    );
                  }

                  return (
                    <div
                      key={chat.id}
                      className={`group relative flex items-center justify-between rounded-xl transition-all border ${
                        isActive
                          ? "bg-primary text-primary-foreground border-primary/20 shadow-md"
                          : "bg-muted/30 text-muted-foreground hover:bg-muted hover:text-foreground border-border"
                      }`}
                    >
                      <DrawerClose asChild>
                        <Link
                          href={url}
                          className="flex-1 flex items-center gap-4 px-4 py-3.5 text-sm font-medium truncate"
                        >
                          <span className="truncate pr-4">{chat.title}</span>
                          {/* {isActive && (
                            <div className="size-2 rounded-full bg-primary-foreground animate-pulse" />
                          )} */}
                        </Link>
                      </DrawerClose>

                      <div className="pr-3 flex items-center shrink-0">
                        <DropdownMenu modal={false}>
                          <DropdownMenuTrigger asChild>
                            <Button
                              size="icon-sm"
                              variant="ghost"
                              className={`size-8 rounded-lg ${
                                isActive
                                  ? "hover:bg-primary-foreground/10 text-primary-foreground"
                                  : "hover:bg-muted text-muted-foreground"
                              }`}
                            >
                              <MoreVertical className="size-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setEditTitle(chat.title);
                                isEscapePressed.current = false;
                                setEditingChatId(chat.id);
                              }}
                            >
                              Rename
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setDeleteConfirmChatId(chat.id);
                              }}
                            >
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
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
      </DrawerContent>
    </Drawer>
  );
}
