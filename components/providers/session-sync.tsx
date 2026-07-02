"use client";

import * as React from "react";
import { usePrivy, useWallets, toViemAccount } from "@privy-io/react-auth";
import { useAuthStore } from "@/stores/auth-store";
import { useWalletStore } from "@/stores/wallet-store";
import { toMetaMaskSmartAccount, Implementation } from "@metamask/smart-accounts-kit";
import { createPublicClient, createWalletClient, custom } from "viem";
import { baseSepolia, base } from "viem/chains";

interface UserProfileData {
  did: string;
  createdAt: string;
  email: string | null;
  walletAddress: string | null;
  smartWalletAddress: string | null;
  smartWalletType: string | null;
  walletType?: string | null;
  oauthProvider: string | null;
  authMethod: string | null;
  name: string | null;
  username: string | null;
  avatarUrl: string | null;
  lastLoginAt: string;
}

export function extractUserProfile(user: any, resolvedSmartWalletAddress: string | null): Omit<UserProfileData, "lastLoginAt"> {
  if (!user) {
    return {
      did: "",
      createdAt: "",
      email: null,
      walletAddress: null,
      oauthProvider: null,
      authMethod: null,
      name: null,
      username: null,
      avatarUrl: null,
      smartWalletAddress: null,
      smartWalletType: null,
    };
  }

  // Extract active address
  const activeAddress = user.wallet?.address || (user as any)?.wallets?.[0]?.address || "";

  // Identify if user logged in via a social/oauth account
  const googleAcc = user.google as any;
  const twitterAcc = user.twitter as any;
  const githubAcc = user.github as any;
  const emailAcc = user.email as any;

  const isSocialUser = !!(
    googleAcc?.name ||
    twitterAcc?.name ||
    githubAcc?.name ||
    emailAcc?.address
  );

  // If it is a social user, hide the connected wallet (represented by EOA wallet)
  // Otherwise, use the activeAddress
  const walletAddress = isSocialUser ? null : (activeAddress || null);

  // Get email
  const email = user.email?.address || null;

  let oauthProvider = null;
  let name = null;
  let username = null;
  let avatarUrl = null;

  // Find linked OAuth accounts directly or through linked accounts array
  const googleAccount = user.google || user.linkedAccounts?.find((acc: any) => acc.type === "google_oauth");
  const twitterAccount = user.twitter || user.linkedAccounts?.find((acc: any) => acc.type === "twitter_oauth");
  const githubAccount = user.github || user.linkedAccounts?.find((acc: any) => acc.type === "github_oauth");
  const discordAccount = user.discord || user.linkedAccounts?.find((acc: any) => acc.type === "discord_oauth");

  if (googleAccount) {
    oauthProvider = "google";
    name = googleAccount.name || name;
    avatarUrl = googleAccount.profilePictureUrl || avatarUrl;
  } else if (twitterAccount) {
    oauthProvider = "twitter";
    name = twitterAccount.name || name;
    username = twitterAccount.username || username;
    avatarUrl = twitterAccount.profilePictureUrl || avatarUrl;
  } else if (githubAccount) {
    oauthProvider = "github";
    name = githubAccount.name || name;
    username = githubAccount.username || username;
    avatarUrl = githubAccount.profilePictureUrl || avatarUrl;
  } else if (discordAccount) {
    oauthProvider = "discord";
    name = discordAccount.username || name;
    avatarUrl = discordAccount.profilePictureUrl || avatarUrl;
  }

  // Fallback to linked accounts list if properties not directly on user object
  if (!oauthProvider && user.linkedAccounts) {
    for (const acc of user.linkedAccounts) {
      if (acc.type?.endsWith("_oauth")) {
        oauthProvider = acc.type.replace("_oauth", "");
        name = acc.name || name;
        username = acc.username || username;
        avatarUrl = acc.profilePictureUrl || avatarUrl;
        break;
      }
    }
  }

  // Abbreviated wallet address for fallback name
  const abbreviatedAddress = walletAddress
    ? `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`
    : null;

  // Final fallbacks if name is empty
  const displayName = name || username || (email ? email.split("@")[0] : null) || abbreviatedAddress || "Qleva User";

  const authMethod = isSocialUser ? "social" : "wallet";

  return {
    did: user.id,
    createdAt: user.createdAt?.toString() || new Date().toISOString(),
    email: email || (googleAccount?.email || githubAccount?.email || null),
    walletAddress,
    smartWalletAddress: resolvedSmartWalletAddress,
    smartWalletType: resolvedSmartWalletAddress ? "metamask-hybrid" : null,
    walletType: isSocialUser 
      ? null 
      : (user.wallet?.walletClientType || (user as any)?.wallets?.[0]?.walletClientType || null),
    oauthProvider,
    authMethod,
    name: displayName,
    username: username || (email ? email.split("@")[0] : null),
    avatarUrl,
  };
}

