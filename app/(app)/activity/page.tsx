"use client";

import * as React from "react";
import { motion } from "framer-motion";
import {
  ArrowUpRight,
  ArrowDownRight,
  ExternalLink,
  Filter,
  ArrowRightLeft,
  ShieldCheck,
  BarChart3,
  Wallet,
  Clock,
  CheckCircle2,
  XCircle,
  Activity,
  Fuel,
} from "lucide-react";
import { AppShell } from "@/components/app/app-shell";
import { SectionCard } from "@/components/shared/section-card";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useActivity } from "@/lib/query-hooks";
import { cn } from "@/lib/utils";

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

const typeConfig = {
  swap: { icon: <ArrowRightLeft className="size-4" />, label: "Swap", color: "bg-blue-500/10 text-blue-500" },
  bridge: { icon: <ArrowUpRight className="size-4" />, label: "Bridge", color: "bg-purple-500/10 text-purple-500" },
  approval: { icon: <ShieldCheck className="size-4" />, label: "Approval", color: "bg-yellow-500/10 text-yellow-500" },
  rebalance: { icon: <BarChart3 className="size-4" />, label: "Rebalance", color: "bg-green-500/10 text-green-500" },
  deposit: { icon: <Wallet className="size-4" />, label: "Deposit", color: "bg-cyan-500/10 text-cyan-500" },
};

const statusConfig = {
  completed: { icon: <CheckCircle2 className="size-3.5" />, label: "Completed", color: "text-green-500" },
  failed: { icon: <XCircle className="size-3.5" />, label: "Failed", color: "text-red-500" },
  pending: { icon: <Clock className="size-3.5" />, label: "Pending", color: "text-yellow-500" },
};

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.04 } },
};

const item = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3, ease: "easeOut" as const } },
};

function ActivityContent() {
  const { data: activity, isLoading } = useActivity();
  const [filter, setFilter] = React.useState<string>("all");

  const filtered = filter === "all" ? activity : activity?.filter((a) => a.type === filter);
  const completedCount = activity?.filter((a) => a.status === "completed").length ?? 0;
  const failedCount = activity?.filter((a) => a.status === "failed").length ?? 0;
  const totalGas = activity?.reduce((sum, a) => sum + a.gasUsed, 0) ?? 0;

  return (
    <AppShell>
      <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
        {/* Header */}
        <motion.div variants={item} className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="font-heading text-2xl font-semibold tracking-tight">Activity</h1>
            <p className="text-sm text-muted-foreground">
              Transaction history and automation logs
            </p>
          </div>
        </motion.div>

        {/* Stats */}
        <motion.div variants={item} className="grid gap-4 sm:grid-cols-4">
          <Card>
            <CardContent className="flex items-center gap-3 ">
              <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10">
                <Activity className="size-4 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total</p>
                <p className="font-heading text-lg font-semibold">{activity?.length ?? 0}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-3 ">
              <div className="flex size-9 items-center justify-center rounded-lg bg-green-500/10">
                <CheckCircle2 className="size-4 text-green-500" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Completed</p>
                <p className="font-heading text-lg font-semibold">{completedCount}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-3 ">
              <div className="flex size-9 items-center justify-center rounded-lg bg-red-500/10">
                <XCircle className="size-4 text-red-500" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Failed</p>
                <p className="font-heading text-lg font-semibold">{failedCount}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-3 ">
              <div className="flex size-9 items-center justify-center rounded-lg bg-muted">
                 <Fuel className="size-4" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Gas Used</p>
                <p className="font-heading text-lg font-semibold">{totalGas.toFixed(4)}</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Filters */}
        <motion.div variants={item} className="flex items-center gap-2">
          <Filter className="size-4 text-muted-foreground" />
          <div className="flex flex-wrap gap-1.5">
            {["all", "swap", "bridge", "approval", "rebalance", "deposit"].map((f) => (
              <Button
                key={f}
                variant={filter === f ? "default" : "outline"}
                size="xs"
                className="h-6 capitalize"
                onClick={() => setFilter(f)}
              >
                {f}
              </Button>
            ))}
          </div>
        </motion.div>

        {/* Activity List */}
        <motion.div variants={item}>
          <SectionCard title="Transaction History" delay={0.1}>
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : (
              <div className="space-y-2">
                {filtered?.map((act) => {
                  const type = typeConfig[act.type as keyof typeof typeConfig];
                  const status = statusConfig[act.status as keyof typeof statusConfig];
                  return (
                    <motion.div
                      key={act.id}
                      variants={item}
                      className="flex items-center gap-3 rounded-lg border p-3 transition-colors hover:bg-muted/50"
                    >
                      <div className={cn("flex size-10 shrink-0 items-center justify-center rounded-full", type.color)}>
                        {type.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium">{act.title}</p>
                          <span className={cn("flex items-center gap-1 text-xs", status.color)}>
                            {status.icon}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground">{act.description}</p>
                        <div className="mt-1 flex items-center gap-3 text-[10px] text-muted-foreground">
                          <span>{act.chain}</span>
                          <span>Gas: {act.gasUsed} ETH</span>
                          <span>{timeAgo(act.timestamp)}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">{act.amount}</p>
                        {act.txHash && (
                          <Button variant="ghost" size="icon-xs" className="mt-1">
                            <ExternalLink className="size-3" />
                          </Button>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </SectionCard>
        </motion.div>
      </motion.div>
    </AppShell>
  );
}

export default function ActivityPage() {
  return <ActivityContent />;
}
