import type { Metadata } from "next";
import {
  Geist,
  Geist_Mono,
  Inter,
  Space_Grotesk,
  DM_Sans,
} from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { TooltipProvider } from "@/components/ui/tooltip";
import Providers from "./providers";

const dmSansHeading = DM_Sans({subsets:['latin'],variable:'--font-heading'});

const inter = Inter({subsets:['latin'],variable:'--font-sans'});

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Qleva",
    template: "%s | Qleva"
  },
  description: "Qleva is a conversational crypto automation platform that lets you execute, manage, and automate onchain actions on Base, Ethereum, and beyond using simple natural language.",
  keywords: ["crypto automation", "AI web3 agent", "conversational defi", "onchain automation", "Qleva smart wallet", "Base network", "Ethereum automations", "DeFi DCA"],
  authors: [{ name: "Victor Adeiza (vicdevman)" }],
  creator: "vicdevman",
  metadataBase: new URL("https://qleva.cloud"),
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://qleva.cloud",
    title: "Qleva",
    description: "Execute, manage, and automate onchain actions using simple natural language. The premier AI companion for web3.",
    siteName: "Qleva",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Qleva Onchain Automation"
      }
    ]
  },
  twitter: {
    card: "summary_large_image",
    title: "Qleva",
    description: "Execute and automate onchain actions using natural language on Base & Ethereum.",
    creator: "@vicdevman",
    images: ["/og-image.png"]
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1
    }
  },
  other: {
    'base:app_id': '69e9fc161eb4a1de6a95854f',
    'talentapp:project_verification': '1ae7a243415259d1bfae82544d625c912e1a2ade1c119d7ff322c423016d0ba7be58fb908cf9592d4a3b4db0d62f26a1215cbcd098cc01cace5b29a859c0058a'
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn(
        "h-full",
        "antialiased",
        geistSans.variable,
        geistMono.variable,
        "font-sans",
        inter.variable,
        dmSansHeading.variable,
      )}
    >
      <body className="min-h-full flex flex-col">
        <TooltipProvider><Providers>{children}</Providers></TooltipProvider>
      </body>
    </html>
  );
}
