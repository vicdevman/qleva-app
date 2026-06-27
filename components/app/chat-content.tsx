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
  Loader,
  DollarSign,
  ArrowBigDown,
  ArrowDown,
} from "lucide-react";
import { AppShell } from "@/components/app/app-shell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useChatMessages, useSendMessage, useToggleAutomationStatus, useDeleteAutomation, usePortfolio } from "@/lib/query-hooks";
import { useQueryClient } from "@tanstack/react-query";
import { usePrivy, useWallets } from "@privy-io/react-auth";
import { parseUnits, createPublicClient, createWalletClient, custom } from "viem";
import { base, baseSepolia } from "viem/chains";
import { cn, getFriendlyScheduleDescription } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { useWalletStore } from "@/stores/wallet-store";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

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
  const symbol = tokenInfo.symbol || "USDC";
  const logoUrl = tokenInfo.logoUrl || (symbol.toUpperCase() === "ETH"
    ? "https://dd.dexscreener.com/ds-data/tokens/base/0x4200000000000000000000000000000000000006.png"
    : symbol.toUpperCase() === "USDC"
      ? "https://dd.dexscreener.com/ds-data/tokens/base/0x833589fcd6edb6e08f4c7c32d4f71b54bda02913.png"
      : "/Base_square_blue.png");
  return (
    <span className="inline-flex items-center gap-1.5 align-middle">
      <TokenLink tokenInfo={tokenInfo} />
      {logoUrl && (
        <img
          src={logoUrl}
          alt=""
          className="size-5 p-0.5 object-cover border border-white/10"
          onError={(e) => {
            (e.target as HTMLImageElement).src = "/Base_square_blue.png";
          }}
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
  responseDuration?: number;
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
  { label: "Buy $100 ETH", icon: <DollarSign className="size-3" /> },
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
  isExpired?: boolean;
}

interface TokenInfo {
  symbol: string;
  contractAddress: string;
  decimals: number;
  logoUrl?: string;
  priceUsd?: number;
  name?: string;
}

const fallbackBaseLogo = "/Base_square_blue.png";

const POPULAR_TOKENS: TokenInfo[] = [
  {
    symbol: "ETH",
    name: "Ethereum",
    contractAddress: "0x4200000000000000000000000000000000000006",
    decimals: 18,
    logoUrl: "https://dd.dexscreener.com/ds-data/tokens/base/0x4200000000000000000000000000000000000006.png",
    priceUsd: 3500.0,
  },
  {
    symbol: "USDC",
    name: "USD Coin",
    contractAddress: "0x833589fcd6edb6e08f4c7c32d4f71b54bda02913",
    decimals: 6,
    logoUrl: "https://dd.dexscreener.com/ds-data/tokens/base/0x833589fcd6edb6e08f4c7c32d4f71b54bda02913.png",
    priceUsd: 1.0,
  },
  {
    symbol: "USDT",
    name: "Tether",
    contractAddress: "0x50c5725949a6f0c72e6c4a641f24029a262da18a",
    decimals: 6,
    logoUrl: "https://dd.dexscreener.com/ds-data/tokens/base/0x50c5725949a6f0c72e6c4a641f24029a262da18a.png",
    priceUsd: 1.0,
  },
  {
    symbol: "WBTC",
    name: "Wrapped BTC",
    contractAddress: "0x03c6b2015b50c0c6e83863d0246a48235272a088",
    decimals: 8,
    logoUrl: "https://dd.dexscreener.com/ds-data/tokens/base/0x03c6b2015b50c0c6e83863d0246a48235272a088.png",
    priceUsd: 68000.0,
  },
  {
    symbol: "DEGEN",
    name: "Degen",
    contractAddress: "0x4ed4e862860bed51a9570b96d89af5e1b0efefed",
    decimals: 18,
    logoUrl: "https://dd.dexscreener.com/ds-data/tokens/base/0x4ed4e862860bed51a9570b96d89af5e1b0efefed.png",
  }
];

const fetchTokenPrice = async (address: string): Promise<number | null> => {
  try {
    const res = await fetch(`https://api.dexscreener.com/latest/dex/tokens/${address}`);
    if (!res.ok) return null;
    const data = await res.json();
    if (data?.pairs?.length) {
      const basePair = data.pairs.find((p: any) => p.chainId === "base") || data.pairs[0];
      return basePair.priceUsd ? Number(basePair.priceUsd) : null;
    }
  } catch (e) {
    console.error("Error fetching price for token", address, e);
  }
  return null;
};

const searchTokens = async (query: string): Promise<TokenInfo[]> => {
  if (!query) return [];
  try {
    const res = await fetch(`https://api.dexscreener.com/latest/dex/search?q=${encodeURIComponent(query)}`);
    if (!res.ok) return [];
    const data = await res.json();
    if (!data?.pairs) return [];

    // Filter pairs on Base chain
    const basePairs = data.pairs.filter((p: any) => p.chainId === "base");
    const tokensMap = new Map<string, TokenInfo>();

    for (const pair of basePairs) {
      if (pair.baseToken) {
        const addr = pair.baseToken.address.toLowerCase();
        if (!tokensMap.has(addr)) {
          tokensMap.set(addr, {
            symbol: pair.baseToken.symbol.toUpperCase(),
            name: pair.baseToken.name,
            contractAddress: pair.baseToken.address,
            logoUrl: pair.info?.imageUrl,
            priceUsd: pair.priceUsd ? Number(pair.priceUsd) : undefined,
            decimals: addr === "0x4200000000000000000000000000000000000006" ? 18 : (addr === "0x833589fcd6edb6e08f4c7c32d4f71b54bda02913" ? 6 : 18)
          });
        }
      }
      if (pair.quoteToken) {
        const addr = pair.quoteToken.address.toLowerCase();
        if (!tokensMap.has(addr)) {
          tokensMap.set(addr, {
            symbol: pair.quoteToken.symbol.toUpperCase(),
            name: pair.quoteToken.name,
            contractAddress: pair.quoteToken.address,
            logoUrl: pair.info?.imageUrl,
            priceUsd: undefined,
            decimals: addr === "0x4200000000000000000000000000000000000006" ? 18 : (addr === "0x833589fcd6edb6e08f4c7c32d4f71b54bda02913" ? 6 : 18)
          });
        }
      }
    }
    return Array.from(tokensMap.values()).slice(0, 20);
  } catch (e) {
    console.error(e);
    return [];
  }
};

export function EditableSwapCard({ intentPreview, chatId, onSuccess, isExpired = false }: EditableSwapCardProps) {
  const config = intentPreview.trigger?.config || {};
  const { wallets } = useWallets();
  const { getAccessToken } = usePrivy();
  const queryClient = useQueryClient();
  const { data: portfolio } = usePortfolio();

  const [fromToken, setFromToken] = React.useState<TokenInfo>({
    symbol: config.fromTokenInfo?.symbol || config.fromToken || "USDC",
    contractAddress: config.fromTokenInfo?.contractAddress || resolveTokenAddress(config.fromToken || "USDC"),
    decimals: config.fromTokenInfo?.decimals || (config.fromToken?.toLowerCase() === "eth" ? 18 : 6),
    logoUrl: config.fromTokenInfo?.logoUrl || (config.fromToken?.toLowerCase() === "eth"
      ? "https://dd.dexscreener.com/ds-data/tokens/base/0x4200000000000000000000000000000000000006.png"
      : config.fromToken?.toLowerCase() === "usdc"
        ? "https://dd.dexscreener.com/ds-data/tokens/base/0x833589fcd6edb6e08f4c7c32d4f71b54bda02913.png"
        : undefined),
    priceUsd: config.fromTokenInfo?.priceUsd || undefined,
    name: config.fromTokenInfo?.name || config.fromToken || "USD Coin",
  });

  const [toToken, setToToken] = React.useState<TokenInfo>({
    symbol: config.toTokenInfo?.symbol || config.toToken || "ETH",
    contractAddress: config.toTokenInfo?.contractAddress || resolveTokenAddress(config.toToken || "ETH"),
    decimals: config.toTokenInfo?.decimals || (config.toToken?.toLowerCase() === "eth" ? 18 : 6),
    logoUrl: config.toTokenInfo?.logoUrl || (config.toToken?.toLowerCase() === "eth"
      ? "https://dd.dexscreener.com/ds-data/tokens/base/0x4200000000000000000000000000000000000006.png"
      : config.toToken?.toLowerCase() === "usdc"
        ? "https://dd.dexscreener.com/ds-data/tokens/base/0x833589fcd6edb6e08f4c7c32d4f71b54bda02913.png"
        : undefined),
    priceUsd: config.toTokenInfo?.priceUsd || undefined,
    name: config.toTokenInfo?.name || config.toToken || "Ethereum",
  });

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
    if (info && info.priceUsd) {
      return info.priceUsd;
    }
    return defaultPrices[sym] || 1.0;
  };

  const fromTokenPrice = fromToken.priceUsd || getPrice(fromToken.symbol, fromToken);
  const toTokenPrice = toToken.priceUsd || getPrice(toToken.symbol, toToken);

  const [fromAmount, setFromAmount] = React.useState<string>(
    config.amountUsd ? (config.amountUsd / fromTokenPrice).toFixed(4) : "10"
  );
  const [walletType, setWalletType] = React.useState<"smart" | "connected">(config.walletType || "smart");

  const [isExecuting, setIsExecuting] = React.useState(false);
  const [statusMessage, setStatusMessage] = React.useState("");
  const [errorMsg, setErrorMsg] = React.useState("");

  const IS_TEST_MODE = process.env.NEXT_PUBLIC_TEST_MODE === "true";
  const ROUTER_ADDRESS = IS_TEST_MODE
    ? "0x94cC0AaC535CCDB3C01d6787D6413C739ae12bc4" // Base Sepolia
    : "0x2626664c2603336E57B271c5C0b26F421741e481"; // Base Mainnet

  const [estimatedGasFeeUsd, setEstimatedGasFeeUsd] = React.useState<string>("$0.15");

  React.useEffect(() => {
    const fetchGasFee = async () => {
      try {
        let activeWallet = null;
        if (walletType === "connected") {
          const storeConnectedAddr = useWalletStore.getState().wallets.find(w => w.type === "connected")?.address;
          if (storeConnectedAddr) {
            activeWallet = wallets.find(w => w.address.toLowerCase() === storeConnectedAddr.toLowerCase());
          }
          if (!activeWallet) {
            activeWallet = wallets.find(w => w.walletClientType !== "privy");
          }
        }
        if (!activeWallet) {
          activeWallet = wallets.find((w) => w.walletClientType === "privy") ||
            wallets.find((w) => w.walletClientType === "coinbase_wallet") ||
            wallets[0];
        }
        if (!activeWallet) return;
        const customProvider = await activeWallet.getEthereumProvider();
        const chain = IS_TEST_MODE ? baseSepolia : base;
        const publicClient = createPublicClient({
          chain,
          transport: custom(customProvider)
        });
        const gasPrice = await publicClient.getGasPrice();
        const gasLimit = BigInt(130000);
        const totalGasWei = gasPrice * gasLimit;
        const gasEth = Number(totalGasWei) / 1e18;
        const ethPrice = await fetchTokenPrice("0x4200000000000000000000000000000000000006") || 3500;
        const feeUsd = gasEth * ethPrice;
        setEstimatedGasFeeUsd(`$${feeUsd.toFixed(2)}`);
      } catch (err) {
        console.error("Error estimating client-side gas fee:", err);
      }
    };
    fetchGasFee();
  }, [wallets, walletType, fromAmount, fromToken]);

  // Search Dialog States
  const [activeSelector, setActiveSelector] = React.useState<"from" | "to" | null>(null);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [searchResults, setSearchResults] = React.useState<TokenInfo[]>([]);
  const [isSearching, setIsSearching] = React.useState(false);

  // Fetch prices on load if not present
  React.useEffect(() => {
    const loadPrices = async () => {
      if (!fromToken.priceUsd) {
        const p = await fetchTokenPrice(fromToken.contractAddress);
        if (p) setFromToken(prev => ({ ...prev, priceUsd: p }));
      }
      if (!toToken.priceUsd) {
        const p = await fetchTokenPrice(toToken.contractAddress);
        if (p) setToToken(prev => ({ ...prev, priceUsd: p }));
      }
    };
    loadPrices();
  }, [fromToken.contractAddress, toToken.contractAddress]);

  // DexScreener search effect
  React.useEffect(() => {
    if (!searchQuery) {
      setSearchResults([]);
      return;
    }
    const delayDebounce = setTimeout(async () => {
      setIsSearching(true);
      const results = await searchTokens(searchQuery);
      setSearchResults(results);
      setIsSearching(false);
    }, 450);
    return () => clearTimeout(delayDebounce);
  }, [searchQuery]);

  // Wallet Awareness
  const hasSmartWallet = !!intentPreview.smartWalletAddress;
  const hasConnectedWallet = wallets && wallets.length > 0;

  React.useEffect(() => {
    if (walletType === "smart" && !hasSmartWallet && hasConnectedWallet) {
      setWalletType("connected");
    } else if (walletType === "connected" && !hasConnectedWallet && hasSmartWallet) {
      setWalletType("smart");
    }
  }, [hasSmartWallet, hasConnectedWallet, walletType]);

  // Available balance
  const balanceAsset = portfolio?.topAssets?.find(
    (a: any) => a.symbol?.toUpperCase() === fromToken.symbol?.toUpperCase()
  );
  const availableBalance = balanceAsset ? balanceAsset.balance : 0;

  const amountUsd = parseFloat(fromAmount) * fromTokenPrice || 0;
  const estimatedOutputAmount = toTokenPrice > 0 ? (amountUsd / toTokenPrice) : 0;

  const handleMax = () => {
    if (availableBalance > 0) {
      setFromAmount(availableBalance.toString());
    }
  };

  const handleSwapTokens = () => {
    const temp = fromToken;
    setFromToken(toToken);
    setToToken(temp);
    if (estimatedOutputAmount > 0) {
      setFromAmount(estimatedOutputAmount.toFixed(4));
    }
  };

  const handleSelectToken = async (token: TokenInfo) => {
    let price = token.priceUsd;
    if (!price) {
      price = await fetchTokenPrice(token.contractAddress) || 1.0;
    }
    const tokenWithPrice = { ...token, priceUsd: price };
    if (activeSelector === "from") {
      setFromToken(tokenWithPrice);
    } else {
      setToToken(tokenWithPrice);
    }
    setActiveSelector(null);
    setSearchQuery("");
  };

  const handleExecute = async () => {
    if (isExecuting) return;
    setIsExecuting(true);
    setErrorMsg("");
    setStatusMessage("Connecting to wallet...");

    try {
      let activeWallet = null;
      if (walletType === "connected") {
        const storeConnectedAddr = useWalletStore.getState().wallets.find(w => w.type === "connected")?.address;
        if (storeConnectedAddr) {
          activeWallet = wallets.find(w => w.address.toLowerCase() === storeConnectedAddr.toLowerCase());
        }
        if (!activeWallet) {
          activeWallet = wallets.find(w => w.walletClientType !== "privy");
        }
      }

      if (!activeWallet) {
        activeWallet = wallets.find((w) => w.walletClientType === "privy") ||
          wallets.find((w) => w.walletClientType === "coinbase_wallet") ||
          wallets[0];
      }

      if (!activeWallet) {
        throw new Error("No active wallet connected. Please connect a wallet first.");
      }

      const provider = await activeWallet.getEthereumProvider();
      const token = await getAccessToken();
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

      const swapDetails = {
        fromToken: {
          contractAddress: fromToken.contractAddress,
          symbol: fromToken.symbol.toUpperCase(),
          decimals: fromToken.decimals,
          name: fromToken.name || fromToken.symbol.toUpperCase(),
          priceUsd: fromTokenPrice
        },
        toToken: {
          contractAddress: toToken.contractAddress,
          symbol: toToken.symbol.toUpperCase(),
          decimals: toToken.decimals,
          name: toToken.name || toToken.symbol.toUpperCase(),
          priceUsd: toTokenPrice
        },
        amountUsd
      };

      if (walletType === "smart") {
        setStatusMessage("Requesting Smart Wallet Spend Permission signature...");

        const allowance = parseUnits(fromAmount, fromToken.decimals).toString();
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
                token: fromToken.contractAddress,
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
              token: fromToken.contractAddress,
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
        setStatusMessage("Initializing transaction client...");
        const customProvider = await activeWallet.getEthereumProvider();
        const chain = IS_TEST_MODE ? baseSepolia : base;
        const publicClient = createPublicClient({
          chain,
          transport: custom(customProvider)
        });
        const walletClient = createWalletClient({
          chain,
          transport: custom(customProvider)
        });

        const fromTokenAddress = fromToken.contractAddress;
        const toTokenAddress = toToken.contractAddress;
        const amountInWei = parseUnits(fromAmount, fromToken.decimals);
        const userAddress = activeWallet.address as `0x${string}`;

        // 1. ERC-20 approval check
        const isNativeEth = fromTokenAddress.toLowerCase() === "0x0000000000000000000000000000000000000000";
        if (!isNativeEth) {
          setStatusMessage("Checking token allowance...");
          const allowance = await publicClient.readContract({
            address: fromTokenAddress as `0x${string}`,
            abi: [
              {
                constant: true,
                inputs: [
                  { name: "_owner", type: "address" },
                  { name: "_spender", type: "address" }
                ],
                name: "allowance",
                outputs: [{ name: "", type: "uint256" }],
                type: "function"
              }
            ],
            functionName: "allowance",
            args: [userAddress, ROUTER_ADDRESS]
          }) as bigint;

          if (allowance < amountInWei) {
            setStatusMessage(`Approving Swap Router to spend your ${fromToken.symbol}...`);
            const approveHash = await walletClient.writeContract({
              address: fromTokenAddress as `0x${string}`,
              abi: [
                {
                  inputs: [
                    { name: "spender", type: "address" },
                    { name: "amount", type: "uint256" }
                  ],
                  name: "approve",
                  outputs: [{ name: "", type: "boolean" }],
                  type: "function"
                }
              ],
              functionName: "approve",
              account: userAddress,
              args: [ROUTER_ADDRESS, amountInWei]
            });
            setStatusMessage("Waiting for approval confirmation...");
            await publicClient.waitForTransactionReceipt({ hash: approveHash });
          }
        }

        // 2. Perform exactInputSingle swap
        setStatusMessage(`Requesting Uniswap swap transaction signature...`);
        let amountOutMin = BigInt(0);
        const priceIn = fromTokenPrice;
        const priceOut = toTokenPrice;
        if (priceIn && priceOut) {
          const expectedOut = (parseFloat(fromAmount) * priceIn) / priceOut;
          const minOut = expectedOut * 0.995; // 0.5% slippage
          amountOutMin = parseUnits(minOut.toFixed(toToken.decimals > 6 ? 6 : toToken.decimals), toToken.decimals);
        }

        const swapParams = {
          tokenIn: fromTokenAddress as `0x${string}`,
          tokenOut: toTokenAddress as `0x${string}`,
          fee: 3000,
          recipient: userAddress,
          amountIn: amountInWei,
          amountOutMinimum: amountOutMin,
          sqrtPriceLimitX96: BigInt(0),
        };

        const txHash = await walletClient.writeContract({
          address: ROUTER_ADDRESS,
          abi: [
            {
              inputs: [
                {
                  components: [
                    { name: "tokenIn", type: "address" },
                    { name: "tokenOut", type: "address" },
                    { name: "fee", type: "uint24" },
                    { name: "recipient", type: "address" },
                    { name: "amountIn", type: "uint256" },
                    { name: "amountOutMinimum", type: "uint256" },
                    { name: "sqrtPriceLimitX96", type: "uint160" }
                  ],
                  name: "params",
                  type: "tuple"
                }
              ],
              name: "exactInputSingle",
              outputs: [{ name: "amountOut", type: "uint256" }],
              type: "function"
            }
          ],
          functionName: "exactInputSingle",
          account: userAddress,
          args: [swapParams]
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
            amountOut: estimatedOutputAmount.toFixed(6),
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
    <div className="mt-10 w-full max-w-[calc(100vw)] sm:max-w-md space-y-4 px-0.5">
      {isExpired && (
        <div className="text-xs font-semibold text-amber-500 bg-amber-500/10 p-2 rounded-xl">
          This swap preview has expired. Please request a new swap strategy to regenerate.
        </div>
      )}

      {/* Stacked Panels Container */}
      <div className="relative space-y-1.5">

        {/* Top Panel (Sell) */}
        <div className="bg-card border border-border rounded-3xl p-5 flex flex-col gap-2.5">
          <div className="flex justify-between items-center">
            <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Sell</span>
            {/* Balance */}
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-semibold">
              <span>Balance: {availableBalance.toFixed(4)} {fromToken.symbol}</span>
              {availableBalance > 0 && (
                <button
                  type="button"
                  disabled={isExpired}
                  onClick={!isExpired ? handleMax : undefined}
                  className={cn("bg-muted hover:bg-muted/80 text-foreground font-bold px-2 py-1 rounded-md text-[9px] uppercase transition-all cursor-pointer", isExpired && "opacity-50 cursor-not-allowed")}
                >
                  Max
                </button>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between gap-4">
            {/* Input */}
            <input
              type="number"
              value={fromAmount}
              disabled={isExpired}
              onChange={(e) => setFromAmount(e.target.value)}
              className="bg-transparent border-0 text-foreground text-3xl font-semibold w-full focus:outline-none focus:ring-0 p-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none disabled:opacity-50"
              placeholder="0"
            />

            {/* Token Selector */}
            <button
              type="button"
              disabled={isExpired}
              onClick={() => !isExpired && setActiveSelector("from")}
              className={cn("flex items-center gap-2 bg-muted/30 hover:bg-muted/80 border border-border rounded-full pl-2 pr-3 py-1.5 text-foreground font-bold transition-all shrink-0 cursor-pointer", isExpired && "opacity-50 cursor-not-allowed")}
            >
              <img
                src={fromToken.logoUrl || fallbackBaseLogo}
                className="size-5 rounded-full object-cover border border-border"
                alt=""
                onError={(e) => { (e.target as HTMLImageElement).src = fallbackBaseLogo; }}
              />
              <span className="text-xs tracking-tight">{fromToken.symbol}</span>
              <ChevronDown className="size-3 text-muted-foreground" />
            </button>
          </div>

          {/* Estimated USD Value */}
          <div className="text-[11px] text-muted-foreground font-semibold">
            {fromAmount && !isNaN(parseFloat(fromAmount)) ? (
              <span>{formatCurrency(parseFloat(fromAmount) * fromTokenPrice)}</span>
            ) : (
              <span>$0.00</span>
            )}
          </div>
        </div>

        {/* Swap Direction Switch Button */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
          <button
            type="button"
            disabled={isExpired}
            onClick={!isExpired ? handleSwapTokens : undefined}
            className={cn("bg-card text-foreground border border-border size-9 rounded-full flex items-center justify-center transition-all active:scale-95 cursor-pointer", isExpired && "opacity-50 cursor-not-allowed")}
          >
            <ArrowRightLeft className="size-3.5 rotate-90 text-primary" />
          </button>
        </div>

        {/* Bottom Panel (Buy) */}
        <div className="bg-card border border-border shadow-sm rounded-3xl p-5 flex flex-col gap-2.5">
          <div className="flex justify-between items-center">
            <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Buy</span>
          </div>

          <div className="flex items-center justify-between gap-4">
            {/* Estimated output display */}
            <div className="text-foreground text-3xl font-semibold w-full select-all">
              {estimatedOutputAmount > 0 ? estimatedOutputAmount.toFixed(4) : "0"}
            </div>

            {/* Token Selector */}
            <button
              type="button"
              disabled={isExpired}
              onClick={() => !isExpired && setActiveSelector("to")}
              className={cn("flex items-center gap-2 bg-muted/30 hover:bg-muted/80 border border-border rounded-full pl-2 pr-3 py-1.5 text-foreground font-bold transition-all shrink-0 cursor-pointer", isExpired && "opacity-50 cursor-not-allowed")}
            >
              <img
                src={toToken.logoUrl || fallbackBaseLogo}
                className="size-5 rounded-full object-cover border border-border"
                alt=""
                onError={(e) => { (e.target as HTMLImageElement).src = fallbackBaseLogo; }}
              />
              <span className="text-xs tracking-tight">{toToken.symbol}</span>
              <ChevronDown className="size-3 text-muted-foreground" />
            </button>
          </div>

          {/* Estimated USD Value */}
          <div className="text-[11px] text-muted-foreground font-semibold">
            {estimatedOutputAmount > 0 ? (
              <span>{formatCurrency(estimatedOutputAmount * toTokenPrice)}</span>
            ) : (
              <span>$0.00</span>
            )}
          </div>
        </div>
      </div>

      {/* Wallet Selection / Awareness Section */}
      {hasSmartWallet && hasConnectedWallet ? (
        <div className="flex flex-col gap-2">
          {/* <div className="flex justify-between items-center text-xs text-muted-foreground font-semibold px-0.5">
            <span>Pay With Wallet</span>
            <span className="text-[10px] text-muted-foreground font-mono truncate max-w-[200px]">
              {walletType === "smart" ? intentPreview.smartWalletAddress : wallets[0]?.address}
            </span>
          </div> */}
          <div className="flex gap-2">
            <button
              type="button"
              disabled={isExpired}
              onClick={() => !isExpired && setWalletType("smart")}
              className={cn(
                "flex-1 py-3 text-xs font-bold rounded-xl transition-all border cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed",
                walletType === "smart"
                  ? "bg-[#ffce48]/20 text-foreground border-none"
                  : "bg-muted/30 text-muted-foreground border-none hover:bg-muted/80 hover:text-foreground"
              )}
            >
              Smart Wallet
            </button>
            <button
              type="button"
              disabled={isExpired}
              onClick={() => !isExpired && setWalletType("connected")}
              className={cn(
                "flex-1 py-3 text-xs font-bold rounded-xl transition-all border cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed",
                walletType === "connected"
                  ? "bg-[#ffce48]/20 text-foreground border-none"
                  : "bg-muted/30 text-muted-foreground border-none hover:bg-muted/80 hover:text-foreground"
              )}
            >
              Connected Wallet
            </button>
          </div>
        </div>
      ) : (
        <div className="flex justify-between items-center bg-card border border-border px-5 py-3.5 rounded-3xl shadow-sm text-xs sm:text-sm">
          <span className="text-muted-foreground font-semibold text-xs">Wallet</span>
          <div className="text-right">
            <span className="font-bold text-foreground text-xs">
              {hasSmartWallet ? "Smart Wallet" : "Connected Wallet"}
            </span>
            <p className="text-[10px] text-muted-foreground font-mono mt-0.5">
              {hasSmartWallet
                ? `${intentPreview.smartWalletAddress.slice(0, 6)}...${intentPreview.smartWalletAddress.slice(-4)}`
                : wallets[0] ? `${wallets[0].address.slice(0, 6)}...${wallets[0].address.slice(-4)}` : ""
              }
            </p>
          </div>
        </div>
      )}



      {/* Market Information Section */}
      <div className="border-t border-border pt-3.5 space-y-2 px-1 text-xs">
        <div className="flex justify-between items-center">
          <span className="text-muted-foreground font-medium">Exchange Rate</span>
          <span className="font-bold text-foreground">
            1 {fromToken.symbol} = {(fromTokenPrice / toTokenPrice).toFixed(6)} {toToken.symbol}
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-muted-foreground font-medium">Estimated Network Fee</span>
          <span className="font-bold text-foreground">{estimatedGasFeeUsd}</span>
        </div>
      </div>

      {/* Error / Status Messages */}
      {statusMessage && (
        <div className="text-xs font-medium text-primary break-words flex items-center gap-1.5 bg-primary/5 p-3 rounded-2xl border border-border">
          <Loader2 className="size-3.5 animate-spin" />
          {statusMessage}
        </div>
      )}
      {errorMsg && (
        <div className="text-xs font-medium text-red-500 break-words max-h-20 overflow-y-auto  bg-red-500/5 p-3 rounded-xl border border-red-500/10">
          {errorMsg}
        </div>
      )}

      {/* Action Button CTA */}
      <Button
        size="lg"
        disabled={isExpired || isExecuting || !fromAmount || isNaN(parseFloat(fromAmount)) || parseFloat(fromAmount) <= 0}
        className="w-full h-12 text-[15px] font-bold rounded-xl transition-all shadow-sm mt-1 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed bg-primary text-primary-foreground hover:bg-primary/95"
        onClick={handleExecute}
      >
        {isExecuting ? "Executing Swap..." : isExpired ? "Swap Expired" : "Swap"}
      </Button>

      {/* Token Search Dialog Overlay */}
      <Dialog open={activeSelector !== null} onOpenChange={(open) => !open && setActiveSelector(null)}>
        <DialogContent className="bg-popover border border-border text-popover-foreground max-w-sm w-full rounded-3xl p-5 shadow-2xl backdrop-blur-xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-foreground mb-1">Select a Token</DialogTitle>
          </DialogHeader>

          {/* Search Box */}
          <div className="relative mb-3">
            <input
              type="text"
              placeholder="Search by name, symbol, or address"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-muted/30 border border-border rounded-2xl px-4 py-2.5 text-xs focus:outline-none focus:border-primary text-foreground"
            />
          </div>

          {/* Quick Select Tokens */}
          <div className="mb-3">
            <label className="text-[10px] text-muted-foreground font-semibold block mb-1.5 uppercase tracking-wider">Popular Tokens</label>
            <div className="flex flex-wrap gap-1.5">
              {POPULAR_TOKENS.map((token) => (
                <button
                  key={token.symbol}
                  type="button"
                  onClick={() => handleSelectToken(token)}
                  className="flex items-center gap-1.5 bg-muted/30 hover:bg-muted/80 border border-border rounded-full px-2.5 py-1.5 text-xs text-foreground font-medium transition-all cursor-pointer"
                >
                  <img
                    src={token.logoUrl || fallbackBaseLogo}
                    className="size-3.5 rounded-full object-cover"
                    alt=""
                    onError={(e) => { (e.target as HTMLImageElement).src = fallbackBaseLogo; }}
                  />
                  {token.symbol}
                </button>
              ))}
            </div>
          </div>

          {/* Results List */}
          <div className="max-h-[220px] overflow-y-auto space-y-1 pr-1 scrollbar-thin scrollbar-thumb-zinc-850">
            {isSearching ? (
              <div className="text-center py-6 text-muted-foreground flex items-center justify-center gap-2 text-xs">
                <Loader2 className="size-3.5 animate-spin text-primary" /> Searching DexScreener...
              </div>
            ) : searchResults.length > 0 ? (
              searchResults.map((token) => (
                <button
                  key={token.contractAddress}
                  type="button"
                  onClick={() => handleSelectToken(token)}
                  className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-muted/30 transition-all text-left group cursor-pointer"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <img
                      src={token.logoUrl || fallbackBaseLogo}
                      className="size-7 rounded-full border border-border p-0.5 object-cover shrink-0"
                      alt=""
                      onError={(e) => { (e.target as HTMLImageElement).src = fallbackBaseLogo; }}
                    />
                    <div className="min-w-0">
                      <p className="font-semibold text-xs text-foreground group-hover:text-primary transition-colors">{token.symbol}</p>
                      <p className="text-[10px] text-muted-foreground truncate max-w-[150px]">{token.name}</p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    {token.priceUsd && (
                      <p className="font-medium text-foreground text-xs">
                        ${Number(token.priceUsd) < 0.01 ? Number(token.priceUsd).toFixed(6) : Number(token.priceUsd).toFixed(2)}
                      </p>
                    )}
                    <p className="text-[9px] text-muted-foreground font-mono">{token.contractAddress.slice(0, 6)}...{token.contractAddress.slice(-4)}</p>
                  </div>
                </button>
              ))
            ) : searchQuery ? (
              <div className="text-center py-6 text-muted-foreground text-xs">No tokens found on Base chain.</div>
            ) : (
              <div className="text-center py-6 text-muted-foreground text-xs">Search for any token or ticker.</div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

interface ScheduledDraftCardProps {
  intentPreview: any;
  isExpired: boolean;
  onConfirm: (updatedPreview: any) => void;
}

export function ScheduledDraftCard({ intentPreview, isExpired, onConfirm }: ScheduledDraftCardProps) {
  const triggerConfig = intentPreview.trigger?.config || {};
  const isSchedule = intentPreview.trigger?.type === "schedule";
  const [expiryDays, setExpiryDays] = React.useState<number>(30);

  // Resolve default time from triggerConfig.schedule?.startDate
  const initialDate = triggerConfig.schedule?.startDate ? new Date(triggerConfig.schedule.startDate) : new Date();

  // Hours and minutes representation
  const formatHourMin = (date: Date): string => {
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  };
  const [selectedTime, setSelectedTime] = React.useState<string>(formatHourMin(initialDate));

  const fromTokenInfo = triggerConfig.fromTokenInfo || { symbol: triggerConfig.fromToken || "USDC", contractAddress: "0x833589fcd6edb6e08f4c7c32d4f71b54bda02913" };
  const toTokenInfo = triggerConfig.toTokenInfo || { symbol: triggerConfig.toToken || "ETH", contractAddress: "0x4200000000000000000000000000000000000006" };

  const amountUsd = triggerConfig.amountUsd || 10;
  const frequency = triggerConfig.frequency || "daily";

  // Re-calculate the preview and config details dynamically based on state
  const getUpdatedPreview = () => {
    const updated = JSON.parse(JSON.stringify(intentPreview));

    // Update expiresAt based on selected expiryDays
    const expiryMs = expiryDays * 24 * 3600 * 1000;
    const expiresDate = new Date(Date.now() + expiryMs);
    updated.execution = updated.execution || {};
    updated.execution.expiresAt = expiresDate.toISOString();
    updated.execution.maxRuns = (updated.trigger?.type === "schedule" && (triggerConfig.mode === "once" || triggerConfig.frequency === "once")) ? 1 : Math.ceil(expiryDays / (frequency === "weekly" ? 7 : frequency === "monthly" ? 30 : 1));

    // Update schedule start time if isSchedule
    if (isSchedule && updated.trigger?.config?.schedule) {
      const [h, m] = selectedTime.split(":").map(Number);
      const newStartDate = new Date(updated.trigger.config.schedule.startDate || Date.now());
      newStartDate.setHours(h, m, 0, 0);
      updated.trigger.config.schedule.startDate = newStartDate.toISOString();

      // Update humanReadable time formatting
      const formatTimeText = (date: Date): string => {
        let hours = date.getHours();
        const mins = date.getMinutes();
        const ampm = hours >= 12 ? "PM" : "AM";
        hours = hours % 12;
        hours = hours ? hours : 12;
        const minsStr = mins < 10 ? "0" + mins : mins;
        return `${hours}:${minsStr} ${ampm}`;
      };

      const newTimeText = `at ${formatTimeText(newStartDate)}`;

      // Dynamic verb resolution
      const isFromStable = ["usdc", "usdt", "dai"].includes(fromTokenInfo.symbol?.toLowerCase());
      const isToStable = ["usdc", "usdt", "dai"].includes(toTokenInfo.symbol?.toLowerCase());
      let verb = "Swap";
      if (!isFromStable && isToStable) {
        verb = "Sell";
      } else if (isFromStable && !isToStable) {
        verb = "Buy";
      }

      const prevMode = updated.trigger.config.schedule.mode;
      const daysOfWeek = updated.trigger.config.schedule.recurrence?.daysOfWeek;
      const daysText = daysOfWeek && daysOfWeek.length > 0 ? ` on ${daysOfWeek.map((d: string) => d.charAt(0).toUpperCase() + d.slice(1)).join(", ")}` : "";
      const frequencyText = prevMode === "once" ? "once" : (frequency || "daily");

      if (prevMode === "once") {
        updated.preview.humanReadable = `${verb} $${amountUsd} of ${toTokenInfo.symbol} with ${fromTokenInfo.symbol} once on ${triggerConfig.startDateText} ${newTimeText}`;
      } else {
        updated.preview.humanReadable = `${verb} $${amountUsd} of ${toTokenInfo.symbol} with ${fromTokenInfo.symbol} ${frequencyText}${daysText} ${newTimeText}`;
      }
    }

    return updated;
  };

  const handleApprove = () => {
    const updated = getUpdatedPreview();
    onConfirm(updated);
  };

  // Determine verb for header title
  const isFromStable = ["usdc", "usdt", "dai"].includes(fromTokenInfo.symbol?.toLowerCase());
  const isToStable = ["usdc", "usdt", "dai"].includes(toTokenInfo.symbol?.toLowerCase());
  let verb = "Swap";
  if (!isFromStable && isToStable) {
    verb = "Sell";
  } else if (isFromStable && !isToStable) {
    verb = "Buy";
  }

  const isOneTime = triggerConfig.mode === "once" || triggerConfig.frequency === "once";
  const cardTitle = isSchedule
    ? (isOneTime ? `One-time Scheduled ${verb}` : `Recurring ${verb}`)
    : `${verb} Limit Trigger`;

  const updatedPreview = getUpdatedPreview();
  const expiresDate = new Date(updatedPreview.execution.expiresAt);
  const formatDate = (d: Date) => d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

  return (
    <Card className="overflow-hidden bg-background border-0 border-sidebar-border shadow-sm backdrop-blur-md rounded-3xl mt-10 w-full max-w-[calc(100vw)] sm:max-w-md">
      <CardContent className="">
        {isExpired && (
          <div className="mb-4 text-xs font-semibold text-amber-500 bg-amber-500/10 p-2 rounded-lg border-amber-500/20">
            This card has expired. Please request a new strategy to regenerate.
          </div>
        )}

        <div className="flex items-center gap-2 font-semibold mb-4 text-lg">
          {cardTitle}
        </div>

        <div className="space-y-3">
          <div className="flex justify-between items-center text-md">
            <span className="text-muted-foreground">Action</span>
            <span className="font-medium text-right flex items-center gap-1.5 capitalize">
              {verb} ${amountUsd} <TokenBadge tokenInfo={toTokenInfo} />
            </span>
          </div>

          <div className="flex justify-between items-center text-md">
            <span className="text-muted-foreground">Pay with</span>
            <span className="font-medium text-right">
              <TokenBadge tokenInfo={fromTokenInfo} />
            </span>
          </div>

          {isSchedule ? (
            <div className="flex justify-between items-center text-md pt-2">
              <span className="text-muted-foreground">Time of Day</span>
              <input
                type="time"
                disabled={isExpired}
                value={selectedTime}
                onChange={(e) => setSelectedTime(e.target.value)}
                className="bg-muted/30 border border-border rounded-lg px-2.5 py-1 text-xs text-foreground focus:outline-none focus:border-primary disabled:opacity-50"
              />
            </div>
          ) : (
            <div className="flex justify-between items-center text-md pt-2">
              <span className="text-muted-foreground">Trigger</span>
              <span className="font-medium text-right flex items-center gap-1.5 text-xs sm:text-sm">
                If <TokenBadge tokenInfo={toTokenInfo} /> {triggerConfig.conditionType?.includes("drops_below") ? "drops below or equals" : "rises above or equals"} ${triggerConfig.targetValue}
              </span>
            </div>
          )}

          <div className="flex justify-between items-center text-md pt-2">
            <span className="text-muted-foreground">Strategy Validity</span>
            <select
              disabled={isExpired}
              value={expiryDays}
              onChange={(e) => setExpiryDays(Number(e.target.value))}
              className="bg-muted/30 border border-border rounded-lg px-2.5 py-1 text-xs text-foreground focus:outline-none focus:border-primary disabled:opacity-50"
            >
              <option value={7}>7 Days</option>
              <option value={30}>30 Days (Default)</option>
              <option value={90}>90 Days</option>
              <option value={365}>1 Year</option>
            </select>
          </div>

          <div className="flex justify-between items-center text-md pt-2">
            <span className="text-muted-foreground">Est. Network Fee</span>
            <span className="font-medium">
              {intentPreview.preview.estimatedFee}
            </span>
          </div>

          {/* Cryptographic Spend Permission Security Panel */}
          <div className="border-t pt-3 mt-3 space-y-2 border-border/50">
            <span className="text-[13px] text-foreground tracking-wider block mb-2">
              Allow Qleva to automate transactions within these limits
            </span>
            <div className="grid grid-cols-[20px_1fr] gap-x-2 gap-y-1 text-xs text-muted-foreground">
              {/* <span>Spender:</span>
              <span className="font-mono text-[10px] text-foreground truncate" title={intentPreview.spender || "0x8888888888888888888888888888888888888888"}>
                {intentPreview.spender || "0x8888888888888888888888888888888888888888"}
              </span> */}

              <span className="flex gap-2"><Check className="size-4 text-emerald-500" /></span>
              <span className="font-semibold text-foreground">
                Spend {amountUsd} {fromTokenInfo.symbol} per 24 Hours
              </span>

              <span className="flex gap-2"><Check className="size-4 text-emerald-500" /></span>
              <span className="text-foreground">
                Valid from {formatDate(new Date())} to {formatDate(expiresDate)}
              </span>
            </div>
          </div>
        </div>

        <div className="mt-4 flex gap-2">
          <Button
            type="button"
            size="lg"
            disabled={isExpired}
            className="w-full h-10 text-[15px] font-bold rounded-xl bg-primary text-primary-foreground hover:bg-primary/95 disabled:opacity-50"
            onClick={handleApprove}
          >
            Approve & Sign
          </Button>
        </div>
      </CardContent>
    </Card>
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
                      <ul className="list-disc list-outside space-y-3 mb-3 ml-4 pl-2 text-[16px] text-foreground/90">
                        {children}
                      </ul>
                    ),
                    ol: ({ children }) => (
                      <ol className="list-decimal list-outside space-y-3 mb-3 ml-4 pl-2 text-[16px] text-foreground/90">
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
                      !inline ? (
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
                        className="text-primary underline underline-offset-6 decoration-dotted hover:text-primary/80 transition-colors"
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
                      <div className="overflow-x-auto w-full my-4 border border-border/30 rounded-2xl">
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
                  </button> {message.responseDuration && (
                    <span className="text-[14px] ml-2 text-muted-foreground select-none font-medium mr-2 self-center">
                      {message.responseDuration.toFixed(1)}s
                    </span>
                  )}
                </>
              )}
            </div>
          </div>

          {message.intentPreview && (() => {
            const CARD_EXPIRY_MS = 10 * 60 * 1000;
            const isExpired = Date.now() - new Date(message.timestamp).getTime() > CARD_EXPIRY_MS;
            const isSwap = message.intentPreview.trigger?.type === "swap";

            if (isSwap) {
              return (
                <EditableSwapCard
                  intentPreview={message.intentPreview}
                  chatId={chatId}
                  onSuccess={() => { }}
                  isExpired={isExpired}
                />
              );
            }

            return (
              <ScheduledDraftCard
                intentPreview={message.intentPreview}
                isExpired={isExpired}
                onConfirm={(updated) => onConfirm?.(updated)}
              />
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
            const isOneTime = config.schedule?.mode === "once" || config.frequency === "once";

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
                <Card className="overflow-hidden bg-background border-0 border-sidebar-border shadow-sm backdrop-blur-md rounded-3xl">
                  <CardContent className="">
                    <div className="flex justify-between items-center mb-4 pb-1">
                      <div className="flex items-center gap-2 font-semibold text-lg">
                        {auto.status === "completed" ? "Completed Strategy" : (isSchedule ? (isOneTime ? "Scheduled Trade" : "Recurring Buy") : "Price Limit Trigger")}
                      </div>
                      <Badge variant="outline" className={cn("text-xs px-2 py-0.5 capitalize border-none font-semibold",
                        auto.status === "active" && "bg-emerald-500/10 text-emerald-500",
                        auto.status === "completed" && "bg-amber-500/10 text-amber-500",
                        auto.status === "paused" && "bg-blue-500/10 text-blue-500",
                        auto.status === "failed" && "bg-red-500/10 text-red-500"
                      )}>
                        {auto.status}
                      </Badge>
                    </div>

                    <div className="space-y-3">
                      <div className="flex justify-between items-center text-md">
                        <span className="text-muted-foreground">Automation</span>
                        <span className="font-semibold capitalize">
                          {isSchedule ? (isOneTime ? "One-time Scheduled" : "Recurring Schedule") : "Price Limit Trigger"}
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
                            <span className="font-medium text-right flex items-center gap-1.5 text-xs sm:text-sm">
                              If <TokenBadge tokenInfo={toTokenInfo} /> {config.conditionType?.includes("drops_below") ? "drops below or equals" : "rises above or equals"} ${config.targetValue}
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

                    <div className="mt-5 flex flex-col gap-2 border-t border-border pt-4">
                      <Button
                        size="lg"
                        className="w-full flex justify-center gap-4 h-10 text-md font-bold bg-primary rounded-xl text-primary-foreground"
                        onClick={() => router.push(`/automations/${auto.id}`)}
                      >
                        View Automation <ArrowRight />
                      </Button>
                      {/* <div className="flex gap-2">
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
                      </div> */}
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
  const lastAiMessageRef = React.useRef<HTMLDivElement | null>(null);
  const messagesContainerRef = React.useRef<HTMLDivElement | null>(null);
  const abortControllerRef = React.useRef<AbortController | null>(null);
  const [showScrollToBottom, setShowScrollToBottom] = React.useState(false);
  const isMobile = useIsMobile()

  const { wallets } = useWallets();

  const [elapsed, setElapsed] = React.useState<number>(0);

  React.useEffect(() => {
    let intervalId: any = null;
    if (isThinking) {
      const start = Date.now();
      setElapsed(0);
      intervalId = setInterval(() => {
        setElapsed((Date.now() - start) / 1000);
      }, 100);
    } else {
      setElapsed(0);
    }
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [isThinking]);

  const formatElapsed = (seconds: number) => {
    if (seconds < 60) {
      return `${seconds.toFixed(1)}s`;
    }
    const mins = Math.floor(seconds / 60);
    const secs = (seconds % 60).toFixed(0);
    return `${mins}m ${secs}s`;
  };

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
      let activeWallet = null;
      const storeConnectedAddr = useWalletStore.getState().wallets.find(w => w.type === "connected")?.address;
      if (storeConnectedAddr) {
        activeWallet = wallets.find(w => w.address.toLowerCase() === storeConnectedAddr.toLowerCase());
      }
      if (!activeWallet) {
        activeWallet = wallets.find(w => w.walletClientType !== "privy");
      }
      if (!activeWallet) {
        activeWallet = wallets.find((w) => w.walletClientType === "privy") ||
          wallets.find((w) => w.walletClientType === "coinbase_wallet" || w.address.toLowerCase() === intentPreview.smartWalletAddress.toLowerCase()) ||
          wallets[0];
      }

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
      const expiresAtStr = intentPreview.execution?.expiresAt;
      const end = expiresAtStr ? Math.round(new Date(expiresAtStr).getTime() / 1000) : (start + 30 * 24 * 3600);
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
    // When AI responds, scroll to the top of the last AI message so the user
    // sees the beginning of the response, not the end.
    if (lastAiMessageRef.current) {
      lastAiMessageRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    } else if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, streamingSteps, isThinking]);

  // Show a "scroll to bottom" button when user scrolls up away from latest messages.
  React.useEffect(() => {
    const el = messagesContainerRef.current;
    if (!el) return;

    const onScroll = () => {
      const threshold = 200; // px
      const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight <= threshold;
      setShowScrollToBottom(!atBottom);
    };

    el.addEventListener("scroll", onScroll, { passive: true });
    // initial check
    onScroll();
    return () => el.removeEventListener("scroll", onScroll);
  }, [messages]);

  const handleStop = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsThinking(false);
    setStreamingSteps([]);
  };

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
        message: "Thinking...",
        status: "init",
        completed: false,
      },
    ]);
    setIsThinking(true);

    // Create a fresh AbortController for this request
    const controller = new AbortController();
    abortControllerRef.current = controller;

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
          signal: controller.signal,
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
            signal: controller.signal,
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
    } catch (error: any) {
      // Ignore abort errors — user intentionally stopped
      if (error?.name === "AbortError") {
        setIsThinking(false);
        setStreamingSteps([]);
        return;
      }
      console.error("[ChatContent] API execution error:", error);
      setIsThinking(false);
      setStreamingSteps([]);

      const errorMessage: ChatMessage = {
        id: `err_${Date.now()}`,
        role: "assistant",
        content:
          "⚠️ **System Communication Issue**\n\nI was unable to establish a secure link with the decentralized execution node. Please try again.",
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      abortControllerRef.current = null;
    }
  };

  const hasMessages = messages.length > 0;

  return (
    <AppShell>
      <div className="relative -mt-2 md:-mt-16 -mt-20 flex h-[calc(100svh-0rem)] md:h-[calc(100svh-1rem)] w-full flex-col overflow-hidden bg-background">
        <AnimatePresence>
          {!hasMessages && !chatId ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, y: -20 }}
              className="flex-1 flex flex-col items-center p-4 text-center z-0"
            >
              <motion.div className="mt-26 max-md:mt-36">
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
              <div className="mx-auto max-w-4xl pb-30 px-1 pt-15">
                {messages.map((msg, idx) => {
                  const isLastAi = msg.role === "assistant" && idx === messages.length - 1;
                  return (
                     <div
                      key={msg.id}
                      ref={isLastAi ? lastAiMessageRef : undefined}
                      style={isLastAi ? { scrollMarginTop: "60px" } : undefined}
                    >
                      <MessageBubble
                        message={msg}
                        chatId={chatId}
                        onConfirm={(intentPreview) => handleApproveAndSign(intentPreview)}
                        onToggleStatus={(id, status) => toggleMutation.mutate({ id, status })}
                        onDelete={(id) => deleteMutation.mutate(id)}
                        isPendingToggle={toggleMutation.isPending}
                        isPendingDelete={deleteMutation.isPending}
                      />
                    </div>
                  );
                })}
                {isThinking && streamingSteps.length > 0 && (
                  <div onClick={() => setStreamingCollapsed((s) => !s)} className="cursor-pointer flex flex-col gap-2 w-full max-w-3xl mx-auto mt-4 px-0 md:px-0">
                    <div className="flex items-center gap-6 max-w-[80%]">
                      <div className="flex items-center gap-2 text-sm font-semibold text-foreground/90">
                        <ShinyText
                          text={`Working on it... ${formatElapsed(elapsed)}`}
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

                    <div className="flex flex-col gap-2 border-white/5">
                      {(streamingCollapsed
                        ? streamingSteps.slice(-2)
                        : streamingSteps
                      ).map((step) => (
                        <div key={step.id} className="grid grid-cols-[20px_1fr] gap-2">
                          {step.completed ? (
                            <Check className="size-4 text-emerald-500 mt-0.5" />
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



        {/* Input Area */}
        <div
          className={cn(
            "fixed md:absolute left-0 right-0 z-20 px-3 bg-linear-to-b from-background/10 rounded-3xl via-background to-background md:pb-2 pb-4",
            hasMessages || isMobile || chatId
              ? "bottom-0 md:bottom-0"
              : "top-100 md:top-90 -translate-y-1/2",
          )}
        >
          {/* Scroll-to-bottom button */}
          <AnimatePresence>
            {showScrollToBottom && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8, y: 4 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.8, y: 4 }}
                transition={{ duration: 0.15 }}
                className="absolute right-4 md:right-2 z-50"
                style={{ bottom: isMobile ? 130 : 110 }}
              >
                <button
                  onClick={() => scrollRef.current?.scrollIntoView({ behavior: "smooth" })}
                  aria-label="Scroll to latest"
                  title="Scroll to latest"
                  className="flex items-center justify-center w-8 h-8 rounded-2xl bg-secondary border border-border/60 text-muted-foreground shadow-md active:scale-90 transition-transform duration-100"
                >
                  <ArrowDown className="size-4" />
                </button>
              </motion.div>
            )}
          </AnimatePresence>
          <div
            className={`mx-auto w-full ${hasMessages || chatId ? "max-w-3xl" : "max-w-2xl"}`}
          >
            {/* Suggestion chips above input when starting a new chat (placed right on top of input) */}
            {!hasMessages && !chatId && isMobile && (
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 }}
                className="mb-3 flex justify-start overflow-scroll gap-2 max-w-2xl mx-auto px-2  no-scrollbar"
              >
                {suggestionChips.map((chip, i) => (
                  <Button
                    key={i}
                    variant="secondary"
                    size="sm"
                    className="h-9 md:h-8 rounded-xl bg-card backdrop-blur-md border-border/50 transition-all gap-2"
                    onClick={() => handleSend(chip.label)}
                  >
                    <span className="text-primary">{chip.icon}</span>
                    <span className="text-[11px] font-semibold">{chip.label}</span>
                  </Button>
                ))}
              </motion.div>
            )}
            <Card className="overflow-hidden border-0 bg-sidebar text-sidebar-foreground border-sidebar-border rounded-3xl ">
              <CardContent className="p-0">
                <div className="flex items-end gap-3 px-3">
                  <Textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Ask anything..."
                    className="max-h-[180px] md:text-md -mt-1 overflow-y-auto focus-visible:ring-0 rounded-0 resize-none p-1 custom-scrollbar "
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
                    <AnimatePresence mode="wait" initial={false}>
                      {isThinking ? (
                        <motion.button
                          key="stop"
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.8 }}
                          transition={{ duration: 0.05 }}
                          onClick={handleStop}
                          aria-label="Stop generating"
                          title="Stop generating"
                        >
                          <Button size="icon-lg" variant="outline" className="hover:bg-destructive hover:text-white ">
                            {/* Filled square stop icon */}
                            <span className="block w-3 h-3 rounded-[2px] bg-primary" />
                          </Button>
                        </motion.button>
                      ) : (
                        <motion.div
                          key="send"
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.8 }}
                          transition={{ duration: 0.05 }}
                        >
                          <Button
                            size="icon-lg"
                            onClick={() => handleSend()}
                            disabled={!input.trim() && !attachedImage}
                          >
                            <ArrowUp className="size-5 font-bold" />
                          </Button>
                        </motion.div>
                      )}
                    </AnimatePresence>
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
                    variant="secondary"
                    size="sm"
                    className="h-9 md:h-9 rounded-xl bg-card backdrop-blur-md border-border/50 transition-all gap-2"
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
