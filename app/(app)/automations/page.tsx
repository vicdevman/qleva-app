"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import {
  Play,
  Pause,
  Trash2,
  Clock,
  BarChart3,
  Repeat,
  Workflow,
  Calendar,
} from "lucide-react";
import { AppShell } from "@/components/app/app-shell";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAutomations, useToggleAutomationStatus, useDeleteAutomation } from "@/lib/query-hooks";
import { cn, getFriendlyScheduleDescription } from "@/lib/utils";

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(value);
}

function formatDate(dateStr?: string | Date | null) {
  if (!dateStr) return "Never";
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
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
    icon: <Play className="size-3" />, // fallback or change if needed
    color: "bg-green-500/10 text-green-500",
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

const TokenBadge = ({ tokenInfo }: { tokenInfo: any }) => {
  if (!tokenInfo) return null;
  const symbol = tokenInfo.symbol || "USDC";
  const address = tokenInfo.contractAddress || "";
  const logoUrl = tokenInfo.logoUrl || (symbol === "ETH" 
    ? "https://dd.dexscreener.com/ds-data/tokens/base/0x4200000000000000000000000000000000000006.png" 
    : "https://dd.dexscreener.com/ds-data/tokens/base/0x833589fcd6edb6e08f4c7c32d4f71b54bda02913.png");

  const url = address ? `https://dexscreener.com/base/${address}` : `https://dexscreener.com/search?q=${symbol}`;

  return (
    <span className="inline-flex items-center gap-1.5 bg-muted/50 border border-border px-2 py-0.5 rounded-md">
      {logoUrl && (
        <img
          src={logoUrl}
          alt=""
          className="size-3.5 rounded-full object-cover border border-white/5"
        />
      )}
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="underline decoration-dotted underline-offset-4 hover:text-primary transition-colors font-medium text-[11px] text-foreground cursor-pointer"
        onClick={(e) => e.stopPropagation()}
      >
        {symbol}
      </a>
    </span>
  );
};

function AutomationCard({ automation }: { automation: any }) {
  const router = useRouter();
  const toggleMutation = useToggleAutomationStatus();
  const deleteMutation = useDeleteAutomation();

  const isSchedule = automation.trigger?.type === "schedule";
  const isActive = automation.status === "active";

  const config = automation.trigger?.config || {};
  const fromTokenInfo = config.fromTokenInfo || { symbol: config.fromToken || "USDC" };
  const toTokenInfo = config.toTokenInfo || { symbol: config.toToken || "ETH" };
  const amountUsd = config.amountUsd || 10;
  const frequency = config.frequency || "daily";

  const creationDate = new Date(automation.createdAt || Date.now());
  const expiresDate = new Date(automation.execution?.expiresAt || (Date.now() + 30 * 24 * 3600 * 1000));
  const nextExecutionDate = automation.execution?.nextExecutionAt ? new Date(automation.execution.nextExecutionAt) : null;

  const currentRuns = automation.execution?.currentRuns || 0;
  const volume = currentRuns * amountUsd;

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    const nextStatus = isActive ? "paused" : "active";
    toggleMutation.mutate({ id: automation.id, status: nextStatus });
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm("Are you sure you want to delete this automation?")) {
      deleteMutation.mutate(automation.id);
    }
  };

  return (
    <motion.div variants={item}>
      <Card
        className={cn(
          "bg-card/40 border-border backdrop-blur-md overflow-hidden transition-all hover:shadow-md cursor-pointer",
          !isActive && "opacity-75 hover:opacity-100 border-dashed"
        )}
        onClick={() => router.push(`/automations/${automation.id}`)}
      >
        <CardContent className="p-5 space-y-4">
          {/* Header */}
          <div className="flex justify-between items-center pb-2 border-b border-border/30">
            <h3 className="font-heading text-sm font-bold tracking-tight text-foreground/90">
              {isSchedule 
                ? (config.schedule?.mode === "once" ? "One-Time Scheduled Swap" : "Recurring Swap Strategy")
                : "Price Condition Trigger"
              }
            </h3>
            <Badge
              variant={isActive ? "default" : "secondary"}
              className={cn(
                "text-[10px] px-2 py-0.5 capitalize font-medium",
                isActive ? "bg-green-500/10 text-green-500 border border-green-500/20" : "bg-muted text-muted-foreground border"
              )}
            >
              {automation.status}
            </Badge>
          </div>

          {/* Details list */}
          <div className="space-y-2.5">
            <div className="flex justify-between items-center text-xs border-b border-border/30 pb-2.5">
              <span className="text-muted-foreground">Token Path</span>
              <span className="flex items-center gap-1.5">
                <TokenBadge tokenInfo={fromTokenInfo} />
                <span className="text-muted-foreground text-[10px] font-bold">➔</span>
                <TokenBadge tokenInfo={toTokenInfo} />
              </span>
            </div>

            <div className="flex justify-between items-center text-xs border-b border-border/30 pb-2.5">
              <span className="text-muted-foreground">Execution Trade Size</span>
              <span className="font-semibold text-emerald-500">{formatCurrency(amountUsd)}</span>
            </div>

            {isSchedule ? (
              <>
                <div className="flex justify-between items-center text-xs border-b border-border/30 pb-2.5">
                  <span className="text-muted-foreground">Schedule</span>
                  <span className="font-medium capitalize">
                    {getFriendlyScheduleDescription(config.schedule, frequency, config.startDateText)}
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs border-b border-border/30 pb-2.5">
                  <span className="text-muted-foreground">Ends</span>
                  <span className="font-medium flex items-center gap-1">
                    <Calendar className="size-3 text-muted-foreground" />
                    {config.schedule?.mode === "once" ? "After execution" : formatDate(expiresDate)}
                  </span>
                </div>
              </>
            ) : (
              <>
                <div className="flex justify-between items-center text-xs border-b border-border/30 pb-2.5">
                  <span className="text-muted-foreground">Trigger Condition</span>
                  <span className="font-medium text-right capitalize">
                    {config.conditionType?.split("_").join(" ") || "Drops below"} ${config.targetValue}
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs border-b border-border/30 pb-2.5">
                  <span className="text-muted-foreground">Starts</span>
                  <span className="font-medium">{formatDate(creationDate)}</span>
                </div>
                <div className="flex justify-between items-center text-xs border-b border-border/30 pb-2.5">
                  <span className="text-muted-foreground">Ends</span>
                  <span className="font-medium flex items-center gap-1">
                    <Calendar className="size-3 text-muted-foreground" />
                    {formatDate(expiresDate)}
                  </span>
                </div>
              </>
            )}

            <div className="flex justify-between items-center text-xs border-b border-border/30 pb-2.5">
              <span className="text-muted-foreground">Next Execution</span>
              <span className="font-medium flex items-center gap-1">
                <Clock className="size-3 text-primary" />
                {isActive && nextExecutionDate ? formatDate(nextExecutionDate) : "Paused"}
              </span>
            </div>

            <div className="flex justify-between items-center text-xs border-b border-border/30 pb-2.5">
              <span className="text-muted-foreground">Runs</span>
              <span className="font-medium">{currentRuns}</span>
            </div>

            <div className="flex justify-between items-center text-xs pb-0.5">
              <span className="text-muted-foreground">Volume</span>
              <span className="font-semibold text-emerald-500">{formatCurrency(volume)}</span>
            </div>
          </div>

          {/* Action Row */}
          <div className="flex gap-2 pt-3 border-t border-border/30">
            <Button
              size="sm"
              variant="outline"
              className="flex-1 h-9 text-xs font-bold border-white/10 hover:bg-white/5"
              onClick={handleToggle}
              disabled={toggleMutation.isPending}
            >
              {isActive ? <Pause className="size-3.5 mr-1.5" /> : <Play className="size-3.5 mr-1.5" />}
              {isActive ? "Pause" : "Resume"}
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="h-9 px-3 text-xs font-bold border-red-500/20 text-red-500 hover:bg-red-500/10 hover:text-red-400"
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
            >
              <Trash2 className="size-3.5" />
            </Button>
            <Button
              size="sm"
              className="flex-1 h-9 text-xs font-bold bg-primary/10 hover:bg-primary/20 text-primary border border-primary/10"
              onClick={(e) => {
                e.stopPropagation();
                router.push(`/automations/${automation.id}`);
              }}
            >
              View Executions
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function AutomationsContent() {
  const { data: automations, isLoading } = useAutomations();
  
  const activeCount =
    automations?.filter((a: any) => a.status === "active").length ?? 0;

  const totalExecutions =
    automations?.reduce((sum: number, a: any) => sum + Number(a.execution?.currentRuns || 0), 0) ?? 0;

  const totalVolume =
    automations?.reduce((sum: number, a: any) => {
      const runs = Number(a.execution?.currentRuns || 0);
      const amount = Number(a.trigger?.config?.amountUsd || a.risk?.maxTradeUsd || 0);
      return sum + (runs * amount);
    }, 0) ?? 0;

  return (
    <AppShell>
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="space-y-6 pb-12"
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
        </motion.div>

        {/* Stats Row */}
        <motion.div variants={item} className="grid gap-4 grid-cols-2 sm:grid-cols-4">
          <Card className="bg-card/40 border-border backdrop-blur-md overflow-hidden">
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
          <Card className="bg-card/40 border-border backdrop-blur-md overflow-hidden">
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
          <Card className="bg-card/40 border-border backdrop-blur-md overflow-hidden">
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
          <Card className="bg-card/40 border-border backdrop-blur-md overflow-hidden">
            <CardContent className="flex items-center gap-3">
              <div className="flex size-9 items-center justify-center rounded-lg bg-purple-500/10">
                <BarChart3 className="size-4 text-purple-500" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Volume</p>
                <p className="font-heading text-lg font-semibold">
                  {totalVolume >= 1000
                    ? `$${(totalVolume / 1000).toFixed(1)}k`
                    : `$${totalVolume.toFixed(2)}`}
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Automation Cards */}
        <div className="space-y-3">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-56 w-full rounded-xl" />
              ))}
            </div>
          ) : !automations || automations.length === 0 ? (
            <div className="text-center py-12 border border-dashed rounded-xl border-muted-foreground/20 text-muted-foreground p-2">
              No active automation strategies. Create one from the chat view!
            </div>
          ) : (
            <motion.div
              variants={container}
              initial="hidden"
              animate="show"
              className="grid grid-cols-1 md:grid-cols-2 gap-5"
            >
              {automations.map((automation: any) => (
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
