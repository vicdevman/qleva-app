"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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
  return useQuery({
    queryKey: ["portfolio"],
    queryFn: async () => {
      await delay(600);
      return portfolioData;
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
  return useQuery({
    queryKey: ["activity"],
    queryFn: async () => {
      await delay(450);
      return activityData;
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
