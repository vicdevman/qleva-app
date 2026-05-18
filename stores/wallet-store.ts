import { create } from "zustand";

export interface WalletInfo {
  id: string;
  name: string;
  type: "connected" | "smart";
  address: string;
  balance: number;
  chain: string;
  chainColor: string;
}

interface WalletState {
  wallets: WalletInfo[];
  selectedWalletId: string | null;
  selectWallet: (id: string) => void;
  setWallets: (wallets: WalletInfo[]) => void;
  syncWallet: (address: string, smartAddress?: string | null) => void;
}

export const useWalletStore = create<WalletState>((set) => ({
  wallets: [
    {
      id: "w_001",
      name: "Connected Wallet",
      type: "connected",
      address: "0x7a2B...4f9E",
      balance: 3450.75,
      chain: "Ethereum",
      chainColor: "#627EEA",
    },
    {
      id: "w_002",
      name: "Smart Wallet",
      type: "smart",
      address: "0x3e8C...1a2B",
      balance: 1280.30,
      chain: "Base",
      chainColor: "#0052FF",
    },
  ],
  selectedWalletId: "w_002",
  selectWallet: (id) => set({ selectedWalletId: id }),
  setWallets: (wallets) => set({ wallets }),
  syncWallet: (address, smartAddress) =>
    set((state) => {
      const updatedWallets = state.wallets.map((w) => {
        if (w.type === "connected") {
          return { ...w, address };
        }
        if (w.type === "smart") {
          const newSmart = smartAddress || (address && address.startsWith("0x") ? `0x8888${address.slice(6)}` : "0x3e8C42fb6728001a2B548817a1772fb2a1881a2B");
          return { ...w, address: newSmart };
        }
        return w;
      });
      return { wallets: updatedWallets };
    }),
}));
