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
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value);
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
  time: { label: "Time-based", icon: <Clock className="size-3" />, color: "bg-blue-500/10 text-blue-500" },
  price: { label: "Price Trigger", icon: <TrendingUp className="size-3" />, color: "bg-green-500/10 text-green-500" },
  portfolio: { label: "Portfolio", icon: <BarChart3 className="size-3" />, color: "bg-purple-500/10 text-purple-500" },
};

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05 } },
};

const item = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3, ease: "easeOut" as const } },
};

function AutomationCard({ automation, index }: { automation: any; index: number }) {
  const trigger = triggerConfig[automation.trigger as keyof typeof triggerConfig];

  return (
    <motion.div variants={item}>
      <Card className="group/card transition-all hover:border-primary/30 hover:shadow-md">
        <CardContent className="space-y-4 pt-4">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold">{automation.name}</h3>
                <Badge
                  variant={automation.status === "active" ? "default" : "secondary"}
                  className={cn(
                    "h-4.5 text-[10px]",
                    automation.status === "active" && "bg-green-500/15 text-green-600 dark:text-green-400"
                  )}
                >
                  {automation.status === "active" ? (
                    <span className="flex items-center gap-1">
                      <span className="size-1.5 rounded-full bg-green-500 animate-pulse" />
                      Active
                    </span>
                  ) : (
                    "Paused"
                  )}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">{automation.description}</p>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon-xs" className="opacity-0 group-hover/card:opacity-100">
                  <MoreHorizontal className="size-3.5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>
                  <Play className="size-3.5" />
                  {automation.status === "active" ? "Pause" : "Resume"}
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Copy className="size-3.5" />
                  Duplicate
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-destructive">
                  <Trash2 className="size-3.5" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Trigger Badge */}
          <div className="flex items-center gap-2">
            <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium", trigger.color)}>
              {trigger.icon}
              {trigger.label}
            </span>
            <span className="text-xs text-muted-foreground">{automation.frequency}</span>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div>
              <p className="text-[10px] text-muted-foreground">Action</p>
              <p className="text-xs font-medium">{automation.action}</p>
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground">Amount</p>
              <p className="text-xs font-medium">{automation.amount}</p>
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground">Chain</p>
              <p className="text-xs font-medium">{automation.chain}</p>
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground">Executions</p>
              <p className="text-xs font-medium">{automation.totalExecutions} runs</p>
            </div>
          </div>

          {/* Footer Stats */}
          <div className="flex items-center justify-between border-t pt-3">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1">
                <CheckCircle2 className="size-3 text-green-500" />
                <span className="text-[10px] text-muted-foreground">
                  {automation.successRate}% success
                </span>
              </div>
              <div className="flex items-center gap-1">
                <Fuel className="size-3 text-muted-foreground" />
                <span className="text-[10px] text-muted-foreground">
                  {automation.gasUsed} ETH gas
                </span>
              </div>
            </div>
            <div className="text-right">
              <p className="text-[10px] text-muted-foreground">
                {automation.status === "active" ? `Next: ${nextRun(automation.nextExecution)}` : `Last: ${timeAgo(automation.lastExecuted)}`}
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
  const activeCount = automations?.filter((a) => a.status === "active").length ?? 0;
  const totalExecutions = automations?.reduce((sum, a) => sum + a.totalExecutions, 0) ?? 0;
  const totalVolume = automations?.reduce((sum, a) => sum + a.totalVolume, 0) ?? 0;

  return (
    <AppShell>
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="space-y-6"
      >
        {/* Header */}
        <motion.div variants={item} className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="font-heading text-2xl font-semibold tracking-tight">Automations</h1>
            <p className="text-sm text-muted-foreground">
              Manage all your active workflows and scheduled actions
            </p>
          </div>
          <Button size="sm" className="gap-2">
            <Plus className="size-4" />
            New Automation
          </Button>
        </motion.div>

        {/* Stats Row */}
        <motion.div variants={item} className="grid gap-4 sm:grid-cols-4">
          <Card>
            <CardContent className="flex items-center gap-3">
              <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10">
                <Workflow className="size-4 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total</p>
                <p className="font-heading text-lg font-semibold">{automations?.length ?? 0}</p>
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
                <p className="font-heading text-lg font-semibold">{activeCount}</p>
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
                <p className="font-heading text-lg font-semibold">{totalExecutions}</p>
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
                  {totalVolume >= 1000 ? `$${(totalVolume / 1000).toFixed(1)}k` : `$${totalVolume}`}
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
            <motion.div variants={container} initial="hidden" animate="show" className="space-y-3">
              {automations?.map((automation, i) => (
                <AutomationCard key={automation.id} automation={automation} index={i} />
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
