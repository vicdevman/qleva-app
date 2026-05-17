"use client";

import * as React from "react";
import { usePrivy } from "@privy-io/react-auth";
import { useAuthStore } from "@/stores/auth-store";
import { useWalletStore } from "@/stores/wallet-store";

interface UserProfileData {
  did: string;
  createdAt: string;
  email: string | null;
  walletAddress: string | null;
  oauthProvider: string | null;
  name: string | null;
  username: string | null;
  avatarUrl: string | null;
  lastLoginAt: string;
}

export function extractUserProfile(user: any): Omit<UserProfileData, "lastLoginAt"> {
  if (!user) {
    return {
      did: "",
      createdAt: "",
      email: null,
      walletAddress: null,
      oauthProvider: null,
      name: null,
      username: null,
      avatarUrl: null,
    };
  }

  // Get active or first wallet address
  const walletAddress = user.wallet?.address || user.wallets?.[0]?.address || null;

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

  return {
    did: user.id,
    createdAt: user.createdAt?.toString() || new Date().toISOString(),
    email: email || (googleAccount?.email || githubAccount?.email || null),
    walletAddress,
    oauthProvider,
    name: displayName,
    username: username || (email ? email.split("@")[0] : null),
    avatarUrl,
  };
}

export function SessionSync() {
  const { ready, authenticated, user } = usePrivy();
  const { setUser, setAuthenticated, logout: localLogout } = useAuthStore();
  const { syncWallet } = useWalletStore();
  const syncedRef = React.useRef<string | null>(null);

  React.useEffect(() => {
    if (!ready) return;

    if (authenticated && user) {
      const profile = extractUserProfile(user);

      // 1. Update Frontend Zustand Auth Store
      setAuthenticated(true);
      setUser({
        id: profile.did,
        name: profile.name || "Qleva User",
        email: profile.email || "",
        avatarUrl: profile.avatarUrl || "",
      });

      // 2. Update Frontend Zustand Wallet Store
      if (profile.walletAddress) {
        syncWallet(profile.walletAddress);
      }

      // Avoid double syncing for the exact same session state
      const currentSyncKey = `${profile.did}-${profile.walletAddress || "no-wallet"}`;
      if (syncedRef.current === currentSyncKey) return;
      syncedRef.current = currentSyncKey;

      // 3. Trigger Backend API Synchronization
      const fullProfile: UserProfileData = {
        ...profile,
        lastLoginAt: new Date().toISOString(),
      };

      console.log("[SessionSync] Synchronizing user oauth/wallet credentials with backend:", fullProfile);

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
      syncedRef.current = null;
    }
  }, [ready, authenticated, user, setUser, setAuthenticated, syncWallet, localLogout]);

  return null;
}
