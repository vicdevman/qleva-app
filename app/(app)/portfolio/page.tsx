"use client";

import * as React from "react";
import { motion } from "framer-motion";
import {
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  Wallet,
  ArrowRightLeft,
  Download,
  ExternalLink,
  Briefcase,
} from "lucide-react";
import { AppShell } from "@/components/app/app-shell";
import { SectionCard } from "@/components/shared/section-card";
import { MiniChart, AllocationBar } from "@/components/shared/mini-chart";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { usePortfolio, useActivity } from "@/lib/query-hooks";
import { cn } from "@/lib/utils";

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value);
}

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
};

const item = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: "easeOut" as const } },
};

function PortfolioContent() {
  const { data: portfolio, isLoading } = usePortfolio();
  const { data: activity, isLoading: activityLoading } = useActivity();

  return (
    <AppShell>
      <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
        {/* Header */}
        <motion.div variants={item} className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="font-heading text-2xl font-semibold tracking-tight">Portfolio</h1>
            <p className="text-sm text-muted-foreground">Asset visibility and wallet management</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="gap-2">
              <Download className="size-3.5" />
              Export
            </Button>
            <Button size="sm" className="gap-2">
              <ArrowRightLeft className="size-3.5" />
              Fund Wallet
            </Button>
          </div>
        </motion.div>

        {/* Summary Cards */}
        <motion.div variants={item} className="grid gap-4 sm:grid-cols-3">
          <Card className="bg-linear-to-br from-primary/5 to-transparent">
            <CardContent className="pt-4">
              <p className="text-xs text-muted-foreground">Total Value</p>
              {isLoading ? (
                <Skeleton className="mt-1 h-8 w-32" />
              ) : (
                <p className="font-heading text-2xl font-semibold">
                  {formatCurrency(portfolio?.totalValue ?? 0)}
                </p>
              )}
              {portfolio && (
                <div className="mt-1 flex items-center gap-1">
                  <TrendingUp className="size-3 text-green-500" />
                  <span className="text-xs text-green-500">+{portfolio.dailyChangePercent}%</span>
                </div>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <p className="text-xs text-muted-foreground">Smart Wallet</p>
              <p className="mt-1 font-heading text-2xl font-semibold">{formatCurrency(1280.30)}</p>
              <p className="mt-1 text-xs text-muted-foreground">Base Network</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <p className="text-xs text-muted-foreground">Connected Wallet</p>
              <p className="mt-1 font-heading text-2xl font-semibold">{formatCurrency(2450.75)}</p>
              <p className="mt-1 text-xs text-muted-foreground">MetaMask · Ethereum</p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Charts */}
        <div className="grid gap-4 lg:grid-cols-3">
          <motion.div variants={item} className="lg:col-span-2">
            <SectionCard title="Portfolio Performance" description="Last 30 days" delay={0.1}>
              {isLoading ? (
                <Skeleton className="h-48 w-full rounded-lg" />
              ) : (
                <MiniChart data={portfolio?.portfolioHistory ?? []} height={180} />
              )}
            </SectionCard>
          </motion.div>
          <motion.div variants={item}>
            <SectionCard title="Allocation" delay={0.15}>
              {isLoading ? (
                <Skeleton className="h-40 w-full rounded-lg" />
              ) : (
                <div className="space-y-4">
                  <AllocationBar
                    segments={portfolio?.chainDistribution.map((c) => ({
                      label: c.chain,
                      percent: c.percent,
                      color: c.color,
                    })) ?? []}
                  />
                </div>
              )}
            </SectionCard>
          </motion.div>
        </div>

        {/* Asset Table */}
        <motion.div variants={item}>
          <SectionCard title="Assets" delay={0.2}>
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b text-left text-xs text-muted-foreground">
                      <th className="pb-2 font-medium">Asset</th>
                      <th className="pb-2 font-medium">Balance</th>
                      <th className="pb-2 font-medium">Value</th>
                      <th className="pb-2 font-medium">Allocation</th>
                      <th className="pb-2 font-medium">24h</th>
                    </tr>
                  </thead>
                  <tbody>
                    {portfolio?.topAssets.map((asset) => (
                      <motion.tr
                        key={asset.symbol}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="border-b last:border-0"
                      >
                        <td className="py-3">
                          <div className="flex items-center gap-3">
                            <div className="flex size-8 items-center justify-center rounded-lg bg-muted text-base">
                              {asset.icon}
                            </div>
                            <div>
                              <p className="text-sm font-medium">{asset.symbol}</p>
                              <p className="text-xs text-muted-foreground">{asset.name}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 text-sm">
                          {asset.balance} {asset.symbol}
                        </td>
                        <td className="py-3 text-sm font-medium">{formatCurrency(asset.value)}</td>
                        <td className="py-3">
                          <div className="flex items-center gap-2">
                            <div className="h-1.5 w-16 overflow-hidden rounded-full bg-muted">
                              <motion.div
                                className="h-full rounded-full bg-primary"
                                initial={{ width: 0 }}
                                animate={{ width: `${asset.allocation}%` }}
                                transition={{ duration: 0.6, delay: 0.2 }}
                              />
                            </div>
                            <span className="text-xs text-muted-foreground">{asset.allocation}%</span>
                          </div>
                        </td>
                        <td className="py-3">
                          <span
                            className={cn(
                              "text-xs font-medium",
                              asset.change24h >= 0 ? "text-green-500" : "text-red-500"
                            )}
                          >
                            {asset.change24h >= 0 ? "+" : ""}
                            {asset.change24h}%
                          </span>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </SectionCard>
        </motion.div>

        {/* Recent Transactions */}
        <motion.div variants={item}>
          <SectionCard title="Recent Transactions" delay={0.25}>
            {activityLoading ? (
              <div className="space-y-3">
                {[1, 2, 3, 4].map((i) => (
                  <Skeleton key={i} className="h-14 w-full" />
                ))}
              </div>
            ) : (
              <div className="space-y-2">
                {activity?.slice(0, 5).map((act) => (
                  <div
                    key={act.id}
                    className="flex items-center gap-3 rounded-lg border p-3 transition-colors hover:bg-muted/50"
                  >
                    <div
                      className={cn(
                        "flex size-9 shrink-0 items-center justify-center rounded-full",
                        act.status === "completed"
                          ? "bg-green-500/10 text-green-500"
                          : "bg-red-500/10 text-red-500"
                      )}
                    >
                      {act.status === "completed" ? (
                        <ArrowUpRight className="size-4" />
                      ) : (
                        <ArrowDownRight className="size-4" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{act.title}</p>
                      <p className="text-xs text-muted-foreground">{act.description}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">{act.amount}</p>
                      <p className="text-xs text-muted-foreground">{act.chain}</p>
                    </div>
                    {act.txHash && (
                      <Button variant="ghost" size="icon-xs">
                        <ExternalLink className="size-3" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </SectionCard>
        </motion.div>
      </motion.div>
    </AppShell>
  );
}

export default function PortfolioPage() {
  return <PortfolioContent />;
}
