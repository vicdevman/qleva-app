"use client";
import React, { useState, useEffect } from "react";
import { getLivePortfolio, ProviderType, UnifiedPortfolioResult } from "@/app/actions/portfolio-orchestrator";
import { getRecentTransactions, UnifiedTransaction } from "@/app/actions/transactions-orchestrator";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, ArrowUpRight, ArrowDownRight, Activity } from "lucide-react";
import { AppShell } from "./app-shell";

type Props = {
  address: string;
};

export default function CrossChainBalances({ address: initialAddress }: Props) {
  const [addressInput, setAddressInput] = useState(initialAddress || "");
  const [activeAddress, setActiveAddress] = useState(initialAddress || "");
  const [provider, setProvider] = useState<ProviderType>("alchemy");
  const [portfolio, setPortfolio] = useState<UnifiedPortfolioResult | null>(null);
  const [transactions, setTransactions] = useState<UnifiedTransaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAll = async (currentProvider: ProviderType, currentAddress: string) => {
    if (!currentAddress) return;
    setPortfolio(null);
    setTransactions([]);
    setLoading(true);
    setError(null);
    try {
      const [portData, txData] = await Promise.all([
        getLivePortfolio(currentAddress, currentProvider),
        getRecentTransactions(currentAddress, currentProvider, "eth") // Default eth chain test
      ]);
      setPortfolio(portData);
      setTransactions(txData);
    } catch (err: any) {
      setError(err.message || "Failed to fetch data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll(provider, activeAddress);
  }, [activeAddress, provider]);

  const handleFetch = () => {
    if (addressInput.trim()) {
      setActiveAddress(addressInput.trim());
    }
  };

  return (
    <AppShell>
    <div className="space-y-8 p-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold">Unified Portfolio & Transactions</h2>
          <div className="flex gap-2 mt-2 max-w-md">
            <input 
              type="text" 
              value={addressInput} 
              onChange={(e) => setAddressInput(e.target.value)} 
              placeholder="0x..." 
              className="flex-1 px-3 py-1.5 text-sm bg-muted rounded-md border border-border"
            />
            <button 
              onClick={handleFetch}
              className="px-4 py-1.5 text-sm rounded-md bg-primary text-primary-foreground"
            >
              Fetch
            </button>
          </div>
        </div>
        <div className="flex gap-2">
          {["alchemy", "moralis", "zapper"].map((p) => (
            <button
              key={p}
              onClick={() => setProvider(p as ProviderType)}
              className={`px-4 py-1.5 text-sm rounded-full transition-colors ${
                provider === p 
                  ? "bg-primary text-primary-foreground" 
                  : "bg-muted hover:bg-muted/80 text-muted-foreground"
              }`}
            >
              {p.charAt(0).toUpperCase() + p.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {loading && !portfolio ? (
        <div className="space-y-4">
          <Skeleton className="h-32 w-full rounded-xl" />
          <Skeleton className="h-64 w-full rounded-xl" />
        </div>
      ) : error ? (
        <div className="p-4 bg-red-500/10 text-red-500 rounded-lg border border-red-500/20">
          {error}
        </div>
      ) : portfolio && (
        <div className="space-y-6">
          {/* Total Value Overview */}
          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="p-6">
              <p className="text-sm text-muted-foreground mb-1">Total Net Worth</p>
              <p className="text-4xl font-heading font-semibold">
                ${portfolio.totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </CardContent>
          </Card>

          {/* Top Assets */}
          <div>
            <h3 className="text-lg font-medium mb-3">Top Assets</h3>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {portfolio.topAssets.map((asset, i) => (
                <Card key={i}>
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="size-10 rounded-full bg-muted overflow-hidden flex items-center justify-center text-lg">
                        {asset.icon?.startsWith("http") ? (
                          <img src={asset.icon} alt={asset.symbol} className="size-full object-cover" />
                        ) : (
                          asset.icon || "$"
                        )}
                      </div>
                      <div>
                        <p className="font-semibold text-sm">{asset.name}</p>
                        <p className="text-xs text-muted-foreground">{asset.balance.toLocaleString()} {asset.symbol}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-sm">${asset.value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                      <Badge variant="outline" className="mt-1 text-[10px]">{asset.allocation}%</Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            {portfolio.topAssets.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-8">No assets found for this provider.</p>
            )}
          </div>

          {/* Recent Transactions */}
          <div>
            <h3 className="text-lg font-medium mb-3">Recent Transactions</h3>
            <Card>
              <CardContent className="p-0 divide-y">
                {transactions.map((tx) => (
                  <div key={tx.id} className="p-4 flex items-center justify-between hover:bg-muted/20 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className={`size-10 rounded-full flex items-center justify-center ${
                        tx.type === "receive" ? "bg-green-500/10 text-green-500" :
                        tx.type === "send" ? "bg-red-500/10 text-red-500" :
                        "bg-blue-500/10 text-blue-500"
                      }`}>
                        {tx.type === "receive" ? <ArrowDownRight className="size-5" /> :
                         tx.type === "send" ? <ArrowUpRight className="size-5" /> :
                         <Activity className="size-5" />}
                      </div>
                      <div>
                        <p className="font-medium text-sm capitalize">{tx.type.replace("_", " ")}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(tx.date).toLocaleDateString()} · {tx.chain.toUpperCase()}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-sm">
                        {tx.type === "send" ? "-" : "+"}{tx.amount} {tx.assetSymbol}
                      </p>
                      <a 
                        href={`https://etherscan.io/tx/${tx.hash}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[10px] text-muted-foreground hover:text-primary flex items-center justify-end gap-1 mt-1"
                      >
                        View Tx <ExternalLink className="size-3" />
                      </a>
                    </div>
                  </div>
                ))}
                {transactions.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-8">No transactions found for this provider.</p>
                )}
              </CardContent>
            </Card>
          </div>

        </div>
      )}
    </div>
    </AppShell>
  );
}