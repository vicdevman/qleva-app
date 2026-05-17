"use client";

import { usePrivy } from "@privy-io/react-auth";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import Link from "next/link";

export default function AuthPage() {
  const { login, authenticated, ready, user } = usePrivy();

  const router = useRouter();

  useEffect(() => {
    if (ready && authenticated) {
      router.replace("/portfolio");
    }

    console.log("----------------------------------------")
    console.log("------------- authenticaed", authenticated)
    console.log("------------- user", user)
    console.log("------------- ready", ready)
  }, [ready, authenticated, router, user]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background relative overflow-hidden px-2 ">
      {/* Background gradients */}
      {/* <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[200px] h-[300px] bg-primary/20 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[600px] h-[400px] bg-secondary/10 blur-[100px] rounded-full pointer-events-none" /> */}

      <motion.div className="w-full max-w-md z-10 px-4 bg-card py-10 rounded-4xl border border-border">
        <div className="flex justify-center mb-8">
          <img
            src="/qleva-brand/qleva-drak.png"
            alt="Qleva Logo"
            className="w-16 h-16 object-contain"
          />
        </div>

        <div className="overflow-hidden rounded-3xl">
          <div className="flex flex-col items-center text-center">
            <h1 className="text-3xl font-bold tracking-tight text-foreground mb-3 font-heading">
              GM, Welcome to Qleva
            </h1>
            <p className="text-muted-foreground mb-8 text-sm leading-tight">
              Automate crypto actions by chatting with AI.
            </p>

            {!ready ? (
              <div className="flex items-center gap-2 justify-center py-2">
                <Loader2 className="size-6 animate-spin text-primary" />
                <p className="text-xs text-muted-foreground animate-pulse tracking-widest font-semibold">
                  One moment...
                </p>
              </div>
            ) : (
              <Button
                onClick={login}
                size="lg"
                className="w-[95%] h-12 text-base font-semibold transition-all rounded-3xl"
              >
                Sign In / Connect
              </Button>
            )}

            <p className="mt-8 text-xs text-muted-foreground max-w-xs text-center leading-loose">
              By connecting your wallet, you agree to our <br />{" "}
              <Link href="/terms" className="text-primary underline">
                Terms of Service
              </Link>{" "}
              and <Link href="privacy" className="text-primary underline">Privacy Policy</Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
