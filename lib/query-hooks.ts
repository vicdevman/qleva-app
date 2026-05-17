"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useWalletStore } from "@/stores/wallet-store";
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

// Portfolio hooks
export function usePortfolio() {
  const { wallets } = useWalletStore();
  const connectedWallet = wallets.find((w) => w.type === "connected");
  const smartWallet = wallets.find((w) => w.type === "smart");

  return useQuery({
    queryKey: ["portfolio", connectedWallet?.address, smartWallet?.address, connectedWallet?.balance, smartWallet?.balance],
    queryFn: async () => {
      await delay(600);

      // Compute dynamic portfolio total based on connected + smart wallet balances
      const totalValue = (connectedWallet?.balance ?? 2450.75) + (smartWallet?.balance ?? 1280.30);
      
      const chainDistribution = [
        { 
          chain: "Base", 
          value: smartWallet?.balance ?? 1280.30, 
          percent: totalValue > 0 ? Number(((smartWallet?.balance ?? 1280.30) / totalValue * 100).toFixed(1)) : 0, 
          color: "#0052FF" 
        },
        { 
          chain: "Ethereum", 
          value: connectedWallet?.balance ?? 2450.75, 
          percent: totalValue > 0 ? Number(((connectedWallet?.balance ?? 2450.75) / totalValue * 100).toFixed(1)) : 0, 
          color: "#627EEA" 
        },
      ];

      return {
        ...portfolioData,
        totalValue,
        chainDistribution,
        topAssets: [
          { 
            symbol: "ETH", 
            name: "Ethereum", 
            balance: Number(((connectedWallet?.balance ?? 2450.75) / 2600).toFixed(3)), 
            value: connectedWallet?.balance ?? 2450.75, 
            allocation: totalValue > 0 ? Number(((connectedWallet?.balance ?? 2450.75) / totalValue * 100).toFixed(1)) : 0, 
            change24h: 2.4, 
            icon: "⟠" 
          },
          { 
            symbol: "USDC", 
            name: "USD Coin", 
            balance: smartWallet?.balance ?? 1280.30, 
            value: smartWallet?.balance ?? 1280.30, 
            allocation: totalValue > 0 ? Number(((smartWallet?.balance ?? 1280.30) / totalValue * 100).toFixed(1)) : 0, 
            change24h: 0.0, 
            icon: "$" 
          },
        ],
      };
    },
    staleTime: 30000,
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
  return useQuery({
    queryKey: ["automations"],
    queryFn: async () => {
      await delay(500);
      return automationsData;
    },
    staleTime: 30000,
  });
}

export function useAutomation(id: string) {
  return useQuery({
    queryKey: ["automations", id],
    queryFn: async () => {
      await delay(300);
      return automationsData.find((a) => a.id === id) ?? null;
    },
    enabled: !!id,
  });
}

// Activity hooks
export function useActivity() {
  const { wallets } = useWalletStore();
  const connectedWallet = wallets.find((w) => w.type === "connected");
  const smartWallet = wallets.find((w) => w.type === "smart");

  return useQuery({
    queryKey: ["activity", connectedWallet?.address, smartWallet?.address],
    queryFn: async () => {
      await delay(450);

      const connAbbr = connectedWallet?.address 
        ? `${connectedWallet.address.slice(0, 6)}...${connectedWallet.address.slice(-4)}` 
        : "Connected Wallet";
      const smartAbbr = smartWallet?.address 
        ? `${smartWallet.address.slice(0, 6)}...${smartWallet.address.slice(-4)}` 
        : "Smart Wallet";

      return activityData.map((act) => {
        if (act.id === "act_006") {
          return {
            ...act,
            description: `Funded Qleva Smart Wallet (${smartAbbr}) from connected wallet (${connAbbr})`,
          };
        }
        if (act.id === "act_004") {
          return {
            ...act,
            description: `Approved USDC spending for Qleva Smart Wallet (${smartAbbr})`,
          };
        }
        return act;
      });
    },
    staleTime: 15000,
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
export function useChatMessages() {
  return useQuery({
    queryKey: ["chat-messages"],
    queryFn: async () => {
      await delay(400);
      return chatMessagesData;
    },
  });
}

export function useSendMessage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ content, role = "user" }: { content: string; role?: "user" | "assistant" }) => {
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
