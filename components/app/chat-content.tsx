"use client";
import * as React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { io, Socket } from "socket.io-client";
import ShinyText from '../ShinyText';
import {
  Send,
  Sparkles,
  ArrowUp,
  Image as ImageIcon,
  Paperclip,
  Plus,
  TrendingUp,
  ArrowRight,
  Zap,
  ArrowRightLeft,
  Fuel,
  CheckCircle2,
  XCircle,
  Clock,
  Loader2,
  Brain,
  ChevronDown,
  ChevronUp,
  Copy,
  Check,
  ThumbsUp,
  ThumbsDown,
} from "lucide-react";
import { AppShell } from "@/components/app/app-shell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useChatMessages, useSendMessage, useToggleAutomationStatus, useDeleteAutomation } from "@/lib/query-hooks";
import { useQueryClient } from "@tanstack/react-query";
import { usePrivy, useWallets } from "@privy-io/react-auth";
import { parseUnits } from "viem";
import { cn, getFriendlyScheduleDescription } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";

const TokenLink = ({ tokenInfo }: { tokenInfo: any }) => {
  const symbol = tokenInfo?.symbol || "USDC";
  const address = tokenInfo?.contractAddress || tokenInfo?.address || "";
  const chainId = "base";
  const url = address ? `https://dexscreener.com/${chainId}/${address}` : `https://dexscreener.com/search?q=${symbol}`;
  
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="underline decoration-dotted underline-offset-4 hover:text-primary transition-colors cursor-pointer inline-block"
    >
      {symbol}
    </a>
  );
};

const TokenBadge = ({ tokenInfo }: { tokenInfo: any }) => {
  if (!tokenInfo) return null;
  const logoUrl = tokenInfo.logoUrl;
  return (
    <span className="inline-flex items-center gap-1.5 align-middle">
       <TokenLink tokenInfo={tokenInfo} />
      {logoUrl && (
        <img
          src={logoUrl}
          alt=""
          className="size-5 p-0.5 object-cover border border-white/10"
        />
      )}
     
    </span>
  );
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(value);
}

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
  intentPreview?: {
    id: string;
    status: "preview" | "active" | "completed";
    createdAt?: string;
    execution?: any;
    trigger: {
      type: "schedule" | "price_condition" | "swap";
      config: any;
    };
    actions: Array<{
      type: "swap" | "transfer";
      config: any;
    }>;
    risk: {
      maxSlippage: number;
      maxTradeUsd: number;
      dailyVolumeLimit: number;
      estimatedGasUsd: number;
    };
    preview: {
      humanReadable: string;
      estimatedOutput: string;
      estimatedFee: string;
      permissionsRequired: Array<{ token: string; amount: string }>;
      riskSummary: string;
    };
  };
  executionStatus?: "pending" | "executing" | "completed" | "failed";
  automationPreview?: any;
  image?: string;
}

const suggestionChips = [
  { label: "Buy $100 ETH", icon: <TrendingUp className="size-3" /> },
  { label: "Setup DCA", icon: <Zap className="size-3" /> },
  { label: "Swap USDC/ETH", icon: <ArrowRightLeft className="size-3" /> },
];

const TOKEN_ADDRESSES: Record<string, string> = {
  usdc: "0x833589fcd6edb6e08f4c7c32d4f71b54bda02913",
  eth: "0x4200000000000000000000000000000000000006",
  weth: "0x4200000000000000000000000000000000000006",
  usdt: "0x50c5725949a6f0c72e6c4a641f24029a262da18a",
  sol: "0x2eed5cb7c1692ec1741d4013149ca7171d1887e5",
  wbtc: "0x03c6b2015b50c0c6e83863d0246a48235272a088",
};

const resolveTokenAddress = (symbol: string) => {
  return TOKEN_ADDRESSES[symbol.toLowerCase()] || "0x833589fcd6edb6e08f4c7c32d4f71b54bda02913";
};

interface EditableSwapCardProps {
  intentPreview: any;
  chatId?: string;
  onSuccess: () => void;
}

