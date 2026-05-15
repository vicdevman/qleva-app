"use client";

import * as React from "react";
import { motion } from "framer-motion";
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  Zap,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
  Brain,
  BarChart3,
  Fuel,
  Repeat,
  ExternalLink,
} from "lucide-react";
import { AppShell } from "@/components/app/app-shell";
import { SectionCard } from "@/components/shared/section-card";
import { MiniChart, AllocationBar } from "@/components/shared/mini-chart";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { usePortfolio, useAutomations, useAiSuggestions, useMarketSnapshot, useActivity } from "@/lib/query-hooks";
import { cn } from "@/lib/utils";

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value);
}

function formatCompact(value: number) {
  if (value >= 1000) return `$${(value / 1000).toFixed(1)}k`;
  return formatCurrency(value);
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
};

const item = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: "easeOut" as const } },
};

function DashboardContent() {
  const { data: portfolio, isLoading: portfolioLoading } = usePortfolio();
  const { data: automations, isLoading: automationsLoading } = useAutomations();
  const { data: suggestions, isLoading: suggestionsLoading } = useAiSuggestions();
  const { data: market, isLoading: marketLoading } = useMarketSnapshot();
  const { data: activity, isLoading: activityLoading } = useActivity();

  const activeAutomations = automations?.filter((a) => a.status === "active").length ?? 0;
  const recentActivity = activity?.slice(0, 5) ?? [];

  return (
    <AppShell>
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="space-y-6"
      >
        {/* Page Header */}
        <motion.div variants={item} className="flex flex-col gap-1">
          <h1 className="font-heading text-2xl font-semibold tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Your financial overview and automation status
          </p>
        </motion.div>

        {/* Balance Cards Row */}
        <motion.div variants={item} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {/* Total Portfolio */}
          <Card className="relative overflow-hidden border-primary/20 bg-linear-to-br from-primary/5 to-transparent">
            <CardContent className="pt-4">
              <div className="flex items-center gap-2 text-muted-foreground">
                <BarChart3 className="size-4" />
                <span className="text-xs font-medium">Total Portfolio</span>
              </div>
              {portfolioLoading ? (
                <Skeleton className="mt-2 h-8 w-32" />
              ) : (
                <p className="mt-1 font-heading text-2xl font-semibold">
                  {formatCurrency(portfolio?.totalValue ?? 0)}
                </p>
              )}
              {portfolio && (
                <div className="mt-1 flex items-center gap-1">
                  <TrendingUp className="size-3 text-green-500" />
                  <span className="text-xs font-medium text-green-500">
                    +{formatCurrency(portfolio.dailyChange)} ({portfolio.dailyChangePercent}%)
                  </span>
                  <span className="text-xs text-muted-foreground">today</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Smart Wallet */}
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Zap className="size-4" />
                <span className="text-xs font-medium">Smart Wallet</span>
              </div>
              {portfolioLoading ? (
                <Skeleton className="mt-2 h-8 w-28" />
              ) : (
                <p className="mt-1 font-heading text-2xl font-semibold">
                  {formatCurrency(1280.30)}
                </p>
              )}
              <p className="mt-1 text-xs text-muted-foreground">Base Network</p>
            </CardContent>
          </Card>

          {/* Connected Wallet */}
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Wallet className="size-4" />
                <span className="text-xs font-medium">Connected Wallet</span>
              </div>
              {portfolioLoading ? (
                <Skeleton className="mt-2 h-8 w-28" />
              ) : (
                <p className="mt-1 font-heading text-2xl font-semibold">
                  {formatCurrency(2450.75)}
                </p>
              )}
              <p className="mt-1 text-xs text-muted-foreground">MetaMask · Ethereum</p>
            </CardContent>
          </Card>

          {/* Active Automations */}
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Activity className="size-4" />
                <span className="text-xs font-medium">Active Automations</span>
              </div>
              {automationsLoading ? (
                <Skeleton className="mt-2 h-8 w-16" />
              ) : (
                <p className="mt-1 font-heading text-2xl font-semibold">{activeAutomations}</p>
              )}
              <p className="mt-1 text-xs text-muted-foreground">
                {automations?.length ?? 0} total configured
              </p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Charts Row */}
        <div className="grid gap-4 lg:grid-cols-3">
          {/* Portfolio Chart */}
          <motion.div variants={item} className="lg:col-span-2">
            <SectionCard
              title="Portfolio Performance"
              description="Last 14 days"
              delay={0.1}
            >
              {portfolioLoading ? (
                <Skeleton className="h-40 w-full rounded-lg" />
              ) : (
                <div className="space-y-3">
                  <MiniChart
                    data={portfolio?.portfolioHistory ?? []}
                    color="hsl(var(--chart-1))"
                    height={140}
                  />
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span>7d</span>
                    <span>14d</span>
                    <span className="text-foreground">30d</span>
                    <span>90d</span>
                    <span>All</span>
                  </div>
                </div>
              )}
            </SectionCard>
          </motion.div>

          {/* Chain Distribution */}
          <motion.div variants={item}>
            <SectionCard title="Chain Distribution" delay={0.15}>
              {portfolioLoading ? (
                <Skeleton className="h-32 w-full rounded-lg" />
              ) : (
                <div className="space-y-4">
                  <AllocationBar
                    segments={portfolio?.chainDistribution.map((c) => ({
                      label: c.chain,
                      percent: c.percent,
                      color: c.color,
                    })) ?? []}
                  />
                  <div className="space-y-2">
                    {portfolio?.chainDistribution.map((chain) => (
                      <div key={chain.chain} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span
                            className="size-2.5 rounded-full"
                            style={{ backgroundColor: chain.color }}
                          />
                          <span className="text-sm">{chain.chain}</span>
                        </div>
                        <span className="text-sm font-medium">{formatCompact(chain.value)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </SectionCard>
          </motion.div>
        </div>

        {/* Middle Row */}
        <div className="grid gap-4 lg:grid-cols-3">
          {/* Top Assets */}
          <motion.div variants={item}>
            <SectionCard title="Top Assets" delay={0.2}>
              {portfolioLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-10 w-full" />
                  ))}
                </div>
              ) : (
                <div className="space-y-3">
                  {portfolio?.topAssets.map((asset) => (
                    <div key={asset.symbol} className="flex items-center gap-3">
                      <div className="flex size-9 items-center justify-center rounded-lg bg-muted text-lg">
                        {asset.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">{asset.symbol}</span>
                          <span className="text-sm font-medium">{formatCurrency(asset.value)}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-muted-foreground">
                            {asset.balance} {asset.symbol}
                          </span>
                          <span
                            className={cn(
                              "text-xs",
                              asset.change24h >= 0 ? "text-green-500" : "text-red-500"
                            )}
                          >
                            {asset.change24h >= 0 ? "+" : ""}
                            {asset.change24h}%
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </SectionCard>
          </motion.div>

          {/* Recent Activity */}
          <motion.div variants={item}>
            <SectionCard title="Recent Activity" delay={0.25}>
              {activityLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3, 4].map((i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : (
                <div className="space-y-2">
                  {recentActivity.map((act) => (
                    <div
                      key={act.id}
                      className="flex items-center gap-3 rounded-lg p-2 transition-colors hover:bg-muted/50"
                    >
                      <div
                        className={cn(
                          "flex size-8 shrink-0 items-center justify-center rounded-full",
                          act.status === "completed"
                            ? "bg-green-500/10 text-green-500"
                            : act.status === "failed"
                            ? "bg-red-500/10 text-red-500"
                            : "bg-yellow-500/10 text-yellow-500"
                        )}
                      >
                        {act.status === "completed" ? (
                          <ArrowUpRight className="size-3.5" />
                        ) : act.status === "failed" ? (
                          <ArrowDownRight className="size-3.5" />
                        ) : (
                          <Activity className="size-3.5" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="truncate text-sm font-medium">{act.title}</p>
                        <p className="text-xs text-muted-foreground">{timeAgo(act.timestamp)}</p>
                      </div>
                      <span className="shrink-0 text-xs font-medium">{act.amount}</span>
                    </div>
                  ))}
                </div>
              )}
            </SectionCard>
          </motion.div>

          {/* AI Suggestions */}
          <motion.div variants={item}>
            <SectionCard
              title="AI Insights"
              description="Personalized suggestions"
              delay={0.3}
            >
              {suggestionsLoading ? (
                <div className="space-y-3">
                  {[1, 2].map((i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : (
                <div className="space-y-3">
                  {suggestions?.slice(0, 3).map((s) => (
                    <div
                      key={s.id}
                      className="rounded-lg border bg-muted/30 p-3 transition-colors hover:bg-muted/50"
                    >
                      <div className="flex items-start gap-2">
                        <Brain className="mt-0.5 size-4 shrink-0 text-primary" />
                        <div className="space-y-1">
                          <p className="text-sm font-medium">{s.title}</p>
                          <p className="text-xs text-muted-foreground">{s.description}</p>
                          <Button variant="link" size="xs" className="h-auto p-0 text-xs">
                            {s.action} →
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </SectionCard>
          </motion.div>
        </div>

        {/* Bottom Row */}
        <div className="grid gap-4 lg:grid-cols-2">
          {/* Market Snapshot */}
          <motion.div variants={item}>
            <SectionCard title="Market Snapshot" delay={0.35}>
              {marketLoading ? (
                <div className="flex gap-4">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-20 flex-1" />
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-3">
                  {market?.map((m) => (
                    <div key={m.symbol} className="rounded-lg border bg-muted/30 p-3 text-center">
                      <div className="text-2xl">{m.icon}</div>
                      <p className="mt-1 text-sm font-medium">{m.symbol}</p>
                      <p className="text-sm font-semibold">{formatCurrency(m.price)}</p>
                      <p
                        className={cn(
                          "text-xs",
                          m.change24h >= 0 ? "text-green-500" : "text-red-500"
                        )}
                      >
                        {m.change24h >= 0 ? "+" : ""}
                        {m.change24h}%
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </SectionCard>
          </motion.div>

          {/* Automation Stats */}
          <motion.div variants={item}>
            <SectionCard title="Automation Stats" delay={0.4}>
              {automationsLoading ? (
                <div className="grid grid-cols-2 gap-3">
                  {[1, 2, 3, 4].map((i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-lg border bg-muted/30 p-3">
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <Repeat className="size-3" />
                      <span className="text-xs">Total Executions</span>
                    </div>
                    <p className="mt-1 font-heading text-xl font-semibold">
                      {automations?.reduce((sum, a) => sum + a.totalExecutions, 0) ?? 0}
                    </p>
                  </div>
                  <div className="rounded-lg border bg-muted/30 p-3">
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <TrendingUp className="size-3" />
                      <span className="text-xs">Success Rate</span>
                    </div>
                    <p className="mt-1 font-heading text-xl font-semibold">94%</p>
                  </div>
                  <div className="rounded-lg border bg-muted/30 p-3">
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <BarChart3 className="size-3" />
                      <span className="text-xs">Total Volume</span>
                    </div>
                    <p className="mt-1 font-heading text-xl font-semibold">
                      {formatCompact(automations?.reduce((sum, a) => sum + a.totalVolume, 0) ?? 0)}
                    </p>
                  </div>
                  <div className="rounded-lg border bg-muted/30 p-3">
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <Fuel className="size-3" />
                      <span className="text-xs">Gas Used</span>
                    </div>
                    <p className="mt-1 font-heading text-xl font-semibold">
                      {automations?.reduce((sum, a) => sum + a.gasUsed, 0).toFixed(4)} ETH
                    </p>
                  </div>
                </div>
              )}
            </SectionCard>
          </motion.div>
        </div>
      </motion.div>
    </AppShell>
  );
}

export default function DashboardPage() {
  return <DashboardContent />;
}
