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
  syncWallet: (address: string, smartAddress?: string | null, connectorType?: string | null) => void;
}

export const useWalletStore = create<WalletState>((set) => ({
  wallets: [
    {
      id: "w_001",
      name: "Connected Wallet",
      type: "connected",
      address: "",
      balance: 0,
      chain: "Ethereum",
      chainColor: "#627EEA",
    },
    {
      id: "w_002",
      name: "Smart Wallet",
      type: "smart",
      address: "",
      balance: 0,
      chain: "Base",
      chainColor: "#0052FF",
    },
  ],
  selectedWalletId: "w_002",
  selectWallet: (id) => set({ selectedWalletId: id }),
  setWallets: (wallets) => set({ wallets }),
  syncWallet: (address, smartAddress, connectorType) =>
    set((state) => {
      const updatedWallets = state.wallets.map((w) => {
        if (w.type === "connected") {
          const defaultName = "Connected Wallet";
          const formattedName = connectorType
            ? connectorType.charAt(0).toUpperCase() + connectorType.slice(1).replace("_", " ")
            : defaultName;
          return { ...w, address, name: formattedName };
        }
        if (w.type === "smart") {
          const newSmart = smartAddress || "";
          return { ...w, address: newSmart };
        }
        return w;
      });
      return { wallets: updatedWallets };
    }),
}));
