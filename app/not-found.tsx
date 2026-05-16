"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Home, Compass } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center bg-background text-foreground overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 z-0 flex items-center justify-center pointer-events-none">
        <div className="absolute h-[500px] w-[500px] rounded-full bg-primary/5 blur-[100px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="z-10 flex flex-col items-center text-center px-4"
      >
        <div className="mb-8 flex size-24 items-center justify-center rounded-3xl bg-primary/10 text-primary shadow-lg ring-1 ring-primary/20 backdrop-blur-xl">
          <Compass className="size-12" />
        </div>
        
        <h1 className="font-heading text-7xl md:text-9xl font-bold tracking-tight mb-4 text-transparent bg-clip-text bg-linear-to-b from-foreground to-foreground/50">
          404
        </h1>
        <h2 className="text-2xl md:text-3xl font-semibold mb-3">
          Page Not Found
        </h2>
        <p className="text-muted-foreground max-w-md mb-8 text-lg">
          The page you are looking for doesn't exist or has been moved. Let's get you back to your workspace.
        </p>

        <Button asChild size="lg" className="rounded-xl font-medium gap-2 h-12 px-6">
          <Link href="/portfolio">
            <Home className="size-5" />
            Back to Dashboard
          </Link>
        </Button>
      </motion.div>
    </div>
  );
}
