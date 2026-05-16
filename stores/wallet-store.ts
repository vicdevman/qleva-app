
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
}

export const useWalletStore = create<WalletState>((set) => ({
  wallets: [
    {
      id: "w_001",
      name: "MetaMask",
      type: "connected",
      address: "0x7a2B...4f9E",
      balance: 2450.75,
      chain: "Ethereum",
      chainColor: "#627EEA",
    },
    {
      id: "w_002",
      name: "Qleva Smart Wallet",
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
}));