export function EditableSwapCard({ intentPreview, chatId, onSuccess }: EditableSwapCardProps) {
  const config = intentPreview.trigger?.config || {};
  const { wallets } = useWallets();
  const { getAccessToken } = usePrivy();
  const queryClient = useQueryClient();

  const [fromToken, setFromToken] = React.useState(config.fromToken || "USDC");
  const [toToken, setToToken] = React.useState(config.toToken || "ETH");
  const [amountUsd, setAmountUsd] = React.useState(config.amountUsd || 10);
  const [walletType, setWalletType] = React.useState<"smart" | "connected">(config.walletType || "smart");
  
  const [isExecuting, setIsExecuting] = React.useState(false);
  const [statusMessage, setStatusMessage] = React.useState("");
  const [errorMsg, setErrorMsg] = React.useState("");

  const fromTokenInfo = config.fromTokenInfo || { symbol: fromToken };
  const toTokenInfo = config.toTokenInfo || { symbol: toToken };

  const defaultPrices: Record<string, number> = {
    usdc: 1.0,
    usdt: 1.0,
    eth: 3500.0,
    weth: 3500.0,
    sol: 150.0,
    wbtc: 68000.0,
    btc: 68000.0,
  };

  const getPrice = (symbol: string, info: any) => {
    const sym = symbol.toLowerCase();
    if (info && info.symbol?.toLowerCase() === sym && info.priceUsd) {
      return info.priceUsd;
    }
    return defaultPrices[sym] || 1.0;
  };

  const toPrice = getPrice(toToken, toTokenInfo);
  const estimatedOutputAmount = (amountUsd / toPrice).toFixed(4);

  const handleExecute = async () => {
    if (isExecuting) return;
    setIsExecuting(true);
    setErrorMsg("");
    setStatusMessage("Connecting to wallet...");

    try {
      const activeWallet = wallets.find((w) => w.walletClientType === "privy") ||
                           wallets.find((w) => w.walletClientType === "coinbase_wallet") ||
                           wallets[0];

      if (!activeWallet) {
        throw new Error("No active wallet connected. Please connect a wallet first.");
      }

      const provider = await activeWallet.getEthereumProvider();
      const token = await getAccessToken();
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

      const fromAddress = resolveTokenAddress(fromToken);
      const toAddress = resolveTokenAddress(toToken);

      const swapDetails = {
        fromToken: {
          contractAddress: fromAddress,
          symbol: fromToken.toUpperCase(),
          decimals: fromToken.toLowerCase() === "eth" ? 18 : 6,
          name: fromToken.toUpperCase(),
          priceUsd: getPrice(fromToken, fromTokenInfo)
        },
        toToken: {
          contractAddress: toAddress,
          symbol: toToken.toUpperCase(),
          decimals: toToken.toLowerCase() === "eth" ? 18 : 6,
          name: toToken.toUpperCase(),
          priceUsd: toPrice
        },
        amountUsd
      };

      if (walletType === "smart") {
        setStatusMessage("Requesting Smart Wallet Spend Permission signature...");
        
        const allowance = parseUnits(amountUsd.toString(), fromToken.toLowerCase() === "eth" ? 18 : 6).toString();
        const period = 86400; // 1 day
        const start = Math.floor(Date.now() / 1000);
        const end = start + 30 * 24 * 3600; // 30 days
        const salt = Math.floor(Math.random() * 10000000).toString();
        const extraData = "0x";
        const spender = intentPreview.spender || "0x8888888888888888888888888888888888888888";

        let chainId = 84532; // Default to Base Sepolia
        if (activeWallet.chainId) {
          const parsed = parseInt(activeWallet.chainId.replace("eip155:", ""));
          if (!isNaN(parsed)) {
            chainId = parsed;
          }
        }

        const domain = {
          name: "Spend Permission Manager",
          version: "1",
          chainId,
          verifyingContract: "0xf85210B21cC50302F477BA56686d2019dC9b67Ad",
        };

        const SpendPermissionTypes = {
          SpendPermission: [
            { name: "account", type: "address" },
            { name: "spender", type: "address" },
            { name: "token", type: "address" },
            { name: "allowance", type: "uint160" },
            { name: "period", type: "uint48" },
            { name: "start", type: "uint48" },
            { name: "end", type: "uint48" },
            { name: "salt", type: "uint256" },
            { name: "extraData", type: "bytes" },
          ],
        };

        const signature = await provider.request({
          method: "eth_signTypedData_v4",
          params: [
            activeWallet.address,
            JSON.stringify({
              domain,
              types: {
                EIP712Domain: [
                  { name: "name", type: "string" },
                  { name: "version", type: "string" },
                  { name: "chainId", type: "uint256" },
                  { name: "verifyingContract", type: "address" },
                ],
                ...SpendPermissionTypes,
              },
              primaryType: "SpendPermission",
              message: {
                account: intentPreview.smartWalletAddress,
                spender,
                token: fromAddress,
                allowance,
                period,
                start,
                end,
                salt,
                extraData,
              },
            }),
          ],
        });

        setStatusMessage("Executing swap instantly via Smart Wallet...");

        const response = await fetch(`${baseUrl}/api/automations/swap`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            chatId,
            walletType: "smart",
            swapDetails,
            permission: {
              account: intentPreview.smartWalletAddress,
              spender,
              token: fromAddress,
              allowance,
              period,
              start,
              end,
              salt,
              extraData,
              signature,
              chainId,
              signerAddress: activeWallet.address,
            }
          }),
        });

        if (!response.ok) {
          const err = await response.json();
          throw new Error(err.error || "Failed to execute Smart Wallet swap");
        }

        setStatusMessage("Swap executed successfully!");
        onSuccess();
      } else {
        setStatusMessage("Requesting Connected Wallet transaction signature...");
        
        const txHash = await provider.request({
          method: "eth_sendTransaction",
          params: [{
            from: activeWallet.address,
            to: activeWallet.address,
            value: "0x0",
            data: "0x",
          }]
        });

        setStatusMessage("Logging Connected Wallet swap execution...");

        const response = await fetch(`${baseUrl}/api/automations/swap`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            chatId,
            walletType: "connected",
            swapDetails,
            txHash,
            amountOut: estimatedOutputAmount,
          }),
        });

        if (!response.ok) {
          const err = await response.json();
          throw new Error(err.error || "Failed to register Connected Wallet swap");
        }

        setStatusMessage("Swap logged successfully!");
        onSuccess();
      }
    } catch (error: any) {
      console.error("Swap execution failed:", error);
      setErrorMsg(error.message || "Failed to execute swap.");
    } finally {
      setIsExecuting(false);
      setStatusMessage("");
    }
  };

  return (
    <div className="mt-10 w-full max-w-[calc(100vw)] sm:max-w-md px-0.5">
      <Card className="overflow-hidden bg-background border border-sidebar-border shadow-sm backdrop-blur-md rounded-3xl">
        <CardContent className="space-y-4 ">
          <div className="flex items-center justify-between font-semibold mb-1 text-lg">
            <span>DeFi Swap Review</span>
            <Badge variant="outline" className="text-xs px-2 py-0.5 capitalize border-emerald-500/30 text-emerald-500 bg-emerald-500/5">
              {walletType === "smart" ? "Smart Account" : "Connected Wallet"}
            </Badge>
          </div>

          <div className="space-y-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-muted-foreground">Pay with</label>
              <input
                type="text"
                value={fromToken}
                onChange={(e) => setFromToken(e.target.value)}
                className="flex h-10 w-full rounded-xl border border-white/10 bg-zinc-950 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary text-foreground font-medium"
                placeholder="e.g. USDC"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-muted-foreground">Receive</label>
              <input
                type="text"
                value={toToken}
                onChange={(e) => setToToken(e.target.value)}
                className="flex h-10 w-full rounded-xl border border-white/10 bg-zinc-950 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary text-foreground font-medium"
                placeholder="e.g. ETH"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-muted-foreground">Amount (USD)</label>
              <input
                type="number"
                value={amountUsd}
                onChange={(e) => setAmountUsd(Number(e.target.value))}
                className="flex h-10 w-full rounded-xl border border-white/10 bg-zinc-950 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary text-foreground font-medium"
                placeholder="Amount in USD"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-muted-foreground">Execution Wallet</label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant={walletType === "smart" ? "default" : "outline"}
                  className="flex-1 h-9 text-xs font-semibold rounded-xl"
                  onClick={() => setWalletType("smart")}
                >
                  Smart Wallet
                </Button>
                <Button
                  type="button"
                  variant={walletType === "connected" ? "default" : "outline"}
                  className="flex-1 h-9 text-xs font-semibold rounded-xl"
                  onClick={() => setWalletType("connected")}
                >
                  Connected Wallet
                </Button>
              </div>
            </div>

            <div className="border-t border-primary/10 pt-3 mt-3 space-y-2">
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Est. Receive:</span>
                <span className="font-semibold text-foreground">
                  ~ {estimatedOutputAmount} {toToken.toUpperCase()}
                </span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Est. Gas Fee:</span>
                <span className="font-medium text-foreground">$0.15</span>
              </div>
            </div>
          </div>

          {statusMessage && (
            <div className="text-xs font-medium text-primary flex items-center gap-1.5 bg-primary/5 p-2 rounded-md border border-primary/10">
              <Loader2 className="size-3.5 animate-spin" />
              {statusMessage}
            </div>
          )}

          {errorMsg && (
            <div className="text-xs font-medium text-red-500 bg-red-500/5 p-2 rounded-md border border-red-500/10">
              {errorMsg}
            </div>
          )}

          <div className="mt-4 flex gap-2">
            <Button
              size="lg"
              disabled={isExecuting}
              className="flex-1 h-10 text-[15px] font-bold rounded-xl"
              onClick={handleExecute}
            >
              {isExecuting ? "Executing..." : "Execute Swap"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function MessageBubble({
  message,
  onConfirm,
  onToggleStatus,
  onDelete,
  isPendingToggle,
  isPendingDelete,
  chatId,
}: {
  message: ChatMessage;
  onConfirm?: (intentPreview: any) => void;
  onToggleStatus?: (id: string, nextStatus: string) => void;
  onDelete?: (id: string) => void;
  isPendingToggle?: boolean;
  isPendingDelete?: boolean;
  chatId?: string;
}) {
  const router = useRouter();
  const isUser = message.role === "user";

  console.log(message.intentPreview);
  const [copied, setCopied] = React.useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message.content || "");
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch (e) {
      // fallback
      try {
        const ta = document.createElement("textarea");
        ta.value = message.content || "";
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
        setCopied(true);
        setTimeout(() => setCopied(false), 1600);
      } catch (err) {
        console.error("Copy failed", err);
      }
    }
  };

  return (
    <div
      className={cn(
        "flex w-full flex-col gap-2 px-0 py-6 md:px-6",
        isUser ? "items-end" : "items-start",
      )}
    >
      <div className="flex items-center gap-3 w-full max-w-3xl mx-auto">
        <div
          className={cn(
            "flex flex-col gap-2 w-full",
            isUser ? "items-end" : "items-start",
          )}
        >
          <div
            className={cn(
              // Assistant messages should occupy full width; user messages limited to 80%.
              "relative group rounded-3xl rounded-br-none p-4 py-2 text-sm transition-all",
              isUser
                ? "max-w-[70%] ml-auto bg-muted/30"
                : "w-full max-w-full p-0",
            )}
          >
            {message.image && (
              <div className="mb-3 overflow-hidden rounded-xl border border-white/10 shadow-sm">
                <img
                  src={message.image}
                  alt="Uploaded"
                  className="max-h-72 w-full object-cover"
                />
              </div>
            )}
            {isUser ? (
              <div className="whitespace-pre-wrap py-1 leading-relaxed break-words text-[16px]">
                {message.content}
              </div>
            ) : (
              <div className="break-words max-w-full">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    h1: ({ children }) => (
                      <h1 className="text-2xl font-bold mt-4 mb-2 text-foreground">
                        {children}
                      </h1>
                    ),
                    h2: ({ children }) => (
                      <h2 className="text-xl font-bold mt-4 mb-2 text-foreground">
                        {children}
                      </h2>
                    ),
                    h3: ({ children }) => (
                      <h3 className="text-lg font-semibold mt-3 mb-2 text-foreground">
                        {children}
                      </h3>
                    ),
                    p: ({ children }) => (
                      <p className="text-[16px] leading-relaxed text-foreground/90 mt-3 mb-3 last:mb-0">
                        {children}
                      </p>
                    ),
                    ul: ({ children }) => (
                      <ul className="list-disc list-outside space-y-1 mb-3 ml-4 pl-2 text-[16px] text-foreground/90">
                        {children}
                      </ul>
                    ),
                    ol: ({ children }) => (
                      <ol className="list-decimal list-outside space-y-1 mb-3 ml-4 pl-2 text-[16px] text-foreground/90">
                        {children}
                      </ol>
                    ),
                    li: ({ children }) => <li className="pl-1">{children}</li>,
                    blockquote: ({ children }) => (
                      <blockquote className="border-l-2 border-primary/60 bg-primary/5 pl-3 pr-2 py-2 my-3 rounded-r-md italic text-foreground/70 text-[16px]">
                        {children}
                      </blockquote>
                    ),
                    code: ({ inline, className, children, ...props }: any) =>
                      inline ? (
                        <code className="bg-foreground/5 text-primary font-mono text-xs px-1 py-0.5 rounded">
                          {children}
                        </code>
                      ) : (
                        <div className="my-3 overflow-hidden rounded-xl bg-zinc-950 border border-white/10 w-full max-w-full overflow-x-auto">
                          <div className="flex items-center justify-between px-4 py-2 bg-zinc-900 border-b border-white/5 min-w-max">
                            <span className="text-[10px] text-zinc-400 uppercase tracking-widest font-bold">
                              Code
                            </span>
                            <div className="flex gap-1.5">
                              <div className="size-2 rounded-full bg-zinc-700" />
                              <div className="size-2 rounded-full bg-zinc-700" />
                              <div className="size-2 rounded-full bg-zinc-700" />
                            </div>
                          </div>
                          <pre className="p-4 overflow-x-auto min-w-max">
                            <code
                              className="font-mono text-xs leading-relaxed text-emerald-400"
                              {...props}
                            >
                              {children}
                            </code>
                          </pre>
                        </div>
                      ),
                    a: ({ href, children }) => (
                      <a
                        href={href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary underline underline-offset-2 hover:text-primary/80 transition-colors"
                      >
                        {children}
                      </a>
                    ),
                    strong: ({ children }) => (
                      <strong className="font-bold text-foreground">
                        {children}
                      </strong>
                    ),
                    table: ({ children }) => (
                      <div className="overflow-x-auto w-full my-4 border border-border/30 rounded-lg">
                        <table className="w-full border-collapse text-sm text-left whitespace-nowrap md:whitespace-normal">
                          {children}
                        </table>
                      </div>
                    ),
                    thead: ({ children }) => (
                      <thead className="bg-muted/50 border-b border-border/30">
                        {children}
                      </thead>
                    ),
                    th: ({ children }) => (
                      <th className="px-3 py-2 font-semibold text-foreground">
                        {children}
                      </th>
                    ),
                    td: ({ children }) => (
                      <td className="px-3 py-2 text-foreground/80 border-b border-border/10">
                        {children}
                      </td>
                    ),
                  }}
                >
                  {message.content}
                </ReactMarkdown>
              </div>
            )}

            {/* Copy button (desktop only, appears on hover) */}
            <div
              className={cn(
                "absolute -bottom-7.5 flex items-center",
                isUser ? "right-0" : "left-0",
              )}
            >
              <button
                onClick={handleCopy}
                className={cn(
                  "group-hover:opacity-100 transition-opacity bg-transparent flex items-center justify-center p-1 rounded-full text-muted-foreground hover:text-foreground",
                  isUser ? "opacity-0" : "opacity-100",
                )}
                aria-label="Copy message"
                title="Copy message"
              >
                {copied ? (
                  <Check className="size-4 text-emerald-500" />
                ) : (
                  <Copy className="size-4" />
                )}
              </button>

              {!isUser && (
                <>
                  <button
                    className=" ml-2 group-hover:opacity-100 transition-opacity bg-transparent flex items-center justify-center p-1 rounded-full text-muted-foreground hover:text-foreground"
                    aria-label="Like message"
                    title="Like message"
                  >
                    <ThumbsUp className="size-4" />
                  </button>
                  <button
                    className=" ml-1 group-hover:opacity-100 transition-opacity bg-transparent flex items-center justify-center p-1 rounded-full text-muted-foreground hover:text-foreground"
                    aria-label="Dislike message"
                    title="Dislike message"
                  >
                    <ThumbsDown className="size-4" />
                  </button>
                </>
              )}
            </div>
          </div>

          {message.intentPreview && (() => {
            const config = message.intentPreview.trigger.config;
            const isSchedule = message.intentPreview.trigger.type === "schedule";
            const isSwap = message.intentPreview.trigger.type === "swap";
            const fromTokenInfo = config.fromTokenInfo || { symbol: config.fromToken || "USDC", contractAddress: "0x833589fcd6edb6e08f4c7c32d4f71b54bda02913" };
            const toTokenInfo = config.toTokenInfo || { symbol: config.toToken || "ETH", contractAddress: "0x4200000000000000000000000000000000000006" };
            
            const amountUsd = config.amountUsd || 10;
            const frequency = config.frequency || "daily";
            
            const creationDate = new Date(message.intentPreview.createdAt || Date.now());
            const expiresDate = new Date(message.intentPreview.execution?.expiresAt || (Date.now() + 30 * 24 * 3600 * 1000));
            
            const formatDate = (d: Date) => d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
            const formatTime = (d: Date) => d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", timeZoneName: "short" });

            if (isSwap) {
              return (
                <EditableSwapCard 
                  intentPreview={message.intentPreview} 
                  chatId={chatId} 
                  onSuccess={() => {
                    // Sub-component query invalidation refreshes the data automatically
                  }}
                />
              );
            }

            return (
              <div className="mt-10 w-full max-w-[calc(100vw)] sm:max-w-md px-0.5">
                <Card className="overflow-hidden bg-background border border-sidebar-border shadow-sm backdrop-blur-md rounded-3xl">
                  <CardContent className="">
                    <div className="flex items-center gap-2 font-semibold mb-4 text-lg">
                      Automation Summary
                    </div>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center text-md">
                        <span className="text-muted-foreground">Automation</span>
                        <span className="font-semibold capitalize">
                          {isSchedule ? "Recurring Buy" : "Price Condition Trigger"}
                        </span>
                      </div>

                      {isSchedule ? (
                        <>
                          <div className="flex justify-between items-center text-md pt-2">
                            <span className="text-muted-foreground">Buy</span>
                            <span className="font-medium text-right flex items-center gap-1.5">
                              ${amountUsd} <TokenBadge tokenInfo={toTokenInfo} />
                            </span>
                          </div>
                          <div className="flex justify-between items-center text-md pt-2">
                            <span className="text-muted-foreground">Pay with</span>
                            <span className="font-medium text-right">
                              <TokenBadge tokenInfo={fromTokenInfo} />
                            </span>
                          </div>
                          <div className="flex justify-between items-center text-md pt-2">
                            <span className="text-muted-foreground">Schedule</span>
                            <span className="font-medium text-right text-xs sm:text-sm">
                              {getFriendlyScheduleDescription(config.schedule, frequency, config.startDateText)}
                            </span>
                          </div>
                          <div className="flex justify-between items-center text-md pt-2">
                            <span className="text-muted-foreground">Ends</span>
                            <span className="font-medium text-right">
                              {formatDate(expiresDate)}
                            </span>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="flex justify-between items-center text-md pt-2">
                            <span className="text-muted-foreground">Condition</span>
                            <span className="font-medium text-right flex items-center gap-1.5">
                              If <TokenBadge tokenInfo={toTokenInfo} /> {config.conditionType === "drops_below" ? "drops below" : "rises above"} ${config.targetValue}
                            </span>
                          </div>
                          <div className="flex justify-between items-center text-md pt-2">
                            <span className="text-muted-foreground">Action</span>
                            <span className="font-medium text-right flex items-center gap-1.5">
                              Swap ${amountUsd} <TokenBadge tokenInfo={fromTokenInfo} /> for <TokenBadge tokenInfo={toTokenInfo} />
                            </span>
                          </div>
                          <div className="flex justify-between items-center text-md pt-2">
                            <span className="text-muted-foreground">Starts</span>
                            <span className="font-medium text-right">
                              {formatDate(creationDate)}
                            </span>
                          </div>
                          <div className="flex justify-between items-center text-md pt-2">
                            <span className="text-muted-foreground">Ends</span>
                            <span className="font-medium text-right">
                              {formatDate(expiresDate)}
                            </span>
                          </div>
                        </>
                      )}

                      <div className="flex justify-between items-center text-md pt-2">
                        <span className="text-muted-foreground">Est. Fee</span>
                        <span className="font-medium">
                          {message.intentPreview.preview.estimatedFee}
                        </span>
                      </div>

                      {/* Permissions Section */}
                      <div className="border-t border-primary/10 pt-3 mt-3">
                        <span className="text-sm font-semibold text-foreground block mb-2">Qleva can act within these limits:</span>
                        <ul className="text-xs space-y-1.5 text-muted-foreground pl-4 list-disc">
                          <li>Spend up to ${amountUsd} {fromTokenInfo.symbol} per execution</li>
                          <li>Execute {isSchedule ? `once per ${frequency === "daily" ? "day" : frequency === "weekly" ? "week" : "month"}` : "on price condition"}</li>
                          <li>Permission expires {formatDate(expiresDate)}</li>
                        </ul>
                      </div>
                    </div>
                    <div className="mt-4 flex gap-2">
                      <Button
                        type="button"
                        size="lg"
                        className="flex-1 h-10 text-[15px] font-bold rounded-xl"
                        onClick={() => onConfirm?.(message.intentPreview)}
                      >
                        Approve & Sign
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            );
          })()}

          {message.automationPreview && (() => {
            const auto = message.automationPreview;
            const config = auto.trigger?.config || {};
            const isSchedule = auto.trigger?.type === "schedule";
            const fromTokenInfo = config.fromTokenInfo || { symbol: config.fromToken || "USDC" };
            const toTokenInfo = config.toTokenInfo || { symbol: config.toToken || "ETH" };

            const isActive = auto.status === "active";
            const amountUsd = config.amountUsd || 10;
            const frequency = config.frequency || "daily";

            const creationDate = new Date(auto.createdAt || Date.now());
            const expiresDate = new Date(auto.execution?.expiresAt || (Date.now() + 30 * 24 * 3600 * 1000));
            const nextExecutionDate = auto.execution?.nextExecutionAt ? new Date(auto.execution.nextExecutionAt) : null;
            
            const formatDate = (d: Date) => d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
            const formatTime = (d: Date) => d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", timeZoneName: "short" });

            const currentRuns = auto.execution?.currentRuns || 0;
            const accumulatedVolume = currentRuns * amountUsd;

            const handleToggle = () => {
              const nextStatus = isActive ? "paused" : "active";
              onToggleStatus?.(auto.id, nextStatus);
            };

            const handleDelete = () => {
              if (confirm("Are you sure you want to delete this automation?")) {
                onDelete?.(auto.id);
              }
            };

            return (
              <div className="mt-10 w-full max-w-[calc(100vw)] sm:max-w-md px-0.5">
                <Card className="overflow-hidden bg-background border-border shadow-sm backdrop-blur-md">
                  <CardContent className="">
                    <div className="flex justify-between items-center mb-4 pb-1">
                      <div className="flex items-center gap-2 font-semibold text-lg">
                        
                        Active Automation
                      </div>
                      <Badge variant="outline" className="text-xs px-2 py-0.5 capitalize border-emerald-500/30 text-emerald-500 bg-emerald-500/5">
                        {auto.status}
                      </Badge>
                    </div>

                    <div className="space-y-3">
                      <div className="flex justify-between items-center text-md">
                        <span className="text-muted-foreground">Automation</span>
                        <span className="font-semibold capitalize">
                          {isSchedule ? "Recurring Buy" : "Price Condition Trigger"}
                        </span>
                      </div>

                      {isSchedule ? (
                        <>
                          <div className="flex justify-between items-center text-md pt-2">
                            <span className="text-muted-foreground">Buy</span>
                            <span className="font-medium text-right flex items-center gap-1.5">
                              ${amountUsd} <TokenBadge tokenInfo={toTokenInfo} />
                            </span>
                          </div>
                          <div className="flex justify-between items-center text-md pt-2">
                            <span className="text-muted-foreground">Pay with</span>
                            <span className="font-medium text-right">
                              <TokenBadge tokenInfo={fromTokenInfo} />
                            </span>
                          </div>
                          <div className="flex justify-between items-center text-md pt-2">
                            <span className="text-muted-foreground">Frequency</span>
                            <span className="font-medium text-right capitalize">
                              {frequency}
                            </span>
                          </div>
                          <div className="flex justify-between items-center text-md pt-2">
                            <span className="text-muted-foreground">Time</span>
                            <span className="font-medium text-right">
                              {formatTime(creationDate)}
                            </span>
                          </div>
                          <div className="flex justify-between items-center text-md pt-2">
                            <span className="text-muted-foreground">Starts</span>
                            <span className="font-medium text-right">
                              {formatDate(creationDate)}
                            </span>
                          </div>
                          <div className="flex justify-between items-center text-md pt-2">
                            <span className="text-muted-foreground">Ends</span>
                            <span className="font-medium text-right">
                              {formatDate(expiresDate)}
                            </span>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="flex justify-between items-center text-md pt-2">
                            <span className="text-muted-foreground">Condition</span>
                            <span className="font-medium text-right flex items-center gap-1.5">
                              If <TokenBadge tokenInfo={toTokenInfo} /> {config.conditionType === "drops_below" ? "drops below" : "rises above"} ${config.targetValue}
                            </span>
                          </div>
                          <div className="flex justify-between items-center text-md pt-2">
                            <span className="text-muted-foreground">Action</span>
                            <span className="font-medium text-right flex items-center gap-1.5">
                              Swap ${amountUsd} <TokenBadge tokenInfo={fromTokenInfo} /> for <TokenBadge tokenInfo={toTokenInfo} />
                            </span>
                          </div>
                          <div className="flex justify-between items-center text-md pt-2">
                            <span className="text-muted-foreground">Starts</span>
                            <span className="font-medium text-right">
                              {formatDate(creationDate)}
                            </span>
                          </div>
                          <div className="flex justify-between items-center text-md pt-2">
                            <span className="text-muted-foreground">Ends</span>
                            <span className="font-medium text-right">
                              {formatDate(expiresDate)}
                            </span>
                          </div>
                        </>
                      )}

                      {isActive && nextExecutionDate && (
                        <div className="flex justify-between items-center text-md pt-2">
                          <span className="text-muted-foreground">Next Execution</span>
                          <span className="font-medium flex items-center gap-1">
                            <Clock className="size-3.5 text-primary" />
                            {formatDate(nextExecutionDate)}
                          </span>
                        </div>
                      )}

                      <div className="flex justify-between items-center text-md pt-2">
                        <span className="text-muted-foreground">Runs</span>
                        <span className="font-medium">{currentRuns}</span>
                      </div>

                      {/* <div className="flex justify-between items-center text-md pt-2">
                        <span className="text-muted-foreground">Volume</span>
                        <span className="font-semibold text-emerald-500">{formatCurrency(accumulatedVolume)}</span>
                      </div> */}
                    </div>

                    <div className="mt-5 flex flex-col gap-2 border-t border-primary/10 pt-4">
                      <Button
                        size="lg"
                        className="w-full h-10 text-md font-bold bg-primary text-primary-foreground"
                        onClick={() => router.push(`/automations/${auto.id}`)}
                      >
                       View Automation
                      </Button>
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          className="flex-1 h-8 text-[11px] font-bold border-white/10 hover:bg-white/5 rounded-xl"
                          onClick={handleToggle}
                          disabled={isPendingToggle}
                        >
                          {isActive ? "Pause" : "Resume"}
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          className="flex-1 h-8 text-[11px] font-bold border-red-500/20 text-red-500 hover:bg-red-500/10 hover:text-red-400 rounded-xl"
                          onClick={handleDelete}
                          disabled={isPendingDelete}
                        >
                          Delete
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            );
          })()}

          {message.executionStatus && (
            <div className="mt-2">
              <Badge
                variant="outline"
                className={cn(
                  "gap-1.5 py-0.5 px-2.5 text-[10px] font-semibold tracking-tight",
                  message.executionStatus === "completed" &&
                    "border-emerald-500/50 bg-emerald-500/5 text-emerald-500",
                  message.executionStatus === "executing" &&
                    "border-blue-500/50 bg-blue-500/5 text-blue-500",
                  message.executionStatus === "failed" &&
                    "border-red-500/50 bg-red-500/5 text-red-500",
                )}
              >
                {message.executionStatus === "completed" && (
                  <CheckCircle2 className="size-3" />
                )}
                {message.executionStatus === "executing" && (
                  <Loader2 className="size-3 animate-spin" />
                )}
                {message.executionStatus === "failed" && (
                  <XCircle className="size-3" />
                )}
                {message.executionStatus.toUpperCase()}
              </Badge>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

interface ChatContentProps {
  chatId?: string;
}

export function ChatContent({ chatId }: ChatContentProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { getAccessToken } = usePrivy();
  const { data: dummyMessages } = useChatMessages(chatId);
  const [messages, setMessages] = React.useState<ChatMessage[]>([]);
  const toggleMutation = useToggleAutomationStatus();
  const deleteMutation = useDeleteAutomation();
  const [input, setInput] = React.useState("");
  const [streamingSteps, setStreamingSteps] = React.useState<
    { id: string; message: string; status: string; completed: boolean }[]
  >([]);
  const [streamingCollapsed, setStreamingCollapsed] = React.useState(true);
  const [isThinking, setIsThinking] = React.useState(false);
  const [attachedImage, setAttachedImage] = React.useState<string | null>(null);
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const messagesContainerRef = React.useRef<HTMLDivElement | null>(null);
  const [showScrollToBottom, setShowScrollToBottom] = React.useState(false);
  const isMobile = useIsMobile()

  const { wallets } = useWallets();

  const handleApproveAndSign = async (intentPreview: any) => {
    if (isThinking) return;
    setIsThinking(true);
    setStreamingSteps([
      {
        id: "signing",
        message: "Requesting wallet signature for Spend Permission...",
        status: "signing",
        completed: false,
      },
    ]);

    try {
      // Prioritize Privy embedded wallet to ensure social login users sign via Privy
      const activeWallet = wallets.find((w) => w.walletClientType === "privy") ||
                           wallets.find((w) => w.walletClientType === "coinbase_wallet" || w.address.toLowerCase() === intentPreview.smartWalletAddress.toLowerCase()) ||
                           wallets[0];
      
      if (!activeWallet) {
        throw new Error("No active wallet connected. Please connect a wallet first.");
      }

      const provider = await activeWallet.getEthereumProvider();
      
      const tokenAddress = intentPreview.actions?.[0]?.config?.from || "0x833589fcd6edb6e08f4c7c32d4f71b54bda02913"; // Default to USDC
      const amount = intentPreview.actions?.[0]?.config?.amount || 10;
      
      const isEth = tokenAddress.toLowerCase() === "0x4200000000000000000000000000000000000006";
      const allowance = parseUnits(amount.toString(), isEth ? 18 : 6).toString();
      
      const period = 86400; // 1 day
      const start = Math.floor(Date.now() / 1000);
      const end = start + 30 * 24 * 3600; // 30 days
      const salt = Math.floor(Math.random() * 10000000).toString();
      const extraData = "0x";
      const spender = intentPreview.spender || "0x8888888888888888888888888888888888888888";

      let chainId = 84532; // Default to Base Sepolia
      if (activeWallet.chainId) {
        const parsed = parseInt(activeWallet.chainId.replace("eip155:", ""));
        if (!isNaN(parsed)) {
          chainId = parsed;
        }
      }

      const domain = {
        name: "Spend Permission Manager",
        version: "1",
        chainId,
        verifyingContract: "0xf85210B21cC50302F477BA56686d2019dC9b67Ad",
      };

      const SpendPermissionTypes = {
        SpendPermission: [
          { name: "account", type: "address" },
          { name: "spender", type: "address" },
          { name: "token", type: "address" },
          { name: "allowance", type: "uint160" },
          { name: "period", type: "uint48" },
          { name: "start", type: "uint48" },
          { name: "end", type: "uint48" },
          { name: "salt", type: "uint256" },
          { name: "extraData", type: "bytes" },
        ],
      };

      const signature = await provider.request({
        method: "eth_signTypedData_v4",
        params: [
          activeWallet.address,
          JSON.stringify({
            domain,
            types: {
              EIP712Domain: [
                { name: "name", type: "string" },
                { name: "version", type: "string" },
                { name: "chainId", type: "uint256" },
                { name: "verifyingContract", type: "address" },
              ],
              ...SpendPermissionTypes,
            },
            primaryType: "SpendPermission",
            message: {
              account: intentPreview.smartWalletAddress,
              spender,
              token: tokenAddress,
              allowance,
              period,
              start,
              end,
              salt,
              extraData,
            },
          }),
        ],
      });

      setStreamingSteps((prev) => [
        ...prev.map((s) => ({ ...s, completed: true })),
        {
          id: "registering",
          message: "Registering spend permission and activating strategy...",
          status: "registering",
          completed: false,
        },
      ]);

      const token = await getAccessToken();
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

      const response = await fetch(`${baseUrl}/api/automations/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          chatId,
          automation: intentPreview,
          permission: {
            account: intentPreview.smartWalletAddress,
            spender,
            token: tokenAddress,
            allowance,
            period,
            start,
            end,
            salt,
            extraData,
            signature,
            chainId,
            signerAddress: activeWallet.address,
          },
        }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || "Failed to register automation");
      }

      setIsThinking(false);
      setStreamingSteps([]);

      if (chatId) {
        queryClient.invalidateQueries({ queryKey: ["chat-messages", chatId] });
      }
      queryClient.invalidateQueries({ queryKey: ["automations"] });

    } catch (error: any) {
      console.error("[Frontend] HandleApproveAndSign failed:", error);
      setIsThinking(false);
      setStreamingSteps([]);

      const errorMessage: ChatMessage = {
        id: `err_${Date.now()}`,
        role: "assistant",
        content: `⚠️ **Approval Failed**\n\n${error.message || "Could not complete the wallet signature or register the spend permission."}`,
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    }
  };

  React.useEffect(() => {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
    const socket = io(baseUrl, {
      transports: ["websocket"],
    });

    socket.on("connect", () => {
      console.log("Connected to agent event stream");
    });

    socket.on("qleva_event", (event: any) => {
      if (event.type === "AGENT_STATUS_UPDATE") {
        const { status, message } = event.payload;
        setStreamingSteps((prev) => {
          const prevSteps = prev.map((s) => ({ ...s, completed: true }));
          if (
            prevSteps.length > 0 &&
            prevSteps[prevSteps.length - 1].message === message
          ) {
            return prevSteps;
          }
          return [
            ...prevSteps,
            {
              id: Date.now().toString() + Math.random().toString(),
              message,
              status,
              completed: false,
            },
          ];
        });
      } else if (event.type === "AGENT_EXECUTION_DONE") {
        setIsThinking(false);
      }
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  React.useEffect(() => {
    // Only load messages if we are viewing an existing chat
    if (chatId && dummyMessages) {
      setMessages(dummyMessages);
    } else {
      setMessages([]);
    }
  }, [chatId, dummyMessages]);

  React.useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, streamingSteps, isThinking]);

  // Show a "scroll to bottom" button when user scrolls up away from latest messages.
  React.useEffect(() => {
    const el = messagesContainerRef.current;
    if (!el) return;

    const onScroll = () => {
      const threshold = 120; // px
      const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight <= threshold;
      setShowScrollToBottom(!atBottom);
    };

    el.addEventListener("scroll", onScroll, { passive: true });
    // initial check
    onScroll();
    return () => el.removeEventListener("scroll", onScroll);
  }, [messages]);

  const handleSend = async (
    text: string = input,
    img: string | null = attachedImage,
  ) => {
    if (isThinking) return;
    if (!text.trim() && !img) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      content: text,
      timestamp: new Date().toISOString(),
      image: img || undefined,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setAttachedImage(null);
    setStreamingSteps([
      {
        id: "init",
        message: "Qleva is formulating execution script...",
        status: "init",
        completed: false,
      },
    ]);
    setIsThinking(true);

    try {
      const token = await getAccessToken();
      const baseUrl =
        process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

      if (!chatId) {
        // Start a brand new chat session
        const response = await fetch(`${baseUrl}/api/chats`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ message: text }),
        });

        if (!response.ok) {
          throw new Error("Failed to start chat session");
        }

        const data = await response.json();
        const returnedChatId = data.chatId;
        const returnedMessages = data.messages;

        setIsThinking(false);
        setStreamingSteps([]);

        // Cache the returned database messages and route to the new ID!
        queryClient.setQueryData(
          ["chat-messages", returnedChatId],
          returnedMessages,
        );

        // Set local state to show response instantly before transition
        setMessages(returnedMessages);

        router.push(`/chat/${returnedChatId}`);
      } else {
        // Post message to existing chat session
        const response = await fetch(
          `${baseUrl}/api/chats/${chatId}/messages`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ message: text }),
          },
        );

        if (!response.ok) {
          throw new Error("Failed to send message");
        }

        const aiMessage = await response.json();

        setIsThinking(false);
        setStreamingSteps([]);
        setMessages((prev) => {
          const finalMessages = [...prev, aiMessage];
          // Update Query cache for this chat session
          queryClient.setQueryData(["chat-messages", chatId], finalMessages);
          return finalMessages;
        });
      }
    } catch (error) {
      console.error("[ChatContent] API execution error:", error);
      setIsThinking(false);
      setStreamingSteps([]);

      const errorMessage: ChatMessage = {
        id: `err_${Date.now()}`,
        role: "assistant",
        content:
          "⚠️ **System Communication Issue**\n\nI was unable to establish a secure link with the decentralized execution node. Please make sure the service is online and try again.",
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    }
  };

  const hasMessages = messages.length > 0;

  return (
    <AppShell>
      <div className="relative -mt-2 md:-mt-4 flex md:h-[calc(100svh-4rem)] w-full flex-col overflow-hidden bg-background">
        <AnimatePresence>
          {!hasMessages && !chatId ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, y: -20 }}
              className="flex-1 flex flex-col items-center p-4 text-center z-0"
            >
              <motion.div className="mt-18 md:16">
                <h1 className="text-3xl font-bold tracking-tight mb-2">
                  How can I help you?
                </h1>
                <p className="text-muted-foreground max-w-md mx-auto text-md">
                  I'm your decentralized agent. I can help with swaps and
                  complex automations.
                </p>
              </motion.div>
            </motion.div>
          ) : (
            <div ref={messagesContainerRef} className="flex-1 overflow-y-auto scroll-smooth no-scrollbar">
              <div className="mx-auto max-w-4xl pb-30">
                {messages.map((msg) => (
                  <MessageBubble
                    key={msg.id}
                    message={msg}
                    chatId={chatId}
                    onConfirm={(intentPreview) => handleApproveAndSign(intentPreview)}
                    onToggleStatus={(id, status) => toggleMutation.mutate({ id, status })}
                    onDelete={(id) => deleteMutation.mutate(id)}
                    isPendingToggle={toggleMutation.isPending}
                    isPendingDelete={deleteMutation.isPending}
                  />
                ))}
                {isThinking && streamingSteps.length > 0 && (
                  <div onClick={() => setStreamingCollapsed((s) => !s)} className="cursor-pointer flex flex-col gap-2 w-full max-w-3xl mx-auto mt-4 px-0 md:px-0">
                    <div className="flex items-center gap-6 max-w-[80%]">
                      <div className="flex items-center gap-2 text-sm font-semibold text-foreground/90">
                        <ShinyText
                          text="Thinking..."
                          speed={2}
                          delay={0}
                          color="#a1a1a1"
                          shineColor="#ffffff"
                          spread={120}
                          direction="left"
                          yoyo={false}
                          pauseOnHover={false}
                          disabled={false}
                        />
                      </div>
                      <button
                        aria-label={
                          streamingCollapsed
                            ? "Expand thinking steps"
                            : "Collapse thinking steps"
                        }
                        title={
                          streamingCollapsed
                            ? "Show all steps"
                            : "Show only last two"
                        }
                        
                        className="group flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {streamingCollapsed ? (
                          <ChevronDown className="size-4" />
                        ) : (
                          <ChevronUp className="size-4" />
                        )}
                      </button>
                    </div>

                    <div className="flex flex-col gap-2 border-white/5 max-w-[80%]">
                      {(streamingCollapsed
                        ? streamingSteps.slice(-2)
                        : streamingSteps
                      ).map((step) => (
                        <div key={step.id} className="flex items-start gap-3">
                          {step.completed ? (
                            <CheckCircle2 className="size-4 text-emerald-500 mt-0.5" />
                          ) : (
                            <Loader2 className="size-4 animate-spin text-primary mt-0.5" />
                          )}
                          <span
                            className={cn(
                              "text-sm font-medium tracking-tight",
                              step.completed
                                ? "text-muted-foreground"
                                : "text-foreground",
                            )}
                          >
                            {step.message}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                <div ref={scrollRef} className="h-4" />
              </div>
            </div>
          )}
        </AnimatePresence>

        {/* Scroll-to-bottom button */}
        {showScrollToBottom && (
          <div className="fixed md:right-8 z-400" style={{ bottom: 120 }}>
            <Button
              variant="secondary"
              size="icon-lg"
              onClick={() => scrollRef.current?.scrollIntoView({ behavior: "smooth" })}
              className="rounded-full bg-primary text-primary-foreground shadow-lg p-2"
              aria-label="Scroll to latest"
              title="Scroll to latest"
            >
              <ChevronDown className="size-5" />
            </Button>
          </div>
        )}

        {/* Input Area */}
        <div
          className={cn(
            "fixed md:absolute left-0 right-0 z-20 px-3 bg-linear-to-b from-background/10 rounded-3xl via-background to-background md:pb-2 pb-4",
            hasMessages || isMobile || chatId 
              ? "bottom-0 md:bottom-0"
              : "top-100 md:top-80 -translate-y-1/2",
          )}
        >
          <div
            className={`mx-auto w-full ${hasMessages || chatId ? "max-w-3xl" : "max-w-2xl"}`}
          >
            {/* Suggestion chips above input when starting a new chat (placed right on top of input) */}
            {!hasMessages && !chatId && isMobile && (
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 }}
                className="mb-3 flex justify-start overflow-scroll gap-2 max-w-2xl mx-auto px-2"
              >
                {suggestionChips.map((chip, i) => (
                  <Button
                    key={i}
                    variant="outline"
                    size="sm"
                    className="h-10 md:h-9 rounded-xl bg-card/50 backdrop-blur-md border-border/50 hover:bg-primary/10 hover:text-primary hover:border-primary/50 transition-all gap-2"
                    onClick={() => handleSend(chip.label)}
                  >
                    <span className="text-primary">{chip.icon}</span>
                    <span className="text-[11px] font-semibold">{chip.label}</span>
                  </Button>
                ))}
              </motion.div>
            )}
            <Card className="overflow-hidden border bg-sidebar text-sidebar-foreground border-sidebar-border rounded-3xl ">
              <CardContent className="p-0">
                <div className="flex items-end gap-3 px-3">
                  <Textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Ask Qleva anything..."
                    className="max-h-[180px] -mt-1 overflow-y-auto focus-visible:ring-0 rounded-0 resize-none p-1 custom-scrollbar "
                    style={{
                      backgroundColor: "transparent",
                      border: "0",
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        if (!isThinking) handleSend();
                      }
                    }}
                  />
                  <div className="flex items-center gap-4 -mb-1">
                    <Button
                      size="icon-lg"
                      onClick={() => handleSend()}
                      disabled={(!input.trim() && !attachedImage) || isThinking}
                    >
                      <ArrowUp className="size-5 font-bold" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {hasMessages || isMobile || chatId ? (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className=""
              ></motion.p>
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="mt-4 flex flex-wrap justify-center gap-2 max-w-2xl mx-auto"
              >
                {suggestionChips.map((chip, i) => (
                  <Button
                    key={i}
                    variant="outline"
                    size="sm"
                    className="h-10 md:h-9 rounded-xl bg-card/50 backdrop-blur-md border-border/50 hover:bg-primary/10 hover:text-primary hover:border-primary/50 transition-all gap-2"
                    onClick={() => handleSend(chip.label)}
                  >
                    <span className="text-primary">{chip.icon}</span>
                    <span className="text-[11px] font-semibold">
                      {chip.label}
                    </span>
                  </Button>
                ))}
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