export function SessionSync() {
  const { ready, authenticated, user } = usePrivy();
  const { wallets } = useWallets();
  const { setUser, setAuthenticated, logout: localLogout } = useAuthStore();
  const { syncWallet } = useWalletStore();
  
  const [smartWalletAddress, setSmartWalletAddress] = React.useState<string | null>(null);
  const syncedRef = React.useRef<string | null>(null);

  // Find active signer wallet
  const activeWallet = React.useMemo(() => {
    if (!user) return null;
    const activeAddr = user.wallet?.address || (user as any)?.wallets?.[0]?.address || "";
    return wallets.find((w) => w.address.toLowerCase() === activeAddr.toLowerCase()) || wallets[0] || null;
  }, [user, wallets]);

  // Resolve MetaMask smart account address asynchronously
  React.useEffect(() => {
    if (!activeWallet) {
      setSmartWalletAddress(null);
      return;
    }

    let active = true;

    async function resolveSmartAccount() {
      try {
        const provider = await activeWallet!.getEthereumProvider();
        
        // Default to Base Sepolia (84532) for dev, or extract from connected wallet
        let chainId = 84532;
        if (activeWallet!.chainId) {
          const parts = activeWallet!.chainId.split(":");
          if (parts.length > 1) {
            chainId = Number(parts[1]);
          }
        }
        
        const chain = chainId === 8453 || chainId === 84532 ? (chainId === 8453 ? base : baseSepolia) : baseSepolia;
        
        const publicClient = createPublicClient({
          chain,
          transport: custom(provider)
        });

        const viemAccount = await toViemAccount({ wallet: activeWallet! });
        const smartAccount = await toMetaMaskSmartAccount({
          client: publicClient as any,
          implementation: Implementation.Hybrid,
          deployParams: [activeWallet!.address as `0x${string}`, [], [], []],
          deploySalt: "0x",
          signer: {
            account: viemAccount as any
          }
        });

        if (active) {
          console.log("[SessionSync] Resolved MetaMask Smart Account address:", smartAccount.address);
          setSmartWalletAddress(smartAccount.address);
        }
      } catch (err) {
        console.error("[SessionSync] Failed to resolve MetaMask Smart Account:", err);
      }
    }

    resolveSmartAccount();

    return () => {
      active = false;
    };
  }, [activeWallet]);

  React.useEffect(() => {
    if (!ready) return;

    if (authenticated && user) {
      // Wait until smart account address is resolved to sync with backend
      if (!smartWalletAddress) return;

      const profile = extractUserProfile(user, smartWalletAddress);

      // 1. Update Frontend Zustand Auth Store
      setAuthenticated(true);
      setUser({
        id: profile.did,
        name: profile.name || "Qleva User",
        email: profile.email || "",
        avatarUrl: profile.avatarUrl || "",
      });

      // 2. Update Frontend Zustand Wallet Store
      syncWallet(profile.walletAddress || "", profile.smartWalletAddress, (profile as any).walletType);

      // Avoid double syncing for the exact same session state
      const currentSyncKey = `${profile.did}-${profile.walletAddress || "no-wallet"}-${smartWalletAddress}`;
      if (syncedRef.current === currentSyncKey) return;
      syncedRef.current = currentSyncKey;

      // 3. Trigger Backend API Synchronization
      const fullProfile: UserProfileData = {
        ...profile,
        lastLoginAt: new Date().toISOString(),
      };

      console.log("[SessionSync] Synchronizing user credentials with backend:", fullProfile);

      fetch("/api/auth", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(fullProfile),
      })
        .then((res) => res.json())
        .then((data) => {
          console.log("[SessionSync] Backend sync success:", data);
        })
        .catch((err) => {
          console.error("[SessionSync] Backend sync failure:", err);
        });
    } else {
      // User is not logged in on Privy, sync local store to unauthenticated state
      localLogout();
      setSmartWalletAddress(null);
      syncedRef.current = null;
    }
  }, [ready, authenticated, user, smartWalletAddress, setUser, setAuthenticated, syncWallet, localLogout]);

  return null;
}
