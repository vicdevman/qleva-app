"use client"

import * as React from "react"
import { useIsMobile } from "@/hooks/use-mobile"

export function MobileOnly({ children }: { children: React.ReactNode }) {
  const isMobile = useIsMobile()
  if (!isMobile) return null
  return <>{children}</>
}

export function DesktopOnly({ children }: { children: React.ReactNode }) {
  const isMobile = useIsMobile()
  if (isMobile) return null
  return <>{children}</>
}

export function useIsMobileComponent() {
  return useIsMobile()
}
