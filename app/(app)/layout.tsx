"use client";

import { Providers } from "@/lib/providers";
import { AppShell } from "@/components/app/app-shell";
import { CommandBar } from "@/components/app/command-bar";
import { FundWithdrawDialogs } from "@/components/app/fund-withdraw-dialog";
import { usePrivy } from "@privy-io/react-auth";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Loader, Loader2 } from "lucide-react";
import { Facehash } from "facehash";

function AuthGuard({ children }: { children: React.ReactNode }) {
  const { ready, authenticated } = usePrivy();
  const router = useRouter();
  const [name, changeName] = useState("thinking");
  const [names, updateName] = useState(["sam", "charlie", "bob", "think"]);
  const [random, setRandom] = useState(0);

  useEffect(() => {
    if (ready && !authenticated) {
      router.replace("/auth");
    }
  }, [ready, authenticated, router]);

  useEffect(() => {

    const random_ = Math.floor(Math.random() * 3)

    changeName(names[random_]);
  }, []);

  if (!ready) {
    return (
      <div className="h-[80dvh] flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-2 text-background  ">
          <Facehash
            name={name}
            size={64}
            colors={["#fdc700", "#fdc700", "#fdc700"]}
            intensity3d="subtle"
            enableBlink
            showInitial={false}
            onRenderMouth={() => (
              <Loader2 className="size-4 animate-spin text-background" />
            )}
          />
        </div>
      </div>
    );
  }

  if (!authenticated) {
    return null;
  }

  return <>{children}</>;
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <Providers>
      <AuthGuard>
          {children}
        <CommandBar />
        <FundWithdrawDialogs />
      </AuthGuard>
    </Providers>
  );
}
