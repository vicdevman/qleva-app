import { create } from "zustand";

interface AuthState {
  isAuthenticated: boolean;
  user: {
    id: string;
    name: string;
    email: string;
    avatarUrl: string;
  } | null;
  setAuthenticated: (auth: boolean) => void;
  setUser: (user: AuthState["user"]) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  isAuthenticated: true, // Simulated authenticated state
  user: {
    id: "usr_001",
    name: "Alex Rivera",
    email: "alex@qleva.io",
    avatarUrl: "",
  },
  setAuthenticated: (auth) => set({ isAuthenticated: auth }),
  setUser: (user) => set({ user }),
  logout: () => set({ isAuthenticated: false, user: null }),
}));
