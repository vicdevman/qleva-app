"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useWalletStore } from "@/stores/wallet-store";
import { getLivePortfolio } from "@/app/actions/portfolio-orchestrator";
import { getRecentTransactions } from "@/app/actions/transactions-orchestrator";
import { usePrivy } from "@privy-io/react-auth";
import {
  portfolioData,
  automationsData,
  activityData,
  notificationsData,
  aiSuggestionsData,
  marketSnapshotData,
  chatMessagesData,
  settingsData,
  aiMemoryData,
} from "./dummy-data";

// Simulated API delay
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// ==========================================
// PORTFOLIO PROVIDER CONFIGURATION
// Switch this to "alchemy", "moralis", or "zapper" to change your data source globally!
// ==========================================
const ACTIVE_PROVIDER = process.env.NEXT_PUBLIC_ACTIVE_PROVIDER || "zapper";

// Note on `staleTime: 5 * 60 * 1000`: 
// This does NOT mean it fetches automatically in the background every 5 minutes. 
// It means if you click a page or interact after 5 minutes, it will fetch fresh data. 
// If you leave the page open for an hour and don't interact, 0 credits are used!
export function usePortfolio() {
  const { wallets } = useWalletStore();
  const connectedWallet = wallets.find((w) => w.type === "connected");
  const smartWallet = wallets.find((w) => w.type === "smart");

  return useQuery({
    queryKey: [
      "portfolio",
      connectedWallet?.address,
      smartWallet?.address,
      connectedWallet?.balance,
      smartWallet?.balance,
    ],
    queryFn: async () => {
      const smartAddress = smartWallet?.address;
      const connectedAddress = connectedWallet?.address;

      const [smartData, connectedData] = await Promise.all([
        smartAddress ? getLivePortfolio(smartAddress, ACTIVE_PROVIDER as any) : Promise.resolve(null),
        connectedAddress ? getLivePortfolio(connectedAddress, ACTIVE_PROVIDER as any) : Promise.resolve(null),
      ]);

      const smartError = smartData?.error ?? true;
      const connectedError = connectedData?.error ?? true;
      const error = (smartAddress && smartError) || (connectedAddress && connectedError);

      const smartValue = smartData && !smartError ? smartData.totalValue : (smartWallet?.balance ?? 1280.30);
      const connectedValue = connectedAddress
        ? (connectedData && !connectedError ? connectedData.totalValue : (connectedWallet?.balance ?? 2450.75))
        : 0;
      
      const totalValue = smartValue + connectedValue;

      // Merge chain distribution
      const chainMap = new Map<string, number>();
      if (!smartError || !connectedError) {
        [smartData, connectedData].forEach(data => {
          if (data && !data.error) {
            data.chainDistribution.forEach(c => {
              chainMap.set(c.chain, (chainMap.get(c.chain) || 0) + c.value);
            });
          }
        });
      } else {
        chainMap.set("Base", smartValue);
        if (connectedAddress) {
          chainMap.set("Ethereum", connectedValue);
        }
      }

      const chainDistribution = Array.from(chainMap.entries()).map(([chain, value]) => ({
        chain,
        value,
        percent: totalValue > 0 ? Number(((value / totalValue) * 100).toFixed(1)) : 0,
        color: chain === "Ethereum" ? "#627EEA" : chain === "Base" ? "#0052FF" : "#8884d8",
      })).sort((a, b) => b.value - a.value);

      // Merge top assets
      const assetMap = new Map<string, any>();
      if (!smartError || !connectedError) {
        [smartData, connectedData].forEach(data => {
          if (data && !data.error && data.topAssets) {
            data.topAssets.forEach(asset => {
              const key = `${asset.symbol}-${asset.name}`;
              if (assetMap.has(key)) {
                const existing = assetMap.get(key);
                existing.value += asset.value;
                existing.balance += asset.balance;
                existing.allocation = totalValue > 0 ? Number(((existing.value / totalValue) * 100).toFixed(1)) : 0;
              } else {
                assetMap.set(key, { ...asset });
              }
            });
          }
        });
      }
      
      let topAssets = Array.from(assetMap.values()).sort((a, b) => b.value - a.value);

      if (topAssets.length === 0) {
        topAssets = [];
        if (connectedAddress && connectedValue > 0) {
          topAssets.push({
            symbol: "ETH",
            name: "Ethereum",
            balance: Number((connectedValue / 2600).toFixed(3)),
            value: connectedValue,
            allocation: totalValue > 0 ? Number(((connectedValue / totalValue) * 100).toFixed(1)) : 0,
            change24h: 2.4,
            icon: "⟠",
          });
        }
        topAssets.push({
          symbol: "USDC",
          name: "USD Coin",
          balance: smartValue,
          value: smartValue,
          allocation: totalValue > 0 ? Number(((smartValue / totalValue) * 100).toFixed(1)) : 0,
          change24h: 0.0,
          icon: "$",
        });
      }

      return {
        ...portfolioData,
        error,
        totalValue,
        smartWalletValue: smartValue,
        connectedWalletValue: connectedValue,
        chainDistribution,
        topAssets,
      };
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  });
}

export function usePortfolioHistory() {
  return useQuery({
    queryKey: ["portfolio", "history"],
    queryFn: async () => {
      await delay(400);
      return portfolioData.portfolioHistory;
    },
    staleTime: 60000,
  });
}

// Automations hooks
export function useAutomations() {
  const { getAccessToken } = usePrivy();

  return useQuery({
    queryKey: ["automations"],
    queryFn: async () => {
      const token = await getAccessToken();
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
      const res = await fetch(`${baseUrl}/api/automations`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!res.ok) {
        throw new Error("Failed to fetch automations");
      }
      return res.json();
    },
    staleTime: 30000,
  });
}

export function useAutomation(id: string) {
  const { getAccessToken } = usePrivy();

  return useQuery({
    queryKey: ["automations", id],
    queryFn: async () => {
      const token = await getAccessToken();
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
      const res = await fetch(`${baseUrl}/api/automations/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!res.ok) {
        throw new Error("Failed to fetch automation");
      }
      return res.json();
    },
    enabled: !!id,
  });
}

export function useAutomationExecutions(id: string) {
  const { getAccessToken } = usePrivy();

  return useQuery({
    queryKey: ["automations", id, "executions"],
    queryFn: async () => {
      const token = await getAccessToken();
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
      const res = await fetch(`${baseUrl}/api/automations/${id}/executions`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!res.ok) {
        throw new Error("Failed to fetch executions");
      }
      return res.json();
    },
    enabled: !!id,
  });
}

export function useToggleAutomationStatus() {
  const { getAccessToken } = usePrivy();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const token = await getAccessToken();
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
      const res = await fetch(`${baseUrl}/api/automations/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) {
        throw new Error("Failed to update automation status");
      }
      return res.json();
    },
    onSuccess: (data, variables) => {
      qc.invalidateQueries({ queryKey: ["automations"] });
      qc.invalidateQueries({ queryKey: ["automations", variables.id] });
    },
  });
}

export function useDeleteAutomation() {
  const { getAccessToken } = usePrivy();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const token = await getAccessToken();
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
      const res = await fetch(`${baseUrl}/api/automations/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!res.ok) {
        throw new Error("Failed to delete automation");
      }
      return id;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["automations"] });
    },
  });
}

// Activity hooks
export function useActivity() {
  const { wallets, selectedWalletId } = useWalletStore();
  
  return useQuery({
    queryKey: ["activity", selectedWalletId],
    queryFn: async () => {
      // Find the currently selected wallet's address, default to connected wallet
      const activeWallet = wallets.find(w => w.id === selectedWalletId) || wallets.find(w => w.type === "connected");
      const address = activeWallet?.address;

      if (!address) return [];

      // Use the actual Recent Transactions Orchestrator
      const txs = await getRecentTransactions(address, ACTIVE_PROVIDER as any);

      // Map UnifiedTransaction back to the UI's activity shape
      return txs.map(tx => ({
        id: tx.id,
        title: tx.type === "receive" ? "Received Tokens" : tx.type === "send" ? "Sent Tokens" : "Contract Interaction",
        description: `${tx.fromAddress?.slice(0,6)}...${tx.fromAddress?.slice(-4)} -> ${tx.toAddress?.slice(0,6)}...${tx.toAddress?.slice(-4)}`,
        amount: `${tx.type === "send" ? "-" : "+"}${tx.amount} ${tx.assetSymbol}`,
        status: tx.status === "success" ? "completed" : tx.status,
        date: new Date(tx.date).toLocaleDateString(),
        timestamp: tx.date,
        type: tx.type === "swap" ? "swap" : tx.type === "contract_execution" ? "contract" : "transfer",
        chain: tx.chain.toUpperCase(),
        txHash: tx.hash,
        gasUsed: 0.0001,
      }));
    },
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
}

// Notifications hooks
export function useNotifications() {
  return useQuery({
    queryKey: ["notifications"],
    queryFn: async () => {
      await delay(300);
      return notificationsData;
    },
    staleTime: 10000,
  });
}

export function useMarkNotificationRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await delay(200);
      return id;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
}

// AI Suggestions hooks
export function useAiSuggestions() {
  return useQuery({
    queryKey: ["ai-suggestions"],
    queryFn: async () => {
      await delay(700);
      return aiSuggestionsData;
    },
    staleTime: 120000,
  });
}

// Market Snapshot hooks
export function useMarketSnapshot() {
  return useQuery({
    queryKey: ["market-snapshot"],
    queryFn: async () => {
      await delay(350);
      return marketSnapshotData;
    },
    staleTime: 30000,
    refetchInterval: 30000,
  });
}

// Chat hooks
export function useChatsList() {
  const { getAccessToken } = usePrivy();

  return useQuery({
    queryKey: ["chats-list"],
    queryFn: async () => {
      const token = await getAccessToken();
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
      const res = await fetch(`${baseUrl}/api/chats`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!res.ok) {
        throw new Error("Failed to fetch chats list");
      }
      return res.json() as Promise<{ id: string; title: string; updatedAt: string }[]>;
    },
  });
}

export function useChatMessages(chatId?: string) {
  const { getAccessToken } = usePrivy();

  return useQuery({
    queryKey: ["chat-messages", chatId],
    queryFn: async () => {
      if (!chatId) return [];
      const token = await getAccessToken();
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
      const res = await fetch(`${baseUrl}/api/chats/${chatId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!res.ok) {
        throw new Error("Failed to fetch chat history");
      }
      return res.json();
    },
  });
}

export function useSendMessage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      content,
      role = "user",
    }: {
      content: string;
      role?: "user" | "assistant";
    }) => {
      await delay(800);
      return {
        id: Math.random().toString(36).substring(7),
        role,
        content,
        timestamp: new Date().toISOString(),
      };
    },
    onSuccess: (newMessage) => {
      qc.setQueryData(["chat-messages"], (old: any[] | undefined) => {
        return [...(old || []), newMessage];
      });
    },
  });
}

// Settings hooks
export function useSettings() {
  return useQuery({
    queryKey: ["settings"],
    queryFn: async () => {
      await delay(300);
      return settingsData;
    },
  });
}

// AI Memory hooks
export function useAiMemory() {
  return useQuery({
    queryKey: ["ai-memory"],
    queryFn: async () => {
      await delay(400);
      return aiMemoryData;
    },
  });
}
