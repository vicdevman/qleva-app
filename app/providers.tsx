"use client";

import { PrivyProvider } from "@privy-io/react-auth";
import { ThemeProvider as NextThemesProvider, useTheme } from "next-themes";
import {SmartWalletsProvider} from '@privy-io/react-auth/smart-wallets';
import { useEffect, useState } from "react";
import { SessionSync } from "@/components/providers/session-sync";

// Suppress React 19 "Encountered a script tag" warning from next-themes false-positive in development
if (typeof window !== "undefined" && process.env.NODE_ENV === "development") {
  const origError = console.error;
  console.error = (...args: any[]) => {
    if (typeof args[0] === "string" && args[0].includes("Encountered a script tag")) {
      return;
    }
    origError.apply(console, args);
  };
}

function PrivyWrapper({ children }: { children: React.ReactNode }) {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <PrivyProvider
      appId={process.env.NEXT_PUBLIC_PRIVY_APP_ID!}
      config={{
        loginMethods: ["email", "google", "wallet"],
        embeddedWallets: {
          ethereum: {
            createOnLogin: "all-users",
          },
        },
        appearance: {
          theme: mounted && resolvedTheme === "light" ? "light" : "dark",
          accentColor: "#676FFF",
        },
      }}
    >
       <SmartWalletsProvider>{children}</SmartWalletsProvider>
    </PrivyProvider>
  );
}

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <PrivyWrapper>
        <SessionSync />
        {children}
      </PrivyWrapper>
    </NextThemesProvider>
  );
}
