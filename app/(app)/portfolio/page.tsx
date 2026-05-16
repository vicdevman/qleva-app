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
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
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

const chartDataMap = {
  "24H": [
    { time: "00:00", value: 3400 },
    { time: "04:00", value: 3450 },
    { time: "08:00", value: 3420 },
    { time: "12:00", value: 3600 },
    { time: "16:00", value: 3580 },
    { time: "20:00", value: 3731 },
  ],
  "30D": [
    { time: "Week 1", value: 3100 },
    { time: "Week 2", value: 3300 },
    { time: "Week 3", value: 3200 },
    { time: "Week 4", value: 3731 },
  ],
  "Months": [
    { time: "Jan", value: 2100 },
    { time: "Feb", value: 2500 },
    { time: "Mar", value: 2800 },
    { time: "Apr", value: 3100 },
    { time: "May", value: 3731 },
  ],
  "Years": [
    { time: "2023", value: 1200 },
    { time: "2024", value: 3731 },
  ]
};

const chartConfig = {
  value: {
    label: "Portfolio Value",
    color: "hsl(var(--primary))",
  },
} satisfies ChartConfig;

function PortfolioContent() {
  const { data: portfolio, isLoading } = usePortfolio();
  const { data: activity, isLoading: activityLoading } = useActivity();
  const [chartFilter, setChartFilter] = React.useState("30D");

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
            <CardContent className="flex flex-col gap-1">
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
            <CardContent className="flex flex-col gap-1">
              <p className="text-xs text-muted-foreground">Smart Wallet</p>
              <p className="mt-1 font-heading text-2xl font-semibold">{formatCurrency(1280.30)}</p>
              <p className="mt-1 text-xs text-muted-foreground">Base Network</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex flex-col gap-1">
              <p className="text-xs text-muted-foreground">Connected Wallet</p>
              <p className="mt-1 font-heading text-2xl font-semibold">{formatCurrency(2450.75)}</p>
              <p className="mt-1 text-xs text-muted-foreground">MetaMask · Ethereum</p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Charts */}
        <div className="grid gap-4 lg:grid-cols-3">
          <motion.div variants={item} className="lg:col-span-2">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div className="space-y-1">
                  <CardTitle>Portfolio Performance</CardTitle>
                  <CardDescription>Historical value</CardDescription>
                </div>
                <div className="flex gap-1 bg-muted/50 p-1 rounded-lg">
                  {["24H", "30D", "Months", "Years"].map((period) => (
                    <Button
                      key={period}
                      variant={chartFilter === period ? "secondary" : "ghost"}
                      size="sm"
                      className="h-7 text-xs px-2"
                      onClick={() => setChartFilter(period)}
                    >
                      {period}
                    </Button>
                  ))}
                </div>
              </CardHeader>
              <CardContent>
                <ChartContainer config={chartConfig} className="h-[200px] w-full">
                  <AreaChart
                    accessibilityLayer
                    data={chartDataMap[chartFilter as keyof typeof chartDataMap]}
                    margin={{
                      left: 0,
                      right: 0,
                      top: 10,
                      bottom: 0,
                    }}
                  >
                    <defs>
                      <linearGradient id="fillValue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--chart-3)" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="var(--chart-4)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid vertical={false} strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis
                      dataKey="time"
                      tickLine={false}
                      axisLine={false}
                      tickMargin={8}
                      className="text-xs text-muted-foreground"
                    />
                    <ChartTooltip
                      cursor={false}
                      content={<ChartTooltipContent indicator="dot" hideLabel />}
                    />
                    <Area
                      dataKey="value"
                      type="monotone"
                      fill="url(#fillValue)"
                      stroke="var(--color-value)"
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ChartContainer>
              </CardContent>
            </Card>
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

        {/* Assets & Activity Tabs */}
        <motion.div variants={item} className="mt-4">
          <Tabs defaultValue="assets" className="w-full">
            <div className="flex items-center justify-between mb-4">
              <TabsList>
                <TabsTrigger value="assets">Assets</TabsTrigger>
                <TabsTrigger value="transactions">Recent Transactions</TabsTrigger>
              </TabsList>
            </div>
            
            <TabsContent value="assets" className="m-0 border-none p-0 outline-none">
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
            </TabsContent>

            <TabsContent value="transactions" className="m-0 border-none p-0 outline-none">
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
            </TabsContent>
          </Tabs>
        </motion.div>
      </motion.div>
    </AppShell>
  );
}

export default function PortfolioPage() {
  return <PortfolioContent />;
}
