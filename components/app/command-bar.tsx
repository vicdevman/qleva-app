"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandShortcut,
} from "@/components/ui/command";
import {
  Search,
  ArrowRight,
  Wallet,
  Workflow,
  TrendingUp,
  Bell,
  Settings,
  MessageSquareText,
} from "lucide-react";
import { useUIStore } from "@/stores/ui-store";
import { useRouter } from "next/navigation";

const quickActions = [
  { label: "Buy ETH", icon: <TrendingUp className="size-4" />, shortcut: "⌘B" },
  { label: "Bridge Funds", icon: <ArrowRight className="size-4" />, shortcut: "⌘R" },
  { label: "Pause Automations", icon: <Workflow className="size-4" />, shortcut: "⌘P" },
  { label: "Check Balance", icon: <Wallet className="size-4" />, shortcut: "⌘L" },
];

const navItems = [
  { label: "Dashboard", icon: <TrendingUp className="size-4" />, href: "/dashboard" },
  { label: "Chat", icon: <MessageSquareText className="size-4" />, href: "/chat" },
  { label: "Automations", icon: <Workflow className="size-4" />, href: "/automations" },
  { label: "Portfolio", icon: <Wallet className="size-4" />, href: "/portfolio" },
  { label: "Notifications", icon: <Bell className="size-4" />, href: "/notifications" },
  { label: "Settings", icon: <Settings className="size-4" />, href: "/settings" },
];

export function CommandBar() {
  const { commandBarOpen, setCommandBarOpen } = useUIStore();
  const router = useRouter();

  const handleSelect = (href: string) => {
    setCommandBarOpen(false);
    router.push(href);
  };

  return (
    <CommandDialog open={commandBarOpen} onOpenChange={setCommandBarOpen}>
      <CommandInput placeholder="Type a command or search..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        <CommandGroup heading="Quick Actions">
          {quickActions.map((action) => (
            <CommandItem
              key={action.label}
              onSelect={() => setCommandBarOpen(false)}
              className="gap-3"
            >
              <span className="text-muted-foreground">{action.icon}</span>
              <span>{action.label}</span>
              <CommandShortcut>{action.shortcut}</CommandShortcut>
            </CommandItem>
          ))}
        </CommandGroup>
        <CommandGroup heading="Navigation">
          {navItems.map((item) => (
            <CommandItem
              key={item.label}
              onSelect={() => handleSelect(item.href)}
              className="gap-3"
            >
              <span className="text-muted-foreground">{item.icon}</span>
              <span>{item.label}</span>
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
