"use client";

import * as React from "react";
import { motion } from "framer-motion";
import {
  Plus,
  Play,
  Pause,
  Copy,
  Trash2,
  MoreHorizontal,
  Clock,
  TrendingUp,
  BarChart3,
  Fuel,
  CheckCircle2,
  XCircle,
  Calendar,
  Repeat,
  Workflow,
  MoreVertical,
} from "lucide-react";
import { AppShell } from "@/components/app/app-shell";
import { SectionCard } from "@/components/shared/section-card";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAutomations } from "@/lib/query-hooks";
import { cn } from "@/lib/utils";

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(value);
}

function timeAgo(dateStr: string | null) {
  if (!dateStr) return "Paused";
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

function nextRun(dateStr: string | null) {
  if (!dateStr) return "Not scheduled";
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

const triggerConfig = {
  time: {
    label: "Time-based",
    icon: <Clock className="size-3" />,
    color: "bg-blue-500/10 text-blue-500",
  },
  price: {
    label: "Price Trigger",
    icon: <TrendingUp className="size-3" />,
    color: "bg-green-500/10 text-green-500",
  },
  portfolio: {
    label: "Portfolio",
    icon: <BarChart3 className="size-3" />,
    color: "bg-purple-500/10 text-purple-500",
  },
};

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05 } },
};

const item = {
  hidden: { opacity: 0, y: 10 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.3, ease: "easeOut" as const },
  },
};

function AutomationCard({ automation }: { automation: any }) {
  const trigger =
    triggerConfig[automation.trigger as keyof typeof triggerConfig];
  const isActive = automation.status === "active";

  return (
    <motion.div variants={item}>
      <Card
        className={cn(
          "group/card overflow-hidden transition-all hover:shadow-md",
          isActive
            ? "border-border hover:border-primary/30"
            : "border-dashed border-muted-foreground/20 opacity-60 hover:opacity-100",
        )}
      >
        <CardContent className="">
          {/* ── Row 1: Identity ── */}
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <span className="flex gap-3 items-center">
                <h3 className="text-sm font-semibold leading-tight">
                  {automation.name}
                </h3>{" "}
                <Badge
                  variant="outline"
                  className={cn(
                    "h-5 border px-2 text-[10px] font-medium",
                    trigger.color,
                  )}
                >
                  {trigger.label}
                </Badge>
              </span>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                {automation.description}
              </p>
            </div>

            <div className="grid grid-cols-2 items-center gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon-xs" className="">
                    <MoreVertical className="size-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-40">
                  <DropdownMenuItem className="gap-2 text-xs">
                    {isActive ? (
                      <Pause className="size-3.5" />
                    ) : (
                      <Play className="size-3.5" />
                    )}
                    {isActive ? "Pause" : "Resume"}
                  </DropdownMenuItem>
                  <DropdownMenuItem className="gap-2 text-xs">
                    <Copy className="size-3.5" />
                    Duplicate
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="gap-2 text-xs text-destructive focus:bg-destructive/10 focus:text-destructive">
                    <Trash2 className="size-3.5" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* ── Row 2: What it does ── */}
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <span className="text-xs text-muted-foreground">
              {automation.action} · {automation.amount} · {automation.chain}
            </span>
          </div>

          {/* ── Row 3: Stats — text-first, no icons ── */}
          <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-4">
            <div>
              <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground/60">
                Success
              </p>
              <p className="mt-0.5 text-sm font-semibold">
                {automation.successRate}%
              </p>
            </div>
            <div>
              <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground/60">
                Runs
              </p>
              <p className="mt-0.5 text-sm font-semibold">
                {automation.totalExecutions}
              </p>
            </div>
            <div>
              <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground/60">
                Gas
              </p>
              <p className="mt-0.5 text-sm font-semibold">
                {automation.gasUsed} ETH
              </p>
            </div>
            <div>
              <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground/60">
                Volume
              </p>
              <p className="mt-0.5 text-sm font-semibold">
                {automation.totalVolume}
              </p>
            </div>
          </div>

          {/* ── Row 4: Schedule ── */}
          <div className="mt-4 flex items-center justify-between border-t pt-3">
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                {isActive ? (
                  <span className="relative flex size-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
                    <span className="relative inline-flex size-2 rounded-full bg-green-500" />
                  </span>
                ) : (
                  <span className="size-2 rounded-full bg-muted-foreground/30" />
                )}
                <span className="text-xs font-medium text-muted-foreground">
                  {isActive ? "Active" : "Paused"}
                </span>
              </div>{" "}
              <span className="text-xs text-muted-foreground">
                {automation.frequency}
              </span>
            </div>

            <div className="text-right">
              <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground/50">
                {isActive ? "Next run" : "Last run"}
              </p>
              <p className="mt-0.5 text-xs font-medium">
                {isActive
                  ? nextRun(automation.nextExecution)
                  : timeAgo(automation.lastExecuted)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function AutomationsContent() {
  const { data: automations, isLoading } = useAutomations();
  const activeCount =
    automations?.filter((a) => a.status === "active").length ?? 0;
  const totalExecutions =
    automations?.reduce((sum, a) => sum + a.totalExecutions, 0) ?? 0;
  const totalVolume =
    automations?.reduce((sum, a) => sum + a.totalVolume, 0) ?? 0;

  return (
    <AppShell>
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="space-y-6"
      >
        {/* Header */}
        <motion.div
          variants={item}
          className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
        >
          <div>
            <h1 className="font-heading text-2xl font-semibold tracking-tight">
              Automations
            </h1>
            <p className="text-sm text-muted-foreground">
              Manage all your active workflows and scheduled actions
            </p>
          </div>
          <Button size="lg" className="gap-2">
            <Plus className="size-4" />
            New Automation
          </Button>
        </motion.div>

        {/* Stats Row */}
        <motion.div variants={item} className="grid gap-4 grid-cols-2 sm:grid-cols-4">
          <Card>
            <CardContent className="flex items-center gap-3">
              <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10">
                <Workflow className="size-4 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total</p>
                <p className="font-heading text-lg font-semibold">
                  {automations?.length ?? 0}
                </p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-3">
              <div className="flex size-9 items-center justify-center rounded-lg bg-green-500/10">
                <Play className="size-4 text-green-500" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Active</p>
                <p className="font-heading text-lg font-semibold">
                  {activeCount}
                </p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-3">
              <div className="flex size-9 items-center justify-center rounded-lg bg-blue-500/10">
                <Repeat className="size-4 text-blue-500" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Executions</p>
                <p className="font-heading text-lg font-semibold">
                  {totalExecutions}
                </p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-3">
              <div className="flex size-9 items-center justify-center rounded-lg bg-purple-500/10">
                <BarChart3 className="size-4 text-purple-500" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Volume</p>
                <p className="font-heading text-lg font-semibold">
                  {totalVolume >= 1000
                    ? `$${(totalVolume / 1000).toFixed(1)}k`
                    : `$${totalVolume}`}
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Automation Cards */}
        <div className="space-y-3">
          {isLoading ? (
            [1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-48 w-full rounded-xl" />
            ))
          ) : (
            <motion.div
              variants={container}
              initial="hidden"
              animate="show"
              className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:grid-cols-2"
            >
              {automations?.map((automation, i) => (
                <AutomationCard key={automation.id} automation={automation} />
              ))}
            </motion.div>
          )}
        </div>
      </motion.div>
    </AppShell>
  );
}

export default function AutomationsPage() {
  return <AutomationsContent />;
}
