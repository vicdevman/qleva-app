"use client";

import * as React from "react";
import { motion } from "framer-motion";
import {
  Wallet,
  ArrowDownRight,
  ArrowUpRight,
  Shield,
  Link2,
  Unlink,
  Copy,
  ExternalLink,
  ChevronRight,
  Zap,
  CheckCircle2,
} from "lucide-react";
import { AppShell } from "@/components/app/app-shell";
import { SectionCard } from "@/components/shared/section-card";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useWalletStore } from "@/stores/wallet-store";
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

function WalletRelationshipVisualizer() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="flex flex-col items-center gap-2 py-6"
    >
      {/* Personal Wallet */}
      <div className="flex items-center gap-3 rounded-xl border bg-muted/50 px-4 py-3">
        <div className="flex size-10 items-center justify-center rounded-full bg-blue-500/10">
          <Wallet className="size-5 text-blue-500" />
        </div>
        <div>
          <p className="text-sm font-medium">Personal Wallet</p>
          <p className="text-xs text-muted-foreground">MetaMask · 0x7a2B...4f9E</p>
        </div>
        <div className="ml-4 text-right">
          <p className="text-sm font-semibold">{formatCurrency(2450.75)}</p>
          <p className="text-[10px] text-muted-foreground">Funding & Withdrawals</p>
        </div>
      </div>

      {/* Arrow Down */}
      <div className="flex flex-col items-center">
        <div className="h-6 w-px bg-border" />
        <div className="flex items-center gap-1 rounded-full border bg-background px-2 py-0.5">
          <ArrowDownRight className="size-3 text-muted-foreground" />
          <span className="text-[10px] text-muted-foreground">Deposit</span>
        </div>
        <div className="h-6 w-px bg-border" />
      </div>

      {/* Smart Wallet */}
      <div className="flex items-center gap-3 rounded-xl border-2 border-primary/30 bg-primary/5 px-4 py-3">
        <div className="flex size-10 items-center justify-center rounded-full bg-primary/10">
          <Zap className="size-5 text-primary" />
        </div>
        <div>
          <p className="text-sm font-medium">Qleva Smart Wallet</p>
          <p className="text-xs text-muted-foreground">Smart Contract · 0x3e8C...1a2B</p>
        </div>
        <div className="ml-4 text-right">
          <p className="text-sm font-semibold">{formatCurrency(1280.30)}</p>
          <p className="text-[10px] text-muted-foreground">Automation Execution</p>
        </div>
      </div>

      {/* Arrow Down */}
      <div className="flex flex-col items-center">
        <div className="h-6 w-px bg-border" />
        <div className="flex items-center gap-1 rounded-full border bg-background px-2 py-0.5">
          <Zap className="size-3 text-primary" />
          <span className="text-[10px] text-muted-foreground">Automated Actions</span>
        </div>
        <div className="h-6 w-px bg-border" />
      </div>

      {/* Actions */}
      <div className="flex flex-wrap justify-center gap-2">
        {["Swap", "Bridge", "DCA", "Rebalance"].map((action) => (
          <Badge key={action} variant="outline" className="gap-1 px-3 py-1">
            <CheckCircle2 className="size-3 text-green-500" />
            {action}
          </Badge>
        ))}
      </div>
    </motion.div>
  );
}

function WalletsContent() {
  const { wallets, selectedWalletId, selectWallet } = useWalletStore();

  return (
    <AppShell>
      <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
        {/* Header */}
        <motion.div variants={item} className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="font-heading text-2xl font-semibold tracking-tight">Wallets</h1>
            <p className="text-sm text-muted-foreground">
              Manage wallet relationships and funding flows
            </p>
          </div>
          <Button size="lg" className="gap-2">
            <Link2 className="size-3.5" />
            Connect Wallet
          </Button>
        </motion.div>

        {/* Wallet Relationship Visualizer */}
        <motion.div variants={item}>
          <SectionCard
            title="Wallet Architecture"
            description="How your wallets work together"
            delay={0.1}
          >
            <WalletRelationshipVisualizer />
          </SectionCard>
        </motion.div>

        {/* Wallet Cards */}
        <div className="grid gap-4 md:grid-cols-2">
          {wallets.map((wallet, i) => (
            <motion.div key={wallet.id} variants={item} custom={i}>
              <Card
                className={cn(
                  "cursor-pointer transition-all hover:shadow-md",
                  selectedWalletId === wallet.id && "border-primary ring-1 ring-primary/20"
                )}
                onClick={() => selectWallet(wallet.id)}
              >
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className="flex size-10 items-center justify-center rounded-lg"
                        style={{ backgroundColor: `${wallet.chainColor}15` }}
                      >
                        <Wallet className="size-5" style={{ color: wallet.chainColor }} />
                      </div>
                      <div>
                        <p className="text-sm font-semibold">{wallet.name}</p>
                        <p className="text-xs text-muted-foreground">{wallet.address}</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-end justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground">Balance</p>
                      <p className="font-heading text-2xl font-semibold">
                        {formatCurrency(wallet.balance)}
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span
                        className="size-2 rounded-full"
                        style={{ backgroundColor: wallet.chainColor }}
                      />
                      <span className="text-xs text-muted-foreground">{wallet.chain}</span>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    {wallet.type === "connected" ? (
                      <>
                        <Button variant="outline" size="lg" className="flex-1 gap-1.5">
                          <ArrowDownRight className="size-3.5" />
                          Fund lgart Wallet
                        </Button>
                        <Button variant="ghost" size="lg" className="gap-1.5">
                          <Copy className="size-3.5" />
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button variant="outline" size="lg" className="flex-1 gap-1.5">
                          <ArrowUpRight className="size-3.5" />
                          Withdraw
                        </Button>
                        <Button variant="ghost" size="lg" className="gap-1.5">
                          <ExternalLink className="size-3.5" />
                        </Button>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Permissions */}
        <motion.div variants={item}>
          <SectionCard title="Permissions & Approvals" delay={0.3}>
            <div className="space-y-3">
              {[
                { token: "USDC", spender: "Qleva Smart Wallet", amount: "Unlimited", chain: "Base" },
                { token: "ETH", spender: "Qleva Smart Wallet", amount: "Unlimited", chain: "Base" },
                { token: "USDC", spender: "Bridge Contract", amount: "$1,000/day", chain: "Base" },
              ].map((perm, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div className="flex items-center gap-3">
                    <Shield className="size-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">{perm.token}</p>
                      <p className="text-xs text-muted-foreground">
                        {perm.spender} · {perm.chain}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-[10px]">
                      {perm.amount}
                    </Badge>
                    <Button variant="ghost" size="xs" className="h-6 text-destructive">
                      Revoke
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </SectionCard>
        </motion.div>
      </motion.div>
    </AppShell>
  );
}

export default function WalletsPage() {
  return <WalletsContent />;
}
