"use client";

import { Providers } from "@/lib/providers";
import { CommandBar } from "@/components/app/command-bar";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Providers>
      {children}
      <CommandBar />
    </Providers>
  );
}
