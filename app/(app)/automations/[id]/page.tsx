"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Clock,
  Play,
  Pause,
  Trash2,
  ExternalLink,
  Calendar,
  ShieldAlert,
  CheckCircle2,
  XCircle,
  Loader2,
  Copy,
  Check,
} from "lucide-react";
import { AppShell } from "@/components/app/app-shell";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAutomation, useAutomationExecutions, useToggleAutomationStatus, useDeleteAutomation } from "@/lib/query-hooks";
import { cn, getFriendlyScheduleDescription } from "@/lib/utils";

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(value);
}

function formatDate(dateStr?: string | null) {
  if (!dateStr) return "Never";
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const TokenBadge = ({ tokenInfo }: { tokenInfo: any }) => {
  if (!tokenInfo) return null;
  const symbol = tokenInfo.symbol || "USDC";
  const address = tokenInfo.contractAddress || "";
  const logoUrl = tokenInfo.logoUrl || (symbol === "ETH"
    ? "https://dd.dexscreener.com/ds-data/tokens/base/0x4200000000000000000000000000000000000006.png"
    : symbol === "USDC"
      ? "https://dd.dexscreener.com/ds-data/tokens/base/0x833589fcd6edb6e08f4c7c32d4f71b54bda02913.png"
      : "/Base_square_blue.png");

  const url = address ? `https://dexscreener.com/base/${address}` : `https://dexscreener.com/search?q=${symbol}`;

  return (
    <span className="inline-flex items-center gap-1.5 bg-muted/50 border border-border px-2.5 py-1 rounded-md">
      {logoUrl && (
        <img
          src={logoUrl}
          alt=""
          className="size-4 rounded-full object-cover border border-white/5"
          onError={(e) => {
            (e.target as HTMLImageElement).src = "/Base_square_blue.png";
          }}
        />
      )}
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="underline decoration-dotted underline-offset-4 hover:text-primary transition-colors font-medium text-xs text-foreground cursor-pointer"
      >
        {symbol}
      </a>
    </span>
  );
};

export default function AutomationDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const { data: automation, isLoading: isAutoLoading } = useAutomation(id);
  const { data: executions, isLoading: isExecsLoading } = useAutomationExecutions(id);
  const toggleMutation = useToggleAutomationStatus();
  const deleteMutation = useDeleteAutomation();

  const [copied, setCopied] = React.useState(false);

  const handleCopyId = () => {
    navigator.clipboard.writeText(id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (isAutoLoading) {
    return (
      <AppShell>
        <div className="space-y-6 pb-12">
          <Skeleton className="h-6 w-32" />
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-5 space-y-6">
              <Skeleton className="h-[400px] w-full rounded-xl" />
            </div>
            <div className="lg:col-span-7 space-y-6">
              <Skeleton className="h-[400px] w-full rounded-xl" />
            </div>
          </div>
        </div>
      </AppShell>
    );
  }

  if (!automation) {
    return (
      <AppShell>
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <ShieldAlert className="size-12 text-destructive mb-4" />
          <h2 className="text-xl font-bold">Automation not found</h2>
          <p className="text-muted-foreground mt-2">The requested automation strategy does not exist or has been deleted.</p>
          <Button className="mt-6 gap-2" onClick={() => router.push("/automations")}>
            <ArrowLeft className="size-4" /> Back to Automations
          </Button>
        </div>
      </AppShell>
    );
  }

  const isActive = automation.status === "active";
  const isSchedule = automation.trigger?.type === "schedule";
  const config = automation.trigger?.config || {};
  const fromTokenInfo = config.fromTokenInfo || { symbol: config.fromToken || "USDC" };
  const toTokenInfo = config.toTokenInfo || { symbol: config.toToken || "ETH" };

  const handleToggle = () => {
    const nextStatus = isActive ? "paused" : "active";
    toggleMutation.mutate({ id, status: nextStatus });
  };

  const handleDelete = () => {
    if (confirm("Are you sure you want to delete this automation?")) {
      deleteMutation.mutate(id, {
        onSuccess: () => {
          router.push("/automations");
        }
      });
    }
  };

  return (
    <AppShell>
      <div className="space-y-6 pb-12">
        {/* Back navigation & header */}
        <div className="flex flex-col gap-4">
          <button
            onClick={() => router.push("/automations")}
            className="flex items-center gap-2 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors max-w-fit"
          >
            <ArrowLeft className="size-3.5" /> Back to Automations
          </button>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <span className="flex items-center gap-3 flex-wrap">
                <h1 className="font-heading text-2xl font-bold tracking-tight">
                  {isSchedule ? "Recurring Buy Strategy" : "Price Condition Trigger"}
                </h1>
                <Badge
                  variant={isActive ? "default" : "secondary"}
                  className={cn(
                    "text-xs px-2.5 py-0.5 capitalize",
                    isActive ? "bg-green-500/10 text-green-500 border border-green-500/20" : "bg-muted text-muted-foreground border"
                  )}
                >
                  {automation.status}
                </Badge>
              </span>
              {/* <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                {automation.humanReadable || "Automated strategy co-pilot execution"}
              </p> */}
            </div>
          </div>
        </div>

        {/* Dual-column content */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Strategy Info */}
          <div className="lg:col-span-6 space-y-6">
            <Card className="bg-card/40 border-border backdrop-blur-md overflow-hidden">
              <CardContent className="space-y-6">
                <div>
                  <h3 className="font-heading text-md font-semibold mb-4 text-foreground/80">Strategy Information</h3>

                  <div className="space-y-4">
                    {/* ID */}
                    {/* <div className="flex justify-between items-center text-sm border-b border-border/40 pb-3">
                      <span className="text-muted-foreground">Automation ID</span>
                      <span className="font-mono text-xs text-foreground flex items-center gap-1.5">
                        {automation.id}
                        <button
                          onClick={handleCopyId}
                          className="hover:text-primary transition-colors text-muted-foreground"
                          title="Copy ID"
                        >
                          {copied ? <Check className="size-3.5 text-green-500" /> : <Copy className="size-3.5" />}
                        </button>
                      </span>
                    </div> */}

                    {/* Strategy type */}
                    <div className="flex justify-between items-center text-sm border-b border-border/40 pb-3">
                      <span className="text-muted-foreground">Strategy Type</span>
                      <span className="font-medium capitalize">
                        {isSchedule
                          ? (config.schedule?.mode === "once" ? "One-Time Scheduled Swap" : "Recurring Swap Strategy")
                          : "Price Limit Trigger"
                        }
                      </span>
                    </div>

                    {/* Tokens */}
                    <div className="flex justify-between items-center text-sm border-b border-border/40 pb-3">
                      <span className="text-muted-foreground">Token Path</span>
                      <span className="flex items-center gap-1.5">
                        <TokenBadge tokenInfo={fromTokenInfo} />
                        <span className="text-muted-foreground text-xs font-semibold">➔</span>
                        <TokenBadge tokenInfo={toTokenInfo} />
                      </span>
                    </div>

                    {/* Amount */}
                    <div className="flex justify-between items-center text-sm border-b border-border/40 pb-3">
                      <span className="text-muted-foreground">Execution Trade Size</span>
                      <span className="font-semibold text-emerald-500">{formatCurrency(config.amountUsd || 10)}</span>
                    </div>

                    {/* Specific details */}
                    {isSchedule ? (
                      <div className="flex justify-between items-center text-sm border-b border-border/40 pb-3">
                        <span className="text-muted-foreground">Schedule</span>
                        <span className="font-medium capitalize">
                          {getFriendlyScheduleDescription(config.schedule, config.frequency, config.startDateText)}
                        </span>
                      </div>
                    ) : (
                      <>
                        <div className="flex justify-between items-center text-sm border-b border-border/40 pb-3">
                          <span className="text-muted-foreground">Trigger Condition</span>
                          <span className="font-medium text-right capitalize">
                            {config.conditionType?.split("_").join(" ")} ${config.targetValue}
                          </span>
                        </div>
                      </>
                    )}

                    {/* Created At */}
                    <div className="flex justify-between items-center text-sm border-b border-border/40 pb-3">
                      <span className="text-muted-foreground">Created Date</span>
                      <span className="font-medium">{formatDate(automation.createdAt)}</span>
                    </div>

                    {/* Next Run */}
                    <div className="flex justify-between items-center text-sm border-b border-border/40 pb-3">
                      <span className="text-muted-foreground">Next Scheduled Execution</span>
                      <span className="font-medium flex items-center gap-1.5">
                        <Clock className="size-3.5 text-primary" />
                        {isActive ? (automation.execution?.nextExecutionAt ? formatDate(automation.execution.nextExecutionAt) : "Not scheduled") : "Paused"}
                      </span>
                    </div>

                    {/* Ends At */}
                    <div className="flex justify-between items-center text-sm pb-1">
                      <span className="text-muted-foreground">Expiration Date</span>
                      <span className="font-medium flex items-center gap-1.5">
                        <Calendar className="size-3.5 text-muted-foreground" />
                        {config.schedule?.mode === "once" ? "After execution" : formatDate(automation.execution?.expiresAt)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Permissions bounds box */}
                <div className="bg-muted/40 border border-border/60 p-4 rounded-xl space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-foreground/70">Qleva Co-Pilot Spend Permissions</h4>
                  <ul className="text-xs space-y-2 text-muted-foreground list-disc pl-4">
                    <li>Smart wallet account authorized for automated swaps</li>
                    <li>Spend allowance capped strictly at <span className="text-foreground font-medium">{formatCurrency(config.amountUsd || 10)}</span> per execution</li>
                    <li>Cooldown limits set to prevent duplicate frontrunning executions</li>
                    <li>Permission period valid until <span className="text-foreground font-medium">{formatDate(automation.execution?.expiresAt)}</span></li>
                  </ul>
                </div>

                {/* Operations Buttons */}
                <div className="flex gap-3 pt-2">
                  <Button
                    size="lg"
                    variant="outline"
                    className="flex-1 h-10 text-xs font-bold border-white/10 hover:bg-white/5"
                    onClick={handleToggle}
                    disabled={toggleMutation.isPending}
                  >
                    {isActive ? <Pause className="size-4 mr-2" /> : <Play className="size-4 mr-2" />}
                    {isActive ? "Pause Automation" : "Activate Automation"}
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    className="flex-1 h-10 text-xs font-bold border-red-500/20 text-red-500 hover:bg-red-500/10 hover:text-red-400"
                    onClick={handleDelete}
                    disabled={deleteMutation.isPending}
                  >
                    <Trash2 className="size-4 mr-2" />
                    Delete Automation
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column: Execution History */}
          <div className="lg:col-span-6 space-y-6">
            <Card className="bg-card/40 border-border backdrop-blur-md overflow-hidden">
              <CardContent className="">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="font-heading text-sm font-semibold text-foreground/80">Execution Run History</h3>
                  <Badge variant="outline" className="text-xs font-semibold px-2 py-0.5">
                    {executions?.length || 0} Runs
                  </Badge>
                </div>

                {isExecsLoading ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                      <Skeleton key={i} className="h-16 w-full rounded-lg" />
                    ))}
                  </div>
                ) : !executions || executions.length === 0 ? (
                  <div className="text-center py-16 px-2 border border-dashed rounded-xl border-muted-foreground/10 text-muted-foreground text-sm">
                    No execution records found. Once trigger parameters are met, runs will appear here automatically.
                  </div>
                ) : (
                  <div className="space-y-4 max-h-[600px] overflow-y-auto pr-1">
                    {executions.map((exec: any) => {
                      const isCompleted = exec.status === "completed";
                      const isFailed = exec.status === "failed";
                      const isExecuting = exec.status === "executing";

                      const chainId = automation.permission?.chainId || 84532;
                      const explorerUrl = chainId === 8453
                        ? `https://basescan.org/tx/${exec.txHash}`
                        : `https://sepolia.basescan.org/tx/${exec.txHash}`;

                      return (
                        <div
                          key={exec.id}
                          className="flex flex-col border border-border/50 bg-background/30 rounded-xl p-4 space-y-3"
                        >
                          <div className="flex justify-between items-start gap-4">
                            <div className="flex items-center gap-3">
                              {isCompleted && <CheckCircle2 className="size-5 text-green-500" />}
                              {isFailed && <XCircle className="size-5 text-red-500" />}
                              {isExecuting && <Loader2 className="size-5 text-blue-500 animate-spin" />}

                              <div>
                                <span className="flex items-center gap-2">
                                  <span className="font-semibold text-sm capitalize">Run {exec.attempts}</span>
                                  <Badge
                                    variant="outline"
                                    className={cn(
                                      "text-[9px] px-1.5 h-4 font-semibold tracking-tight uppercase",
                                      isCompleted && "border-green-500/30 text-green-500 bg-green-500/5",
                                      isFailed && "border-red-500/30 text-red-500 bg-red-500/5",
                                      isExecuting && "border-blue-500/30 text-blue-500 bg-blue-500/5"
                                    )}
                                  >
                                    {exec.status}
                                  </Badge>
                                </span>
                                <p className="text-xs text-muted-foreground mt-0.5">
                                  {formatDate(exec.finishedAt || exec.startedAt || exec.createdAt)}
                                </p>
                              </div>
                            </div>

                            <div className="text-right">
                              <p className="text-sm font-semibold text-emerald-500">
                                {formatCurrency(config.amountUsd || 10)}
                              </p>
                              <p className="text-[10px] text-muted-foreground uppercase font-medium mt-0.5">
                                Trade Size
                              </p>
                            </div>
                          </div>

                          {exec.txHash && (
                            <div className="flex justify-between items-center text-xs bg-muted/20 p-2.5 rounded-lg border border-border/40">
                              <span className="text-muted-foreground">Tx Hash</span>
                              <a
                                href={explorerUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="font-mono text-primary flex items-center gap-1 hover:underline text-[11px]"
                              >
                                {exec.txHash.slice(0, 10)}...{exec.txHash.slice(-8)}
                                <ExternalLink className="size-3" />
                              </a>
                            </div>
                          )}

                          {exec.error && (
                            <div className="text-xs text-red-500/80 bg-red-500/5 border border-red-500/10 p-3 rounded-lg flex items-start gap-2">
                              <ShieldAlert className="size-4 shrink-0 mt-0.5" />
                              <span>{exec.error}</span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
